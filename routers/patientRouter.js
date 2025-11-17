const express = require('express');
const patientRouter = express.Router();
const authController = require('../controllers/authController.js');
const protectMiddleware = require('../middlewares/protect-router.js');
const doctorPatientController = require('../controllers/doctorPatient.controller.js');
const adminController = require('../controllers/adminController.js');
const restriction = require('../middlewares/checkAdmin.js');
const completeProfile = require('../middlewares/completedProfile.js');
const patientController = require('../controllers/patientController.js');

// Must be logged in and this is belongs to patint only
patientRouter.use(protectMiddleware.protect);
patientRouter.use(restriction.restrictTo('patient'));
patientRouter.use(completeProfile.checkProfileCompletness); // does not work without protect middleware

patientRouter.route('/available-doctors').get(patientController.getAllDoctors);

patientRouter.route('/about-me').get(patientController.getMeInfo);
module.exports = patientRouter;
