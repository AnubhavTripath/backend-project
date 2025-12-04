import { Router } from "express";
import {loginUser, logOutUser, refreshAccessToken, registerUser} from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

router.route("/register").post(
    upload.fields([ //this upload , which we created we multer to take care of the file read and upload ,
        // this upload which is coming with multer gives multiple options , like this field it takes array of object of those field in which file will come.
        {
            name: "avatar",
            maxCount:1,
        },
        {
            name: "coverImage",
            maxCount:1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT , logOutUser) //in logout api it firstly verifies the jwt token and with help of next() which we initialized in the
// api it will go to the logOutUser controller

router.route("/refresh-token").post(refreshAccessToken)

export default router