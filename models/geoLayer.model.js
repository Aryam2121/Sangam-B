import mongoose, { Schema } from "mongoose";

const geoLayerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    layerType: {
      type: String,
      enum: ["ward_boundary", "hotspot", "project_overlay", "custom"],
      default: "custom",
    },
    geojson: { type: Schema.Types.Mixed, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
    uploadedByName: { type: String, default: "" },
    visible: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const GeoLayer = mongoose.model("GeoLayer", geoLayerSchema);
