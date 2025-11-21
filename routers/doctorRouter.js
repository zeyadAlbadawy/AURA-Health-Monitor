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
const reviewRouter = require('./reviewRouter.js');

doctorRouter.use('/:doctorId/reviews', reviewRouter);

doctorRouter.use(protectMiddleware.protect);
doctorRouter.use(restriction.restrictTo('doctor'));
doctorRouter.use(completeProfile.checkProfileCompletness);

doctorRouter
  .route('/patients-requests')
  .get(doctorController.patientsRequestsWithMe);
doctorRouter.route('/patient-booking/:id').get(doctorController.patientBooking); // get specific booking
doctorRouter
  .route('/patient-booking/:id/approve')
  .post(doctorController.approveBooking);

doctorRouter
  .route('/patient-booking/:id/reject')
  .post(doctorController.rejectBooking);

doctorRouter.route('/update-booking/:id').post(doctorController.updateBooking);
doctorRouter
  .route('/my-patients-approved')
  .get(doctorController.myPatientsApproved);

// Slot Approach
doctorRouter.route('/about-me').get(doctorController.getMeInfo);

doctorRouter.route('/create-slot').post(doctorController.createSlot);
doctorRouter
  .route('/all-slots-available')
  .get(doctorController.allAvailableSlots);
doctorRouter
  .route('/slot/:id')
  .get(doctorController.getSpecificSlot)
  .delete(doctorController.deleteSlot);
// .patch(doctorController.updateSlotInfo);
module.exports = doctorRouter;
