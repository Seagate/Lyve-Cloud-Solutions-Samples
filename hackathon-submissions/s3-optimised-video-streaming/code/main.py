from fastapi.staticfiles import StaticFiles
import json
import logging

import boto3
from fastapi import (FastAPI, File, Form, HTTPException, Request, UploadFile,
                     status)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, HTMLResponse, FileResponse
import time
# 1 MB Chunks when downloading from S3
S3_DOWNLOAD_BYTE_LENGTH = 1024 ** 2 * 1
CHUNK_SIZE = 1024 ** 2 * 8  # 8 MB Chunks to be downloaded per user request
CONFIG_LOCATION = "config.json"
# For 8 MB Chunk Size and 1 MB S3 Download byte length, this means that there will be 8 TCP requests to S3, while streaming the entire response.
# This means that when the FIRST 1 MB S3 download is completed, this file can be immediately sent over to the client
# This is a tradeoff between the number of TCP requests and the size of the response

# The smaller the S3_DOWNLOAD_BYTE_LENGTH, the faster the TTFB, but the larger the number of TCP requests
# Edit S3_DOWNLOAD_BYTE_LENGTH to increase TTFB or decrease TTFB as required.

# Chunk Size can be changed as required, but may cause latency lags if it is too small (8MB is ideal)
# Smaller Chunk Size may help with network egress fees from S3 downloads

CACHE = {}

logger = logging.getLogger('SeagateVideoStreaming')
logger.setLevel(logging.DEBUG)

# create console handler and set level to debug
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)

# create formatter
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
# add formatter to ch
ch.setFormatter(formatter)
logger.addHandler(ch)


app = FastAPI()


# CORS template
origins = [
    "https://seagate.com",
    # "http://localhost:9000",
    # "http://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def read_config(file_path):
    with open(file_path, 'r') as file:
        content_json = json.loads(file.read())
    return content_json


config = read_config(CONFIG_LOCATION)
s3_resource = boto3.resource('s3', endpoint_url=config["endpoint_url"],
                             aws_access_key_id=config["access_key"],
                             aws_secret_access_key=config["secret_key"],
                             region_name=config["region_name"])
s3_client = boto3.client('s3', endpoint_url=config["endpoint_url"],
                         aws_access_key_id=config["access_key"],
                         aws_secret_access_key=config["secret_key"],
                         region_name=config["region_name"])


""" Functions for bucket operations """
# The function prints the list of the existing buckets


def list_buckets():
    buckets = s3_client.list_buckets()
    result = []
    if buckets['Buckets']:
        for bucket in buckets['Buckets']:
            print(bucket)
            result.append(bucket)
    return result


def create_bucket(bucket_name):
    s3_client.create_bucket(Bucket=bucket_name)
    print('Successfully created bucket %s' % bucket_name)


def delete_bucket(bucket_name):
    s3_client.delete_bucket(Bucket=bucket_name)
    print('Bucket %s successfully deleted' % bucket_name)


""" Functions for video streaming optimisation for TTFB

    Follows the Range Requests Specification in RFC 7233
    https://datatracker.ietf.org/doc/html/rfc7233


"""


def send_bytes_range_requests(
    bucket: str, file_name: str, start: int, end: int, starttime: float, chunk_size: int = S3_DOWNLOAD_BYTE_LENGTH  # 1 MB chunks
):
    """Send a file in chunks using Range Requests specification RFC7233

    `start` and `end` parameters are inclusive due to specification
    """
    pos = start
    # starttime = None
    endtime = time.time() - starttime
    logger.debug("TIME TAKEN FOR TTFB: " +
                 str(int(endtime * 1000)) + "ms")
    while (pos) < end:
        read_size = min(chunk_size, end + 1 - pos)
        # starttime = time.time()
        resp = s3_client.get_object(
            Bucket=bucket, Key=file_name, Range=f"bytes={pos}-{pos + read_size - 1}")
        if pos != start:
            endtime = time.time() - starttime
            starttime = time.time()
            logger.debug("Downloading from S3 - End: " + str(int(end / 1024 / 1024)).ljust(2) + " MB " + "Current: " +
                         str(int(pos / 1024 / 1024)).ljust(2) + " MB Total: " + str(int((pos - start) / 1024 / 1024)).ljust(2) +
                         " MB content_length: " + str(int(int(resp['ContentLength']) / 1024 / 1024)).ljust(2) + " MB " +
                         "Time Taken: " + str(int(endtime * 1000)) + "ms")
        else:
            logger.debug("Downloading from S3 - End: " + str(int(end / 1024 / 1024)).ljust(2) + " MB " + "Current: " +
                         str(int(pos / 1024 / 1024)).ljust(2) + " MB Total: " + str(int((pos - start) / 1024 / 1024)).ljust(2) +
                         " MB content_length: " + str(int(int(resp['ContentLength']) / 1024 / 1024)).ljust(2) + " MB ")

        pos = pos + resp['ContentLength']

        yield resp["Body"].read()


def _get_range_header(range_header: str, file_size: int):
    """
    _get_range_header 

    Gets the start and end of the existing range requests, if not present, raise a HTTP 416 exception

    Follows the RFC 7233 Range Requests Specification

    """
    def _invalid_range():
        return HTTPException(
            status.HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE,
            detail=f"Invalid request range (Range:{range_header!r})",
        )

    try:
        h = range_header.replace("bytes=", "").split("-")
        start = int(h[0]) if h[0] != "" else 0
        end = int(h[1]) if h[1] != "" else file_size - 1
    except ValueError:
        raise _invalid_range()

    if start > end or start < 0 or end > file_size - 1:
        raise _invalid_range()
    return start, end


def range_requests_response(
    request: Request, bucket: str, file_name: str, content_type: str, starttime: float, chunks: int = CHUNK_SIZE
):
    """Returns StreamingResponse using Range Requests of a given file

    Raise a HTTP 416 exception if the range request is invalid

    Follows the RFC 7233 Range Requests Specification

    """

    range_header = request.headers.get("range")
    # Requested Range header from GET request
    key = bucket + "/" + file_name
    if key in CACHE:
        file_size = CACHE[key]
    else:
        logger.debug('Getting HEAD information from S3')
        response = s3_client.head_object(Bucket=bucket, Key=file_name)
        file_size = response['ContentLength']
        CACHE[key] = file_size
        endtime = time.time() - starttime

        logger.debug('TIME TAKEN TO GET HEAD information from S3: ' +
                     str(int(endtime * 1000)) + "ms")
        logger.debug('File Size: ' + str(int(file_size / 1024 / 1024)) + "MB")

    headers = {
        "content-type": content_type,
        "accept-ranges": "bytes",
        "content-encoding": "identity",
        "content-length": str(file_size),
        "access-control-expose-headers": (
            "content-type, accept-ranges, content-length, "
            "content-range, content-encoding"
        ),
    }
    start = 0
    end = file_size - 1
    status_code = status.HTTP_200_OK
    if range_header is not None:
        start, end = _get_range_header(range_header, file_size)
        end = min(chunks + start - 1, end)
        size = end - start + 1
        headers["content-length"] = str(size)
        headers["content-range"] = f"bytes {start}-{end}/{file_size}"
        status_code = status.HTTP_206_PARTIAL_CONTENT

    return StreamingResponse(
        send_bytes_range_requests(
            bucket=bucket, file_name=file_name, start=start, end=end, starttime=starttime),
        headers=headers,
        status_code=status_code,
    )


""" Functions for objects operations """


async def list_objects(bucket_name):
    current_bucket = s3_resource.Bucket(bucket_name)
    print('The files in bucket %s:\n' % bucket_name)
    data = []
    for obj in current_bucket.objects.all():
        data.append(obj.meta.data)
    return data


async def upload_object(bucket_name, file_name, file_location):
    s3_resource.Bucket(bucket_name).upload_file(file_location, file_name)
    print('Object %s successfully uploaded' % file_name)


async def delete_object(bucket_name, file_name):
    s3_client.delete_object(Bucket=bucket_name, Key=file_name)
    print('Object %s successfully deleted' % file_name)


async def download_object(bucket_name, file_name, file_location):
    s3_resource.Bucket(bucket_name).download_file(file_name, file_location)
    print('Object %s successfully downloaded' % file_name)


""" FastAPI Views and functions

The API endpoints below are barebones, sufficient for file upload and download and streaming, but without authentication.

Authentication deployment is left for the end-user, as each authentication deployment will differ for each usecase, with different specs depending on OAuth2.

"""


@app.get("/watch")
async def get_video(request: Request, v: str, bucket: str):
    starttime = time.time()
    return range_requests_response(request, bucket=bucket, file_name=v, content_type="video/mp4", starttime=starttime)


@app.get("/list_buckets")
async def list_bucket_endpoint():
    return list_buckets()


@app.get("/list_objects")
async def list_object_endpoint(bucket: str):
    return await list_objects(bucket)


@app.post("/create_bucket")
async def create_bucket_post(bucket_name):
    s3_client.create_bucket(Bucket=bucket_name)
    print('Successfully created bucket %s' % bucket_name)
    return "Success"


@app.post("/files_upload")
async def create_files(file: UploadFile = File(...), file_name: str = Form(...), bucket: str = Form(...)):
    print(bucket, file_name)
    try:
        s3_client.upload_fileobj(file.file, bucket, str(file_name))
        return "Success"
    except Exception as e:
        if hasattr(e, "message"):
            raise HTTPException(
                status_code=e.message["response"]["Error"]["Code"],
                detail=e.message["response"]["Error"]["Message"],
            )
        else:
            raise HTTPException(status_code=500, detail=str(e))


app.mount("/assets", StaticFiles(directory='web/assets'), name="assets")
app.mount("/images", StaticFiles(directory='web/images'), name="images")


@app.get("/", include_in_schema=False, response_class=HTMLResponse)
async def home():
    with open("web/index.html") as f:
        return f.read()


@app.get('/favicon.ico', include_in_schema=False)
async def favicon():
    favicon_path = "web/favicon.ico"
    return FileResponse(favicon_path)

# You can run the file from commandline using the following command below
# Remove the --reload flag for production use case
# uvicorn main:app --host 127.0.0.1 --port 8080 --reload --timeout-keep-alive 60
