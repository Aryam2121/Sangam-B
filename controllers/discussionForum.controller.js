import { DiscussionMessage } from "../models/discussionForum.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ADMIN_ROLES } from "../utils/roles.js";

const getDisplayName = (user) => user.fullName || user.username;

const canAccessDepartment = (user, department) => {
  if (ADMIN_ROLES.includes(user.role)) return true;
  return user.department === department;
};

export const getDiscussionHistory = asyncHandler(async (req, res) => {
  const { department } = req.params;
  if (!department) {
    throw new ApiError(400, "Department is required");
  }

  if (!canAccessDepartment(req.user, department)) {
    throw new ApiError(403, "Access denied for this department");
  }

  const messages = await DiscussionMessage.find({ department })
    .sort({ createdAt: 1 })
    .lean();

  res.status(200).json(messages);
});

export const createDiscussionMessage = asyncHandler(async (req, res) => {
  const { department, content, isFavorite } = req.body;
  const user = getDisplayName(req.user);

  if (!department || !content?.trim()) {
    throw new ApiError(400, "department and content are required");
  }

  if (!canAccessDepartment(req.user, department)) {
    throw new ApiError(403, "Access denied for this department");
  }

  const message = await DiscussionMessage.create({
    department,
    user,
    content: content.trim(),
    isFavorite: Boolean(isFavorite),
  });

  res.status(201).json(new ApiResponse(201, message, "Message created"));
});
