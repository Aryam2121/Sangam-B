import { Message } from "../models/message.model.js";
import { ApiError } from "../utils/ApiError.js";

export const getChatHistory = async (req, res) => {
  try {
    const { contact } = req.params;
    if (!contact) {
      throw new ApiError(400, "Contact is required");
    }

    const messages = await Message.find({
      $or: [{ sender: contact }, { receiver: contact }],
    })
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching chat history", error });
  }
};

export const sendChatMessage = async (req, res) => {
  try {
    const { sender, receiver, text } = req.body;
    if (!sender || !receiver || !text) {
      throw new ApiError(400, "sender, receiver, and text are required");
    }

    const message = await Message.create({ sender, receiver, text });
    res.status(201).json({ message: "Message sent", data: message });
  } catch (error) {
    res.status(500).json({ message: "Error sending message", error });
  }
};
