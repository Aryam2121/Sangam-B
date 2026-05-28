import { DiscussionMessage } from "../models/discussionForum.model.js";
import { ApiError } from "../utils/ApiError.js";

export const getDiscussionHistory = async (req, res) => {
  try {
    const { department } = req.params;
    if (!department) {
      throw new ApiError(400, "Department is required");
    }

    const messages = await DiscussionMessage.find({ department })
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching discussion history", error });
  }
};

export const createDiscussionMessage = async (req, res) => {
  try {
    const { department, user, content, isFavorite } = req.body;
    if (!department || !user || !content) {
      throw new ApiError(400, "department, user, and content are required");
    }

    const message = await DiscussionMessage.create({
      department,
      user,
      content,
      isFavorite: Boolean(isFavorite),
    });

    res.status(201).json({ message: "Message created", data: message });
  } catch (error) {
    res.status(500).json({ message: "Error creating discussion message", error });
  }
};
