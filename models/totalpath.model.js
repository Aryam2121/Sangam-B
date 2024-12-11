import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from 'uuid';

const pathPointSchema = new Schema({
    lat: {
        type: Number,
        required: true
    },
    lng: {
        type: Number,
        required: true
    }
});

const pathSchema = new Schema({
    uuid: {
        type: String,
        default: uuidv4
    },
    projectId: {
        type: String,
        required: true
    },
    totalpath: [
        {
            _id:{
                type: String,
                default: uuidv4
            },
            points:{
            type:[pathPointSchema],
            required: true
            }
        }    
    ],
    timestamp: {
        type: Date,
        required: true
    },
    distance: {
        type: Number
    }
});

export const Path = mongoose.model("Path", pathSchema);