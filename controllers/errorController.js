export default (err, req, res, next) => {
    // console.log(err.stack);

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    
    if(process.env.NODE_ENV === 'development'){
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
            nameOFError: err.name
        });
    }else if(process.env.NODE_ENV === 'production'){
        // operational, trusted error: send message to client
        if(err.isOperational){
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
            });

        // Programming or other unknown errors: don't leak the details
        }else {
            // 1) log error
            console.error(err);

            // 2) Send generic message to the client
            res.status(500).json({
                status: 'error',
                message: 'Something went very wrong!'
            });
        }
    }
};