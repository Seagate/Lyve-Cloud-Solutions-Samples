export enum MigrationStatus {
  NOT_STARTED = 0,
  IN_PROGRESS = 1,
  DONE = 2,
  FAILED = 3,
}

export type Migration = {
  ID: 1,
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null,
  name: string;
  aws_access_key: string;
  aws_secret_key: string;
  AwsRegionName: string;
  aws_bucket_name: string;
  aws_path: string;
  access_key: string;
  secret_key: string,
  LyveRegionName: string;
  bucket_name: string;  // lyve bucket name
  endpoint: string;
  Status: MigrationStatus,
  done_count: number;
  failed_count: number;
}

export type MigrationObject = {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  name: string;
  size: number;
  status: MigrationStatus;
  MigrationID: number;
}
