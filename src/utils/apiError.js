class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong!",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null  // the data here we are defining to make the response consistent in both success and failure of the api response . 
        // when we have get api data successfully our information is in data similarly we are making here the data field as nulll
        this.message = message
        this.success = false
        this.errors = errors


        if(stack){
            this.stack = stack
        }else {
            Error.captureStackTrace(this , this.constructor)
        }
    }
}

export {ApiError}