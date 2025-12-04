import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import {User} from "../models/user.model.js"

export const verifyJWT = asyncHandler(async(req , res , next) => {
   try {
     // with help of cookie parser which we have installed and initialzed in our app.js we can get and set the cookie.
     const token = req.cookies?.accessToken || req.header("Autherization")?.replace("Bearer " , "") // we are accessing user access token 
     // also checking that is user passed the token in there header may be this api is being used in the mobile app in that case we cannot set the tokens in cookies
 
     if(!token){
         throw new ApiError(401 , "Unotherized request")
     }
 
     // to access the token we need to verify the token , it will give all the data which we have stored in the token
     const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET) // to verify it takes the token and the secret key
     const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
 
     if(!user){
         throw new ApiError(401 , "Invalid Access Token")
     }
 
     req.user = user;  // by doing this i am passing this user which we just fetched , basically injecting this user in request
     next();
   } catch (error) {
        throw new ApiError(401 , error?.message || 'Invalid Access Token')
   }
})