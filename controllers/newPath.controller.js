// newPath.controller.js
import express from 'express';
import { NewPath } from '../models/newpath.model.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Controller function to create a new path
export const createNewPath = async (req, res) => {
    try {
        const { projectId1, projectId2, location1, location2, timestamp, distance } = req.body;

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
