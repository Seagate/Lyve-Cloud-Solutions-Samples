import request from "src/utils/request";
import { BASE_URL } from "./constants";
import { ResTemplate } from "../Types";

export type CreateMigrationParams = {
  name: string;

  awsAccessKey: string;
  awsSecretKey: string;
  awsBucketName: string;
  awsPath?: string;

  acessKey: string;
  secretKey: string;
  bucketName: string;
  endPoint: string;

  minObjSize?: number;
  maxObjSize?: number;
  creationDate?: string; // may change to date time
  objectAge?: number; // in days
}

export const createMigration: (params: CreateMigrationParams) => Promise<ResTemplate<any>> = (params) => {
  return request(
    BASE_URL,
    {
      method: "POST",
      data: {
        name: params.name,
        aws_access_key: params.awsAccessKey,
        aws_secret_key: params.awsSecretKey,
        aws_bucket_name: params.awsBucketName,
        aws_path: params.awsPath || undefined,
        access_key: params.acessKey,
        secret_key: params.secretKey,
        bucket_name: params.bucketName,
        endpoint: params.endPoint,
        min_object_size: params.minObjSize,
        max_object_size: params.maxObjSize,
        creation_date: params.creationDate,
        object_age: params.objectAge,
      }
    }
  )
}