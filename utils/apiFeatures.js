class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        // filtering
        const queryObj = { ...this.queryString };  // making shallow copy
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(element => delete queryObj[element]);
        // console.log(req.query, queryObj);

        //  Advanced filtering with regex
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);
        // console.log(JSON.parse(queryStr));

        this.query = this.query.find(JSON.parse(queryStr));
        // let query = Tour.find(JSON.parse(queryStr)); // return array of docs

        return this;
    }

    sort() {
        if (this.queryString.sort) {
            // console.log(this.queryString.sort);
            const sortBy = this.queryString.sort.split(',').join(' ');
            console.log(sortBy);
            this.query = this.query.sort(sortBy);  // sorted through mongoose
        } else {
            this.query = this.query.sort('-createdAt');  // '-' for descending order
        }
        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);   // select specific fields in the schema
        }
        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1;  // this.queryString.page*1 --> typecasting
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}

export default APIFeatures;