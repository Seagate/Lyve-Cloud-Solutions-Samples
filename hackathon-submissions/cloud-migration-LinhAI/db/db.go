package db

import (
	"os"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

type StatusEnum int

const (
	NotStarted StatusEnum = iota
	InProgress
	Done
	Failed
)

const dbFile = "test.db"

type Migration struct {
	gorm.Model
	Name           string `json:"name" binding:"required"`
	AwsAccessKey   string `json:"aws_access_key" binding:"required"`
	AwsSecretKey   string `json:"aws_secret_key" binding:"required"`
	AwsRegionName  string
	AwsBucket      string  `json:"aws_bucket_name" binding:"required"`
	AwsPath        *string `json:"aws_path,omitempty"`
	LyveAccessKey  string  `json:"access_key" binding:"required"`
	LyveSecretKey  string  `json:"secret_key" binding:"required"`
	LyveRegionName string
	LyveBucket     string `json:"bucket_name" binding:"required"`
	LyveEndpoint   string `json:"endpoint" binding:"required"`
	Status         StatusEnum
	// Filter
	// CreationDate filter objects created from this date
	CreationDate *time.Time `json:"creation_date,omitempty"`
	// ObjectAge filter objects older than number of days
	ObjectAge *int `json:"object_age,omitempty"`
	// ObjectSize is in MB
	MaxObjectSize *int `json:"max_object_size,omitempty"`
	MinObjectSize *int `json:"min_object_size,omitempty"`
	// Internal
	ListDone          bool
	ContinuationToken *string

	// For API only
	DoneCount   int `json:"done_count" gorm:"-:all"`
	FailedCount int `json:"failed_count" gorm:"-:all"`
}

type Object struct {
	gorm.Model
	Key           string     `json:"name"`
	ContentLength int64      `json:"size"`
	Status        StatusEnum `json:"status"`
	MigrationID   uint
	Migration     Migration `gorm:"constraint:OnDelete:CASCADE;" json:"-"`
}

var DbSession *gorm.DB

func InitDB() {
	var err error
	DbSession, err = gorm.Open(sqlite.Open(dbFile), &gorm.Config{})

	if err != nil {
		panic(err)
	}

	err = DbSession.AutoMigrate(&Migration{}, &Object{})
	if err != nil {
		panic(err)
	}
}

func ResetDB() {
	os.Remove(dbFile)
}
