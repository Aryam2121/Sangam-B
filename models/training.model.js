import mongoose, {Schema} from "mongoose"
//import User from "../models/training.model.js"


const seminarSchema=new Schema(
    {
        publisherName:{
            type:String,
            required:true
        },
        seminarLink:{
            type:String,
            requres:true
        },
        description:{
            type:String
        }
    },{
        timestamps:true
    }
)

const Seminar=mongoose.model("Seminar",seminarSchema);

export default Seminar;

