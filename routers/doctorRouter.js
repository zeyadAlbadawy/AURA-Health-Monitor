const express = require('express');
const doctorRouter = express.Router();
const authController = require('../controllers/authController.js');
const protectMiddleware = require('../middlewares/protect-router.js');
const doctorPatientController = require('../controllers/doctorPatient.controller.js');
const adminController = require('../controllers/adminController.js');
const restriction = require('../middlewares/checkAdmin.js');
const completeProfile = require('../middlewares/completedProfile.js');
const patientController = require('../controllers/patientController.js');
const doctorController = require('../controllers/doctorController.js');

doctorRouter.use(protectMiddleware.protect);
doctorRouter.use(restriction.restrictTo('doctor'));

doctorRouter
  .route('/about-me')
  .get(completeProfile.checkProfileCompletness, doctorController.getMeInfo);
module.exports = doctorRouter;
