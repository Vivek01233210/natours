import mongoose from 'mongoose';
import slugify from 'slugify';
import validator from 'validator';
import User from './userModel.js';

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true,
        trim: true,
        maxLength: [40, 'A tour name cannot have more than 40 characters'],
        minLength: [10, 'A tour name cannot have less than 10 characters'],
        // validating using the external validator module.
        // validate: [validator.isAlpha, 'Tour must only contain characters an no whitespaces'],
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: "Difficulty  must be either easy, medium or difficult"
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be at least 1.0'],
        max: [5, 'Rating must be at most 5.0']
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    priceDiscount: {
        type: Number,
        // defining custom validator
        validate: {
            validator: function (val) {
                // this here only refers to the current doc/New doc creation and won't work in updation.
                if (val > this.price) return false
                else return true;
            },
            message: "Discount price cannot be greater than the regular price."
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a description']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false  // hide this field from sending it in response. Only used for the database
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        // GeoJSON
        type:{
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    // guides: Array,
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: "User"
        }
    ]
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// making index
tourSchema.index({ startLocation: '2dsphere' });

// Virtual property
tourSchema.virtual('durationWeeks').get(function () {
    return this.duration / 7;
});

// Virtual populate to connect tourModel with reviewModel
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

// TYPES OF MONGOOSE MIDDLEWARES:- 1) DOCUMENT MIDDLEWARE  2) QUERY MIDDLEWARE
// 3) AGGREGATE MIDDLEWARE  4) MODEL MIDDLEWARE 

// 1) DOCUMENT MIDDLEWARE(PRE-SAVE HOOK/MIDDLEWARE): runs before .save() or .create() methods only
tourSchema.pre('save', function (next) {
    // this here refers to the document before saving the tour
    this.slug = slugify(this.name, { lower: true });
    next();
});

// to implement embedding of users into tour document
// tourSchema.pre('save',async function(next){
//    const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//    this.guides = await Promise.all(guidesPromises);
//     next();
// });

// DOCUMENT MIDDLEWARE(PRE-SAVE HOOK/MIDDLEWARE)
tourSchema.pre('save', function (next) {
    // console.log("Will save the document...");
    next();
})

// DOCUMENT MIDDLEWARE(POST-SAVE HOOK/MIDDLEWARE): runs after the document is saved.
tourSchema.post('save', function (doc, next) {
    // doc here refers to the after it has been saved in the db.
    // console.log(doc);
    next();
})

// 2) QUERY MIDDLEWARE
// /^find/ --> regex for every string which starts with find(eg:- find, findOne etc.)
tourSchema.pre(/^find/, function (next) {
    // this here refers to the query object.
    this.find({ secretTour: { $ne: true } });
    this.start = Date.now();
    next();
});

// query middleware to populate referenced field 'guides'
tourSchema.pre(/^find/, function(next){
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });
    next();
});

// query middleware to log time taken to do a query.
tourSchema.post(/^find/, function (docs, next) {
    console.log('Query took', Date.now() - this.start, 'milliseconds!');
    // console.log(docs);
    next();
});

// 3) AGGREGATION MIDDLEWARE:- happens before and after an aggregation happens. Aggregation is happening in the tourControlles.js
// tourSchema.pre('aggregate', function (next) {
//     console.log(this._pipeline);
//     this._pipeline.unshift({ $match: { secretTour: { $ne: true } } })
//     next();
// })

const Tour = mongoose.model('Tour', tourSchema);

export default Tour;