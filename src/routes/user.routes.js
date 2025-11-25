import { Router } from "express";
import registerUser from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";


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

export default router