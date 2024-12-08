import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from 'uuid';

const pathSchema = new Schema({
    uuid: {
        type: String,
        default: uuidv4,
        unique: true
    },
    projectId: {
        type: String,
        required: true
    },
    path: [
        {
            lat: {
                type: Number,
                required: true
            },
            lng: {
                type: Number,
                required: true
            }
        }
    ],
    timestamp: {
        type: Date,
        required: true
    },
    distance: {
        type: Number,
        required: true
    }
});

export const Path = mongoose.model("Path", pathSchema);