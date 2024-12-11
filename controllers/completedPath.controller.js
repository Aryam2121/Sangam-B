// completedPath.controller.js
import express from 'express';
import { CompletedPath } from '../models/completePath.models.js';
import { v4 as uuidv4 } from 'uuid';



// Controller function to create a new completed path
export const createCompletedPath = async (req, res) => {
    try {
        const { projectId, completedPath, timestamp, distance } = req.body;

        if (!projectId || !completedPath || !timestamp) {
            return res.status(400).json({ error: 'All required fields must be provided' });
        }

        // Validate each list in completedPath
        for (const path of completedPath) {
            if (!path._id) {
                path._id = uuidv4();
            }
            if (!path.points) {
                path.points = [];
            }
            for (const point of path.points) {
                if (typeof point.lat !== 'number' || typeof point.lng !== 'number') {
                    return res.status(400).json({ error: 'Invalid coordinates in completedPath' });
                }
            }
        }

        const newCompletedPath = new CompletedPath({
            uuid: uuidv4(),
            projectId,
            completedPath,
            timestamp,
            distance
        });

        await newCompletedPath.save();
        res.status(201).json(newCompletedPath);
    } catch (error) {
        console.error('Error creating completed path:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

