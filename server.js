import dotenv from 'dotenv';
import mongoose from 'mongoose';

process.on('uncaughtException', err=>{
    console.log('UNCAUGHT EXCEPTION! Shutting down the program...');
    console.log(err.name, err.message);
    server.close(()=>{
        process.exit(1);
    });
});

dotenv.config({ path: './config.env' });
import { app } from "./app.js";

const DB_URI = process.env.DATABASE_URI.replace('<PASSWORD>', process.env.DB_PASSWORD)
// console.log(process.env.DATABASE)

mongoose.connect(DB_URI).then(con => {
    // console.log(con.connection);
    console.log("DB connection successful!")
})

const server = app.listen(process.env.PORT, () => {
    console.log(`Example  app listening on port http://localhost:${process.env.PORT}`);
});

//  Handling unhandled promise rejections in the app.(eg- DB failed to connect.)
process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! Shutting down the program...');
    console.log(err.name, err.message);
    server.close(()=>{
        process.exit(1);
    });
});

// console.log(x);