import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, Pagination, Spin } from "antd";
import { getErrorLogs } from "src/services/migration";

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_PAGE = 1;
const ErrorLogs: React.FC = () => {
  const { migrationId } = useParams();
  const [fromLine, setFromLine] = useState(0);
  const [logData, setLogData] = useState<string[]>([]);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  useEffect(() => {
    setInterval(async () => {
      const res = await getErrorLogs({
        id: migrationId ? parseInt(migrationId) : 0,
        fromLine: fromLine,
      });
      if (res.status && res.content) {
        const splittedLogs = res.content.split("\n");
        const usedSplittedLogs = splittedLogs.slice(0, splittedLogs.length - 1) // to remove the last empty line after \n
        const newLineNumber = usedSplittedLogs.length;
        setFromLine(newLineNumber);
        setLogData(usedSplittedLogs);
      }
    }, 5000);
  }, []);

  return (
    <div style={{ width: "95vw" }}>
      <Card
        style={{ borderRadius: "15px", height: "85vh", overflowY: "scroll" }}
      >
        {logData && logData.length !== 0 ? (
          <div>
            {logData.slice((page-1) * pageSize, page*pageSize).map((l) => (
              <p key={l}>{l}</p>
            ))}
            <Pagination
              total={logData.length}
              defaultCurrent={DEFAULT_PAGE}
              pageSize={pageSize}
              pageSizeOptions={[10, 20, 30]}
              showTotal={(total) => `Total ${total} items`}
              style={{ display: "flex", justifySelf: "center" }}
              onChange={(p, ps) => {
                setPage(p)
                setPageSize(ps);
              }}
            />
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Spin tip={"Loading..."} />
          </div>
        )}
      </Card>
    </div>
  );
};

export default ErrorLogs;
