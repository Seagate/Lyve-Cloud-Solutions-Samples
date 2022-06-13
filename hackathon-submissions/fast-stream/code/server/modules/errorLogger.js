const fs = require('fs');

exports.log = function (err) {
    const filename = "server/logs/error.log";

    let errorLogStream = fs.createWriteStream(filename, { flags: 'a' });

    let currentTimestamp = new Date();

    errorLogStream.write(`${currentTimestamp.toString()} - ${err}\n`, 'utf8');

    errorLogStream.end();
}