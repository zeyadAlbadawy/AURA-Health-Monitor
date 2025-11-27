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

adminRouter.use(protectMiddleware.protect);
adminRouter.use(restriction.restrictTo('admin'));

adminRouter.route('/product').post(adminController.addNewProduct);
adminRouter
  .route('/product/:id')
  .delete(adminController.deleteProduct)
  .patch(adminController.editProduct);
adminRouter.route('/orders/:id').get(adminController.getOrderById);
adminRouter.route('/orders/:id').patch(adminController.updateOrderStatus);
adminRouter.route('/all-orders').get(adminController.getAllOrders);

adminRouter.route('/approve-doctor/:id').post(adminController.approveDoctor);
adminRouter.route('/all-doctors').get(adminController.getAllDoctors);

module.exports = adminRouter;
