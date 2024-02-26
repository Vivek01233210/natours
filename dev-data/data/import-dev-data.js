import fs from 'fs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import Tour from '../../models/tourModel.js';
import Review from '../../models/reviewModel.js';
import User from '../../models/userModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


dotenv.config({ path: './config.env' });

const DB_URI = process.env.DATABASE_URI.replace('<PASSWORD>', process.env.DB_PASSWORD)

mongoose.connect(DB_URI).then(con => {
    // console.log(con.connection);
    console.log("DB connection successful!")
});

// READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

// IMPORT DATA INTO DB
const importData = async () => {
    try {
        await Tour.create(tours);
        // await User.create(users, {validateBeforeSave: false });
        // await Review.create(reviews);
        console.log("Data successfully loaded!");
    } catch (error) {
        console.log(error);
    }
    process.exit();
}

//  DELETE ALL DATA FROM COLLECTION
const deleteData = async () => {
    try {
        await Tour.deleteMany();
        // await User.deleteMany();
        // await Review.deleteMany();
        console.log("Data successfully deleted!");
    } catch (error) {
        console.log(error);
    }
    process.exit();
}

// deleteData();
importData();

if (process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--delete') {
    deleteData();
}

// console.log(process.argv);


// script to load data :- node e:\\Udemy\\Jonas_backend\\01_natours_project\\dev-data\\data\\import-dev-data.js --import

// script to delete data :- node e:\\Udemy\\Jonas_backend\\01_natours_project\\dev-data\\data\\import-dev-data.js --delete