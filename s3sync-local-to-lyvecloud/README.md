# Local directory data sync with Lyve Cloud Bucket 

## Introduction
There are some scenarios when the user wants to keep the local directory and Lyve Cloud bucket in sync. The expectation is local data and Lyve Cloud bucket data should be the same.
If the user adds or removes any file or directory from the local directory, then it should also get added or removed from the Lyve Cloud bucket.
The solution is a script using the `aws s3 sync` command. This is a one-way sync operation. This script will copy contents from Linux based computer to Lyve Cloud when trigger file is created in the computer folder.

## Problem statement
Syncing a local directory content to Lyve Cloud bucket on-demand.

## Requirements
Before you start, please make sure you have these requirements and information in place:
- Lyve Cloud account with privilege to create service account.
- Compute instance with 
  - Linux operating system installed.
  - Available storage space to hold the data.
  - AWS CLI utility installed.

## Setup Instructions
### Step 1: Get Lyve Cloud credentials and endpoints
Login to Lyve Cloud console, create a Service Account with appropriate permissions and extract the following:
- Access Key
- Secret key
- Endpoint URL

### Step 2: Configure Lyve Cloud S3API CLI utility account
1. Login to Linux compute instance.
2. run following command to configure Lyve Cloud Profile. `aws configure --profile <profile-name>`
    Provide the access key ID and secret access key of Lyve Cloud Service account.

### Step 3: Create s3 bucket for data replication
1.  Create Lyve Cloud S3 bucket to sync data between local directory and Lyve Cloud S3
    use below command (replace name of bucket as you like): \
    ```aws s3api create-bucket -–bucket <bucket_name> --endpoint <endpoint> –-profile <profile_name>```
2.  Verify the bucket is created: \
    ```aws –-profile <profile_name> --endpoint <endpoint> s3api list-buckets```
 
### Step 4: Copy the script to compute instance and replace the values of variables according to your requirement in scripts
1.  Create a local directory 's3script':
    ```
    mkdir s3script
    cd s3script
    cp ~s3sync .
    chmod +x s3sync
    ```
2.  Create a directory which you want to sync with Lyve Cloud bucket: `mkdir dist`
3. Copy the data that needs to be sync with S3.
4. Create the trigger file: `touch dist/trigger`

### Step 5: Add the crontab entry to run the script every 5 mins
```
sudo crontab -u <user-name> -e
*/5 * * * * /sbin/sh /home/user/s3script/s3sync.sh
```

## Results 
The script checks if the trigger file exists inside dist directory if exists then data will be copied to Lyve Cloud bucket and the trigger file will be removed.

## Tested by:
* May 2, 2022: Rahul Gode (rahul.gode@seagate.com) on Linux
* May 16, 2022: Bari Arviv (bari.arviv@seagate.com) on Ubuntu