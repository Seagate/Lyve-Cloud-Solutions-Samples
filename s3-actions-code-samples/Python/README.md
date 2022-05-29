# S3 Actions Code Sample - Python

## Prerequisites
* [Python3](https://www.python.org/downloads/)

## Running the CLI Tool
1. Enter your credentials in [config.json file](config.json):
   * access key
   * secret key
   * region name
   * endpoint URL
2. Install all required packages: `pip3 install -r requirements.txt`.
3. Run the s3-actions.py --help to see all options: `python3 s3-actions.py --help`
```
usage: s3-actions.py [-h] -o OPERATION [-b BUCKETNAME] [-op OBJECTPATH] [-c CONFIGPATH]

python3 s3-actions.py --operation=po --bucketName=bari-test --objectPath=go.mod

optional arguments:
  -h, --help            show this help message and exit
  -o OPERATION, --operation OPERATION
                        cb[CreateBucket]/db[DeleteBucket]/lb[ListBuckets]/po[PutObject]
                        /do[DeleteObject]/go[GetObject]/lo[ListObjects]
  -b BUCKETNAME, --bucketName BUCKETNAME
                        The bucket name
  -op OBJECTPATH, --objectPath OBJECTPATH
                        The object path for delete, put, and get object
  -c CONFIGPATH, --configPath CONFIGPATH
                        The config file path
```

### Sessions Setup
```python
args = flags_init()
config = read_config(args.configPath)

# Objects to perform actions: client is swiss knife , resource has all sort of data:
s3_resource = boto3.resource('s3', endpoint_url=config["endpoint_url"],
                             aws_access_key_id=config["access_key"],
                             aws_secret_access_key=config["secret_key"],
                             region_name=config["region_name"])

s3_client = boto3.client('s3', endpoint_url=config["endpoint_url"],
                         aws_access_key_id=config["access_key"],
                         aws_secret_access_key=config["secret_key"],
                         region_name=config["region_name"])
```

### Create Bucket
```python
s3_client.create_bucket(Bucket=bucket_name)
```

### Delete Bucket
```python
s3_client.delete_bucket(Bucket=bucket_name)
```

### List Buckets
```python
buckets = s3_client.list_buckets()
if buckets['Buckets']:
    for bucket in buckets['Buckets']:
        print(bucket)
```

### Put Object
```python
s3_resource.Bucket(bucket_name).upload_file(file_location, file_name)
```

### Delete Object
```python
s3_client.delete_object(Bucket=bucket_name, Key=file_name)
```

### Get Object
```python
s3_resource.Bucket(bucket_name).download_file(file_name, file_location) 
```

### List Objects
```python
current_bucket = s3_resource.Bucket(bucket_name)
print('The files in bucket %s:\n' % bucket_name)

for obj in current_bucket.objects.all():
    print(obj.meta.data) 
```

## Tested By:
* March 13, 2022: Bari Arviv (bari.arviv@seagate.com) on MacOS
