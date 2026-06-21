import mongoose, { Schema } from "mongoose";

const approvalSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    userName: String,
    action: { type: String, enum: ["approved", "rejected", "comment"], required: true },
    comment: { type: String, default: "" },
  },
  { timestamps: true }
);

const interDeptRequestSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    fromDepartment: { type: String, required: true, index: true },
    toDepartment: { type: String, required: true, index: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requestedByName: { type: String, default: "" },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    project: { type: Schema.Types.ObjectId, ref: "Project" },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["pending", "in_review", "approved", "rejected", "resolved"],
      default: "pending",
      index: true,
    },
    slaDeadline: { type: Date },
    escalated: { type: Boolean, default: false },
    approvals: [approvalSchema],
    zone: String,
    ward: String,
    district: String,
  },
  { timestamps: true }
);

export const InterDeptRequest = mongoose.model("InterDeptRequest", interDeptRequestSchema);
