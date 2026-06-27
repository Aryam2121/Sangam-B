import Seminar from "../models/training.model.js";
import { SeminarAttendance } from "../models/seminarAttendance.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createSeminar = asyncHandler(async (req, res) => {
  const { publisherName, seminarLink, description } = req.body;

  if (!publisherName || !seminarLink) {
    return res.status(400).json({ message: "Author name and seminar link are required." });
  }

  const newSeminar = await Seminar.create({ publisherName, seminarLink, description });
  res.status(201).json(newSeminar);
});

export const getAllSeminars = asyncHandler(async (req, res) => {
  const seminars = await Seminar.find().sort({ createdAt: -1 });
  res.status(200).json(seminars);
});

export const markSeminarAttendance = asyncHandler(async (req, res) => {
  const { seminarId } = req.params;
  const { certificateIssued } = req.body;

  const record = await SeminarAttendance.findOneAndUpdate(
    { seminarId, userId: req.user._id },
    {
      userName: req.user.fullName || req.user.username,
      certificateIssued: Boolean(certificateIssued),
    },
    { upsert: true, new: true }
  );

  res.status(200).json({ success: true, attendance: record });
});

export const getSeminarAttendance = asyncHandler(async (req, res) => {
  const { seminarId } = req.params;
  const records = await SeminarAttendance.find({ seminarId }).sort({ createdAt: -1 });
  const mine = await SeminarAttendance.findOne({ seminarId, userId: req.user._id });
  res.status(200).json({ success: true, records, attended: Boolean(mine) });
});

export const getMySeminarCertificates = asyncHandler(async (req, res) => {
  const records = await SeminarAttendance.find({
    userId: req.user._id,
    certificateIssued: true,
  }).populate("seminarId");

  res.status(200).json({ success: true, certificates: records });
});
