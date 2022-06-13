import React, { useEffect, useState } from "react";
import { Card, Row, Space, Table, Pagination, Button, Typography } from "antd";
// import { useDispatch, useSelector } from '@@/plugin-dva/exports';
import { useNavigate } from "react-router-dom";

// import type { ConnectState } from '@/models/connect';
import TableSearchFilter, { StatusOption } from "../utils/TableSearchFilter";
import { MigrationsColumnFormatter, MigrationColumnIndexToAPIFieldMap, MigrationsColumnIndex } from "../utils/MigrationsColumnFormatter";

import { getMigrationList, Migration } from "src/services/migration";
import type { GetMigrationListParams } from 'src/services/migration';

const initMigrationsListParams: GetMigrationListParams = {
  page: 1,
  pageSize: 5,
}

export const MigrationList: React.FC = () => {
  // const dispatch = useDispatch();
  const navigate = useNavigate();
  // Migration listing states
  const [migrationsListParams, setMigrationsListParams] = useState<GetMigrationListParams>(initMigrationsListParams)

  const [isLoadingMigrations, setIsLoadingMigrations] = useState(false);
  const [migrations, setMigrations] = useState<Migration[]>([]);

  useEffect(() => {
    const loadMigration = async () => {
      setIsLoadingMigrations(true);
      const res = await getMigrationList(migrationsListParams);
      if (res.status){
        try {
          setMigrations(res.content);
        } catch (err) {
          console.error("Error when parsing migration api return", err);
        }
      }
      setIsLoadingMigrations(false);
    }
    const timeout = setTimeout(() => {
      loadMigration();
    }, 10);
    return () => {
      clearTimeout(timeout);
    }
  }, [migrationsListParams]);

  const handleChangeMigration = (_: any, __: any, sorter: {
    field?: any;
    order?: any;
  }| any) => {
    if (Object.keys(sorter).length === 0) {
      return;
    }

    if (!sorter.order && migrationsListParams.order) {
      setMigrationsListParams((curState) => ({
        ...curState,
        order: undefined,
      }));
    } else if (
      sorter.field !== migrationsListParams.order ||
      (sorter.order === "ascend") !== migrationsListParams.ascending
    ) {
      setMigrationsListParams((curState) => ({
        ...curState,
        order: sorter.field? MigrationColumnIndexToAPIFieldMap[sorter.field as MigrationsColumnIndex]: undefined,
        ascending: sorter.order === "ascend",
      }));
    }
  };

  const handlePaginationChange = (page: number, pageSize?: number) => {
    setMigrationsListParams((curState) => ({
      pageSize: pageSize || curState.pageSize,
      page,
    }));
  };

  const handleSearchFilter = (value: any, column: 'name' | 'status') => {
    if (column === "name"){
      setMigrationsListParams((curState) => ({
        ...curState,
        search: value,
      }))
    }
  };

  const handleResetFilter = () => {
    setMigrationsListParams((curState) => ({
      ...curState,
      search: undefined,
    }));
  };

  const handleLinkClick = (value: number) => {
    navigate(`/lyve_cloud_migration/${value}`);
  };

  return (
    <div style={{ width: "95vw" }}>
      <Space style={{ width: "100%" }} direction="vertical">
        <Button
          style={{
            margin: "5px",
            borderRadius: "10px",
          }}
          type="primary"
          size="middle"
          onClick={() => {
            navigate("/lyve_cloud_migration/create_migration");
          }}
        >
          + New Migration
        </Button>
        <Card style={{ borderRadius: "15px" }}>
          <Space style={{ width: "100%" }} direction="vertical">
            <Row justify="space-between">
              <Typography.Title level={4}>Migration History</Typography.Title>
              <TableSearchFilter
                columns={MigrationsColumnFormatter({ handleLinkClick })}
                handleSearchFilter={handleSearchFilter}
                handleReset={handleResetFilter}
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
              columns={MigrationsColumnFormatter({ handleLinkClick })}
              dataSource={migrations}
              onChange={handleChangeMigration}
              pagination={false}
              loading={isLoadingMigrations}
              rowKey={(record) => {
                return record.ID;
              }}
            />
            <Row justify="end">
              <Pagination
                showSizeChanger
                onChange={handlePaginationChange}
                pageSize={migrationsListParams.pageSize}
                current={migrationsListParams.page}
                // total={modelList.data?.length}
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`
                }
              />
            </Row>
          </Space>
        </Card>
      </Space>
    </div>
  );
};

export default MigrationList;
