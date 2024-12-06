import mongoose, { Schema } from "mongoose";

const resourceAssignmentSchema = new Schema({
    project: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    }
});

const resourceSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    description: String,
    unit: {
        type: String,
        required: true,
    },
    assignments: [resourceAssignmentSchema] // Array of assignments to different projects
});

export const Resource = mongoose.model('Resource', resourceSchema);