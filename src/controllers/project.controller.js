import mongoose from 'mongoose';
import { Project } from '../models/project.model.js';
import {User} from '../models/user.model.js';
import {Task} from '../models/tasks.model.js';
import {asyncHandler} from '../utils/asyncHandler.js';

export const createProject = asyncHandler(async (req, res) => {
    try {
        const { name, description, projectAdminId, workerIds,taskIds} = req.body;
        if (!name || !description  || !projectAdminId || !workerIds || !taskIds) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const projectAdmin = await User.findById(projectAdminId);
        if (!projectAdmin) return res.status(404).json({ error: 'Project admin not found' });
        
       
        if (!Array.isArray(workerIds)) {
            return res.status(400).json({ error: 'workerIds must be an array' });
        }

        if (!Array.isArray(taskIds)) {
            return res.status(400).json({ error: 'task must be an array' });
        }

        if (taskIds.length === 0) {
            return res.status(400).json({ error: 'taskIds array cannot be empty' });
        }

        const workers = await User.find({ _id: { $in: workerIds } });
        const tasks=await Task.find({_id: { $in: taskIds}});

        if (workers.length !== workerIds.length) {
            return res.status(404).json({ error: 'One or more workers not found' });
        }

        if (tasks.length !== taskIds.length) {
            return res.status(404).json({ error: 'One or more tasks not found' });
        }
        
        const newProject = await Project.create({
            name,
            description,
            projectAdmin: projectAdminId,
            workers: workerIds,
            tasks:taskIds,
        });

        res.status(201).json(newProject);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export const updateProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const updates = req.body;
        const updatedProject = await Project.findByIdAndUpdate(projectId, updates, { new: true });
        res.json({ message: "Project updated successfully", updatedProject });
    } catch (error) {
        res.status(500).json({ message: "Error updating project", error });
    }
};

export const deleteProject = async (req, res) => {
    try {
        console.log(req);
        const { projectId } = req.params;
        await Project.findByIdAndDelete(projectId);
        res.json({ message: "Project deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting project", error });
    }
};

export const getProjects = async (req, res) => {
    try {
        const projects = await Project.find().populate('projectAdmin').populate('workers');
        res.json({ projects });
    } catch (error) {
        res.status(500).json({ message: "Error fetching projects", error });
    }
};

export const getProjectById = async (req, res) => {
        const { id } = req.body;
        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });        
        }
        res.status(200).json({project} );
};

export const getAllTasksByProjectId = async (req, res) => {
    try {
        
        const { projectId } = req.params;

        console.log(req);

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid project ID' });
        }
        const project = await Project.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(projectId) } },
            { $lookup: {
                from: 'tasks',
                localField: 'tasks',
                foreignField: '_id',
                as: 'tasks'
            }},
            { $project: { tasks: 1, _id: 0 } }
        ]);

        if (!project || project.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.status(200).json(project[0].tasks);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Server error' });
    }
};