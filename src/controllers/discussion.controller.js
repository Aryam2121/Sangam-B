// import { Discuss } from '../models/discuss.model.js';

// export const createDiscussion = async (req, res) => {
//     try {
//         const { project, participants, messages } = req.body;
//         const discussion = new Discuss({ project, participants, messages });
//         await discussion.save();
//         res.status(201).json({ message: "Discussion created successfully", discussion });
//     } catch (error) {
//         res.status(500).json({ message: "Error creating discussion", error });
//     }
// };

// export const getDiscussions = async (req, res) => {
//     try {
//         const discussions = await Discuss.find().populate('project').populate('participants').populate('messages');
//         res.json({ discussions });
//     } catch (error) {
//         res.status(500).json({ message: "Error fetching discussions", error });
//     }
// };

// export const addMessage = async (req, res) => {
//     try {
//         const { discussionId } = req.params;
//         const { sender, content } = req.body;
//         const discussion = await Discuss.findById(discussionId);
//         discussion.messages.push({ sender, content });
//         await discussion.save();
//         res.json({ message: "Message added successfully", discussion });
//     } catch (error) {
//         res.status(500).json({ message: "Error adding message", error });
//     }
// };
