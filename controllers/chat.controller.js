import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getDisplayName = (user) => user.fullName || user.username;

export const getChatContacts = asyncHandler(async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } })
    .select("fullName username")
    .lean();

  const contacts = users.map((user) => ({
    fullName: user.fullName,
    username: user.username,
  }));

  res.status(200).json(new ApiResponse(200, contacts, "Chat contacts retrieved"));
});

export const getChatHistory = asyncHandler(async (req, res) => {
  const { contact } = req.params;
  if (!contact) {
    throw new ApiError(400, "Contact is required");
  }

  const selfName = getDisplayName(req.user);

  const messages = await Message.find({
    $or: [
      { sender: selfName, receiver: contact },
      { sender: contact, receiver: selfName },
    ],
  })
    .sort({ createdAt: 1 })
    .lean();

  res.status(200).json(messages);
});

export const sendChatMessage = asyncHandler(async (req, res) => {
  const { receiver, text } = req.body;
  const sender = getDisplayName(req.user);

  if (!receiver || !text?.trim()) {
    throw new ApiError(400, "receiver and text are required");
  }

  const message = await Message.create({ sender, receiver, text: text.trim() });
  res.status(201).json(new ApiResponse(201, message, "Message sent"));
});
