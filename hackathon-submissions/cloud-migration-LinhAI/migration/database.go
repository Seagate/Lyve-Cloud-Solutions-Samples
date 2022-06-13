package migration

import (
	"go.uber.org/zap"
	"gorm.io/gorm/clause"
	"seagate-hackathon/db"
	"seagate-hackathon/utils"
)

func CreateMigrationDB(migration *db.Migration) uint {
	// Default values
	migration.AwsRegionName = "ap-southeast-1"
	migration.LyveRegionName = "ap-southeast-1"
	migration.Status = db.NotStarted

	// Encrypt
	migration.AwsAccessKey = utils.Encrypt(migration.AwsAccessKey)
	migration.AwsSecretKey = utils.Encrypt(migration.AwsSecretKey)
	migration.LyveAccessKey = utils.Encrypt(migration.LyveAccessKey)
	migration.LyveSecretKey = utils.Encrypt(migration.LyveSecretKey)

	db.DbSession.Create(&migration)
	return migration.ID
}

func CreateObjects(objects *[]db.Object) {
	db.DbSession.Omit(clause.Associations).Create(objects)
}

func UpdateOrCreateObject(object db.Object) {
	// https://gorm.io/docs/advanced_query.html#FirstOrCreate
	db.DbSession.Where(db.Object{
		Key:         object.Key,
		MigrationID: object.MigrationID,
	}).Attrs(db.Object{
		Status: object.Status,
	}).Assign(db.Object{
		ContentLength: object.ContentLength,
	}).Omit(clause.Associations).FirstOrCreate(&object)
}

func GetMigration(id uint) *db.Migration {
	var migration = &db.Migration{}
	if err := db.DbSession.First(migration, id).Error; err != nil {
		return nil
	}

	return migration
}

func GetCount(migrationId uint, status db.StatusEnum) int {
	var result int64
	db.DbSession.Table("objects").Where("migration_id = ? AND status = ?", migrationId, status).Count(&result)
	return int(result)
}

func GetObject(id uint) *db.Object {
	var object = &db.Object{}
	if err := db.DbSession.First(object, id).Error; err != nil {
		return nil
	}

	return object
}

func UpdateObjectStatus(oId uint, status db.StatusEnum) {
	object := GetObject(oId)
	if object == nil {
		return
	}

	object.Status = status
	db.DbSession.Save(object)
}

func GetNotStartedAndSet() *db.Object {
	var object = &db.Object{}
	if err := db.DbSession.Where("status = ?", db.NotStarted).First(object).Error; err != nil {
		return nil
	}

	object.Status = db.InProgress
	db.DbSession.Save(object)
	return object
}

func UpdateInProgressObjectsStatus() {
	res := db.DbSession.Debug().Model(db.Object{}).Where("status = ?", db.InProgress).Update("status", db.NotStarted)
	err := res.Error
	if err != nil {
		utils.Logger.Error("Failed to change objects status", zap.Error(err))
	}
}

func CheckMigrationAndSet(oId uint) {
	object := GetObject(oId)
	var exists bool
	db.DbSession.Model(db.Object{}).Select("count(*) > 0").
		Where("(status = ? OR status = ?) AND migration_id = ?", db.NotStarted, db.InProgress, object.MigrationID).Find(&exists)
	if exists {
		return
	}

	var migration = GetMigration(object.MigrationID)
	if migration != nil {
		migration.Status = db.Done
		db.DbSession.Save(migration)
	}
}
