import Router from 'express';
import Report from '../models/report.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import {Project} from '../models/project.model.js';
import mongoose from 'mongoose';
import multer from 'multer';
import fs from 'fs';

const router = Router();

const upload = multer({ dest: 'uploads/' });

export const uploadProjectReport = async (req, res) => {
    try {
        const { projectId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid project ID' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;

        const result = await uploadOnCloudinary(filePath);

        if (!result) {
            return res.status(500).json({ error: 'Error uploading file to Cloudinary' });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const report = new Report({
            projectId: project._id,
            reportUrl: result.secure_url,
            submittedAt: new Date()
        });

        await report.save();

        res.status(200).json({ message: 'Report uploaded successfully', report });
    } catch (error) {
        console.error('Error uploading report:', error);
        res.status(500).json({ error: 'Server error' });
    }
};





router.post('/uploadProjectReport/:projectId', upload.single('report'), uploadProjectReport);





export default router;



