import type { RequestOptionsInit } from 'umi-request';
import { extend } from 'umi-request';
import { notification } from 'antd';
import Cookies from 'js-cookie';
// import * as Sentry from '@sentry/react';

const SESSION_KEY = 'sessionKey';

const getDefaultHeaderOnMount = (): Record<any, any> => {
  let headers = {};
  const token = localStorage.getItem(SESSION_KEY);

  if (token) {
    headers = { ...headers, Authorization: `Token ${token}` };
  }

  const cfrsToken = Cookies.get('csrftoken');
  if (cfrsToken) {
    headers = { ...headers, 'X-CSRFTOKEN': cfrsToken };
  }

  return headers;
};

let defaultHeaders = getDefaultHeaderOnMount();

export const setDefaultHeader = (key: string, value: string) => {
  if (key && value) {
    defaultHeaders[key] = value;
  }
};

export const removeDefaultHeader = (key: string) => {
  delete defaultHeaders[key];
};

export function setSessionKey(key: string | null): void {
  if (key) {
    localStorage.setItem(SESSION_KEY, key);
  } else {
    localStorage.removeItem('sessionKey');
    removeDefaultHeader('Authorization');
    removeDefaultHeader('X-CSRFTOKEN');
  }

  defaultHeaders = getDefaultHeaderOnMount();
}

// const codeMessage: Record<number, string> = {
//   200: 'Request successful',
//   201: 'Created',
//   202: '202 Accepted',
//   204: 'No content',
//   400: 'Bad request',
//   401: 'Unauthorized',
//   403: 'Forbidden',
//   404: 'Not found',
//   406: 'Not acceptable',
//   410: 'Gone',
//   500: 'Internal server error',
//   502: 'Bad gateway',
//   503: 'Service unavailable',
//   504: 'Gateway timeout',
// };

export type GlobalResponseType = {
  status: boolean;
  content: any;
};

// const sentryErr = async (error: {
//   response: Response;
//   data: any;
//   request: {
//     url: string;
//     options: RequestOptionsInit;
//   };
// }) => {
//   if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
//     Sentry.captureException(
//       {
//         response: error.response.status,
//         resData: error.data,
//         content: await error.response.json(),
//         url: error.request.url,
//         method: error.request.options.method,
//         headers: error.request.options.headers,
//         data: error.request.options.data,
//       },
//       {
//         tags: {
//           source: 'graviton-admin',
//         },
//       },
//     );
//   }
// };
/**
 * @en-US Exception handler
 */
const errorHandler = (error: {
  response: Response;
  data: any;
  request: {
    url: string;
    options: RequestOptionsInit;
  };
}): GlobalResponseType => {
  // sentryErr(error);
  const { response, data } = error;
  if (response && response.status) {
    // const { status, url } = response;
    // const errorText = codeMessage[status] || response.statusText;
    // notification.error({
    //   message: `Request error ${errorText}: ${url}`,
    //   description: JSON.stringify(data),
    // });
  } else if (!response) {
    if (error.request?.options.preventPopup !== true) {
      notification.error({
        description: 'Your network is abnormal and cannot connect to the server',
        message: 'Network anomaly',
      });
    }
  }

  return { status: false, content: data };
};

/**
 * @en-US Configure the default parameters for request
 * @zh-CN 配置request请求时的默认参数
 */
const request = extend({
  errorHandler, // default error handling
  credentials: 'include', // Does the default request bring cookies
});

// if the same GET request is on the fly, skip it
const pendingRequest = new Set();
const overwriteRequest = new Map<any, number>();

request.use(async (ctx, next) => {
  // middleware to prepare request with default headers
  const { preventDupId, overwriteId } = ctx.req.options;

  let overwriteValue = 0;
  if (overwriteId) {
    overwriteValue = (overwriteRequest.get(overwriteId) || 0) + 1;
    overwriteRequest.set(overwriteId, overwriteValue);
  } else if (preventDupId) {
    if (pendingRequest.has(preventDupId)) {
      ctx.res = { status: false, content: null };
      return;
    }
    pendingRequest.add(preventDupId);
    // allow the request to be retried after 5s
    setTimeout(() => {
      pendingRequest.delete(preventDupId);
    }, 5000);
  }

  const { headers } = ctx.req.options;
  ctx.req.options.headers = {
    ...headers,
    ...defaultHeaders,
  };

  // execute request
  await next();

  if (preventDupId) pendingRequest.delete(preventDupId);
  if (overwriteId) {
    if (overwriteRequest.get(overwriteId) === overwriteValue) {
      overwriteRequest.delete(overwriteId);
    } else {
      ctx.res = { status: false, content: null, overwrite: true };
      return;
    }
  }

  const { res } = ctx;
  if (! res){
    ctx.res = { status: true, content: ctx.res };
    return;
  }
  if (Array.isArray(res.errors) && res.errors?.length > 0) {
    if (ctx.req.options.preventPopup !== true) {
      notification.error({
        message: `An error happened 🤭 !`,
        description: res?.errors[0].message,
      });
    }

    ctx.res = { status: false, content: res.errors };
    return;
  }
  // format success response
  ctx.res = { status: true, content: ctx.res };
});

export default request;
