import mongoose from 'mongoose';
import { Task } from '../models/tasks.model.js';
import { Project } from '../models/project.model.js';
import {User} from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { logActivity } from "../utils/activityLogger.js";


export const createTask = async (req, res) => {
    try {
        const { title,taskId, description, assignedTo, project, status, dueDate } = req.body;
        const existedProject = await Project.findById(project)
        if(!existedProject){
            return res.status(404).json({ error: 'Project not found' })
        }
        //console.log(req.body);
        const task = new Task({ title,taskId, description, assignedTo, project, status, dueDate });
        await task.save();
        await logActivity({
            entityType: "task",
            action: "created",
            entityId: task._id,
            title: `Task created: ${task.title}`,
            description: `Status ${task.status || "Pending"}`,
            actorName: req.user?.fullName || req.user?.username || "System",
            actorId: req.user?._id,
        });
        res.status(201).json({ message: "Task created successfully", task });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error creating task", error });
    }
};


export const updateTask = async (req, res)=>{
    try {
        const { taskId } = req.params;
        const updates = req.body;
        const updatedTask = await Task.findByIdAndUpdate(taskId, updates, { new: true });
        if (!updatedTask) {
            return res.status(404).json({ message: "Task not found" });
        }
        await logActivity({
            entityType: "task",
            action: updates?.status ? "status_changed" : "updated",
            entityId: updatedTask._id,
            title: `Task updated: ${updatedTask.title}`,
            description: updates?.status ? `Status changed to ${updates.status}` : "Task details edited",
            actorName: req.user?.fullName || req.user?.username || "System",
            actorId: req.user?._id,
        });
        res.json({ message: "Task updated successfully", updatedTask });
    } catch (error) {
        res.status(500).json({ message: "Error updating task", error });
    }
};


export const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const deleted = await Task.findByIdAndDelete(taskId);
        if (deleted) {
            await logActivity({
                entityType: "task",
                action: "deleted",
                entityId: deleted._id,
                title: `Task deleted: ${deleted.title}`,
                description: "Task removed from workspace",
                actorName: req.user?.fullName || req.user?.username || "System",
                actorId: req.user?._id,
            });
        }
        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting task", error });
    }
};


export const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find().populate('assignedTo').populate('project');
        res.json({ tasks });
    } catch (error) {
        res.status(500).json({ message: "Error fetching tasks", error });
    }
};


export const getTaskById = async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await Task.findById(taskId);
        if (!task) {
            throw new ApiError(404, "Task not found");
        }
        res.status(200).json(
            { task }
        );
    } catch (error) {
        console.error('Error fetching task by ID:', error);
        res.status(500).json({ message: "Error fetching task", error: error.message });
    }
};


export const getAllTasksByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        const tasks = await Task.find({ assignedTo: userId }).populate('assignedTo').populate('project');

        res.status(200).json({ tasks: tasks || [] });
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


export const getAllTasks = async (req, res) => {
    try {
        const { status, assignee, department, dueFrom, dueTo, project } = req.query || {};
        const filter = {};
        if (status) filter.status = status;
        if (project) filter.project = project;
        if (assignee) filter.assignedTo = assignee;
        if (dueFrom || dueTo) {
            filter.dueDate = {};
            if (dueFrom) filter.dueDate.$gte = new Date(dueFrom);
            if (dueTo) filter.dueDate.$lte = new Date(dueTo);
        }

        const tasks = await Task.find(filter)
            .populate("assignedTo", "fullName username department")
            .populate("project", "name status");

        const filteredByDepartment = department
            ? tasks.filter((task) => (task.assignedTo?.department || "").toLowerCase() === String(department).toLowerCase())
            : tasks;
        res.status(200).json(filteredByDepartment);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error fetching tasks", error });
    }
};

