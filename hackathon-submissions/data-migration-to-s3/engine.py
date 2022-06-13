import os
import boto3
import json
from tkinter import *
import tkinter as tk
from tkcalendar import Calendar, DateEntry
import time
import multiprocessing.dummy as mp
from datetime import datetime
import pytz

utc = pytz.utc


def generate_client(params):
    return boto3.client("s3", **params)


def load_config():
    with open(
        os.path.dirname(os.path.realpath(__file__)) + "/config.json", "r"
    ) as file:
        config = json.loads(file.read())
    return config


def run_migration(num_threads, migration_type, min_date, max_date, min_size, max_size):
    global config, migration_label

    if migration_type == "AWS to Lyve":
        migrate_from = "aws"
        send_to = "lyve"
    else:
        migrate_from = "lyve"
        send_to = "aws"

    min_date = utc.localize(datetime.strptime(min_date, "%m/%d/%y"))
    max_date = utc.localize(datetime.strptime(max_date, "%m/%d/%y"))

    def update(o):
        print(f"Downloading {o['Key']}...")
        data = from_client.get_object(Bucket=bucket_from, Key=o["Key"])
        if not (min_size <= int(data["ContentLength"]) / 1000 <= max_size):
            print("Out of size range!")
            return
        if not (min_date <= data["LastModified"] <= max_date):
            print("Out of date range!")
            return
        to_client.upload_fileobj(data["Body"], bucket_to, o["Key"])

    top_logs = Toplevel(m)
    lab = Label(top_logs)
    lab.pack()

    from_client = generate_client(config[migrate_from]["params"])
    to_client = generate_client(config[send_to]["params"])

    bucket_from = config[migrate_from]["bucket_name"]
    bucket_to = config[send_to]["bucket_name"]

    bucket_from_objects = from_client.list_objects_v2(Bucket=bucket_from)
    num_objects = len(bucket_from_objects["Contents"])

    p = mp.Pool(num_threads)
    p.map(update, bucket_from_objects["Contents"])
    p.close()
    p.join()

    migration_label.configure(text=f"Transfer successful! {num_objects}/{num_objects}")


def generate_config(
    lyve_id,
    lyve_secret,
    lyve_bucket,
    aws_id,
    aws_secret,
    aws_bucket,
    aws_region,
    lyve_region,
):
    top = Toplevel(m)
    top.geometry("400x280")
    top.title("Generated Configuration")

    config["lyve"]["params"]["aws_access_key_id"] = lyve_id.get()
    config["lyve"]["params"]["aws_secret_access_key"] = lyve_secret.get()
    config["lyve"]["bucket_name"] = lyve_bucket.get()
    config["lyve"]["params"]["region_name"] = lyve_region.get()
    config["lyve"]["params"][
        "endpoint_url"
    ] = f"https://s3.{lyve_region.get()}.lyvecloud.seagate.com"
    config["aws"]["bucket_name"] = aws_bucket.get()
    config["aws"]["params"]["aws_access_key_id"] = aws_id.get()
    config["aws"]["params"]["aws_secret_access_key"] = aws_secret.get()
    config["aws"]["params"]["region_name"] = aws_region.get()
    if lyve_id.get() and lyve_secret.get():
        lyve_client = generate_client(config["lyve"]["params"])
        lyve_buckets = [
            bucket["Name"] for bucket in lyve_client.list_buckets()["Buckets"]
        ]
        drop = OptionMenu(m, lyve_bucket, *lyve_buckets)
        drop.grid(row=row, column=2)
        lyve_bucket.set(lyve_buckets[0])
    if aws_id.get() and aws_secret.get():
        aws_client = generate_client(config["aws"]["params"])
        aws_buckets = [
            bucket["Name"] for bucket in aws_client.list_buckets()["Buckets"]
        ]
        drop1 = OptionMenu(m, aws_bucket, *aws_buckets)
        drop1.grid(row=row, column=4)
        aws_bucket.set(aws_buckets[0])

    Label(top, text=json.dumps(config, indent=2), justify=LEFT).pack()
    if lyve_id and lyve_secret and lyve_bucket and aws_id and aws_secret and aws_bucket:
        config_label.configure(text="Config generated successfully!")
    else:
        config_label.configure(text="Please fill out all fields.")
    return config


def open_popup():
    top = Toplevel(m)
    top.geometry("750x250")
    top.title("Child Window")
    Label(top, text="Hello World!", font=("Mistral 18 bold")).place(x=150, y=80)


if __name__ == "__main__":
    m = Tk()
    m.geometry("700x410")
    m.title("AWS S3 <> Lyve Cloud Migration Solution")

    config = {
        "lyve": {
            "params": {
                "aws_access_key_id": "",
                "aws_secret_access_key": "",
                "region_name": "",
                "endpoint_url": "",  # "https://s3.ap-southeast-1.lyvecloud.seagate.com",
            },
            "bucket_name": "",
        },
        "aws": {
            "params": {
                "aws_access_key_id": "",
                "aws_secret_access_key": "",
                "region_name": "",
            },
            "bucket_name": "",
        },
    }
    row = 1
    Label(m, text="---Configuration---").grid(row=row, column=1)

    row += 1
    Label(m, text="Lyve Cloud Access Key ID:", width=20).grid(row=row, column=1)
    lyve_id = Entry(m, width=20)
    lyve_id.grid(row=row, column=2)

    Label(m, text="AWS Access Key ID:", width=20).grid(row=row, column=3)
    aws_id = Entry(m, width=20)
    aws_id.grid(row=row, column=4)

    row += 1
    Label(m, text="Lyve Cloud Secret Access Key:").grid(row=row, column=1)
    lyve_secret = Entry(m, width=20)
    lyve_secret.grid(row=row, column=2)

    Label(m, text="AWS Secret Access Key:").grid(row=row, column=3)
    aws_secret = Entry(m, width=20)
    aws_secret.grid(row=row, column=4)

    row += 1

    Label(m, text="Lyve Cloud Region:").grid(row=row, column=1)
    lyve_region = Entry(m, width=20)
    lyve_region.grid(row=row, column=2)

    Label(m, text="AWS S3 Region:").grid(row=row, column=3)
    aws_region = Entry(m, width=20)
    aws_region.grid(row=row, column=4)

    row += 1
    Label(m, text="Lyve Cloud Bucket to Transfer:").grid(row=row, column=1)
    lyve_bucket = StringVar()
    lyve_buckets = [""]
    drop = OptionMenu(m, lyve_bucket, *lyve_buckets)
    drop.grid(row=row, column=2)

    Label(m, text="AWS Bucket to Transfer:").grid(row=row, column=3)
    aws_bucket = StringVar()
    aws_buckets = [""]
    drop1 = OptionMenu(m, aws_bucket, *aws_buckets)
    drop1.grid(row=row, column=4)

    row += 1
    Label(m, text="Number of Threads:").grid(row=row, column=1)
    num_threads = Entry(m, width=20)
    num_threads.grid(row=row, column=2)
    num_threads.insert(0, "4")

    Label(m, text="Migration Type:").grid(row=row, column=3)
    migration_type = StringVar()
    migration_type.set("AWS to Lyve")
    drop2 = OptionMenu(m, migration_type, *["AWS to Lyve", "Lyve to AWS"])
    drop2.grid(row=row, column=4)

    row += 1
    Button(
        m,
        text="Generate Config File",
        command=lambda: generate_config(
            lyve_id,
            lyve_secret,
            lyve_bucket,
            aws_id,
            aws_secret,
            aws_bucket,
            aws_region,
            lyve_region,
        ),
    ).grid(row=row, column=1)
    config_label = Label(m, text="Please fill out all the fields.")
    config_label.grid(row=row, column=2)

    row += 1
    Label(m, text="").grid(row=row, column=1)

    row += 1
    Label(m, text="---Filters---").grid(row=row, column=1)

    row += 1
    Label(m, text="Min Date:").grid(row=row, column=1)
    min_date = DateEntry(m, width=16, background="magenta3", foreground="white", bd=2)
    min_date.grid(row=row, column=2)

    Label(m, text="Max Date:").grid(row=row, column=3)
    max_date = DateEntry(m, width=16, background="magenta3", foreground="white", bd=2)
    max_date.grid(row=row, column=4)

    row += 1
    Label(m, text="Min Size (in KB):").grid(row=row, column=1)
    min_size = Entry(m, width=20)
    min_size.grid(row=row, column=2)
    min_size.insert(0, "0")

    Label(m, text="Max Size (in KB):").grid(row=row, column=3)
    max_size = Entry(m, width=20)
    max_size.grid(row=row, column=4)
    max_size.insert(0, "1000000")

    row += 1
    Label(m, text="").grid(row=row, column=1)

    row += 1
    Button(
        m,
        text="Migrate Data",
        command=lambda: run_migration(
            int(num_threads.get()),
            migration_type.get(),
            min_date.get(),
            max_date.get(),
            int(min_size.get()),
            int(max_size.get()),
        ),
    ).grid(row=row, column=1)
    migration_label = Label(m, text="", justify=LEFT)
    migration_label.grid(row=row, column=2)

    row += 1
    Button(m, text="Quit Application", command=m.quit).grid(row=row, column=1)

    m.mainloop()
