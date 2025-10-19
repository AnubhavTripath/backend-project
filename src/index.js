// require('dotenv').config({path: './env'}) //it takes the object inside the config and inwhich we have to pass the location of .env
import dotenv from "dotenv"
import connectDB from "./db/index.js"; // adding complete file like index.js to run otherwise it will give error

dotenv.config({
    path: './env'
})

import express from "express";
const app = express()

//if we follow this way to import the dotenv then we have to update the package.json file
// "dev": "nodemon -r dotenv/config --experimental-json-modules src/index.js"
//nodemon is use to restart the server after every changes
// -r dotenv/config will help to load the env file on server but not locally for locally we have to use the experimental mode


connectDB()  // it gives promise that it connected or not 
.then(()=> {
    app.on("error" , (error)=>{
        console.log("error" , error)  // handling error before listening 
    })

    app.listen(process.env.PORT || 4000 , ()=> {
        console.log(`App is running on port: ${process.env.PORT}`)
    })
})
.catch((err)=> {
    console.log("Failed to connect Mongo DB" , err)
})