import mongoose from 'mongoose';
import Report from './report.model.js';

const taskReportSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true
    }
});

const TaskReport = Report.discriminator('TaskReport', taskReportSchema);

export default TaskReport;