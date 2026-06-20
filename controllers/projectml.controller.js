import ProjectMLModel from '../models/projectmlmodel.model.js';
import {Project} from '../models/project.model.js';
import { pickFields } from '../utils/pickFields.js';

const ML_MODEL_FIELDS = [
    'projectML_id', 'department', 'task_priority', 'task_complexity',
    'available_resources', 'resources_allocated', 'communication_frequency',
    'historical_delay', 'expected_completion_time', 'actual_completion_time',
    'cost_estimate', 'actual_cost', 'site_location', 'latitude', 'longitude',
    'project_start_date', 'project_end_date', 'conflict_indicator',
    'cost_reduction_potential', 'cost_reduction_category', 'resource_utilization',
    'complexity_to_priority_ratio', 'delay_factor', 'adjusted_frequency',
];

export const createProjectMLModel = async (req, res) => {
    try {
        const project_id = req.body.project_id || req.body.projectId;
        const fields = pickFields(req.body, ML_MODEL_FIELDS);

        // Ensure the Project exists
        const project = await Project.findById(project_id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Create the ProjectMLModel with the same ObjectId as the Project
        const projectMLModel = new ProjectMLModel({
            _id: project._id,
            project_id,
            ...fields,
        });

        await projectMLModel.save();
        res.status(201).json(projectMLModel);
    } catch (error) {
        console.error('Error creating ProjectMLModel:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


// Get a ProjectMLModel by ID
export const getProjectMLModelById = async (req, res) => {
    try {
        const { id } = req.params;

        const projectMLModel = await ProjectMLModel.findById(id);
        if (!projectMLModel) {
            return res.status(404).json({ error: 'ProjectMLModel not found' });
        }

        res.status(200).json(projectMLModel);
    } catch (error) {
        console.error('Error fetching ProjectMLModel:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update a ProjectMLModel by ID
export const updateProjectMLModelById = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = pickFields(req.body, ML_MODEL_FIELDS);

        const projectMLModel = await ProjectMLModel.findByIdAndUpdate(id, updates, { new: true });
        if (!projectMLModel) {
            return res.status(404).json({ error: 'ProjectMLModel not found' });
        }

        res.status(200).json(projectMLModel);
    } catch (error) {
        console.error('Error updating ProjectMLModel:', error);
        res.status(500).json({ error: 'Server error' });
    }
};