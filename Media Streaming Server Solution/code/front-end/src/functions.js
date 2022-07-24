import { request } from './utils/request';

export const callApi = async ({ url, mehod, data, authenticaed }) => {
  try {
    const metadata = {
      path: url,
      method: mehod,
    };
    const response = await request(metadata, metadata, authenticaed);
    if (response.success === true) {
      return response.data;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};
