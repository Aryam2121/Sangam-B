// import mongoose, { Schema } from "mongoose";
// //import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

// const discussionSchema = new Schema({
//   project: {
//       type: Schema.Types.ObjectId,
//       ref: 'Project',
//       //required: true,
//   },
//   participants: [{
//       type: Schema.Types.ObjectId,
//       ref: 'User',
//   }],
//   messages: [{
//       type: Schema.Types.ObjectId,
//       ref: 'Message',
//   }],
//   createdAt: {
//       type: Date,
//       default: Date.now,
//   },
// },
//   {
//     timestamps: true,
//   }
// );

// // discussionSchema.plugin(mongooseAggregatePaginate);
// // discussionSchema.index({ content: "text" }); 

// export const Discuss = mongoose.model("Discuss", discussionSchema);
