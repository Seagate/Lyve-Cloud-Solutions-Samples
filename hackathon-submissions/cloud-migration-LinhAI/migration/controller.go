package migration

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"seagate-hackathon/utils"
	"sort"
	"sync"

	"github.com/aws/aws-sdk-go/service/s3"
	"go.uber.org/zap"
)

type PartRangeParam struct {
	StartingByteOffset int64
	EndingByteOffset   int64
}

type ObjectMigrationState struct {
	Lock                  *sync.RWMutex
	Failed                bool
	NumberOfPart          int64
	CompletedParts        []*s3.CompletedPart
	NumberOfRequestedPart int64
}

type ObjectMigrationController struct {
	Source     *SourceClient
	Dest       *DestClient
	Key        *string
	UploadInfo *s3.CreateMultipartUploadOutput
	ObjectInfo *s3.HeadObjectOutput
	State      *ObjectMigrationState
	ChunkSize  int64
	Id         uint

	logger *zap.Logger
}

type PartMigration struct {
	Range     *PartRangeParam
	PartIndex *int64
}

type OnDoneSignal func(done bool)

func (d *PartRangeParam) GetRange() *string {
	var rangeStr = fmt.Sprintf("bytes=%d-%d", d.StartingByteOffset, d.EndingByteOffset)
	return &rangeStr
}

func (d *PartRangeParam) GetRangeSize() int64 {
	return d.EndingByteOffset - d.StartingByteOffset + 1
}

func (o *ObjectMigrationController) downloadPart(partRange *PartRangeParam) []byte {
	o.info("Downloading part", zap.String("range", *partRange.GetRange()))
	output, err := o.Source.s3Client.GetObject(&s3.GetObjectInput{
		Bucket: o.Source.bucketName,
		Key:    o.Key,
		Range:  partRange.GetRange(),
	})

	if err != nil {
		return nil
	}

	buffer, err := ioutil.ReadAll(output.Body)

	if err != nil {
		return nil
	}

	err = output.Body.Close()
	if err != nil {
		o.error("Failed to close get object", zap.String("range", *partRange.GetRange()), zap.Error(err))
	}

	return buffer
}

func (o *ObjectMigrationController) getObjectInfo() {
	o.info("Getting object info")
	output, err := o.Source.s3Client.HeadObject(&s3.HeadObjectInput{
		Bucket: o.Source.bucketName,
		Key:    o.Key,
	})

	if err == nil {
		o.ObjectInfo = output
		return
	}

	o.error("Get object error", zap.Error(err))
	onErr <- o.Id
}

func (o *ObjectMigrationController) uploadPart(content []byte, partIndex *int64) *string {
	o.info("Upload object part", zap.Int64("index", *partIndex), zap.Int("size", len(content)))
	output, err := o.Dest.s3Client.UploadPart(&s3.UploadPartInput{
		Body:       bytes.NewReader(content),
		Bucket:     o.Dest.bucketName,
		Key:        o.Key,
		PartNumber: partIndex,
		UploadId:   o.UploadInfo.UploadId,
	})

	if err == nil {
		return output.ETag
	}

	o.error("Part upload error", zap.Error(err))
	return nil
}

func (o *ObjectMigrationController) getPartToMigrate() *PartMigration {
	o.State.Lock.Lock()
	if o.State.NumberOfRequestedPart >= o.State.NumberOfPart {
		o.State.Lock.Unlock()
		return nil
	}

	partIndex := o.State.NumberOfRequestedPart + 1
	o.State.NumberOfRequestedPart++
	o.State.Lock.Unlock()

	byteChunk := o.getChunkSizeByBytes()
	startingOffset := (partIndex - 1) * byteChunk
	endingOffset := partIndex*byteChunk - 1

	contentLength := *o.ObjectInfo.ContentLength
	if endingOffset >= contentLength {
		endingOffset = contentLength - 1
	}

	return &PartMigration{
		Range: &PartRangeParam{
			StartingByteOffset: startingOffset,
			EndingByteOffset:   endingOffset,
		},
		PartIndex: &partIndex,
	}
}

func (o *ObjectMigrationController) migratePart() {
	param := o.getPartToMigrate()
	if o.isAborted() || param == nil {
		return
	}

	o.info("Start migrating part", zap.Int64("index", *param.PartIndex))
	content := o.downloadPart(param.Range)
	if content == nil {
		o.abortMultiPart()
		return
	}

	if o.isAborted() {
		return
	}

	eTag := o.uploadPart(content, param.PartIndex)
	if eTag == nil {
		o.abortMultiPart()
		return
	}

	// still need to manual trigger abort because of concurrent upload
	if o.isAborted() {
		o.abortMultiPart()
	}

	o.onPartDone(param.PartIndex, eTag)
	o.info("Complete migrating part", zap.Int64("index", *param.PartIndex))
}

func (o *ObjectMigrationController) abortMultiPart() {
	o.info("Aborting multipart upload")
	o.State.Lock.Lock()
	o.State.Failed = true
	o.State.Lock.Unlock()
	_, err := o.Dest.s3Client.AbortMultipartUpload(&s3.AbortMultipartUploadInput{
		Bucket:   o.Dest.bucketName,
		Key:      o.Key,
		UploadId: o.UploadInfo.UploadId,
	})

	if err != nil {
		o.error("abortMultiPart multipart upload error", zap.Error(err))
	}

	onErr <- o.Id
}

func (o *ObjectMigrationController) isAborted() bool {
	var status = false
	o.State.Lock.RLock()
	status = o.State.Failed
	o.State.Lock.RUnlock()

	return status
}

func (o *ObjectMigrationController) onPartDone(partIndex *int64, eTag *string) {
	defer o.State.Lock.Unlock()
	o.State.Lock.Lock()
	o.State.CompletedParts = append(o.State.CompletedParts, &s3.CompletedPart{
		ETag:       eTag,
		PartNumber: partIndex,
	})
	if o.State.NumberOfPart == int64(len(o.State.CompletedParts)) {
		o.onMultiPartObjectDone()
	}
}

func (o *ObjectMigrationController) onMultiPartObjectDone() {
	o.info("Completing multipart upload")
	sort.Slice(o.State.CompletedParts, func(i, j int) bool {
		return *o.State.CompletedParts[i].PartNumber < *o.State.CompletedParts[j].PartNumber
	})
	_, err := o.Dest.s3Client.CompleteMultipartUpload(&s3.CompleteMultipartUploadInput{
		Bucket:   o.Dest.bucketName,
		Key:      o.Key,
		UploadId: o.UploadInfo.UploadId,
		MultipartUpload: &s3.CompletedMultipartUpload{
			Parts: o.State.CompletedParts},
	})

	if err != nil {
		o.error("Complete multipart upload error", zap.Error(err))
	}

	onDone <- o.Id
	o.info("Completed object")
}

func (o *ObjectMigrationController) createMultipartUpload() bool {
	o.info("Creating multipart upload")
	output, err := o.Dest.s3Client.CreateMultipartUpload(&s3.CreateMultipartUploadInput{
		Bucket:      o.Dest.bucketName,
		Key:         o.Key,
		Metadata:    o.ObjectInfo.Metadata,
		ContentType: o.ObjectInfo.ContentType,
	})

	if err == nil {
		o.UploadInfo = output
		return true
	}

	o.error("Create multipart upload error", zap.Error(err))
	return false
}

func (o *ObjectMigrationController) downloadObject() []byte {
	o.info("Downloading object")
	output, err := o.Source.s3Client.GetObject(&s3.GetObjectInput{
		Bucket: o.Source.bucketName,
		Key:    o.Key,
	})

	if err != nil {
		o.error("Get object error", zap.Error(err))
		return nil
	}
	buffer, err := ioutil.ReadAll(output.Body)

	if err != nil {
		o.error("Buffer read error", zap.Error(err))
		return nil
	}

	err = output.Body.Close()
	if err != nil {
		o.error("Failed to close get object", zap.Error(err))
	}

	return buffer
}

func (o *ObjectMigrationController) uploadObject(content []byte) *string {
	o.info("Uploading object")
	output, err := o.Dest.s3Client.PutObject(&s3.PutObjectInput{
		Body:        bytes.NewReader(content),
		Bucket:      o.Dest.bucketName,
		Key:         o.Key,
		Metadata:    o.ObjectInfo.Metadata,
		ContentType: o.ObjectInfo.ContentType,
	})

	if err == nil {
		return output.ETag
	}

	o.error("Object upload error", zap.Error(err))
	return nil
}

func (o *ObjectMigrationController) migrateSmallObject() {
	o.info("Small object migration")
	content := o.downloadObject()
	if content == nil {
		onErr <- o.Id
		return
	}

	eTag := o.uploadObject(content)
	if eTag == nil {
		o.info("Invalid eTag")
		onErr <- o.Id
		return
	}

	onDone <- o.Id
	o.info("Completed object")
}

func (o *ObjectMigrationController) prepareLargeObject() {
	o.info("Large object migration")
	success := o.createMultipartUpload()

	if !success {
		onErr <- o.Id
		return
	}

	contentLength := *o.ObjectInfo.ContentLength
	byteChunk := o.getChunkSizeByBytes()
	var numberOfChunks = contentLength / byteChunk

	if contentLength%byteChunk != 0 {
		numberOfChunks++
	}

	// set total number of part
	o.State.NumberOfPart = numberOfChunks
	o.info(fmt.Sprintf("Number of chunk %d", numberOfChunks))
}

func (o *ObjectMigrationController) prepareObject() {
	o.getObjectInfo()
	contentLength := *o.ObjectInfo.ContentLength
	o.info(fmt.Sprintf("Object size %d", contentLength))
	if !o.isSmall() {
		o.prepareLargeObject()
	}
}

func (o *ObjectMigrationController) getNumberOfParts() int64 {
	return o.State.NumberOfPart // safe to call concurrently
}

func (o *ObjectMigrationController) isSmall() bool {
	return *o.ObjectInfo.ContentLength <= DefaultChunkSize*1000*1000
}

func (o *ObjectMigrationController) info(msg string, fields ...zap.Field) {
	utils.Logger.With(zap.String("key", *o.Key)).Info(msg, fields...)
}

func (o *ObjectMigrationController) error(msg string, fields ...zap.Field) {
	o.logger.With(zap.String("key", *o.Key)).Error(msg, fields...)
}

func (o *ObjectMigrationController) getChunkSizeByBytes() int64 {
	return o.ChunkSize * 1000 * 1000
}

func NewObjectMigrationController(src *SourceClient, dest *DestClient, key string, id uint) *ObjectMigrationController {
	object := GetObject(id)
	logger := utils.GetLogger(object.MigrationID)
	return &ObjectMigrationController{
		Source:     src,
		Dest:       dest,
		Key:        &key,
		UploadInfo: nil,
		State: &ObjectMigrationState{
			Lock:                  &sync.RWMutex{},
			Failed:                false,
			NumberOfPart:          0,
			CompletedParts:        []*s3.CompletedPart{},
			NumberOfRequestedPart: 0,
		},
		ChunkSize: DefaultChunkSize,
		Id:        id,
		logger:    logger,
	}
}
