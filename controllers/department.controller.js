import { Department } from '../models/department.model.js';

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