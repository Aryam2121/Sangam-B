// newPath.controller.js
import { NewPath } from '../models/newpath.model.js';
import { pickFields } from '../utils/pickFields.js';

const NEW_PATH_FIELDS = ['projectId1', 'projectId2', 'location1', 'location2', 'timestamp', 'distance'];

// Controller function to create a new path
export const createNewPath = async (req, res) => {
    try {
        const { projectId1, projectId2, location1, location2, timestamp, distance } = pickFields(req.body, NEW_PATH_FIELDS);

        if (!projectId1 || !projectId2 || !location1 || !location2 || !timestamp || !distance) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const newPath = new NewPath({
            projectId1,
            projectId2,
            location1,
            location2,
            timestamp,
            distance
        });

        await newPath.save();
        res.status(201).json(newPath);
    } catch (error) {
        console.error('Error registering new path:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const getNewPath = async (req, res) => {
    try {
        const { id } = req.params;
        const newPath = await NewPath.findById(id);
        if (!newPath) {
            return res.status(404).json({ error: 'Path not found' });
        }
        res.status(200).json(newPath);
    } catch (error) {
        console.error('Error fetching new path:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


export const getAllNewPaths = async (req, res) => {
    try {
        const newPaths = await NewPath.find();
        res.status(200).json(newPaths);
    } catch (error) {
        console.error('Error fetching all new paths:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

