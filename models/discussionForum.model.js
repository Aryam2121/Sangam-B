import mongoose, { Schema } from "mongoose";

const discussionMessageSchema = new Schema(
	{
		department: {
			type: String,
			required: true,
			trim: true,
		},
		user: {
			type: String,
			required: true,
			trim: true,
		},
		content: {
			type: String,
			required: true,
			trim: true,
		},
		isFavorite: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

export const DiscussionMessage = mongoose.model(
	"DiscussionMessage",
	discussionMessageSchema
);
