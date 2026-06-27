import mongoose, { Schema } from "mongoose";

const budgetEntrySchema = new Schema(
  {
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    department: { type: String, index: true },
    category: { type: String, default: "general" },
    description: { type: String, default: "" },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["allocation", "expense", "adjustment"], default: "expense" },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User" },
    recordedByName: { type: String, default: "" },
  },
  { timestamps: true }
);

export const BudgetEntry = mongoose.model("BudgetEntry", budgetEntrySchema);
