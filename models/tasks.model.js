import mongoose, {Schema} from "mongoose";

const taskSchema = new Schema({
    title:{
        type: String,
        required: true,
    },
    taskId:{
        type: Number,
        required: true,
    },
    description: String,
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed','Submitted'],
        default: 'Pending',
    },
    dueDate: Date,
});

export const Task = mongoose.model('Task', taskSchema);


