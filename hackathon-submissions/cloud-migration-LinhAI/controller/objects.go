package controller

import (
	"net/http"
	"seagate-hackathon/db"
	"seagate-hackathon/migration"
	"seagate-hackathon/models"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetObjectsUnderAMigration(c *gin.Context) {
	var objects []db.Object
	var failedObjectCount int64
	var doneObjectCount int64
	var totalSize int64

	migrationPk := c.Params.ByName("id")
	migrationId, _ := strconv.Atoi(migrationPk)

	dbMigration := migration.GetMigration(uint(migrationId))
	err := models.GetMigrationObjects(migrationPk, &objects)

	totalObjectCount := len(objects)
	for _, obj := range objects {
		if obj.Status == db.Done {
			doneObjectCount++
			totalSize += obj.ContentLength
		} else if obj.Status == db.Failed {
			failedObjectCount++
		}
	}

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Message": err.Error()})
	} else {
		// return nested json response
		c.JSON(http.StatusOK, gin.H{
			"results": gin.H{
				"id":           dbMigration.ID,
				"status":       dbMigration.Status,
				"done_count":   doneObjectCount,
				"total_count":  totalObjectCount,
				"failed_count": failedObjectCount,
				"objects":      objects,
				"total_size":   totalSize,
			},
		})
	}
}
