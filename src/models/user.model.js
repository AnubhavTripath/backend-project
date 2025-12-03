import mongoose , {Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"

const userSchema = new Schema({
    
    username: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true,
        index: true , // we provide index if we want to have a search feature with that thing , like here we want to have search with the username
        //so we add the index : true , this is little resource intrensive so it is used carefully and we can also search without doing index: true
        //  but it make it in optimize way of search
    },
    email: {
        type: String,
        required: true,
        lowecase: true,
        unique: true,
        trim: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String, // cloudnary url
        required: true
    },
    coverImage: {
        type: String
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        required: [true , "Password is required"]
    },
    refreshToken: {
        type: String
    }


}, {timestamps : true})

// in pre hook we first pass the event on which we have to do something after that we write a normal function , we write normal function not an 
// arrow function because the arrow function doesn't have the context of the current execution context


userSchema.pre("save" , async function(next){  // in general we have error request response and next while any data process , we give next access here because we are using middleware and after doing its task it will proceed to next
    if(!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password , 10) //this bcrypt provide us the hash method which firstly take value which want to hash and the saltRounds means how many times it wants to rotate the hash
    next()
});

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password , this.password)  
    //it takes a string password which user fills in password field and another one is hashed password 
    // it checks itself because it knows the key and the rounds it did its hashes
}


userSchema.methods.generateAccessToken = function(){
    // it will directly return the token
    return jwt.sign( //these methods are directly connected with db and know about the current execution context so that we can get the value by using 'this'
        {
            _id: this._id,
            email: this.email,
            fullName: this.fullName, 
            username: this.username
        },
        process.env.ACCESS_TOKEN_SECRET,
        { 
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
         },

    )
}


userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        { 
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
         },
    )
}

export const User = mongoose.model("User" , userSchema)