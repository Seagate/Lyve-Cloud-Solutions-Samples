import request from "src/utils/request";
import { BASE_URL } from "./constants";
import { Migration } from "./types";
import { ResTemplate } from "../Types";

type GetMigrationByIdRes = ResTemplate<Migration>;

export const getMigrationById: (id: number) => Promise<GetMigrationByIdRes> = (id) => {
  return request(`${BASE_URL}/${id}`)
}