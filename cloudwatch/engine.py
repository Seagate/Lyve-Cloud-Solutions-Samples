import os
import boto3
from utils.json_extractor import JsonExtractor
from services.pull_logs_service import PullLogsService
from services.upload_cloudwatch_logs_service import UploadCloudwatchLogsService

def generate_cloudwatch_client(params):
    return boto3.client(
        'logs',
        aws_access_key_id=params.get("aws_access_key_id"),
        aws_secret_access_key=params.get("aws_secret_access_key"),
        region_name=params.get("region_name"),
    )

def generate_lyvecloud_client(params):
    return boto3.client(
        's3',
        aws_access_key_id=params.get("aws_access_key_id"),
        aws_secret_access_key=params.get("aws_secret_access_key"),
        region_name=params.get("region_name"),
        endpoint_url=params.get("endpoint_url"),
    )

def main():
    print("Starting engine...")

    config = JsonExtractor.from_file(os.path.dirname(os.path.realpath(__file__))+"/config.json")
    lyvecloud_client = generate_lyvecloud_client(config["lyvecloud"])
    cloudwatch_client = generate_cloudwatch_client(config["aws"])

    logs = PullLogsService(
        s3=lyvecloud_client,
        bucket_name=config["lyvecloud"]["bucket_name"]
    )()
    print(f"Pull {len(logs)} Audit Logs")
    if len(logs) > 0:
        response = UploadCloudwatchLogsService(
            cloudwatch_client=cloudwatch_client,
            log_group=config["aws"]["log_group"],
            log_stream=config["aws"]["log_stream"],
            log_events=logs
        )()

    print("Done")


if __name__ == '__main__':
    main()
