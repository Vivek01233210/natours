import express from 'express';
import { createReview, deleteReview, getAllReviews, getReview, setTourUserIds, updateReview } from "../controllers/reviewController.js";
import { protect, restrictTo } from '../controllers/authController.js';

const router = express.Router({ mergeParams: true });

// implement protect middleware form this after.
router.use(protect);

// POST /tour/3hhj3j2v/reviews
// GET /tour/3hhj3j2v/reviews
// POST /reviews
router.route('/')
    .get(getAllReviews)
    .post(restrictTo('user'), setTourUserIds, createReview);

router.route('/:id')
    .get(getReview)
    .patch(restrictTo('user', 'admin'), updateReview)
    .delete(restrictTo('user', 'admin'), deleteReview)

export default router;