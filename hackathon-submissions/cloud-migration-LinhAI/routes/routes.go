package routes

import (
	"seagate-hackathon/controller"

	"github.com/gin-gonic/gin"
)

func SetUpRouter() *gin.Engine {
	r := gin.Default()
	v1 := r.Group("/api/v1")
	{
		v1.GET("migrations", controller.GetMigrations)
		v1.POST("migrations", controller.CreateAMigration)
		v1.GET("migrations/:id", controller.GetAMigration)
		v1.GET("migrations/:id/objects", controller.GetObjectsUnderAMigration)
		v1.GET("migrations/:id/logs", controller.GetMigrationLogs)
	}
	return r
}
