import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import {deleteOldImageOnCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId); // got user by userId

        // in user we have all those method which have created in the user.schema
        const accessToken = user.generateAccessToken() 
        const refreshToken =user.generateRefreshToken()

        // now we have to save the data at our db so that we will have the refresh token and we do not need to ask user their username everytime
        await user.save({ validateBeforeSave: false}) //because the user is coming from the mongoDB we have save() method here
        // we did validateBeforeSave turned off so that it will do not save the user password here

        return {accessToken , refreshToken}

    } catch (error) {
        throw new ApiError(500 , "Something went wrong while creating the tokens")
    }
}

const getPublicIdFromUrl = (url) => {
    const parts = url.split("/");
    const fileWithExtension = parts.pop(); // abc123.png
    const fileName = fileWithExtension.split(".")[0]; // abc123

    return fileName;
};


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

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files?.coverImage[0]?.path
    }

    if(!avatarLocalFilePath){
        throw new ApiError(400 , "Avatar image is required")
    }

    // storing the image in the cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalFilePath);


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
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(500 , "Something went wrong while creating the user")
    }

    return res.status(201).json(
        new ApiResponse(200 , createdUser , "User registered Successfully!")
    )

} );


const loginUser = asyncHandler(async(req , res) => {
    // req body -> data
    // username or email for login
    // find the user
    // password check
    // create access and refresh token 
    // send token in cookies


    // fetch data from user request body
    const {username , email , password} = req.body

    if(!username && !email){
        throw new ApiError(400 , "username or email is required")
    }

    // get user from the User modal
    const user = await User.findOne({  
        $or: [{username} , {email}]   // $or: is the mongodb query 
    })

    if (!user) {
        throw new ApiError(404 , "user does not exits")
    }

    // this user is not the User , user is the object which we get from the User modal and in user we have 'isPasswordCorrect' 
    // which we have created in the user.modal.js
    const isPasswordValid = user.isPasswordCorrect(password) 

    if (!isPasswordValid) {
        throw new ApiError(401 , "Invalid credentials")
    }

    const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id)

    // the upper 'user' is not having the access and refresh token because we called the generateAccessAndRefreshToken() up side
    //  and that one also have the password field with it , so we will take fresh user because by calling the upper method the refreshToken is saved in it

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // by these option no one can update those cookies manually , it will be modifible only by server
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken" , refreshToken , options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser , accessToken , refreshToken
            },
            "User loggedIn successfully"
        )
    )
})

const logOutUser = asyncHandler(async(req , res) => {
    // remove the refresh and access token from the user cookies
    // clear the refresh token from the db

    // this req.user we are having because in the verifyJwt middleware we accessed the user data and passed to request and this verifyJWT is used in its routes
    await User.findByIdAndUpdate(  //with this findById and update it firstly take the id of which we want to update then the object we want to do update
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true  //with this new true it will set the new updated one
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken" , options)
    .json(new ApiResponse(200 , {} , "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async(req , res)=> {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken //maybe user sending the refresh token in the body or header 

    if(!incomingRefreshToken){
        throw new ApiError(401 , "Unautherized Request")
    }

    try {
        // to access the token we need to verify the token , it will give all the data which we have stored in the token
        const decodedToken = jwt.verify(incomingRefreshToken , process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401 , "invalid refresh token")
        }
    
        if(incomingRefreshToken !== user.refreshToken){
            throw new ApiError(401 , "invalid refresh token")   
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken" , accessToken , options)
        .cookie("refreshToken" , refreshToken , options)
        .json(
            new ApiResponse(
                200 , 
                {accessToken , refreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req , res) => {
    const {oldPassword , newPassword} = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400 , "Invalid Password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(
        200 , 
        {},
        "Password updated successfully"
    ))
})

const getCurrentUser = asyncHandler(async(req , res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            req.user,
            "User fetched successfully"
        )
    )
})

const updateAccountDetails = asyncHandler(async(req , res)=> {
    const {fullName , email} = req.body

    if(!fullName || !email){
        throw new ApiError(400 , "All fields are required")
    }

    const user = User.findByIdAndUpdate(req.user._id , {  //by using the findByIdAndUpdate we can find the user and update also in a go
            $set: {  //$set is the mongodb operator by using this we can update the data
                fullName,
                email
            }
        },
        {new: true} //by doing this new : true it will return the user updated data
    ).select("-password") //by doing select and passing the value in - it will remove the password from the response

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user,
        "Account details updated successfully"
    ))
})

const updateUserAvatar = asyncHandler(async(req , res)=> {
    const avatarLocalFilePath = req.file?.path  // we have here req.file rather than req.files as compare to register user because in 
    // register user router we have defined an array of adding file avatar and coverimage , for its router we have single file upload so we have file

    if(!avatarLocalFilePath){
        throw new ApiError(400 , "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalFilePath)

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading the avatar")
    }

    if(req.user?.avatar){
        const publicId = getPublicIdFromUrl(req.user.avatar)
        await deleteOldImageOnCloudinary(publicId)
    }

    const user = await User.findByIdAndUpdate(req.user?._id , {
        $set: {
            avatar: avatar.url
        }
    },
    {new: true}
    ).select("-password")


    return res
    .status(200)
    .json(new ApiResponse(
        200, 
        user,
        "Avatar updated successfully"
    ))

})


const updateUserCoverImage = asyncHandler(async(req , res)=> {
    const coverImageLocalFilePath = req.file?.path

    if(!coverImageLocalFilePath){
        throw new ApiError(400 , "Cover Image is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalFilePath)

    if(!coverImage.url){
        throw new ApiError(400 , "Error while uploading the cover image")
    }

    if(req.user?.avatar){
        const publicId = getPublicIdFromUrl(req.user.coverImage)
        await deleteOldImageOnCloudinary(publicId)
    }

    const user = await User.findByIdAndUpdate(req.user?._id , {
        $set: {
            coverImage: coverImage.url
        }
    },
    {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user,
        "Cover image updated successfully"
    ))


})

export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
};