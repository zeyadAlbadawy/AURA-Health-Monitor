const express = require('express');
const adminRouter = express.Router();
const passport = require('passport');
const jwtCreation = require('../utils/createSendJWT.js');
const authController = require('../controllers/authController.js');
const protectMiddleware = require('../middlewares/protect-router.js');
const doctorPatientController = require('../controllers/doctorPatient.controller.js');
const adminController = require('../controllers/adminController.js');
const restriction = require('../middlewares/checkAdmin.js');
const completeProfile = require('../middlewares/completedProfile.js');

adminRouter
  .route('/approve-doctor/:id')
  .post(
    protectMiddleware.protect,
    restriction.restrictTo('admin'),
    adminController.approveDoctor
  );

adminRouter
  .route('/all-doctors')
  .get(
    protectMiddleware.protect,
    restriction.restrictTo('admin'),
    adminController.getAllDoctors
  );

module.exports = adminRouter;
