import { promisify } from 'util';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import User from "../models/userModel.js";
import AppError from '../utils/appError.js';
import sendEmail from '../utils/email.js';

export const signup = async (req, res, next) => {
    try {
        const newUser = await User.create({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            role: req.body.role,
            passwordConfirm: req.body.passwordConfirm,
            passwordChangedAt: req.body.passwordChangedAt
        });

        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        const cookieOptions = {
            expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
            httpOnly: true, //only accessible through HTTP and not by client-side scripting like JavaScript
            secure: process.env.NODE_ENV === 'production' ? true : false //only send over HTTPS
        };
        res.cookie('jwt', token, cookieOptions);

        res.status(201).json({
            status: 'success',
            token: token,
            data: {
                user: newUser
            }
        });
    } catch (error) {
        console.log(error)
        res.status(400).json({
            status: 'fail',
            data: {
                error: error
            }
        });
    };
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1) Check if email/password exist
        if (!email || !password) {
            return next(new AppError('Please provide email and password!', 400));
        }

        // 2) Check is user exists and password is correct
        const user = await User.findOne({ email: email }).select('+password');
        console.log(user);

        // .correctPassword() is defined in userModel.js
        if (!user || !(await user.correctPassword(password, user.password))) {
            return next(new AppError("Incorrect email or password", 401));
        }

        // 3) If everything is ok, send token to client and store it as HTTPOnly cookie
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        const cookieOptions = {
            expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
            httpOnly: true, //only accessible through HTTP and not by client-side scripting like JavaScript
            secure: process.env.NODE_ENV === 'production' ? true : false //only send over HTTPS
        };
        res.cookie('jwt', token, cookieOptions);

        res.status(200).json({
            status: 'success',
            token: token,
            data: {
                user: user
            }
        });
    } catch (error) {
        console.log(error);
        return next(new AppError(error));
    }
};

// since the jwt is stored in cookie(with http access only), it can't be edited or removed by the client. So we have to define this logout route to reset jwt
export const logout = async (req, res, next) => {
    try {
        res.cookie('jwt', 'loggedOut', {
            expires: new Date(Date.now() + (10*1000)),
            httpOnly: true
        });
        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (error) {
        console.log(error);
        return next(new AppError(error));
    }
};

// middleware function to be used in tourRoutes.js
export const protect = async (req, res, next) => {
    try {
        // 1) Getting token and check if it's there
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(" ")[1];
        }
        // console.log(token);

        if (!token) {
            return next(new AppError("You are not logged in! Please login first!", 401))
        }

        // 2) Verification of token
        try {
            const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
            // console.log(decoded);
            // 3) Check if user still exists or is deleted his account.
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next(new AppError('User belonging to this token does no longer exist.', 401));
            }

            // 4) Check if user changed password after the token was issued.
            // changedPasswordAfter custom method defined in userModel.js, it returns a boolean value
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next(new AppError('User recently changed password! Please log in again.', 401));
            }

            // setting user in req obj, to make this data available to the upcoming middlewares.
            req.user = currentUser;
            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return next(new AppError('Your token has expired! Please login again!', 401));
            } else if (error.name === 'JsonWebTokenError') {
                return next(new AppError('Invalid token! Please login again!', 401));
            }
        }
    } catch (error) {
        return next(new AppError(error));
    };
};

// middleware function to be used in tourRoutes.js
export const restrictTo = (...roles) => {
    // here restrictTo is a wrapper function/closure which return the middleware function. It is done so that the middleware function could get access to the ...roles parameters.
    // roles = ['admin', 'lead-guide'], role='user'/'admin'/'lead-guide'
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            // user property on req object was added in the 'protect' middleware.
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    }
}

// middleware function to be used in userRoutes.js
export const forgotPassword = async (req, res, next) => {
    try {
        // 1) Get user based on POSTed email
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return next(new AppError('There is not user with the  provided email address.', 404));
        }

        // 2) Generate the random reset token
        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        // 3) Sent it to user's email
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

        const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Your password reset token (valid for 10 min)',
                message: message
            });

            res.status(200).json({
                status: 'success',
                message: 'A reset token has been sent to your email!'
            });
        } catch (error) {
            user.passwordResetToken = undefined;
            user.passwordResetExpire = undefined;
            await user.save({ validateBeforeSave: false });

            return next(new AppError('There was an error sending the email. Try again later!', 500));
        }

    } catch (error) {
        console.log(error);
        return next(new AppError("Email could not be sent.", 500));
    }
}

// middleware function to be used in userRoutes.js
export const resetPassword = async (req, res, next) => {
    try {
        // 1) Get user based on the token
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpire: { $gt: Date.now() } });

        // 2) If token has not expired, and there is user, set the password
        if (!user) {
            next(new AppError('Token is invalid or expired!', 400));
        }
        user.password = req.body.password;
        user.passwordConfirm = req.body.passwordConfirm;
        user.passwordResetToken = undefined;
        user.passwordResetExpire = undefined;
        await user.save();

        // 3) Update changedPassword property for the user

        // 4) Log the user in send JWT
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        const cookieOptions = {
            expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
            httpOnly: true, //only accessible through HTTP and not by client-side scripting like JavaScript
            secure: process.env.NODE_ENV === 'production' ? true : false //only send over HTTPS
        };
        res.cookie('jwt', token, cookieOptions);

        res.status(200).json({
            status: 'success',
            token: token,
        });
    } catch (error) {
        console.log(error);
        return next(new AppError(error, 500));
    }
}

// middleware function to be used in userRoutes.js
export const updatePassword = async (req, res, next) => {
    try {
        // 1) Get user from the db.
        // user has been saved in the req obj in the protect middleware 
        const user = await User.findById(req.user.id).select('+password');

        // 2) Check if POSTed password is correct.
        if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
            return next(new AppError('Your current password is wrong!', 401));
        }

        // 3) If so, update the password.
        user.password = req.body.password;
        user.passwordConfirm = req.body.passwordConfirm;
        await user.save();
        // User.findByIdAndUpdate will not work as inteded! It does not trigger setters and validation rules!

        // 4) Log user in, send a new JWT.
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        const cookieOptions = {
            expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
            httpOnly: true, //only accessible through HTTP and not by client-side scripting like JavaScript
            secure: process.env.NODE_ENV === 'production' ? true : false //only send over HTTPS
        };
        res.cookie('jwt', token, cookieOptions);

        res.status(200).json({
            status: 'success',
            token: token,
        });
    } catch (error) {
        console.log(error);
        return next(new AppError(error, 400));
    };
};