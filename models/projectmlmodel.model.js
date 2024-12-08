import mongoose from 'mongoose';

const projectMLModelSchema = new mongoose.Schema({
    _id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    projectML_id: { type: String},
    department: { type: String},
    task_priority: { type: Number },
    task_complexity: { type: Number},
    available_resources: { type: Number},
    resources_allocated: { type: Number },
    communication_frequency: { type: Number },
    historical_delay: { type: Number},
    expected_completion_time: { type: Number },
    actual_completion_time: { type: Number },
    cost_estimate: { type: Number},
    actual_cost: { type: Number},
    site_location: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    project_start_date: { type: Date },
    project_end_date: { type: Date},
    conflict_indicator: { type: Number },
    cost_reduction_potential: { type: Number},
    cost_reduction_category: { type: String},
    resource_utilization: { type: Number },
    complexity_to_priority_ratio: { type: Number},
    delay_factor: { type: Number },
    adjusted_frequency: { type: Number }
});

const ProjectMLModel = mongoose.model('ProjectMLModel', projectMLModelSchema);

export default ProjectMLModel;