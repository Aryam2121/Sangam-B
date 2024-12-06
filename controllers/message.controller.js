// import Message from '../models/message.model.js';
// import Discussion from '../models/discuss.model.js';

// // Create a new message in a discussion
// export const createMessage = async (req, res) => {
//     try {
//         const { discussionId, senderId, content } = req.body;

//         const discussion = await Discussion.findById(discussionId);
//         if (!discussion) return res.status(404).json({ error: 'Discussion not found' });

//         const newMessage = new Message({
//             discussion: discussionId,
//             sender: senderId,
//             content,
//         });

//         await newMessage.save();
//         discussion.messages.push(newMessage._id);
//         await discussion.save();

//         res.status(201).json(newMessage);
//     } catch (error) {
//         res.status(500).json({ error: 'Server error' });
//     }
// };

// // Get all messages in a discussion
// export const getMessagesByDiscussion = async (req, res) => {
//     try {
//         const messages = await Message.find({ discussion: req.params.discussionId }).populate('sender');
//         res.status(200).json(messages);
//     } catch (error) {
//         res.status(500).json({ error: 'Server error' });
//     }
// };

// // Get a single message by ID
// export const getMessageById = async (req, res) => {
//     try {
//         const message = await Message.findById(req.params.id).populate('sender');
//         if (!message) return res.status(404).json({ error: 'Message not found' });
//         res.status(200).json(message);
//     } catch (error) {
//         res.status(500).json({ error: 'Server error' });
//     }
// };

// // Delete a message
// export const deleteMessage = async (req, res) => {
//     try {
//         const deletedMessage = await Message.findByIdAndDelete(req.params.id);
//         if (!deletedMessage) return res.status(404).json({ error: 'Message not found' });
//         res.status(200).json({ message: 'Message deleted successfully' });
//     } catch (error) {
//         res.status(500).json({ error: 'Server error' });
//     }
// };
