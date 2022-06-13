import React from 'react';
import { Form, Input } from 'antd';

// need to align with CreateMigrationParams
export const renderInitFormItems = () => {
  const nameLists: {
    value: string;
    label: string;
  }[] = [
    {
      value: 'name',
      label: 'Name',
    },
    {
      value: 'endPoint',
      label: 'Endpoint',
    }
  ];
  return nameLists.map((ele) => {
    return (
      <Form.Item
        label={ele.label}
        key={ele.value}
        name={ele.value}
        rules={ele.value !== "path"? [{ required: true, message: `Please enter the ${ele.label} !` }] : undefined}
      >
        <Input></Input>
      </Form.Item>
    );
  });
};

export const renderAmazonS3FormItems = () => {
  const nameLists: {
    value: string;
    label: string;
  }[] = [
    {
      value: 'awsAccessKey',
      label: 'Access key',
    },
    {
      value: 'awsSecretKey',
      label: 'Secret access key',
    },
    {
      value: 'awsBucketName',
      label: 'Bucket name',
    },
    {
      value: 'awsPath',
      label: 'Path',
    },
  ];
  return nameLists.map((ele) => {
    return (
      <Form.Item
        label={ele.label}
        key={ele.value}
        name={ele.value}
        rules={ele.value !== "awsPath"? [{ required: true, message: `Please enter the ${ele.label} !` }] : undefined}
      >
        <Input></Input>
      </Form.Item>
    );
  });
};

export const renderLyveS3FormItems = () => {
  const nameLists: {
    value: string;
    label: string;
  }[] = [
    {
      value: 'acessKey',
      label: 'Access key',
    },
    {
      value: 'secretKey',
      label: 'Secret access key',
    },
    {
      value: 'bucketName',
      label: 'Bucket name',
    },
  ];
  return nameLists.map((ele) => {
    return (
      <Form.Item
        label={ele.label}
        key={ele.value}
        name={ele.value}
        rules={[{ required: true, message: `Please enter the Lyve ${ele.label} !` }]}
      >
        <Input></Input>
      </Form.Item>
    );
  });
};
