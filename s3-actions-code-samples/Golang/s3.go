// Bari Arviv - S3 Actions Code Sample - Golang
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
	PrintlnC "github.com/fatih/color"
	"io/ioutil"
	"os"
	"strings"
	"text/tabwriter"
)

type Config struct {
	AccessKey   string `json:"access_key"`
	SecretKey   string `json:"secret_key"`
	RegionName  string `json:"region_name"`
	EndpointUrl string `json:"endpoint_url"`
	BucketName  string `json:"bucket_name"`
}

type S3Client struct {
	Session    *session.Session
	s3Client   *s3.S3
	BucketName *string
}

var (
	operation, bucketName, objectPath, configPath string
)

// Usage prints a usage message documenting all defined command-line flags in a nice way formatted so u can use it to override
// the default flag.Usage func also added the to set the Usage and Example print so the Usage Msg will look much clear
func usage(mustUseFlags, examples []string) func() {
	return func() {
		f := flag.CommandLine
		if len(mustUseFlags) > 0 {
			fmt.Println("Usage:")
			for _, useFlag := range mustUseFlags {
				fmt.Fprintf(f.Output(), "  %s %s\n", os.Args[0], useFlag)
			}
		}
		if len(examples) > 0 {
			fmt.Println("Example:")
			for _, example := range examples {
				fmt.Fprintf(f.Output(), "  %s %s\n", os.Args[0], example)
			}
			fmt.Println()
		}
		fmt.Fprintf(f.Output(), "All optional flag's:\n")
		writer := tabwriter.NewWriter(os.Stdout, 0, 8, 1, '\t', tabwriter.AlignRight)
		defer writer.Flush()
		flag.VisitAll(func(flag_ *flag.Flag) {
			if flag_.Usage == "" {
				return
			}
			s := fmt.Sprintf("  --%s", flag_.Name) // Two spaces before -; see next two comments.
			name, usage := flag.UnquoteUsage(flag_)
			if len(name) > 0 {
				s += " " + name
			}
			usage = strings.ReplaceAll(usage, "\n", "")
			if flag_.DefValue != "" {
				usage += fmt.Sprintf(" (default %v)", flag_.DefValue)
			}
			_, _ = fmt.Fprintf(writer, "%s\t    %s\t\n", s, usage)
		})
	}
}

func flagsInit() {
	flag.Usage = usage([]string{"--Operation=<value> --BucketName=<value> --FilePath=<value> --ConfigPath=<value>"}, []string{fmt.Sprintf("--Operation=po --BucketName=bari-test --FilePath=go.mod\n\n")})
	flag.StringVar(&operation, "Operation", "", "cb[CreateBucket]/db[DeleteBucket]/lb[ListBuckets]/po[PutObject]/do[DeleteObject]/go[GetObject]/lo[ListObjects]")
	flag.StringVar(&bucketName, "BucketName", "", "The bucket name")
	flag.StringVar(&objectPath, "ObjectPath", "", "The object path for delete, put, and get object")
	flag.StringVar(&configPath, "ConfigPath", "config.json", "The config file path")
	flag.Parse()
}

func verifyFlags() bool {
	if operation == "" {
		PrintlnC.Red("ERROR: --Operation flag cannot be empty! Please provide an operation")
		flag.Usage()
		return false
	}
	if bucketName == "" && operation != "lb" {
		PrintlnC.Red("ERROR: --BucketName flag cannot be empty! Please provide a bucket name")
		flag.Usage()
		return false
	}
	if (operation == "po" || operation == "do" || operation == "go") && objectPath == "" {
		PrintlnC.Red("ERROR: --ObjectPath flag cannot be empty! Please provide an object path")
		flag.Usage()
		return false
	}
	return true
}

// readConfigFile returns the credentials from the config file
func readConfigFile(configPath string) (Config, error) {
	var config Config
	data, err := ioutil.ReadFile(configPath)
	if err != nil {
		return config, err
	}
	if err = json.Unmarshal(data, &config); err != nil {
		return config, err
	}
	return config, nil
}

// configCredentials initializes the credentials and creates an S3 service client
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

// createBucket creates a new bucket
func (c *S3Client) createBucket() error {
	if _, err := c.s3Client.CreateBucket(&s3.CreateBucketInput{Bucket: c.BucketName}); err != nil {
		return err
	}
	PrintlnC.Green("Successfully created bucket %s\n", *c.BucketName)
	return nil
}

// deleteBucket deletes a bucket
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

// listBuckets prints the list of the existing buckets
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

// putObject uploads a file to the bucket
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

// deleteObject deletes a file from the bucket
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

// getObject downloads a file from the bucket
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

// listObjects prints the list of the objects in the bucket
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

func main() {
	flagsInit()
	if !verifyFlags() {
		return
	}

	var client S3Client
	if err := client.configCredentials(configPath, bucketName); err != nil {
		PrintlnC.Red(err.Error())
	}

	var err error
	switch operation {
	case "cb", "CreateBucket":
		err = client.createBucket()
	case "db", "DeleteBucket":
		err = client.deleteBucket()
	case "lb", "ListBuckets":
		err = client.listBuckets()
	case "po", "PutObject":
		err = client.putObject(objectPath)
	case "do", "DeleteObject":
		err = client.deleteObject(objectPath)
	case "go", "GetObject":
		err = client.getObject(objectPath)
	case "lo", "ListObjects":
		err = client.listObjects()
	default:
		PrintlnC.Red("Unknown operation!!")
	}
	if err != nil {
		PrintlnC.Red(err.Error())
	}
}
