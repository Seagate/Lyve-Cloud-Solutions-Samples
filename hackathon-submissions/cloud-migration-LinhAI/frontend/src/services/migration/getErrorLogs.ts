import { BASE_URL } from "./constants";
import request from "src/utils/request";
import { generateQueryUrl } from "../utils";

type GetErrorLogsRes =
  | {
      status: true;
      content: string;
    }
  | {
      status: false;
      content: null;
    };

export const getErrorLogs: (params: {
  id: number | undefined;
  fromLine: number | undefined;
}) => Promise<GetErrorLogsRes> = (params) => {
  return request(
    generateQueryUrl(`${BASE_URL}/${params.id}/logs`, {
      from_line: undefined,
    })
  );
};
