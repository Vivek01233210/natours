import Review from "../models/reviewModel.js";
import APIFeatures from "../utils/apiFeatures.js";
import AppError from "../utils/appError.js";

export const getAllReviews = async (req, res, next) => {
    try {
        let filterObj = {};
        if (req.params.tourId) filterObj = { tour: req.params.tourId };

        const features = new APIFeatures(Review.find(filterObj), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();

        const reviews = await features.query;

        // SEND RESPONSE
        res.status(200).json({
            status: 'success',
            results: reviews.length,
            data: { reviews: reviews }
        });
    } catch (error) {
        console.log(error);
        next(new AppError(error.message));
    }
};

export const getReview = async (req, res, next) => {
    const review = await Review.findById(req.params.id);

    if (!review) return next(new AppError('No review found with that ID!', 404));

    res.status(200).json({
        status: 'success',
        data: { review: review }
    });
};

// asssistant middleware
export const setTourUserIds = (req, res, next) => {
    // Allow nested routes
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;

    next();
};

export const createReview = async (req, res, next) => {
    try {
        const newReview = await Review.create(req.body);

        res.status(201).json({
            status: 'success',
            data: {
                review: newReview
            }
        });
    } catch (error) {
        console.log(error);
        return next(new AppError(error, 500));
    }
};

export const deleteReview = async (req, res, next) => {
    try {
        const doc = await Review.findByIdAndDelete(req.params.id);

        if (!doc) {
            return next(new AppError('No document found with that ID!', 404));
        };

        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        console.log(error);
        return next(new AppError(error));
    }
};

export const updateReview = async (req, res, next) => {
    try {
        const doc = await Review.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!doc) {
            return next(new AppError("No document found with this ID", 404));
        }

        res.status(200).json({
            status: 'success',
            data: doc
        })
    } catch (error) {
        console.log(error);
        return next(new AppError(error, 500))
    }
};