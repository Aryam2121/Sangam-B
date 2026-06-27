import mongoose, { Schema } from "mongoose";

const announcementSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    department: { type: String, default: null, index: true },
    authorName: { type: String, default: "Admin" },
    authorId: { type: Schema.Types.ObjectId, ref: "User" },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Announcement = mongoose.model("Announcement", announcementSchema);
