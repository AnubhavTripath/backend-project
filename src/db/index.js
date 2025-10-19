import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";


const connectDB = async () => {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)  // after connection whatever the response is coming we are storing it into the connectionInstance
        // console.log(`\n MongoDB connected !! DB Host : ${connectionInstance}`)
        console.log(`\n MongoDB connected !! DB Host : ${connectionInstance.connection.host}`)  // tells the place where i connected
    }catch(error){
        console.log('MongoDB connection failed' , error);
        process.exit(1)
    }
}

export default connectDB;