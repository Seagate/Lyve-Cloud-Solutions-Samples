import request from 'src/utils/request';
import { BASE_URL } from "./constants";
import type { ResTemplate } from "../Types";
import type { MigrationObject } from './types';

export type MigrationObjectsResults = {
  id: number;
  name: string;  // migration name
  status: string;
  done_count: number;
  failed_count: number;
  total_count: number;
  total_size: number;
  objects: MigrationObject[];
}
type GetMigrationObjectsRes = ResTemplate<{
  results: MigrationObjectsResults
}>
export const getMigrationObjects: (id: number) => Promise<GetMigrationObjectsRes> = (id) => {
  return request(`${BASE_URL}/${id}/objects`);
}