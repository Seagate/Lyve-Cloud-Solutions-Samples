const config = require('./config/config');

const app = require('./config/express');

if (!module.parent) {
  app.listen(config.port, () => {
    console.log(`server started on port ${config.port}`);
  });
}
