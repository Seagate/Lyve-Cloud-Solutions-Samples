package migration

import (
	"go.uber.org/zap"
	"seagate-hackathon/db"
	"seagate-hackathon/utils"
	"time"
)

const NumberOfWorker = 20

var requestChan = make(chan int)
var execChan = make(chan *ObjectMigrationController)
var onDone = make(chan uint) // channel receiving the id of done object
var onErr = make(chan uint)  // channel receiving the id of failed object
var largeObjectList = make(map[uint]*ObjectMigrationController)
var partTracking = make(map[uint]int64)

func onCompleteObject(oId uint) {
	utils.Logger.Info("On completing objects", zap.Uint("key", oId))
	delete(largeObjectList, oId)
	delete(partTracking, oId)
	UpdateObjectStatus(oId, db.Done)
	CheckMigrationAndSet(oId)
}

func onErrorObject(oId uint) {
	utils.Logger.Info("On error objects", zap.Uint("key", oId))
	delete(largeObjectList, oId)
	delete(partTracking, oId)
	UpdateObjectStatus(oId, db.Failed)
	CheckMigrationAndSet(oId)
}

func onRequest() {
	utils.Logger.Info("On requesting object")
	for u, o := range largeObjectList {
		if o.getNumberOfParts() > partTracking[u] {
			partTracking[u]++
			execChan <- o
			return
		}
	}

	for {
		object := GetNotStartedAndSet()
		if object == nil {
			execChan <- nil
			return
		}

		sourceClient, destClient := initMigrationClients(object.MigrationID)
		migrationController := NewObjectMigrationController(sourceClient, destClient, object.Key, object.ID)
		migrationController.prepareObject()

		if migrationController.isSmall() {
			execChan <- migrationController
			return
		}

		largeObjectList[object.ID] = migrationController
		partTracking[object.ID] = 1
		execChan <- migrationController
		return
	}
}

func worker() {
	requestChan <- 0
	for o := range execChan {
		if o == nil {
			time.Sleep(5 * time.Second)
			requestChan <- 0
			continue
		}

		if !o.isSmall() {
			o.migratePart()
		} else {
			o.migrateSmallObject()
		}

		requestChan <- 0
	}
}

func master() {
	for i := 0; i < NumberOfWorker; i++ {
		go worker()
	}

	for {
		select {
		case <-requestChan:
			onRequest()
		case oId := <-onDone:
			onCompleteObject(oId)
		case oId := <-onErr:
			onErrorObject(oId)
		}
	}
}

func Init() {
	UpdateInProgressObjectsStatus()
	master()
}
