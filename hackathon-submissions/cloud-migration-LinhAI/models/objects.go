package models

import (
	"gorm.io/gorm/clause"
	"seagate-hackathon/db"
)

func GetMigrationObjects(migrationId string, objects *[]db.Object) (err error) {
	// look up objects under migration
	if err := db.DbSession.Where("migration_id = ?", migrationId).Find(
		&objects).Omit(clause.Associations).Error; err != nil {
		return err
	}
	return nil
}
