import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
	{
		sender: {
			type: String,
			required: true,
			trim: true,
		},
		receiver: {
			type: String,
			required: true,
			trim: true,
		},
		text: {
			type: String,
			required: true,
			trim: true,
		},
	},
	{ timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
