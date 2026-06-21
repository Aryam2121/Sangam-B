import mongoose, { Schema } from "mongoose";

const seminarAttendanceSchema = new Schema(
  {
    seminarId: { type: Schema.Types.ObjectId, ref: "Seminar", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userName: { type: String, default: "" },
    certificateIssued: { type: Boolean, default: false },
  },
  { timestamps: true }
);

seminarAttendanceSchema.index({ seminarId: 1, userId: 1 }, { unique: true });

export const SeminarAttendance = mongoose.model("SeminarAttendance", seminarAttendanceSchema);
