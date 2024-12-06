import mongoose, { Schema } from "mongoose";

const pathPointSchema = new Schema({
    lat: {
        type: Number,
        required: true
    },
    lng: {
        type: Number,
        required: true
    },
    id: {
        type: String,
        required: true
    }
});


const pathSchema = new Schema({
    projectId: {
        type: String,
        required: true
    },
    path: [
        {
            id: {
                type: String,
                required: true
            },
            points: [pathPointSchema]
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