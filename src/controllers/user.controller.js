import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const registerUser = asyncHandler( async(req , res)=> {
    
    const {password ,  fullName , email , username  } = req.body

    // if(fullName === "") {
    //     throw new ApiError(400 , "fullName is required")
    // } //in this way we have to write ifelse for every fields


    // the some is the method which return true if performed action gets true
    if([password , fullName , email , username].some((field) => (
        field?.trim() === ""
    ))){
        throw new ApiError(400 , "All fields are required!")
    }

    // findOne will return true when it finds the first matching
    const existedUser = await User.findOne({   //it returns true or false if it founds any exisiting username or email
        $or: [ {username} , {email} ]
    })

    if(existedUser){
        throw new ApiError(409 , "User with this email or username already existed!")
    }

    // in request we are having we can now access the file because we have added the multer video upload in between the routes and passed these fields in it
    // in req.files we are having a array of object and it have one object only which includes the local path on which the physical file has been saved by multer.
    const avatarLocalFilePath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalFilePath){
        throw new ApiError(400 , "Avatar image is required")
    }

    // storing the image in the cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalFilePath);
    console.log("avatar" , avatar) // prints the avatar

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    // check if the avatar is uploaded properly
    if(!avatar){
        throw new ApiError(400 , "Avatar image is required")
    }

    // storing the data in the data base with help of User modal
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage.url || "",
        email,
        password,
        username: username.toLowerCase() // making all the username in database in lowercase
    })


    // taking  the user from user modal by using the created user id
    //  in this select we basically passing the value with '-' that we are unselecting these value , by default it have selected all , 
    // and after that we can send this created user as response to the user
    const createdUser = await User.findById(user._id).select("-password" , "-refreshToken")

    if(!createdUser){
        throw new ApiError(500 , "Something went wrong while creating the user")
    }

    return res.status(201).json(
        new ApiResponse(200 , createdUser , "User registered Successfully!")
    )

} );


export default registerUser;