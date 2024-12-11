import mongoose, { Schema } from "mongoose";
import { v4 as uuidv4 } from 'uuid';

const newPathSchema = new Schema({
    projectId1: {
        type: String,
        required: true
    },
    projectId2: {
        type: String,
        required: true
    },
    location1: {
        lat: {
            type: Number,
            required: true
        },
        lng: {
            type: Number,
            required: true
        }
    },
    location2: {
        lat: {
            type: Number,
            required: true
        },
        lng: {
            type: Number,
            required: true
        }
    },
    timestamp: {
        type: Date,
        required: true
    },
    distance: {
        type: Number,
        required: true
    }
});

export const NewPath = mongoose.model("NewPath", newPathSchema);