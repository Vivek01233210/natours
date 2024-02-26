import Tour from '../models/tourModel.js';
import APIFeatures from '../utils/apiFeatures.js';
import AppError from '../utils/appError.js';

// middleware for the route: /api/v1/tours/top-5-cheapest
export const aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = 'price,-ratingsAverage';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};

// class APIFeatures {
//     constructor(query, queryString) {
//         this.query = query;
//         this.queryString = queryString;
//     }

//     filter() {
//         // filtering
//         const queryObj = { ...this.queryString };  // making shallow copy
//         const excludedFields = ['page', 'sort', 'limit', 'fields'];
//         excludedFields.forEach(element => delete queryObj[element]);
//         // console.log(req.query, queryObj);

//         //  Advanced filtering with regex
//         let queryStr = JSON.stringify(queryObj);
//         queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);
//         // console.log(JSON.parse(queryStr));

//         this.query = this.query.find(JSON.parse(queryStr));
//         // let query = Tour.find(JSON.parse(queryStr)); // return array of docs

//         return this;
//     }

//     sort() {
//         if (this.queryString.sort) {
//             // console.log(this.queryString.sort);
//             const sortBy = this.queryString.sort.split(',').join(' ');
//             console.log(sortBy);
//             this.query = this.query.sort(sortBy);  // sorted through mongoose
//         } else {
//             this.query = this.query.sort('-createdAt');  // '-' for descending order
//         }
//         return this;
//     }

//     limitFields() {
//         if (this.queryString.fields) {
//             const fields = this.queryString.fields.split(',').join(' ');
//             this.query = this.query.select(fields);   // select specific fields in the schema
//         }
//         return this;
//     }

//     paginate() {
//         const page = this.queryString.page * 1 || 1;  // this.queryString.page*1 --> typecasting
//         const limit = this.queryString.limit * 1 || 100;
//         const skip = (page - 1) * limit;
//         this.query = this.query.skip(skip).limit(limit);

//         return this;
//     }
// }

export const getAllTours = async (req, res, next) => {
    // console.log(req.requestTime);
    // console.log(req.query);
    try {
        // BUILD QUERY
        // 1A) Filtering
        // const queryObj = { ...req.query };  // making shallow copy
        // const excludedFields = ['page', 'sort', 'limit', 'fields'];
        // excludedFields.forEach(element => delete queryObj[element]);
        // // console.log(req.query, queryObj);

        // // 1B) Advanced filtering with regex
        // let queryStr = JSON.stringify(queryObj);
        // queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);
        // // console.log(JSON.parse(queryStr));

        // let query = Tour.find(JSON.parse(queryStr)); // return array of docs

        // 2) Sorting
        // if (req.query.sort) {
        //     // console.log(req.query.sort);
        //     const sortBy = req.query.sort.split(',').join(' ');
        //     console.log(sortBy);
        //     query = query.sort(sortBy);  // sorted through mongoose
        // } else {
        //     query = query.sort('-createdAt');  // '-' for descending order
        // }

        // 3) Field Limitting
        // if (req.query.fields) {
        //     const fields = req.query.fields.split(',').join(' ');
        //     query = query.select(fields);   // select specific fields in the schema
        // }

        // 4) Pagination
        // const page = req.query.page * 1 || 1;  // req.query.page*1 --> typecasting
        // const limit = req.query.limit * 1 || 100;
        // const skip = (page - 1) * limit;
        // query = query.skip(skip).limit(limit);

        // if (req.query.page) {
        //     const numOfTours = await Tour.countDocuments();
        //     // console.log(skip,page*limit, numOfTours);
        //     if (page * limit > numOfTours) throw new Error('This page does not exist!')
        // }


        // EXECUTE QUERY

        const features = new APIFeatures(Tour.find(), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();

        // const tours = await features.query.explain();
        const tours = await features.query;

        // SEND RESPONSE
        res.status(200).json({
            status: 'success',
            results: tours.length,
            data: { tours: tours }
        });
    } catch (error) {
        next(new AppError(error.message));
        // res.status(404).json({
        //     status: 'fail',
        //     message: error
        // })
    }
};

export const getTour = async (req, res, next) => {
    // console.log(req.params.id);
    // const id = req.params.id * 1;
    try {
        const tour = await Tour.findById(req.params.id).populate('reviews');
        if (!tour) { return next(new AppError("No tour found with that ID", 404)) }

        res.status(200).json({
            status: 'success',
            data: {
                tour
            }
        });
    } catch (error) {
        if (error.name === "CastError") {
            return next(new AppError("Invalid tour Id", 400));
        }
        next(new AppError(error.message, 404));

        // res.status(404).json({
        //     status: 'fail',
        //     message: error
        // });
    }
};

export const createTour = async (req, res, next) => {
    // const newTours = new Tour({})
    // newTours.save();
    try {
        const newTour = await Tour.create(req.body);
        // console.log(newTour);

        res.status(200).json({
            status: 'success',
            data: {
                tour: newTour
            }
        });
    } catch (error) {
        if (error.code === 11000) { return next(new AppError('Tour already exists! Please choose another name!', 400)) }

        next(new AppError(error.message, 400));
        // res.status(400).json({
        //     status: 'fail',
        //     message: error
        // })
    }
};

export const updateTour = async (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return res.status(200).json({
            status: 'success',
            data: "No updates provided"
        });
    }
    try {
        const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!tour) { return next(new AppError("No tour found with that ID", 404)) }

        res.status(200).json({
            status: 'success',
            data: {
                tour: tour
            }
        });

    } catch (error) {
        if (error.name === "CastError") {
            return next(new AppError("Invalid tour Id", 400));
        }
        if (error.name === "ValidationError") {
            const message = Object.values(error.errors).map(el => el.message).join(", ");
            return next(new AppError(`Invalid Input data. ${message}`, 400));
        }

        // res.status(404).json({
        //     status: 'fail',
        //     error: error
        // });
    }
};

export const deleteTour = async (req, res, next) => {
    try {
        const tour = await Tour.findByIdAndDelete(req.params.id);
        if (!tour) { return next(new AppError("No tour found with that ID", 404)) }

        res.status(204).json({
            status: 'Successfully deleted the document!',
            data: null
        });

    } catch (error) {
        next(new AppError(error.message, 400));

        // res.status(400).json({
        //     status: 'Failed to delete the document!',
        //     message: error
        // });
    }
};

// /tours-within/:distance/center/25.6278, 85.1798/unit/mi
export const getToursWithin = async (req, res, next) => {
    try {
        const { distance, latlng, unit } = req.params;
        const [lat, lng] = latlng.split(',');

        // calculating radius in radians | (3963.2 miles/ 6378.1) km is the radius of earth
        const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

        if (!lat || !lng) {
            return next(new AppError('Invalid latitude or longitude', 400));
        }

        const tours = await Tour.find({
            startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
        });

        res.status(200).json({
            status: 'success',
            results: tours.length,
            data: {
                data: tours
            }
        });
    } catch (error) {
        console.log(error);
        return next(new AppError(error));
    }
}

export const getDistances = async (req, res, next) => {
    try {
        const { latlng, unit } = req.params;
        const [lat, lng] = latlng.split(',');

        const multiplier =  unit === 'mi' ? 0.000621371 :  0.001;

        if (!lat || !lng) {
            return next(new AppError('Invalid latitude or longitude', 400));
        }

        const distances = await Tour.aggregate([
            {
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: [lng*1, lat*1]
                    },
                    distanceField: 'distance',
                    distanceMultiplier: multiplier
                }
            },
            {
                $project: {
                    distance:  1,
                    name: 1,
                }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                data: distances
            }
        });
    } catch (error) {
        console.log(error);
        return next(new AppError(error, 400));
    }
}

// AGGREGATION PIPELINE
export const getTourStats = async (req, res, next) => {
    try {
        const stats = await Tour.aggregate([
            { $match: { ratingsAverage: { $gte: 4.5 } } },
            {
                $group: {
                    _id: '$difficulty',
                    num: { $sum: 1 },
                    numRatings: { $sum: '$ratingsQuantity' },
                    avgRating: { $avg: '$ratingsAverage' },
                    avgPrice: { $avg: '$price' },
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' }
                }
            },
            {
                $sort: { avgPrice: 1 }
            },
            // {
            //     $match: { _id: { $ne: 'easy' } }
            // }
        ]);
        res.status(200).json({
            status: 'Successful!',
            data: stats
        });
    } catch (error) {
        next(new AppError(error.message, 400));

        // res.status(400).json({
        //     status: 'Failed to aggregate!',
        //     message: error
        // });
    }
}

// AGGREGATION PIPELINE
export const getMonthlyPlan = async (req, res, next) => {
    try {
        const year = req.params.year * 1;
        const plan = await Tour.aggregate([
            {
                $unwind: '$startDates'
            },
            {
                $match: {
                    startDates: {
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`),
                    }
                }
            },
            {
                $group: {
                    _id: { $month: '$startDates' },
                    numTourStart: { $sum: 1 },
                    tours: { $push: '$name' }
                }
            },
            {
                $addFields: { month: '$_id' }
            },
            {
                $project: {
                    _id: 0
                }
            },
            {
                $sort: { numTourStart: -1 }
            },
            {
                $limit: 12
            }
        ]);

        res.status(200).json({
            status: 'Successfully aggregated',
            data: plan
        });
    } catch (error) {
        next(new AppError(error.message, 400));

        // res.status(400).json({
        //     status: 'Failed to delete the document!',
        //     message: error
        // });
    }
}