import { Badge, Typography } from "antd";
import { GetMigrationListOrder, Migration, MigrationStatus } from "src/services/migration";

import { compareRetNumber } from "src/utils/compareNumberAndString";

// the index should be align with the data returned by the API
export enum MigrationsColumnIndex {
  NAME = "name",
  STATUS = "Status",
  NO_OF_MIGRATED_OBJS = "done_count",
  NO_OF_FAILED_OBJS = "failed_count",
  EXECUTION_TIME = "CreatedAt",
}

export const MigrationColumnIndexToAPIFieldMap: Partial<Record<MigrationsColumnIndex,  GetMigrationListOrder>> = {
  [MigrationsColumnIndex.NAME]: 'name',
  [MigrationsColumnIndex.NO_OF_FAILED_OBJS]: 'failed',
  [MigrationsColumnIndex.NO_OF_MIGRATED_OBJS]: 'migrated',
}

// the index should be align with the data returned by the API
export enum ActivitiesColumnIndex {
  OBJECT = "name",
  STATUS = "status",
  OBJECT_SIZE = "size",
  EXECUTION_TIME = "UpdatedAt",
}


type MigrationsColumnFormatterProps = {
  handleLinkClick: any;
};

enum BadgeComponentStatus {
  PROCESSING = "processing",
  ERROR = "error",
  WARNING = "warning",
  SUCCESS = "success",
}

enum BadgeComponentStatusText {
  PROCESSING = "In Progress",
  ERROR = "Error",
  FAILED = "Failed",
  DONE = "Done",
  NOT_STARTED = "Not started",
}

export const convertToBadgeStatusAndText: (
  migrationStatus: MigrationStatus | undefined
) => {
  status: BadgeComponentStatus;
  text: BadgeComponentStatusText;
} = (migrationStatus) => {
  const toRet: {
    status: BadgeComponentStatus;
    text: BadgeComponentStatusText;
  } = {
    status: BadgeComponentStatus.ERROR,
    text: BadgeComponentStatusText.ERROR,
  };
  switch (migrationStatus) {
    case MigrationStatus.NOT_STARTED:
      toRet.status = BadgeComponentStatus.ERROR;
      toRet.text = BadgeComponentStatusText.NOT_STARTED;
      break;
    case MigrationStatus.IN_PROGRESS:
      toRet.status = BadgeComponentStatus.PROCESSING;
      toRet.text = BadgeComponentStatusText.PROCESSING;
      break;
    case MigrationStatus.DONE:
      toRet.status = BadgeComponentStatus.SUCCESS;
      toRet.text = BadgeComponentStatusText.DONE;
      break;
    case MigrationStatus.FAILED:
      toRet.status = BadgeComponentStatus.ERROR;
      toRet.text = BadgeComponentStatusText.FAILED;
      break;
    default:
      break;
  }
  return toRet;
};

export const MigrationsColumnFormatter = (
  props: MigrationsColumnFormatterProps
) => {
  const { handleLinkClick } = props;

  return [
    {
      title: "Name",
      dataIndex: MigrationsColumnIndex.NAME,
      key: MigrationsColumnIndex.NAME,
      sorter: true,
      searchFilter: true,
      render: (text: any, record: Migration) => (
        <Typography.Link onClick={() => handleLinkClick(record.ID)}>
          {text}
        </Typography.Link>
      ),
    },
    {
      title: "Status",
      dataIndex: MigrationsColumnIndex.STATUS,
      key: MigrationsColumnIndex.STATUS,
      searchFilter: false,
      render: (obj: any) => {
        const { status: badgeStatus, text: badgeText } =
          convertToBadgeStatusAndText(obj);
        return <Badge status={badgeStatus} text={badgeText} />;
      },
    },
    {
      title: "Number of migrated objects",
      dataIndex: MigrationsColumnIndex.NO_OF_MIGRATED_OBJS,
      sorter: true,
    },
    {
      title: "Number of failed objects",
      dataIndex: MigrationsColumnIndex.NO_OF_FAILED_OBJS,
      sorter: true,
    },
    {
      title: "Execution time",
      dataIndex: MigrationsColumnIndex.EXECUTION_TIME,
      key: MigrationsColumnIndex.EXECUTION_TIME,
      render: (obj: any) => new Date(obj).toLocaleDateString(),
    },
  ];
};

export const ActivitiesColumnFormatter = () => {
  return [
    {
      title: "Object",
      dataIndex: ActivitiesColumnIndex.OBJECT,
      key: ActivitiesColumnIndex.OBJECT,
      sorter: (a: any, b: any) => {
        return compareRetNumber(a as string, b as string);
      },
      searchFilter: true,
    },
    {
      title: "Status",
      dataIndex: ActivitiesColumnIndex.STATUS,
      key: ActivitiesColumnIndex.STATUS,
      searchFilter: false, // currently unable to filter
      render: (obj: any) => {
        const { status: badgeStatus, text: badgeText } =
          convertToBadgeStatusAndText(obj);
        return <Badge status={badgeStatus} text={badgeText} />;
      },
    },
    {
      title: "Object size (B)",
      dataIndex: ActivitiesColumnIndex.OBJECT_SIZE,
      sorter: (a: any, b: any) => {
        return compareRetNumber(a as number, b as number);
      },
    },
    {
      title: "Execution time",
      dataIndex: ActivitiesColumnIndex.EXECUTION_TIME,
      key: ActivitiesColumnIndex.EXECUTION_TIME,
      render: (obj: any) => new Date(obj).toLocaleDateString(),
    },
  ];
};
