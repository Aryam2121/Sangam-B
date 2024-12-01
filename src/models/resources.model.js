import mongoose,{Schema} from "mongoose";

const resourceSchema=new Schema({
    name:{
        type:String,
        required:true,
    },
    description:String,
    quantity:{
        type:Number,
        required:true,
    },
    unit:{
        type:String,
        required:true,
    },
    assignedTo:{
        type:Schema.Types.ObjectId,
        ref:'Project',
        required:true,
    }
})