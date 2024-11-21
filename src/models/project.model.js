import mongoose, {Schema} from "mongoose";

const projectSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    description: String,
    // departments: [{
    //     type: Schema.Types.ObjectId,
    //     ref: 'User',
    // }],
    resources: {
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
},
{
    timestamps: true, // Adds createdAt and updatedAt fields
}
);

export const Project = mongoose.model("Project", projectSchema);
