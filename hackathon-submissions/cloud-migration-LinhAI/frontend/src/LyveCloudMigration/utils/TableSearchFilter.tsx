import { Button, Input, Row, Select, Space } from 'antd';
import React, { useState } from 'react';
import { SearchOutlined } from '@ant-design/icons';

const { Option } = Select;

export enum StatusOption {
  DONE = 'done',
  IN_PROGRESS = 'in_progress',
}

const SelectOptions = {
  done: 'Done',
  in_progress: 'In Progress',
};

export interface TableSearchFilterType {
  columns: any[];
  handleSearchFilter: any;
  handleReset: any;
  options?: StatusOption[];
}

/** Options for status are required if status filter is used */
const TableSearchFilter = (props: TableSearchFilterType): any => {
  const { columns, handleReset, handleSearchFilter, options } = props;
  const [searchText, setSearchText] = useState('');
  const [column, setColumn] = useState('');

  const onClickReset = () => {
    setSearchText('');
    handleReset();
  };

  const onSelectChange = (value: any) => {
    setSearchText('');
    setColumn(value);
  };

  const onClickFilter = () => {
    handleSearchFilter(searchText, column);
  };

  const generateStatusFilter = (statusOptions: StatusOption[]) => {
    const opts: any[] = [];
    statusOptions.forEach((opt: StatusOption) => {
      opts.push(<Select.Option value={opt}>{SelectOptions[opt]}</Select.Option>);
    });
    return opts;
  };

  return (
    <Row justify="end">
      <Space>
        {column === 'status' ? (
          <Select
            style={{ width: 150 }}
            onChange={(value: string) => setSearchText(value)}
            placeholder="Select a status"
          >
            {options && generateStatusFilter(options)}
          </Select>
        ) : (
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />
        )}
        <Select
          onChange={onSelectChange}
          placeholder="Select column to filter"
          style={{ width: 200 }}
        >
          {columns.map((c) =>
            c.searchFilter ? (
              <Option key={c.key} value={c.key}>
                {c.title}
              </Option>
            ) : null,
          )}
        </Select>
        <Button
          disabled={searchText.length === 0 || !column}
          type="primary"
          onClick={onClickFilter}
        >
          Filter
        </Button>
        <Button type="default" onClick={onClickReset}>
          Reset
        </Button>
      </Space>
    </Row>
  );
};

export default TableSearchFilter;
