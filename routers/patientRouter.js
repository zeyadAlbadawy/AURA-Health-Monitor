const express = require('express');
const patientRouter = express.Router();
const authController = require('../controllers/authController.js');
const protectMiddleware = require('../middlewares/protect-router.js');
const doctorPatientController = require('../controllers/doctorPatient.controller.js');
const adminController = require('../controllers/adminController.js');
const restriction = require('../middlewares/checkAdmin.js');
const completeProfile = require('../middlewares/completedProfile.js');
const patientController = require('../controllers/patientController.js');
const doctorController = require('../controllers/doctorController.js');
// Must be logged in and this is belongs to patint only
patientRouter.use(protectMiddleware.protect);
patientRouter.use(restriction.restrictTo('patient'));
patientRouter.use(completeProfile.checkProfileCompletness); // does not work without protect middleware

// slots
patientRouter.route('/available-doctors').get(patientController.getAllDoctors);
patientRouter.route('/available-doctors/:id').get(doctorController.getMeInfo); //get one doctor info
patientRouter.route('/about-me').get(patientController.getMeInfo); // get signed in patient info

patientRouter
  .route('/all-available-slots/:doctorId')
  .get(doctorController.allAvailableSlots);

patientRouter
  .route('/all-available-slots/:doctorId/request-slot/:slotId')
  .post(patientController.requestSlotWithDoctor);
patientRouter.route('/my-bookings').get(patientController.myBookings);
patientRouter.route('/my-booking/:id').get(patientController.myBooking);
patientRouter
  .route('/update-booking/:id')
  .post(patientController.updateMyBookingNotes);

patientRouter
  .route('/cancel-booking/:id')
  .post(patientController.cancelBookingSlot);

patientRouter
  .route('/api/payment/callback')
  .post(patientController.paymobWebhookController);

module.exports = patientRouter;
