package models

import (
	"seagate-hackathon/db"
)

func GetAllMigrations(migrations *[]db.Migration) (err error) {
	if err := db.DbSession.Find(migrations).Error; err != nil {
		return err
	}
	return nil
}

func GetAMigration(migration *db.Migration, pk string) (err error) {
	if err := db.DbSession.First(migration, pk).Error; err != nil {
		return err
	}
	return nil
}

func CreateAMigration(newMigration *db.Migration) (err error) {
	if err := db.DbSession.Create(newMigration).Error; err != nil {
		return err
	}

	// create objects and object parts

	return nil
}
