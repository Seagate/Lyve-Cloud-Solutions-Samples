# S3 Actions Code Sample - Golang

## Prerequisites
* [Golang](https://go.dev/doc/install)

## Running the CLI Tool
1. Enter your credentials in [config.json file](config.json):
   * access key
   * secret key
   * region name
   * endpoint URL
2. Run the `./s3-actions --help` to see all options:
```
Usage:
  ./s3-actions --Operation=<value> --BucketName=<value> --FilePath=<value> --ConfigPath=<value>
Example:
  ./s3-actions --Operation=po --BucketName=bari-test --FilePath=go.mod

All optional flag's:
  --BucketName string	The bucket name													
  --ConfigPath string	The config file path (default config.json)										
  --ObjectPath string	The object path for delete, put, and get object									
  --Operation string	cb[CreateBucket]/db[DeleteBucket]/lb[ListBuckets]/po[PutObject]/do[DeleteObject]/go[GetObject]/lo[ListObjects]
```

### Sessions Setup
```go
func (c *S3Client) configCredentials(configPath, bucketName string) error {
  config, err := readConfigFile(configPath)
  if err != nil {
    return err
  }
  s3Config := &aws.Config{
    Credentials:      credentials.NewStaticCredentials(config.AccessKey, config.SecretKey, ""),
    Endpoint:         aws.String(config.EndpointUrl),
    Region:           aws.String(config.RegionName),
    DisableSSL:       aws.Bool(true),
    S3ForcePathStyle: aws.Bool(true),
  }
  // Create S3 service client
  c.Session = session.Must(session.NewSession(s3Config))
  c.s3Client = s3.New(c.Session)
  c.BucketName = aws.String(bucketName)
  return nil
}
```

### Create Bucket
```go
func (c *S3Client) createBucket() error {
    if _, err := c.s3Client.CreateBucket(&s3.CreateBucketInput{Bucket: c.BucketName}); err != nil {
        return err
    }
    PrintlnC.Green("Successfully created bucket %s\n", *c.BucketName)
    return nil
}
```

### Delete Bucket
```go
func (c *S3Client) deleteBucket() error {
	if _, err := c.s3Client.DeleteBucket(&s3.DeleteBucketInput{Bucket: c.BucketName}); err != nil {
		return err
	}
	// Wait until bucket is deleted before finishing
	fmt.Printf("Waiting for bucket %q to be deleted...\n", *c.BucketName)
	if err := c.s3Client.WaitUntilBucketNotExists(&s3.HeadBucketInput{Bucket: c.BucketName}); err != nil {
		return err
	}
	PrintlnC.Green("Bucket %q successfully deleted\n", *c.BucketName)
	return nil
}

```

### List Buckets
```go
func (c *S3Client) listBuckets() error {
  result, err := c.s3Client.ListBuckets(nil)
  if err != nil {
     return err
  }
  PrintlnC.Cyan("Buckets:")
  for _, bucket := range result.Buckets {
    PrintlnC.Cyan("* %s\n", aws.StringValue(bucket.Name))
  }
  return nil
}
```

### Put Object
```go
func (c *S3Client) putObject(filename string) error {
  objectFile, err := os.Open(filename)
  if err != nil {
    return err
  }
  defer objectFile.Close()
  
  // Upload the file to the bucket
  if _, err = c.s3Client.PutObject(&s3.PutObjectInput{Body: objectFile, Bucket: c.BucketName, Key: aws.String(filename)}); err != nil {
    return err
  }
  PrintlnC.Green("Successfully created bucket %s and uploaded data", *c.BucketName)
  return nil
}
```

### Delete Object
```go
func (c *S3Client) deleteObject(filename string) error {
  if _, err := c.s3Client.DeleteObject(&s3.DeleteObjectInput{Bucket: c.BucketName, Key: aws.String(filename)}); err != nil {
    return err
  }
  if err := c.s3Client.WaitUntilObjectNotExists(&s3.HeadObjectInput{Bucket: c.BucketName, Key: aws.String(filename)}); err != nil {
    return err
  }
  PrintlnC.Green("Object %q successfully deleted\n", filename)
  return nil
}
```

### Get Object
```go
func (c *S3Client) getObject(filename string) error {
  file, err := os.Create(filename)
  if err != nil {
    return err
  }
  defer file.Close()
  
  downloader := s3manager.NewDownloader(c.Session)
  if numBytes, err := downloader.Download(file, &s3.GetObjectInput{Bucket: c.BucketName, Key: aws.String(filename)}); err != nil {
    return err
  } else {
    PrintlnC.Green("Downloaded file", file.Name(), numBytes, "bytes")
    return nil
  }
}
```

### List Objects
```go
func (c *S3Client) listObjects() error {
  resp, err := c.s3Client.ListObjectsV2(&s3.ListObjectsV2Input{Bucket: c.BucketName})
  if err != nil {
    return err
  }
  for _, item := range resp.Contents {
    PrintlnC.Cyan("Name: %s\nSize: %d\nLast modified: %s\n\n", *item.Key, *item.Size, *item.LastModified)
  }
  if len(resp.Contents) == 0 {
    PrintlnC.Red("The bucket is empty!")
  }
  return nil
}
```

## Tested By:
* March 13, 2022: Bari Arviv (bari.arviv@seagate.com) on MacOS
