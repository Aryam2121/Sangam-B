import ProjectMLModel from '../models/projectmlmodel.model.js';
import {Project} from '../models/project.model.js'; // Assuming you have a Project model

// Create a new ProjectMLModel
export const createProjectMLModel = async (req, res) => {
    try {
        const { project_id, ...rest } = req.body;

        // Ensure the Project exists
        const project = await Project.findById(project_id);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Create the ProjectMLModel with the same ObjectId as the Project
        const projectMLModel = new ProjectMLModel({
            _id: project._id,
            project_id,
            ...rest
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
        const updates = req.body;

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