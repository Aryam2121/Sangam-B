import { v4 as uuidv4 } from 'uuid';
import {Path} from '../models/geolocation.model.js';
import { ApiError } from '../utils/ApiError.js';
import {Project} from '../models/project.model.js';

export const createPath = async (req, res) => {
    try {
        const { projectId, path, timestamp, distance } = req.body;

        if (!projectId || !path || !timestamp || !distance) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const newPath = new Path({
            projectId,
            path,
            timestamp,
            distance
        });

        await newPath.save();
        res.status(201).json(newPath);
    } catch (error) {
        console.error('Error registering path:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


export const getPathById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new ApiError(400, "Path ID is required");
        }

        const path = await Path.findOne({ projectId: id });

        if (!path) {
            throw new ApiError(404, "Path not found");
        }

        res.status(200).json({ path });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};


export const updatePath = async (req, res) => {
    try {
        const { id } = req.params;
        const { lat, lng } = req.body;

        if (!lat || !lng) {
            return res.status(400).json({ error: 'Latitude and longitude are required' });
        }

        const path = await Path.findById(id);

        if (!path) {
            return res.status(404).json({ error: 'Path not found' });
        }

        path.path.push({ lat, lng });

        await path.save();
        res.status(200).json(path);
    } catch (error) {
        console.error('Error updating path:', error);
        res.status(500).json({ error: 'Server error' });
    }
};