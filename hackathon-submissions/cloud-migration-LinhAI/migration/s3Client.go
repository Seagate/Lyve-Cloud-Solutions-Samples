package migration

import (
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"net/http"
	"seagate-hackathon/utils"
	"time"
)

const (
	DefaultChunkSize     = 10
	DefaultInternalRetry = 3
	DefaultTimeout       = 120
)

type clientWrapper struct {
	session    *session.Session
	s3Client   *s3.S3
	bucketName *string
}

type Config struct {
	AccessKey  string
	SecretKey  string
	RegionName string
	BucketName string
	Endpoint   string
}

func (c *clientWrapper) configCredentials(config Config) error {
	var err error
	var maxRetries = DefaultInternalRetry
	s3Config := &aws.Config{
		Credentials: credentials.NewStaticCredentials(config.AccessKey, config.SecretKey, ""),
		Region:      aws.String(config.RegionName),
		MaxRetries:  &maxRetries,
		HTTPClient: &http.Client{
			Timeout: DefaultTimeout * time.Second,
		},
		Endpoint: aws.String(config.Endpoint),
	}
	// Create S3 service Source

	c.session, err = session.NewSession(s3Config)
	if err != nil {
		return err
	}

	c.s3Client = s3.New(c.session)
	c.bucketName = aws.String(config.BucketName)
	return nil
}

type SourceClient struct {
	clientWrapper
}

type DestClient struct {
	clientWrapper
}

func NewSourceClient(config Config) *SourceClient {
	sourceClient := &SourceClient{}
	err := sourceClient.configCredentials(config)

	if err != nil {
		utils.Logger.Error("Failed to construct source Source")
		return nil
	}

	return sourceClient
}

func NewDestClient(config Config) *DestClient {
	destClient := &DestClient{}
	err := destClient.configCredentials(config)

	if err != nil {
		utils.Logger.Error("Failed to construct source Source")
		return nil
	}
	return destClient
}

func initMigrationClients(migrationId uint) (*SourceClient, *DestClient) {
	migration := GetMigration(migrationId)
	sourceClient := NewSourceClient(Config{
		AccessKey:  utils.Decrypt(migration.AwsAccessKey),
		SecretKey:  utils.Decrypt(migration.AwsSecretKey),
		RegionName: migration.AwsRegionName,
		BucketName: migration.AwsBucket,
	})

	destClient := NewDestClient(Config{
		AccessKey:  utils.Decrypt(migration.LyveAccessKey),
		SecretKey:  utils.Decrypt(migration.LyveSecretKey),
		RegionName: migration.LyveRegionName,
		BucketName: migration.LyveBucket,
		Endpoint:   migration.LyveEndpoint,
	})

	return sourceClient, destClient
}
