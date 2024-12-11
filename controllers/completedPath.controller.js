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
        for (const path of completedPath) {
            if (!path._id) {
                path._id = uuidv4();
            }
            if (!path.points || path.points.length === 0) {
                return res.status(400).json({ error: 'Points array cannot be null or empty' });
            }
            for (const point of path.points) {
                if (typeof point.lat !== 'number' || typeof point.lng !== 'number') {
                    return res.status(400).json({ error: 'Invalid coordinates in completedPath' });
                }
            }
        }

        const newCompletedPath = new CompletedPath({
            _id: projectId,
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

export const getCompletedPathById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: 'Path ID is required' });
        }

        const path = await CompletedPath.findById(id);

        if (!path) {
            return res.status(404).json({ error: 'Path not found' });
        }

        res.status(200).json(path);
    } catch (error) {
        console.error('Error getting completed path:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};



export const updateCompletedPath = async (req, res) => {
    try {
        const { id } = req.params;
        const { completedPath } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'Path ID is required' });
        }

        const path = await CompletedPath.findById(id);

        if (!path) {
            return res.status(404).json({ error: 'Path not found' });
        }

        // Validate and update each list in completedPath
        for (const newPath of completedPath) {
            if (!newPath._id) {
                newPath._id = uuidv4();
            }
            if (!newPath.points || newPath.points.length === 0) {
                return res.status(400).json({ error: 'Points array cannot be null or empty' });
            }
            for (const point of newPath.points) {
                if (typeof point.lat !== 'number' || typeof point.lng !== 'number') {
                    return res.status(400).json({ error: 'Invalid coordinates in completedPath' });
                }
            }

            const existingPath = path.completedPath.find(p => p._id === newPath._id);
            if (existingPath) {
                existingPath.points.push(...newPath.points);
            } else {
                path.completedPath.push(newPath);
            }
        }

        await path.save();
        res.status(200).json(path);
    } catch (error) {
        console.error('Error updating completed path:', error);
        res.status(500).json({ error: 'Server error' });
    }
};



