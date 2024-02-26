import express from 'express';
import {
    getAllUsers,
    createUser,
    getUser,
    updateUser,
    deleteUser,
    updateMe,
    deleteMe,
    getMe,
} from '../controllers/userController.js';
import { signup, login, forgotPassword, resetPassword, updatePassword, protect, restrictTo, logout } from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

// protect all the defined after this middleware.
router.use(protect);

router.get('/me',getMe); // Get the logged in user info
router.patch('/updateMyPassword/', updatePassword);
router.patch('/updateMe/', updateMe);
router.delete('/deleteMe/', deleteMe);

// restrictTo middleware implemented after this route.
router.use(restrictTo('admin'));

router
    .route('/')
    .get(getAllUsers)
    .post(createUser);

router
    .route('/:id')
    .get(getUser)
    .patch(updateUser)
    .delete(deleteUser);

export default router;