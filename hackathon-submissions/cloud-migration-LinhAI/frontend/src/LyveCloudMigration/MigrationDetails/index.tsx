import React, { useState, useEffect, useMemo } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Spin,
  Progress,
  Row,
  Space,
  Table,
  Typography,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { LeftOutlined } from "@ant-design/icons";

import TableSearchFilter, { StatusOption } from "../utils/TableSearchFilter";
import { ActivitiesColumnFormatter, convertToBadgeStatusAndText} from "../utils/MigrationsColumnFormatter";
import "./index.css";

import { getMigrationObjects, getMigrationById, MigrationObjectsResults, MigrationStatus } from 'src/services/migration';
import type { Migration } from "src/services/migration";

const POLLING_INTERVAL = 5000;
const MigrationDetails: React.FC = () => {
  const { migrationId }: any = useParams();
  const intMigrationId = useMemo(() => {
    return parseInt(migrationId, 10);
  }, [migrationId])
  const navigate = useNavigate();

  const [donePolling, setDonePolling] = useState(false);
  useEffect(() => {
    setDonePolling(false);
  }, [intMigrationId])

  const [isLoadingMigration, setIsLoadingMigration] = useState(false);
  const [migration, setMigration] = useState<Migration | null>(null);

  useEffect(() => {
    const loadMigration = async () => {
      setIsLoadingMigration(true);
      const res = await getMigrationById(intMigrationId);
      if (res.status){
        setMigration(res.content);
        if (res.content.Status === MigrationStatus.DONE){
          setDonePolling(true);
        }
      }
      setIsLoadingMigration(false);
    }
    if (! donePolling){
      const timeout = setTimeout(() => {
        loadMigration();
      }, 10);
      const interval = setInterval(() => {
        loadMigration();
      }, POLLING_INTERVAL)
      return (() => {
        clearTimeout(timeout);
        clearInterval(interval);
      })
    }
  }, [intMigrationId, donePolling])

  const [isLoadingMigrationObjs, setIsLoadingMigrationObj] = useState(false);
  const [migrationsObjsResult, setMigrationObjsResults] = useState<MigrationObjectsResults | null>(null);
  useEffect(() => {
    const loadMigrationObjs = async () => {
      setIsLoadingMigrationObj(true)
      const res = await getMigrationObjects(intMigrationId);
      console.log("check get migration objects response", res);
      if (res.status){
        const results = res.content.results;
        setMigrationObjsResults(results);
      }
      setIsLoadingMigrationObj(false);
    }

    if (! donePolling){
      const timeout = setTimeout(() => {
        loadMigrationObjs();
      }, 10);
      const interval = setInterval(() => {
        loadMigrationObjs();
      }, POLLING_INTERVAL)
      return (() => {
        clearTimeout(timeout);
        clearInterval(interval);
      })
    }
  }, [intMigrationId, donePolling])


  // Activity listing states
  const [filerInfo, setFilterInfo] = useState<{name?: string}>({});

  const dataSource = useMemo(() => {
    const objsArr = migrationsObjsResult?.objects
    const nameFilter = filerInfo.name
    const filteredMigrationsObj = nameFilter ? objsArr?.filter((migrationObj) => {
      return migrationObj.name.includes(nameFilter)
    }) : [ ...(objsArr || [])]
    return filteredMigrationsObj
  }, [filerInfo.name, migrationsObjsResult?.objects])

  // only name collumn can be search now
  const handleSearchFilter = (value: any, column: 'name') => {
    if (column === 'name'){
      setFilterInfo({
        name: value as string | undefined,
      });
    }
  };

  const handleReset = () => {
    setFilterInfo({});
  };

  const migrationInfo = useMemo(() => {
    if (! migration){
      return null;
    }
    const createdString = new Date(migration.CreatedAt).toDateString();
    const { status: badgeStatus, text: badgeText } = convertToBadgeStatusAndText(migration.Status);
    return (
      <Card className="cardRender">
        <Row>
          <Typography.Title level={4}>{migration.name}</Typography.Title>
        </Row>
        <Row wrap={false}>
          <Descriptions>
            <Descriptions.Item label="Status">
              <Badge status={badgeStatus} text={badgeText} />
            </Descriptions.Item>
            <Descriptions.Item label="AWS bucket">{migration.aws_bucket_name}</Descriptions.Item>
            <Descriptions.Item label="AWS path ">{migration.aws_path}</Descriptions.Item>
            <Descriptions.Item label="Lyve bucket ">{migration.bucket_name}</Descriptions.Item>
            <Descriptions.Item label="Endpoint ">
              <a href={migration.endpoint}>{migration.endpoint}</a>
            </Descriptions.Item>
            <Descriptions.Item label="Created at">{createdString}</Descriptions.Item>

            <Descriptions.Item label="Number of migrated objects ">{typeof migrationsObjsResult?.done_count === "number" ? migrationsObjsResult?.done_count: "N/A"}</Descriptions.Item>
            <Descriptions.Item label="Number of failed objects ">{typeof migrationsObjsResult?.failed_count === "number" ? migrationsObjsResult?.failed_count: "N/A"}</Descriptions.Item>
            <Descriptions.Item label="Number of objects ">{typeof migrationsObjsResult?.total_count === "number" ? migrationsObjsResult?.total_count: "N/A"}</Descriptions.Item>
            <Descriptions.Item label="Total migrated size ">{typeof migrationsObjsResult?.total_size === "number" ? `${Math.round(migrationsObjsResult?.total_size/(1024*1024) * 100) / 100} MB` : "N/A"}</Descriptions.Item>
          </Descriptions>
        </Row>
      </Card>
    );
  }, [migration, migrationsObjsResult]);

  const migrationProgressBar = useMemo(() => {
    const migrationProgress = typeof (migrationsObjsResult?.done_count) === "number" && typeof migrationsObjsResult?.total_count === "number" ?
      migrationsObjsResult.done_count/migrationsObjsResult.total_count : undefined
    return (
      <Card className="cardRender">
        <Row>
          <Typography.Title level={4}>Progress</Typography.Title>
        </Row>
        <Row gutter={[16, 0]}>
          <Col span={23}>
            <Progress percent={typeof migrationProgress === 'number'? Math.floor(migrationProgress *100*100)/100: undefined} showInfo/>
          </Col>
          <Col>
            <Spin spinning={typeof migrationProgress === 'number'? migrationProgress < 1: undefined}></Spin>
          </Col>
        </Row>
      </Card>
    );
  }, [migrationsObjsResult?.done_count, migrationsObjsResult?.total_count]);

  const renderActivitiesTable = () => {
    return (
      <Card className="cardRender">
        <Space style={{ width: "100%" }} direction="vertical">
          <Row justify="space-between">
            <Typography.Title level={4}>Migration History</Typography.Title>
            <TableSearchFilter
              columns={ActivitiesColumnFormatter()}
              handleSearchFilter={handleSearchFilter}
              handleReset={handleReset}
              options={[StatusOption.IN_PROGRESS, StatusOption.DONE]}
            />
          </Row>
          <Table
            locale={{
              sortTitle: "Sort",
              triggerDesc: "Click sort by descend",
              triggerAsc: "Click sort by ascend",
              cancelSort: "Click to cancel sort",
            }}
            columns={ActivitiesColumnFormatter()}
            dataSource={dataSource}
            pagination={{
              position: ["bottomRight"],
            }}
            rowKey={(record) => {
              return record.ID;
            }}
          />
        </Space>
      </Card>
    );
  };

  const renderErrorLog = () => {
    return (
      <Card className="cardRender" style={{ marginBottom: "25px" }}>
        <Space style={{ width: "100%" }} direction="vertical">
          <Row>
            <Typography.Title level={4}>Error Log</Typography.Title>
          </Row>
          <Button
            type="primary"
            onClick={() =>
              navigate(`/lyve_cloud_migration/${migrationId}/logs`)
            }
          >
            Show details
          </Button>
        </Space>
      </Card>
    );
  };

  return (
    <div style={{ width: "95vw" }}>
      <Spin spinning={isLoadingMigration || isLoadingMigrationObjs} size="large">
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Row style={{ justifyContent: "space-between" }}>
            <Button
              style={{
                borderRadius: "10px",
              }}
              onClick={() => navigate("/lyve_cloud_migration")}
            >
              <LeftOutlined /> Back
            </Button>
            {/*<Button*/}
            {/*  style={{*/}
            {/*    borderRadius: "10px",*/}
            {/*  }}*/}
            {/*  type="primary"*/}
            {/*  danger*/}
            {/*>*/}
            {/*  Terminate Job*/}
            {/*</Button>*/}
          </Row>
          {migrationInfo}
          {migrationProgressBar}
          {renderActivitiesTable()}
          {renderErrorLog()}
        </Space>
      </Spin>
    </div>
  );
};

export default MigrationDetails;
