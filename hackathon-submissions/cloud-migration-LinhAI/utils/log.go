package utils

import (
	"fmt"
	"github.com/natefinch/lumberjack"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var loggerMap = make(map[uint]*zap.Logger)
var Logger = initializeLogger(nil)

// Save file log cut
func getLogWriter(migrationId *uint) zapcore.WriteSyncer {
	var logName string
	if migrationId != nil {
		logName = fmt.Sprintf("./logs/%d.log", *migrationId)
	} else {
		logName = "./logs/migration.log"
	}
	lumberJackLogger := &lumberjack.Logger{
		Filename:   logName, // Log name
		MaxSize:    1000,    // File content size, MB
		MaxBackups: 5,       // Maximum number of old files retained
		MaxAge:     30,      // Maximum number of days to keep old files
		Compress:   false,   // Is the file compressed
	}
	return zapcore.AddSync(lumberJackLogger)
}

func getEncoder() zapcore.Encoder {
	encoderConfig := zap.NewProductionEncoderConfig()
	// The format time can be customized
	encoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	encoderConfig.EncodeLevel = zapcore.CapitalLevelEncoder
	return zapcore.NewConsoleEncoder(encoderConfig)
}

func initializeLogger(migrationId *uint) *zap.Logger {
	writeSyncer := getLogWriter(migrationId)
	encoder := getEncoder()
	core := zapcore.NewCore(
		encoder,
		writeSyncer,
		zapcore.InfoLevel,
	)

	return zap.New(core, zap.AddCaller())
}

func GetLogger(migrationId uint) *zap.Logger {
	if val, ok := loggerMap[migrationId]; ok {
		return val
	}

	newLogger := initializeLogger(&migrationId)
	loggerMap[migrationId] = newLogger
	return newLogger
}
