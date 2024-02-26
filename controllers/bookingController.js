import Stripe from 'stripe';

import AppError from "../utils/appError.js";
import Tour from "../models/tourModel.js";

// this will give us an stripe object to work with.
const stripe = new Stripe("sk_test_51OnjYVSC7TN3f0TAnpNsqoBBOVYML4JLuKGLmmYAtwugwJ89ez9aYtBAvqahQZowR4xhqWuDmtdt64omf8NDBHb800Qm0xZhhr");
// console.log(process.env.STRIPE_SECRET_KEY)

export const getCheckoutSession = async(req,res,next)=>{
    try {
        // 1) Get the currently booked tour
        const tour = await Tour.findById(req.params.tourId);

        // 2) Create checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            success_url: `${req.protocol}://${req.get('host')}/`,
            cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
            customer_email: req.user.email,
            client_reference_id: req.params.tourId,
            line_items: [{
                price_data: {
                    unit_amount: tour.price,
                    currency: "inr",
                    product_data: {
                        name: `${tour.name} tour`,
                        description: tour.summary,
                        images: ["https://natours.netlify.app/img/nat-1-large.jpg"],
                    }
                },
                quantity: 1
            }],
            mode: 'payment',
        })

        // 3) Create session as response
        res.status(200).json({
            status: 'success',
            session: session
        });

    } catch (error) {
        console.log(error);
        return next(new AppError(error));
    }
}