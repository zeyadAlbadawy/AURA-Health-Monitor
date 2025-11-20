const express = require('express');

const reviewController = require('./../controllers/reviewController');

const protectMiddleware = require('./../middlewares/protect-router');

const restriction = require('./../middlewares/checkAdmin');

const router = express.Router({ mergeParams: true });

router.use(protectMiddleware.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(restriction.restrictTo('patient'), reviewController.createReview);

router
  .route('/:id')
  .get(reviewController.getReviewById)
  .delete(reviewController.deleteReview)
  .patch(reviewController.updateReview);

module.exports = router;
