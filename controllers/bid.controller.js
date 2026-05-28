import { Bid } from "../models/bid.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logActivity } from "../utils/activityLogger.js";

const mapBid = (bid) => ({
  ...bid.toObject(),
  isExpired: Date.now() > new Date(bid.expiresAt).getTime(),
});

export const getAllBids = asyncHandler(async (_req, res) => {
  const bids = await Bid.find().sort({ createdAt: -1 });
  res.status(200).json({ bids: bids.map(mapBid) });
});

export const createBid = asyncHandler(async (req, res) => {
  const { contractor, resource, price, expiresAt } = req.body || {};
  if (!contractor || !resource || !price || !expiresAt) {
    return res.status(400).json({ message: "contractor, resource, price and expiresAt are required" });
  }

  const created = await Bid.create({
    contractor: String(contractor).trim(),
    resource: String(resource).trim(),
    price: Number(price),
    expiresAt: new Date(expiresAt),
  });

  await logActivity({
    entityType: "bid",
    action: "created",
    entityId: created._id,
    title: `Bid created for ${created.resource}`,
    description: `${created.contractor} placed bid at ${created.price}`,
    actorName: req.user?.fullName || req.user?.username || "System",
    actorId: req.user?._id,
  });

  res.status(201).json({ message: "Bid created successfully", bid: mapBid(created) });
});

export const updateBid = asyncHandler(async (req, res) => {
  const { bidId } = req.params;
  const updates = { ...req.body };
  if ("price" in updates) updates.price = Number(updates.price);
  if ("expiresAt" in updates) updates.expiresAt = new Date(updates.expiresAt);

  const updated = await Bid.findByIdAndUpdate(bidId, updates, { new: true, runValidators: true });
  if (!updated) return res.status(404).json({ message: "Bid not found" });

  await logActivity({
    entityType: "bid",
    action: "updated",
    entityId: updated._id,
    title: `Bid updated for ${updated.resource}`,
    description: `${updated.contractor} bid updated`,
    actorName: req.user?.fullName || req.user?.username || "System",
    actorId: req.user?._id,
  });

  res.status(200).json({ message: "Bid updated successfully", bid: mapBid(updated) });
});

export const deleteBid = asyncHandler(async (req, res) => {
  const { bidId } = req.params;
  const deleted = await Bid.findByIdAndDelete(bidId);
  if (!deleted) return res.status(404).json({ message: "Bid not found" });

  await logActivity({
    entityType: "bid",
    action: "deleted",
    entityId: deleted._id,
    title: `Bid deleted for ${deleted.resource}`,
    description: `${deleted.contractor} bid removed`,
    actorName: req.user?.fullName || req.user?.username || "System",
    actorId: req.user?._id,
  });

  res.status(200).json({ message: "Bid deleted successfully" });
});
