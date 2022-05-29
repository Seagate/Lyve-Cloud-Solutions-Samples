import gzip
import json
from datetime import datetime, timedelta

class PullLogsService(object):
    def __init__(self, s3, bucket_name):
        self.s3 = s3
        self.bucket_name = bucket_name

    def __call__(self):
        prefix, suffix = self.__get_prefix_suffix__()
        all_objects = self.s3.list_objects_v2(Bucket=self.bucket_name, Prefix=prefix)
        if "Contents" not in all_objects:
            return list()

        objects = all_objects["Contents"]
        while all_objects['IsTruncated']:
            all_objects = self.s3.list_objects_v2(Bucket=self.bucket_name, Prefix=prefix, ContinuationToken=all_objects['NextContinuationToken'])
            objects += all_objects["Contents"]

        return self.__get_logs__(objects, suffix)

    def __get_logs__(self, objects, suffix):
        logs = list()
        for obj in objects:
            if suffix in obj["Key"]:
                s3_response_object = self.s3.get_object(Bucket=self.bucket_name, Key=obj["Key"])
                with gzip.open(s3_response_object["Body"], "rt") as gf:
                    logs += self.__format_gz_file__(gf)

        return logs

    def __get_prefix_suffix__(self):
        today = datetime.utcnow() - timedelta(hours=1)
        string_month = today.strftime("%B")
        year = today.year
        month = today.strftime("%m")
        day = today.strftime("%d")
        hour = today.strftime("%H")
        return f"{string_month}-{year}/S3-", f"-{year}-{month}-{day}-{hour}"

    def __format_gz_file__(self, file):
        lines = file.readlines()
        return [json.loads(line) for line in lines]