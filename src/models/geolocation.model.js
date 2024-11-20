import mongoose, {Schema} from "mongoose";

const pathSchema = new Schema({
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
