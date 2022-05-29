#!/bin/bash
# s3sync.sh 936754 rahul.gode@seagate.com v1.01
# This script will copy contents from Linux based computer over S3 only when trigger file is created.
# It will also create the logs file.

MODE=0
USER=admin
TODAY=`date +%d%m%Y`
LOGDIR=/home/$USER/s3script/logs
LOGFILE=build-script-$TODAY
BUCKET=s3://lyve-bucket
ENDPOINT=https://s3.us-east-1.lyvecloud.seagate.com
PROFILE=adminuser

function syncData()
{
        dt=$(date '+%d/%m/%Y %H:%M:%S');
        echo "Datetime begin script : $dt"
        # Go to script directory
        cd /home/$USER/s3script

        # Deploy files to Lyve Cloud
        echo "copying data"
        /usr/local/bin/aws --profile $PROFILE --endpoint $ENDPOINT s3 sync dist/ $BUCKET --delete --follow-symlinks

        echo "Removing trigger"
        rm -vf /home/$USER/s3script/dist/trigger
}

# If log directory is not available, then create it
if [ ! -d "$LOGDIR" ]; then mkdir -p $LOGDIR; fi

# Set execution mode
if [ $# -gt 0 ]; then MODE=$1; fi

# Execute the build script and capture the logs
if [ -f "/home/$USER/s3script/dist/trigger" ]; then
        if  [ ${MODE} -eq 1 ] ; then
                syncData >> $LOGDIR/$LOGFILE;
        else
                syncData;
        fi
fi