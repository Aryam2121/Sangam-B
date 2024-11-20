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
    projectAdmin: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    workers: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
    }],
    tasks: [{
        type: Schema.Types.ObjectId,
        ref: 'Task',
    }]
    // discussions: [{
    //     type: Schema.Types.ObjectId,
    //     ref: 'Discussion',
    // }]
});

export const Project = mongoose.model("Project", projectSchema);
