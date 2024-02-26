import express from 'express';
import { getAllTours, createTour, getTour, updateTour, deleteTour, aliasTopTours, getTourStats, getMonthlyPlan, getToursWithin, getDistances } from '../controllers/tourController.js';
import { protect, restrictTo } from '../controllers/authController.js';
import reviewRouter from './reviewRoutes.js';

const router = express.Router();

// router.param('id', checkID);

// Nested Routing
// POST /tour/h234bgvhj43/reviews
// GET /tour/r23hjbvh43thbv/reviews
// GET /tour/kn252bn5j/reviews/bn421k5bj3j

// router.route('/:tourId/reviews')
//     .post(protect, restrictTo('user'), createReview)

router.use('/:tourId/reviews', reviewRouter)

router
    .route('/top-5-cheapest')
    .get(aliasTopTours, getAllTours)

router
    .route('/tour-stats')
    .get(getTourStats);

router
    .route('/monthly-plan/:year')
    .get(protect, restrictTo('admin', 'lead-guide', 'guide'), getMonthlyPlan);

router
    .route('/tours-within/:distance/center/:latlng/unit/:unit')
    .get(getToursWithin)

router.
    route('/distances/:latlng/unit/:unit')
    .get(getDistances)

router
    .route('/')
    .get(getAllTours)
    .post(protect, restrictTo('admin', 'lead-guide'), createTour);

router
    .route('/:id')
    .get(getTour)
    .patch(protect, restrictTo('admin', 'lead-guide'), updateTour)
    .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);

export default router;