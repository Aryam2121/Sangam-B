import Router from 'express';
import Report from '../models/report.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import {Project} from '../models/project.model.js';
import {Task} from '../models/tasks.model.js';
import TaskReport from '../models/taskReport.model.js';
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

        if (!req.files || req.files.length === 0) {
            console.error('No files uploaded');
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const uploadPromises = req.files.map(async (file) => {
            if (!file.mimetype.startsWith('image/')) {
                throw new Error('Only image files are allowed');
            }

            const filePath = file.path;
            console.log(`Uploading file: ${filePath}`);

            const result = await uploadOnCloudinary(filePath);
            if (!result) {
                throw new Error('Error uploading file to Cloudinary');
            }

            return result.secure_url;
        });

        const reportUrls = await Promise.all(uploadPromises);

        let report = await Report.findById(projectId);
        if (!report) {
            report = new Report({
                _id: project._id,
                reportUrls: reportUrls,
                submittedAt: new Date()
            });
        } else {
            if (!report.reportUrls) {
                report.reportUrls = [];
            }
            report.reportUrls.push(...reportUrls);
            report.submittedAt = new Date();
        }

        await report.save();

        res.status(200).json({ message: 'Reports uploaded successfully', report });
    } catch (error) {
        console.error('Error uploading reports:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


export const uploadTaskReport = async (req, res) => {
    try {
        const { taskId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ error: 'Invalid task ID' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const uploadPromises = req.files.map(async (file) => {
            if (!file.mimetype.startsWith('image/')) {
                throw new Error('Only image files are allowed');
            }

            const filePath = file.path;
            console.log(`Uploading file: ${filePath}`);

            const result = await uploadOnCloudinary(filePath);
            if (!result) {
                throw new Error('Error uploading file to Cloudinary');
            }

            return result.secure_url;
        });

        const reportUrls = await Promise.all(uploadPromises);

        let report = await TaskReport.findById(taskId);
        if (!report) {
            report = new TaskReport({
                _id: task._id,
                reportUrls: reportUrls,
                submittedAt: new Date()
            });
        } else {
            report.reportUrls.push(...reportUrls);
            report.submittedAt = new Date();
        }

        await report.save();

        res.status(200).json({ message: 'Reports uploaded successfully', report });
    } catch (error) {
        console.error('Error uploading reports:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


export const getReportByProjectId = async (req, res) => {
    try {
        const { projectId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid project ID' });
        }

        const report = await Report.findById(projectId);


        res.status(200).json({ report });
    } catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).json({ error: 'Server error' });
    }
};


export const getReportByTaskId = async (req, res) => {
    try {
        const { taskId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ error: 'Invalid task ID' });
        }

        const report = await TaskReport.findById(taskId);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        res.status(200).json({ report });
    } catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const updateProjectReport = async (req, res) => {
    try {
        const { projectId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid project ID' });
        }

        if (!req.files || req.files.length === 0) {
            console.error('No files uploaded');
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        const uploadPromises = req.files.map(async (file) => {
            if (!file.mimetype.startsWith('image/')) {
                throw new Error('Only image files are allowed');
            }

            const filePath = file.path;
            console.log(`Uploading file: ${filePath}`);

            const result = await uploadOnCloudinary(filePath);
            if (!result) {
                throw new Error('Error uploading file to Cloudinary');
            }

            return result.secure_url;
        });

        const reportUrls = await Promise.all(uploadPromises);

        let report = await Report.findById(projectId);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        report.reportUrls.push(...reportUrls);
        report.submittedAt = new Date();

        await report.save();

        res.status(200).json({ message: 'Reports updated successfully', report });
    } catch (error) {
        console.error('Error updating reports:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const updateTaskReport = async (req, res) => {
    try {
        const { taskId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ error: 'Invalid task ID' });
        }

        if (!req.files || req.files.length === 0) {
            console.error('No files uploaded');
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const uploadPromises = req.files.map(async (file) => {
            if (!file.mimetype.startsWith('image/')) {
                throw new Error('Only image files are allowed');
            }

            const filePath = file.path;
            console.log(`Uploading file: ${filePath}`);

            const result = await uploadOnCloudinary(filePath);
            if (!result) {
                throw new Error('Error uploading file to Cloudinary');
            }

            return result.secure_url;
        });

        const reportUrls = await Promise.all(uploadPromises);

        let report = await TaskReport.findById(taskId);
        if (!report) {
            return res.status(404).json({ error: 'Report not found' });
        }

        report.reportUrls.push(...reportUrls);
        report.submittedAt = new Date();

        await report.save();

        res.status(200).json({ message: 'Reports updated successfully', report });
    } catch (error) {
        console.error('Error updating reports:', error);
        res.status(500).json({ error: 'Server error' });
    }
};




router.post('/uploadProjectReport/:projectId', upload.array('report',10), uploadProjectReport);

router.get('/getReportByProjectId/:projectId', getReportByProjectId);

router.post('/uploadtaskreport/:taskId',upload.array('report'),uploadTaskReport);

router.get('/getReportByTaskId/:taskId', getReportByTaskId);

router.patch('/updateprojectreport/:projectId', upload.array('report',10), updateProjectReport);

export default router;