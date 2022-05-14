import json
import logging
import subprocess

def read_config(file_path):
    with open(file_path, 'r') as file:
        content_json = json.loads(file.read())

    return content_json


        

if __name__ == '__main__':

    # initializes the credentials and creates an S3 service client
        # objects to perform actions: client is swiss knife, resource has all sort of data
    config = read_config("config.json")

    lyve_config = config["lyvecloud"]
    aws_config = config["aws"]

    to_upload_lst = lyve_config["to_upload"]
    
    for data in to_upload_lst:
        try: 
            cmd = "aws s3 cp " +  "s3://" + lyve_config["bucket_name"] + "/" + data  + " " + data + " --endpoint-url=" + lyve_config["endpoint_url"] + " --profile " + lyve_config["profile_name"]
            subprocess.run(cmd,shell=True, check=True)
            
            cmd = "aws s3 cp " + data + " s3://" + aws_config["bucket_name"] + " --profile " + aws_config["profile_name"] 
            subprocess.run(cmd,shell=True, check=True)
        except subprocess.CalledProcessError as e:
            logging.error(e)


    
    for script in config["scripts"]:
        try:
            upload_scripts = "aws s3 cp " + script + " s3://" + aws_config["bucket_name"] + " --profile " + aws_config["profile_name"] 
            subprocess.run(upload_scripts,shell=True, check=True)
        except subprocess.CalledProcessError as e:
            logging.error(e)


