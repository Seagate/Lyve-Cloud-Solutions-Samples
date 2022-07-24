import configs from '../configs';
import jwt_decode from 'jwt-decode';

export class ResponseError extends Error {
  // this.response;

  constructor(response) {
    super(response.statusText);
    this.response = response;
  }
}

/**
 * Parses the JSON returned by a network request
 *
 * @param  {object} response A response from a network request
 *
 * @return {object}          The parsed JSON from the request
 */
function parseJSON(response) {
  if (response.status === 204 || response.status === 205) {
    return null;
  }
  return response.json();
}

export function getAuthToken() {
  return sessionStorage.getItem(`token-${configs.APP_DOMAIN}`);
}
export function getUserId() {
  let token = sessionStorage.getItem(`token-${configs.APP_DOMAIN}`);
  if (token) {
    let user = jwt_decode(token);
    return user.id;
  } else {
    return null;
  }
}
export function getCurrentUserId() {
  try {
    const token = sessionStorage.getItem(`token-${configs.APP_DOMAIN}`);
    if (token) {
      let user = jwt_decode(token);
      return user.id;
    } else {
      return null;
    }
  } catch (error) {
    console.log(error);
    return null;
  }
}
export function clearAuthToken() {
  sessionStorage.removeItem(`token-${configs.APP_DOMAIN}`);
}

/**
 * Checks if a network request came back fine, and throws an error if not
 *
 * @param  {object} response   A response from a network request
 *
 * @return {object|undefined} Returns either the response, or throws an error
 */
function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  const error = new ResponseError(response);
  error.response = response;
  throw error;
}

/**
 * Requests a URL, returning a promise
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [options] The options we want to pass to "fetch"
 *
 * @return {object}           The response data
 */
export async function request(_metadata, data, isSecure = true) {
  const metadata = { ..._metadata };
  const pathTokens = metadata.path.split('/:');
  if (metadata.path.indexOf('/:') !== 0) {
    pathTokens.shift();
  }
  pathTokens.forEach((token) => {
    metadata.path = metadata.path.replace(`/:${token}`, `/${data[token]}`);
  });

  const url = `${configs.ROOT_BACKEND_API}${metadata.path}`;
  const options = {
    method: metadata.method,
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache',
    credentials: 'omit', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
      ...(isSecure && {
        Authorization: `Bearer ${getAuthToken()}`,
      }),
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrer: 'no-referrer', // no-referrer, *client
    ...(['POST', 'PUT'].includes(metadata.method) && {
      body: JSON.stringify(data),
    }),
  };

  const fetchResponse = await fetch(url, options);
  const response = checkStatus(fetchResponse);
  return parseJSON(response);
}
