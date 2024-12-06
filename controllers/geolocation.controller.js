import { v4 as uuidv4 } from 'uuid';
import {Path} from '../models/geolocation.model.js';
import { ApiError } from '../utils/ApiError.js';
import {Project} from '../models/project.model.js';

export const createPath = async (req, res) => {
    try {
        //console.log((req));
        const { projectId, path, timestamp, distance } = req.body;
        //console.log("body is",req.body);

        if (!projectId || !timestamp) {
            throw new ApiError(400, "All fields are required");
        }

        if(!Array.isArray(path)){
            throw new ApiError(400, "Path must be an array");
        }
        const project = await Project.findById(projectId);
        if (!project) {
            throw new ApiError(404, "Project not found");
        }
        const pathWithIds = path.map(innerArray => ({
            id: uuidv4(),
            points:innerArray.map(point => ({
                ...point,
                id: uuidv4()
            }))
    }));

        const newPath = await Path.create({
            projectId,
            path:pathWithIds,
            timestamp,
            distance:distance || 0
        });

        res.status(201).json({ message: 'Path created successfully', newPath });
    } catch (error) {
        console.error(error);
        if (error instanceof ApiError) {
            res.status(error.statusCode).json({ message: error.message, error });
        } else {
            res.status(500).json({ message: 'Server error', error });
        }
    }
};

export const getPathById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new ApiError(400, "Path ID is required");
        }

        const path = await Project.findById(id);

        if (!path) {
            throw new ApiError(404, "Path not found");
        }

        res.status(200).json({ path });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};