import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Result } from "antd";

const ErrorPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{ width: "95vw" }}>
      <Card style={{ borderRadius: "15px" }}>
        <Result
          status="404"
          title="404"
          subTitle="Sorry, the page you visited does not exist."
          extra={
            <Button type="primary" onClick={() => navigate("/lyve_cloud_migration")}>
              Back Home
            </Button>
          }
        />
      </Card>
    </div>
  );
};

export default ErrorPage;
