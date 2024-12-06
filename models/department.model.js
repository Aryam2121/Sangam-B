import mongoose, {Schema} from "mongoose";

const departmentSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: String,
});

export const Department = mongoose.model('Department', departmentSchema);