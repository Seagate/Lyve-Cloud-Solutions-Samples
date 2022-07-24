const mode = window.location.host;

let ROOT_BACKEND_API = 'http://localhost:4000/api';
let APP_DOMAIN = 'http://localhost:3000';

switch (mode) {
  case 'lyve-cloud-frontend.s3-website-ap-southeast-1.amazonaws.com':
    ROOT_BACKEND_API = 'http://52.76.244.21:4040/api';
    APP_DOMAIN =
      'http://lyve-cloud-frontend.s3-website-ap-southeast-1.amazonaws.com';
    break;

  default:
    // ROOT_BACKEND_API = 'http://localhost:4040/api';
    ROOT_BACKEND_API = 'http://52.76.244.21:4040/api';
    APP_DOMAIN = 'http://localhost:3000';
    break;
}

let exportModules = {
  ROOT_BACKEND_API,
  APP_DOMAIN,
};
export default exportModules;
