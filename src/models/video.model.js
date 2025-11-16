import mongoose , {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"; //this helps to write the complex queries , like here we have watchHistory

const videoSchema = new Schema({

    videoFile: {
        type: String, //from cloudnary
        required: true,
    },
    thumbnail: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    views: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
    

}, {timestamps: true})


videoSchema.plugin(mongooseAggregatePaginate)

// mongoose provide that we can write our own plugin by using the .plugin() in our schema and by passing the mongooseAggregatePaginate we can write
// advanced queries

export const Video = mongoose.model("Video" , videoSchema)