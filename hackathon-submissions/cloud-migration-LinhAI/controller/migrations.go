package controller

import (
	"bufio"
	"fmt"
	"github.com/gin-gonic/gin"
	"net/http"
	"os"
	"seagate-hackathon/db"
	"seagate-hackathon/migration"
	"seagate-hackathon/models"
)

func GetMigrations(c *gin.Context) {
	var migrations []db.Migration

	err := models.GetAllMigrations(&migrations)

	var populatedMigrations []db.Migration
	for _, m := range migrations {
		m.DoneCount = migration.GetCount(m.ID, db.Done)
		m.FailedCount = migration.GetCount(m.ID, db.Failed)
		populatedMigrations = append(populatedMigrations, m)
	}
	if err != nil {
		c.JSON(
			http.StatusBadRequest,
			gin.H{"Message": err.Error()})
	} else {
		c.JSON(http.StatusOK, populatedMigrations)
	}
}

func GetAMigration(c *gin.Context) {
	pk := c.Params.ByName("id")
	var migration db.Migration

	err := models.GetAMigration(&migration, pk)

	if err != nil {
		c.JSON(
			http.StatusBadRequest,
			gin.H{"Message": err.Error()})
	} else {
		c.JSON(http.StatusOK, migration)
	}
}

func CreateAMigration(c *gin.Context) {
	var newMigration db.Migration
	err := c.ShouldBindJSON(&newMigration)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Message": err.Error()})
		return
	}

	migrationId := migration.CreateMigrationDB(&newMigration)
	migration.QueueRetrieval(migrationId)
	c.Status(http.StatusOK)
}

type LogQueryParams struct {
	FromLine *int `form:"from_line"`
}

func GetMigrationLogs(c *gin.Context) {
	pk := c.Params.ByName("id")
	logReader, err := os.Open(fmt.Sprintf("./logs/%s.log", pk))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Message": err.Error()})
		return
	}
	defer logReader.Close()

	contentType := "text/plain; charset=utf-8"

	var params LogQueryParams
	err = c.ShouldBindQuery(&params)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Message": err.Error()})
		return
	}
	if params.FromLine != nil {
		counter := 0
		scanner := bufio.NewScanner(logReader)
		var data []byte
		for scanner.Scan() {
			if counter >= *params.FromLine {
				data = append(data, scanner.Bytes()...)
				data = append(data, "\n"...)
			}
			counter += 1
		}
		c.Data(http.StatusOK, contentType, data)
		return
	}

	info, err := logReader.Stat()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Message": err.Error()})
		return
	}
	contentLength := info.Size()
	c.DataFromReader(http.StatusOK, contentLength, contentType, logReader, nil)
}
