import mongoose from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name!']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email!'],
        unique: true,
        lowercase: true,  // not a validator, it will convert the email to lower case
        validate: [validator.isEmail, 'Please provide a valid email address!']
    },
    photo: String,
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide a password!'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password!'],
        validate: {
            // this only works during creating the document and not during updating the document.
            validator: function (el) {
                return el === this.password;
            },
            message: "Passwords are not the same!"
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpire: Date,
    active: {
        type: Boolean,
        default: true,
        select: false  // don't send the active field in response
    }
});

// mongoose middleware that hashes the password before saving it into the database
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
});

// mongoose middleware that updates the passwordChangedAt property before saving the updated apssword into the database.
userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

// mongoose middleware that hides the unactive users before any find query is done.
userSchema.pre(/^find/, function (next) {
    this.find({ active: { $ne: false } });
    next();
});

// custom method added to schema required during logging in.
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    // .compare --> async function, return boolean value.
    return await bcrypt.compare(candidatePassword, userPassword);
}

// custom method to check whether user has changed password or not.
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        // console.log(changedTimeStamp, JWTTimestamp);
        if (JWTTimestamp < changedTimeStamp) {
            return true;
        }
    }
    // false means that the password has not been changed
    return false;
};

// custom method to create reset password token
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    console.log({ resetToken, passwordResetToken: this.passwordResetToken });

    // after ten mins the password resetting session expires.
    this.passwordResetExpire = Date.now() + 10 * 60 * 1000;

    return resetToken;
}

const User = mongoose.model("User", userSchema);

export default User;