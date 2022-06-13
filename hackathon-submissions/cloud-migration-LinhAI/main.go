package main

import (
	"github.com/gin-contrib/cors"
	"github.com/joho/godotenv"
	"log"
	"os"
	"seagate-hackathon/db"
	"seagate-hackathon/migration"
	"seagate-hackathon/routes"
)

func CreateMockMigration() {
	migration.CreateMigrationDB(&db.Migration{
		AwsAccessKey:   os.Getenv("AWS_ACCESS_KEY"),
		AwsSecretKey:   os.Getenv("AWS_SECRET_KEY"),
		AwsRegionName:  "ap-southeast-1",
		AwsBucket:      "linh-testing-nhan",
		LyveAccessKey:  os.Getenv("LYVE_ACCESS_KEY"),
		LyveSecretKey:  os.Getenv("LYVE_SECRET_KEY"),
		LyveRegionName: "ap-southeast-1",
		LyveBucket:     "active-learning-linh",
		Status:         0,
	})

	migration.CreateObjects(&[]db.Object{{
		Key:         "hackathon/sample (1).zip",
		MigrationID: 1,
	}})
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	//db.ResetDB()
	db.InitDB()

	go migration.RunRetrievalProcess()
	go migration.Init()

	// Set up gin
	log.Println("Set up server")
	r := routes.SetUpRouter()
	// Allow all origins
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000"}
	r.Use(cors.New(config))
	r.Run()
}
