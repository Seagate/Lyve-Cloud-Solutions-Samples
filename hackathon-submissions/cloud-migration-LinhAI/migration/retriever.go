package migration

import (
	"fmt"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/s3"
	"go.uber.org/zap"
	"seagate-hackathon/db"
	"seagate-hackathon/utils"
	"time"
)

type ObjectRetriever struct {
	Source    *SourceClient
	Migration *db.Migration

	logger *zap.Logger
}

func (o *ObjectRetriever) listObjects() {
	o.infoWithLog(fmt.Sprintf("Starting migration %s", o.Migration.Name))
	// Change status to in progress
	o.Migration.Status = db.InProgress
	db.DbSession.Save(o.Migration)

	for !o.Migration.ListDone {
		input := &s3.ListObjectsV2Input{
			Bucket:            o.Source.bucketName,
			ContinuationToken: o.Migration.ContinuationToken,
		}
		if o.Migration.AwsPath != nil {
			input.Prefix = o.Migration.AwsPath
		}
		var resp *s3.ListObjectsV2Output
		var err error
		operation := func() error {
			resp, err = o.Source.s3Client.ListObjectsV2(input)
			if err != nil {
				o.error(fmt.Sprintf("Fail to list objects %s, trying again", *o.Source.bucketName), zap.Error(err))
				return err
			}
			return nil
		}
		err = backoff.Retry(operation, backoff.NewExponentialBackOff())
		if err != nil {
			o.error("Retry failed")
			return
		}

		// Create objects in db
		var objects []db.Object
		for _, item := range resp.Contents {
			if o.filterObject(item) {
				o.info("Filter object according to filter condition", zap.String("key", *item.Key))
				continue
			}

			o.info("Saving object info to database for migration", zap.String("key", *item.Key))
			objects = append(objects, db.Object{
				Key:           *item.Key,
				ContentLength: *item.Size,
				Status:        db.NotStarted,
				MigrationID:   o.Migration.ID,
			})
		}
		CreateObjects(&objects)

		if !aws.BoolValue(resp.IsTruncated) {
			o.Migration.ListDone = true
		}
		o.Migration.ContinuationToken = resp.NextContinuationToken
		// Save to db the listdone and continuationtoken in case of failure
		db.DbSession.Save(o.Migration)
	}

	o.info("Save all objects info to database successfully")
}

func (o *ObjectRetriever) filterObject(item *s3.Object) bool {
	if o.Migration.CreationDate != nil && item.LastModified.After(*o.Migration.CreationDate) {
		return true
	}
	if o.Migration.ObjectAge != nil {
		beforeDate := time.Now().Add(-time.Duration(*o.Migration.ObjectAge) * time.Hour * 24)
		if item.LastModified.Before(beforeDate) {
			return true
		}
	}
	if o.Migration.MaxObjectSize != nil && *item.Size < int64(*o.Migration.MaxObjectSize*1024*1024) {
		return true
	}
	if o.Migration.MinObjectSize != nil && *item.Size > int64(*o.Migration.MinObjectSize*1024*1024) {
		return true
	}

	return false
}

func (o *ObjectRetriever) info(msg string, fields ...zap.Field) {
	utils.Logger.With(zap.String("migration", o.Migration.Name)).Info(msg, fields...)
}

func (o *ObjectRetriever) infoWithLog(msg string, fields ...zap.Field) {
	o.logger.With(zap.String("key", o.Migration.Name)).Info(msg, fields...)
}

func (o *ObjectRetriever) error(msg string, fields ...zap.Field) {
	o.logger.With(zap.String("key", o.Migration.Name)).Error(msg, fields...)
}

func retrieveObject(migrationId uint) {
	migration := GetMigration(migrationId)
	retriever := &ObjectRetriever{
		Source: NewSourceClient(Config{
			AccessKey:  utils.Decrypt(migration.AwsAccessKey),
			SecretKey:  utils.Decrypt(migration.AwsSecretKey),
			RegionName: migration.AwsRegionName,
			BucketName: migration.AwsBucket,
		}),
		Migration: migration,
		logger:    utils.GetLogger(migrationId),
	}

	retriever.listObjects()
}

var retrievalChan = make(chan uint)

func QueueRetrieval(migrationId uint) {
	retrievalChan <- migrationId
}

func RunRetrievalProcess() {
	for mid := range retrievalChan {
		go retrieveObject(mid)
	}
}
