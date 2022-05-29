# Bari Arviv - S3 Actions Code Sample - Python
import json
import boto3
import logging
import argparse
from botocore.exceptions import ClientError


""" Functions for bucket operations """
# The function prints the list of the existing buckets
def list_buckets():
    buckets = s3_client.list_buckets()
    if buckets['Buckets']:
        for bucket in buckets['Buckets']:
            print(bucket)


# The function performs the operation according to the parameter obtained. In case of
# an exception, print it. You can create, delete and print the list of existing buckets.
def bucket_operations(bucket_name=None, operation='list'):
    if operation != 'list' and not bucket_name:
        logging.error('The bucket name is %s missing!' % bucket_name)
        return False
    try:
        if operation == 'delete':
            s3_client.delete_bucket(Bucket=bucket_name)
            print('Bucket %s successfully deleted' % bucket_name)
        elif operation == 'create':
            s3_client.create_bucket(Bucket=bucket_name)
            print('Successfully created bucket %s' % bucket_name)
        elif operation == 'list':
            list_buckets()
        else:
            logging.error('Unknown bucket operation')
            return False
    except ClientError as err:
        logging.error(err)
        return False

    return True


""" Functions for objects operations """
# The function prints the list of the objects in the bucket
def list_objects(bucket_name):
    current_bucket = s3_resource.Bucket(bucket_name)
    print('The files in bucket %s:\n' % bucket_name)
    for obj in current_bucket.objects.all():
        print(obj.meta.data)


# The function performs the operation according to the parameter obtained. In case of an exception,
# print it. You can upload, download and delete an object and print the list of the objects inside the bucket.
def object_operations(bucket_name, operation='list', file_name=None, file_location=None):
    if not bucket_name:
        logging.error('The bucket name is %s missing!' % bucket_name)
        return False
    try:
        if operation == 'list':
            list_objects(bucket_name)
        elif operation == 'delete':
            s3_client.delete_object(Bucket=bucket_name, Key=file_name)
            print('Object %s successfully deleted' % file_name)
        elif operation == 'download':
            s3_resource.Bucket(bucket_name).download_file(file_name, file_location)
            print('Object %s successfully downloaded' % file_name)
        elif operation == 'upload':
            s3_resource.Bucket(bucket_name).upload_file(file_location, file_name)
            print('Object %s successfully uploaded' % file_name)
        else:
            logging.error('Unknown file operation')
            return False
    except ClientError as err:
        logging.error(err)
        return False

    return True


# The function returns the credentials from the config file
def read_config(file_path):
    with open(file_path, 'r') as file:
        content_json = json.loads(file.read())

    return content_json


def flags_init():
    # args contains user inputs
    parser = argparse.ArgumentParser(description='python3 s3-actions.py --operation=po --bucketName=bari-test --objectPath=go.mod')
    parser.add_argument('-o', '--operation', type=str, required=True, help='cb[CreateBucket]/db[DeleteBucket]/lb[ListBuckets]/po[PutObject]/do[DeleteObject]/go[GetObject]/lo[ListObjects]')
    parser.add_argument('-b', '--bucketName', type=str, help='The bucket name')
    parser.add_argument('-op', '--objectPath', type=str, help='The object path for delete, put, and get object')
    parser.add_argument('-c', '--configPath', type=str, default='config.json', help='The config file path')
    return parser.parse_args()


def verify_flags():
    if args.operation == "":
        print("ERROR: --operation flag cannot be empty! Please provide an operation")
        return 0
    if args.bucketName == "" and args.operation != "lb":
        print("ERROR: --bucketName flag cannot be empty! Please provide a bucket name")
        return 0
    if (args.operation == "po" or args.operation == "do" or args.operation == "go") and args.objectPath == "":
        print("ERROR: --objectPath flag cannot be empty! Please provide an object path")
        return 0

    return 1


def main():
    # creates a new bucket
    if args.operation == 'cb' or args.operation == 'CreateBucket':
        bucket_operations(args.bucketName, 'create')
    # deletes a bucket
    elif args.operation == 'db' or args.operation == 'DeleteBucket':
        bucket_operations(args.bucketName, 'delete')
    # prints the list of the existing buckets
    elif args.operation == 'lb' or args.operation == 'ListBuckets':
        bucket_operations(operation='list')
    # uploads a file to the bucket
    elif args.operation == 'po' or args.operation == 'PutObject':
        object_operations(args.bucketName, 'upload', args.objectPath, args.objectPath)
    # deletes a file from the bucket
    elif args.operation == 'do' or args.operation == 'DeleteObject':
        object_operations(args.bucketName, 'delete', args.objectPath)
    # downloads a file from the bucket
    elif args.operation == 'go' or args.operation == 'GetObject':
        object_operations(args.bucketName, 'download', args.objectPath, args.objectPath)
    # prints the list of the objects in the bucket
    elif args.operation == 'lo' or args.operation == 'ListObjects':
        object_operations(args.bucketName, 'list')
    else:
        print('Unknown operation!!')


if __name__ == '__main__':
    args = flags_init()
    config = read_config(args.configPath)

    # initializes the credentials and creates an S3 service client
    if verify_flags():
        # objects to perform actions: client is swiss knife, resource has all sort of data
        s3_resource = boto3.resource('s3', endpoint_url=config["endpoint_url"],
                                     aws_access_key_id=config["access_key"],
                                     aws_secret_access_key=config["secret_key"],
                                     region_name=config["region_name"])

        s3_client = boto3.client('s3', endpoint_url=config["endpoint_url"],
                                 aws_access_key_id=config["access_key"],
                                 aws_secret_access_key=config["secret_key"],
                                 region_name=config["region_name"])

        main()