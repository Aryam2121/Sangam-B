import mongoose from "mongoose";
import {User} from '../models/user.model.js';

import Seminar from "../models/training.model.js";


export const createSeminar = async (req, res) => {
    const { publisherName, seminarLink, description } = req.body;

    if (!publisherName || !seminarLink) {
        return res.status(400).json({ message: "Author name and seminar link are required." });
    }

    try {
        const newSeminar = new Seminar({
            publisherName,
            seminarLink,
            description
        });

        await newSeminar.save();
        res.status(201).json(newSeminar);
    } catch (error) {
        console.error('Error creating seminar:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


export const getAllSeminars = async (req, res) => {
    try {
        const seminars = await Seminar.find();
        res.status(200).json(seminars);
    } catch (error) {
        console.error('Error getting seminars:', error);
        res.status(500).json({ message: 'Server error' });
    }
}




