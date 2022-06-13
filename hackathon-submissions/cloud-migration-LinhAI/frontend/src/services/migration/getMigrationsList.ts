import request from 'src/utils/request';
import { BASE_URL } from "./constants";
import type { Migration } from './types';
import { generateQueryUrl } from '../utils';
import type { ResTemplate } from '../Types';

export type GetMigrationListOrder = "name" | "failed" | "migrated"
export type GetMigrationListParams = {
  order?: GetMigrationListOrder,
  ascending?: boolean;
  search?: string;
  pageSize?: number;
  page?: number; 
}

type GetMigrationListRes = ResTemplate<Migration[]>
export const getMigrationList: (params: GetMigrationListParams) => Promise<GetMigrationListRes> = (params) => {
  let ordering: string | undefined;
  if (typeof params.order === "string"){
    ordering = `${params.ascending? "-": ""}${params.order}`
  }
  return request(generateQueryUrl(
    BASE_URL,
    {
      ordering,
      search: params.search,
      page: params.page,
      page_size: params.pageSize
    }
  ))
}

