import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"


const app = express()

// app.use() is used when we are using the app with middleware or configuration means like we need the auth token or something else which secures the api response
// basically app.use() is used when we are using the middleware or doing configuration

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// this is how we define the cors policy

app.use(express.json({
    limit: "16kb"
}))

//here we made that we are accessing the json file and added the file limit of 16kb


app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}))

// here we made that we are accepting the data from the url (params) also and make it extended true means that ham objects k andar bhi ek object bna skte hai in params


app.use(express.static("public"))

// here we made a static file for such case we have to store a file or image temporarily at our server and here the public is our folder name


app.use(cookieParser())
// by this syntax we can make crud operation (create update delete ) in user browser cookies




//routes import

import userRouter from "./routes/user.routes.js"




// routes declaration
// here we are doing app.use instead of app.get('/api' ()=>{}) because with app.use we have the access of middleware

// app.use("/users" , userRouter)  //this /user is the api url , what this do is that it routes the api to user.route and in user routes we have the user controller which do functionality
app.use("/api/v1/users" , userRouter)



// http://localhost:8000/users/register //this is the api url
export {app}