import mongoose, {Schema} from "mongoose";

const projectSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    projectMLId:{
        type: String
    },
    description: String,
    departments: [{
        type: Schema.Types.ObjectId,
        ref: 'Department',
    }],
    resources: {
        type: String,
        required: true,
    },
    projectAdmin: {
        type: String,
        required: true,
    },
    workerIds: [{ 
        type: String,
        ref: 'User',
    }],
    taskIds: [{ 
        type: Schema.Types.ObjectId,
        ref: 'Task',
    }],
    status: {
        type: String,
        enum: ['active', 'completed', 'pending'],
        default: 'active',
    },
    startDate: {
        type: Date,
        default: Date.now, // Default to current date
    },
    endDate: {
        type: Date,
    },
    zone: { type: String, index: true },
    ward: { type: String, index: true },
    district: { type: String, index: true },
    budgetAllocated: { type: Number, default: 0 },
    budgetSpent: { type: Number, default: 0 },
    location: {
        lat: { type: Number },
        lng: { type: Number },
    },
},
{
    timestamps: true, // Adds createdAt and updatedAt fields
}
);

export const Project = mongoose.model("Project", projectSchema);
