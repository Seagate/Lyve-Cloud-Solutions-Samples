import React, { useState } from "react";
import type { Moment } from 'moment';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  InputNumber,
  message,
  Row,
  Typography,
} from "antd";
import { useNavigate } from "react-router-dom";
import { CaretRightOutlined } from "@ant-design/icons";
import { renderAmazonS3FormItems, renderInitFormItems, renderLyveS3FormItems } from "./utils";
import { createMigration } from "src/services/migration";
import type { CreateMigrationParams } from "src/services/migration";

type FormValues = Omit<CreateMigrationParams, "creationDate"> & {
  creationDate: Moment
};
const CreateMigration: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<FormValues>();
  const [showFilter, setShowFilter] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  return (
    <div style={{ width: "95vw" }}>
      <Card style={{ borderRadius: "15px" }}>
        <Row justify="center">
          <Col span={24}>
            <Form
              form={form}
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 18 }}
              onSubmitCapture={() => {
                let isError = false;
                form.validateFields().catch((error) => {
                  if (error){
                    isError = true;
                  }
                })
                .finally(async () => {
                  if (isError){
                    return;
                  }
                  const formValues = form.getFieldsValue();
                  setIsSubmitting(true);
                  const res = await createMigration({
                    ...formValues,
                    creationDate: formValues.creationDate?.toISOString()
                  });
                  if (res.status){
                    message.success("Migration successfully");
                    navigate("/");
                  }
                  setIsSubmitting(false);
                })
              }}
            >
              {renderInitFormItems()}
              <Col offset={6}>
                <Typography.Title level={4}>
                  AWS S3 Configuration
                </Typography.Title>
              </Col>
              {renderAmazonS3FormItems()}
              <Col offset={6} style={{ marginBottom: "10px" }}>
                <Typography.Link
                  onClick={() => {
                    setShowFilter(!showFilter);
                  }}
                >
                  <CaretRightOutlined rotate={showFilter ? 90 : 0} />
                  Advanced filter
                </Typography.Link>
              </Col>
              {showFilter && (
                <>
                  <Form.Item
                    label="Min object size"
                    key="minObjSize"
                    name="minObjSize"
                  >
                    <InputNumber />
                  </Form.Item>
                  <Form.Item
                    label="Max object size"
                    key="maxObjSize"
                    name="maxObjSize"
                  >
                    <InputNumber />
                  </Form.Item>
                  <Form.Item
                    label="Object age"
                    key="objectAge"
                    name="objectAge"
                  >
                    <InputNumber />
                  </Form.Item>
                  <Form.Item
                    label="Creation Date"
                    key="creationDate"
                    name="creationDate"
                  >
                    <DatePicker allowClear={false} />
                  </Form.Item>
                </>
              )}
              <Col offset={6}>
                <Typography.Title level={4}>
                  Lyve S3 Configuration
                </Typography.Title>
              </Col>
              {renderLyveS3FormItems()}
              <Form.Item wrapperCol={{ offset: 6 }}>
                <Button type="primary" htmlType="submit" loading={isSubmitting}>
                  Submit
                </Button>
              </Form.Item>
            </Form>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default CreateMigration;
