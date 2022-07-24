const express = require('express');
const videoRoutes = require('./server/video/video.routes');
const logsRoutes = require('./server/logs/logs.routes');

const router = express.Router(); // eslint-disable-line new-cap

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) => res.send('OK'));

// function isAuthenticated(req, res, next) {
//   const token = req.header('authorization');
//   if (token) {
//     const bearer = token.split(' ')[1];
//     const validated = jwt.verify(bearer, config.jwtSecret);
//     if (validated) {
//       return next();
//     }
//   }

//   // IF A USER ISN'T LOGGED IN, THEN REDIRECT THEM SOMEWHERE
//   return Response.unauthorizedRequest(res, 'Unauthorized request', {});
// }

// mount user routes at /users
router.use('/videos', videoRoutes);
router.use('/logs', logsRoutes);
module.exports = router;
