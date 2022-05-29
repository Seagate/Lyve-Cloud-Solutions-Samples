import os
import time
import json
import boto3
import logging
from botocore.exceptions import ClientError

log = logging.getLogger()
log.setLevel(logging.INFO)

# Set date ranges for CloudWatch gathering
startTime = time.strftime('%Y-%m') + '-01T00:00:00Z'
endTime = time.strftime('%Y-%m-%dT%H:%M:%SZ')

smClient = boto3.client('secretsmanager')
cwClient = boto3.client('cloudwatch')


def lambda_handler(event, context):
    secret_name = os.environ['SECRET_KEY']
    region_name = os.environ['REGION']
        
    # In this sample we only handle the specific exceptions for the 'GetSecretValue' API.
    # See https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
    # We rethrow the exception by default.

    try:
        get_secret_value_response = smClient.get_secret_value(
            SecretId=secret_name
        )
    except ClientError as e:
        if e.response['Error']['Code'] == 'DecryptionFailureException':
            # Secrets Manager can't decrypt the protected secret text using the provided KMS key.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response['Error']['Code'] == 'InternalServiceErrorException':
            # An error occurred on the server side.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response['Error']['Code'] == 'InvalidParameterException':
            # You provided an invalid value for a parameter.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response['Error']['Code'] == 'InvalidRequestException':
            # You provided a parameter value that is not valid for the current state of the resource.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response['Error']['Code'] == 'ResourceNotFoundException':
            # We can't find the resource that you asked for.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
    else:
        # Decrypts secret using the associated KMS key.
        # Depending on whether the secret is a string or binary, one of these fields will be populated.
        if 'SecretString' in get_secret_value_response:
            secret = get_secret_value_response['SecretString']
            data = json.loads(secret)

    s3_session = boto3.Session(aws_access_key_id     = data['lc_access_key'],
                               aws_secret_access_key = data['lc_secret_key'],
                               region_name           = region_name)
    s3_client = s3_session.client('s3', endpoint_url = data['lc_endpoint_url'])
    s3_response = s3_client.list_buckets()

    for bucket in s3_response['Buckets']:
        bucket_size = 0
        count_obj = 0
        bucket_name = bucket['Name']
        s3_obj_response = s3_client.list_objects_v2(Bucket=bucket_name)

        # Check for non-empty bucket. If empty, create entry with zero size and objects
        if "Contents" in s3_obj_response:
            bucket_size = sum(obj['Size'] for obj in s3_obj_response['Contents'])
            count_obj += len(s3_obj_response['Contents'])

            while s3_obj_response['IsTruncated']:
                s3_obj_response = s3_client.list_objects_v2(Bucket=bucket_name, ContinuationToken=s3_obj_response['NextContinuationToken'])
                count_obj += len(s3_obj_response['Contents'])

        log.info('Bucket - %s: total bucket size: %.2f, total objects: %.0f' % (bucket_name, bucket_size, count_obj))

        response = cwClient.put_metric_data(
            Namespace='LyveCloudBucketSizes',
            MetricData=[
                {
                    'MetricName': 'BucketSizeBytes',
                    'Dimensions': [
                        {
                            'Name': 'BucketName',
                            'Value': bucket_name
                        }
                    ],
                    'Timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ'),
                    'Value': bucket_size,
                    'Unit': 'Bytes'
                },
                {
                    'MetricName': 'NumberOfObjects',
                    'Dimensions': [
                        {
                            'Name': 'BucketName',
                            'Value': bucket_name
                        }
                    ],
                    'Timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ'),
                    'Value': count_obj,
                    'Unit': 'Count'
                }
            ]
        )
