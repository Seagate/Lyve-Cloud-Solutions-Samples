import time

class UploadCloudwatchLogsService(object):
    def __init__(self, cloudwatch_client, log_group, log_stream, log_events):
        self.log_group = log_group
        self.log_stream = log_stream
        self.log_events = log_events
        self.cloudwatch_client = cloudwatch_client

    def __call__(self):
        logs_response = self.cloudwatch_client.describe_log_streams(
            logGroupName=self.log_group, 
            logStreamNamePrefix=self.log_stream
        )

        timestamp = int(round(time.time() * 1000))
        sequence_token = logs_response['logStreams'][0].get("uploadSequenceToken")
        log_events = [{"timestamp": timestamp, "message": str(event)} for event in self.log_events]
        
        if sequence_token is None:
            return self.cloudwatch_client.put_log_events(
                logGroupName=self.log_group,
                logStreamName=self.log_stream,
                logEvents=log_events
            )
            
        return self.cloudwatch_client.put_log_events(
            logGroupName=self.log_group,
            logStreamName=self.log_stream,
            logEvents=log_events,
            sequenceToken=sequence_token
        )