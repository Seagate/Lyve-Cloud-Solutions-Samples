import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "antd/dist/antd.css";
import "./index.css";
import reportWebVitals from "./reportWebVitals";

import { Typography } from "antd";
import MigrationList from "./LyveCloudMigration/MigrationHistory";
import MigrationDetails from "./LyveCloudMigration/MigrationDetails";
import CreateMigration from "./LyveCloudMigration/CreateMigration";
import ErrorLogs from "./LyveCloudMigration/ErrorLogs";
import ErrorPage from "./LyveCloudMigration/404";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <React.StrictMode>
    <Typography.Title
      level={2}
      style={{ display: "flex", justifyContent: "center", marginTop: "10px" }}
    >
      Lyve Cloud Migration
    </Typography.Title>
    <Router>
      <Routes>
        <Route index element={<MigrationList />} />
        <Route path="/lyve_cloud_migration" element={<MigrationList />} />
        <Route
          path="/lyve_cloud_migration/:migrationId"
          element={<MigrationDetails />}
        />
        <Route
          path="/lyve_cloud_migration/:migrationId/logs"
          element={<ErrorLogs />}
        />
        <Route
          path="/lyve_cloud_migration/create_migration"
          element={<CreateMigration />}
        />
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </Router>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
