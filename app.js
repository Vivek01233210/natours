import express from 'express';
import multer from 'multer';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';

import tourRouter from './routes/tourRoutes.js';
import userRouter from './routes/userRoutes.js';
import reviewRouter from './routes/reviewRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import AppError from './utils/appError.js';
import globalErrorHandler from './controllers/errorController.js';

import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const app = express();

// 1) GLOBAL MIDDLEWARES

// Set security HTTP headers
app.use(helmet());

// logs request related info in the console.
app.use(morgan('dev'));

const limiter = rateLimit({
    max: 100,
    windowMs: 60*60*1000,
    message: 'Too many reqs from this IP, please try again in an hour!'
});
// limiting the number of requests to our /api route.
app.use('/api', limiter);

// Body parser. reading data from the body into req.body
app.use(express.json({ limit: '10kb'}));

// Data sanitization against NoSQL query injection.
app.use(mongoSanitize());

// Data sanitization against XSS(Cross-Side-Scripting) attacks
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
    whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price']
}));

// serving static files
app.use(express.static(`${__dirname}/public`));

// some test middleware
// app.use((req, res, next) => {
//     req.requestTime = new Date().toISOString();;
//     console.log(req.headers);
//     next();
// })

// 2) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// 3)  ERROR HANDLING
// .all is for all the http methods.
app.all('*', (req, res, next) => {
    // const err = new Error(`Can't find ${req.originalUrl} on this server!`);
    // err.status = 'fail';
    // err.statusCode = 404;

    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

//  GLOBAL ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandler);