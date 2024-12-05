import mongoose from 'mongoose';
import { Resource } from '../models/resources.model.js';
import { Project } from '../models/project.model.js';


// Controller to create a new resource
export const createResource = async (req, res) => {
    try {
        const { name, description, unit } = req.body;
        const resource = new Resource({ name, description, unit });
        await resource.save();
        res.status(201).json({ message: "Resource created successfully", resource });
    } catch (error) {
        res.status(500).json({ message: "Error creating resource", error });
    }
};


// Controller to assign a resource to a project
export const assignResourceToProject = async (req, res) => {
    try {
        const { resourceId, projectId, quantity } = req.body;

        if (!mongoose.Types.ObjectId.isValid(resourceId) || !mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid resource or project ID' });
        }

        const resource = await Resource.findById(resourceId);
        if (!resource) {
            return res.status(404).json({ error: 'Resource not found' });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Check if the resource is already assigned to the project
        const existingAssignment = resource.assignments.find(assignment => assignment.project.toString() === projectId);
        if (existingAssignment) {
            existingAssignment.quantity += quantity; // Update the quantity if already assigned
        } else {
            resource.assignments.push({ project: projectId, quantity }); // Add new assignment
        }

        await resource.save();
        res.status(200).json({ message: "Resource assigned to project successfully", resource });
    } catch (error) {
        res.status(500).json({ message: "Error assigning resource to project", error });
    }
};



export const getResourceById = async (req, res) => {
    try {
        const { resourceId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(resourceId)) {
            return res.status(400).json({ error: 'Invalid resource ID' });
        }

        const resource = await Resource.findById(resourceId).populate('assignments.project', 'name description');
        if (!resource) {
            return res.status(404).json({ error: 'Resource not found' });
        }

        res.status(200).json(resource);
    } catch (error) {
        res.status(500).json({ message: "Error fetching resource data", error });
    }
};



export const getResourcesByProjectId = async (req, res) => {
    try {
        const { projectId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid project ID' });
        }

        const resources = await Resource.find({ 'assignments.project': projectId })
            .populate('assignments.project', 'name description');

        if (!resources || resources.length === 0) {
            return res.status(404).json({ error: 'No resources found for this project' });
        }

        res.status(200).json(resources);
    } catch (error) {
        res.status(500).json({ message: "Error fetching resources for project", error });
    }
};



export const getAllResources = async (req, res) => {
    try {
        const resources = await Resource.find().populate('assignments.project', 'name description');
        res.status(200).json(resources);
    } catch (error) {
        res.status(500).json({ message: "Error fetching all resources", error });
    }
};