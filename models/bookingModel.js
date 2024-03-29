import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, "Booking must belong to a tour!"]
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, "Please provide a valid user!"]
    },
    price: {
        type: Number,
        required: [true, "Booking must have a price!"]
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    paid: {
        type: Boolean,
        default: true
    }
});

// Pre Query middleware
bookingSchema.pre(/^find/, function (next){
    this.populate('user').populate({
        path: 'tour',
        select: 'name'
    })
});

const Booking = mongoose.Model('Booking', bookingSchema)

export default Booking;