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
    stockLevel: { type: Number, default: 100 },
    minStockLevel: { type: Number, default: 10 },
    unitCost: { type: Number, default: 0 },
    assignments: [resourceAssignmentSchema]
});

export const Resource = mongoose.model('Resource', resourceSchema);