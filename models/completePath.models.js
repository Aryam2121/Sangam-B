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

const completedPathSchema = new Schema({
    uuid: {
        type: String,
        default: uuidv4
    },
    projectId: {
        type: String,
        required: true
    },
    completedPath: [
        {
            _id: {
                type: String,
                default: uuidv4
            },
            points: {
                type: [pathPointSchema],
                default:[]
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

export const CompletedPath = mongoose.model("CompletedPath", completedPathSchema);