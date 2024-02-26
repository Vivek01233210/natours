import User from '../models/userModel.js';
import APIFeatures from '../utils/apiFeatures.js';
import AppError from '../utils/appError.js';

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
}

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new AppError('No user found with provided id!', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: user
      }
    });
  } catch (error) {
    console.log(error);
    next(new AppError(error, 404));
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const features = new APIFeatures(User.find(), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();

        const users = await features.query;

        // SEND RESPONSE
        res.status(200).json({
            status: 'success',
            results: users.length,
            data: { users: users }
        });
    } catch (error) {
        console.log(error);
        next(new AppError(error.message));
    }
};

// middleware function
export const updateMe = async (req, res, next) => {
  try {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
      return next(new AppError("This route is not for password updates!", 400));
    }

    // 2) Filtered out unwanted field names that are not allowed to be updated.
    const filteredBody = filterObj(req.body, 'name', 'email');

    // 3) Update user document
    const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        user: updateUser
      }
    });
  } catch (error) {
    next(new AppError(error, 400));
  }
};

export const deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    return next(new AppError(error, 400));
  }
}

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new AppError('No user found with provided id!', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: user
      }
    });
  } catch (error) {
    console.log(error);
    next(new AppError(error, 404));
  }
};

export const createUser = async (req, res, next) => {
  // const user = await User.create(req.body);
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead!'
  });
};

export const updateUser = async (req, res, next) => {
  try {
    const doc = await User.findByIdAndUpdate(req.params.id, req.body, {
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

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
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