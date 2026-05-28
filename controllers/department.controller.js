import mongoose from 'mongoose';
import { Department } from '../models/department.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createDepartment = async (req, res) => {
    try {
        const { name, description } = req.body;
                
        const existingDepartment = await Department.findOne({ name });
        if (existingDepartment) {
            return res.status(400).json({ message: "Department name already exists" });
        }

        
        const newDepartment = await Department.create({
            name,
            description,
        });

        res.status(201).json(newDepartment);
    } catch (error) {
        res.status(500).json({ message: "Error creating department", error });
    }
};


export const getAllDepartments = async (req, res) => {
    try {
        const departments = await Department.find();
        res.status(200).json(departments);
    } catch (error) {
        res.status(500).json({ message: "Error fetching departments", error });
    }
};

export const getDepartmentById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid department ID" });
    }
    const department = await Department.findById(id);
    if (!department) {
        return res.status(404).json({ message: "Department not found" });
    }
    res.status(200).json(department);
});

export const updateDepartment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid department ID" });
    }

    if (name) {
        const duplicate = await Department.findOne({ name, _id: { $ne: id } });
        if (duplicate) {
            return res.status(409).json({ message: "Department name already exists" });
        }
    }

    const updated = await Department.findByIdAndUpdate(
        id,
        { ...(name && { name }), ...(description !== undefined && { description }) },
        { new: true, runValidators: true }
    );

    if (!updated) {
        return res.status(404).json({ message: "Department not found" });
    }

    res.status(200).json({ message: "Department updated", department: updated });
});

export const deleteDepartment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid department ID" });
    }

    const deleted = await Department.findByIdAndDelete(id);
    if (!deleted) {
        return res.status(404).json({ message: "Department not found" });
    }

    res.status(200).json({ message: "Department deleted successfully" });
});