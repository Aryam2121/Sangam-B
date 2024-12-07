import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    reportUrls: [{
        type: String,
        required: true
    }],
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

const Report = mongoose.model('Report', reportSchema);

export default Report;