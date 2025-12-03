const express = require('express');
const deviceRouter = express.Router();
const protectMiddleware = require('../middlewares/protect-router.js');
const restriction = require('../middlewares/checkAdmin.js');
const completeProfile = require('../middlewares/completedProfile.js');
const deviceController = require('../controllers/deviceController');

deviceRouter.use(protectMiddleware.protect);
deviceRouter.use(restriction.restrictTo('patient'));
deviceRouter.use(completeProfile.checkProfileCompletness);

deviceRouter.route('/pair-device').post(deviceController.pairDevice);
deviceRouter.route('/:deviceId').delete(deviceController.disconnectDevice);
deviceRouter.route('/').get(deviceController.myPairedDevices);
module.exports = deviceRouter;
