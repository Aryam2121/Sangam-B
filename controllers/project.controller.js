import mongoose from 'mongoose';
import { Project } from '../models/project.model.js';
import {User} from '../models/user.model.js';
import {Task} from '../models/tasks.model.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import {Department} from '../models/department.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js';

export const createProject = asyncHandler(async (req, res) => {
    try {
        console.log("Request body:", req.body);
        const { name, description,departments,resources, projectAdmin, workerIds,taskIds} = req.body;
        if (!name || !description || !departments || !projectAdmin || !resources || !workerIds || !taskIds) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        const existedProject = await Project.findOne({
            name
        })
        if (existedProject) {
            return res.status(409).json({ error: 'Project with name already exists' })
        }

        if (!Array.isArray(departments) || departments.length === 0) {
            return res.status(400).json({ error: 'departments must be a non-empty array' });
        }

        const departmentObjectIds = await Promise.all(departments.map(async (departmentName) => {
            const department = await Department.findOne({ name: departmentName });
            if (!department) {
                throw new Error(`Department not found: ${departmentName}`);
            }
            return department._id;
        }));

       
        const existingProjectAdmin = await User.findOne({username:projectAdmin});

        if (!existingProjectAdmin) return res.status(404).json({ error: 'Project admin not found'});
        

        
        if (!Array.isArray(workerIds)) {
            return res.status(400).json({ error: 'workerIds must be an array' });
        }

        if (!Array.isArray(taskIds)) {
            return res.status(400).json({ error: 'task must be an array' });
        }

        if (taskIds.length === 0) {
            return res.status(400).json({ error: 'taskIds array cannot be empty' });
        }

        const workers = await User.find({ username: { $in: workerIds } });
        const tasks=await Task.find({_id: { $in: taskIds}});

       

        if (workers.length !== workerIds.length) {
            return res.status(404).json({ error: 'One or more workers not found' });
        }

        if (tasks.length !== taskIds.length) {
            return res.status(404).json({ error: 'One or more tasks not found' });
        }

        const workerUsernames = workers.map(worker => worker.username);
        const taskObjectIds = tasks.map(task => task._id);
        
        const newProject = await Project.create({
            name,
            description,
            departments:departmentObjectIds,
            resources,
            projectAdmin: existingProjectAdmin.username,
            workerIds: workerUsernames,
            taskIds:taskObjectIds,
            startDate: new Date(), // Example property
            endDate: new Date(),
            status: 'active'
        });

        res.status(201).json(newProject);
    } catch (error) {
        console.error("Error creating project:", error); // Log the error for debugging
        res.status(500).json({ error: 'Server error',details:error.message });
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
    try {
        const { id } = req.params;
        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        res.status(200).json({ project });
    } catch (error){
        console.error('Error fetching project:', error);
        res.status(500).json({ message: "Server error", error });
    }
};

export const getAllTasksByProjectId = async (req, res) => {
    try {
        
        const { projectId } = req.params;

        //console.log(req.params);

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid project ID' });
        }
        const tasks = await Task.find({ project: projectId }).populate('assignedTo');

        if (!tasks || tasks.length === 0) {
            return res.status(404).json({ error: 'No tasks found for this project' });
        }

        res.status(200).json(tasks);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Server error' });
    }
};


export const getAllProjects=async (req,res)=>{
    try {
        const projects=await Project.find();
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({message:"Eroor in fetching projects",error});
    }
}


