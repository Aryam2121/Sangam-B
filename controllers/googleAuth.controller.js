import crypto from "crypto";
import bcryptjs from "bcryptjs";
import { User } from "../models/user.model.js";
import { Department } from "../models/department.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { verifyFirebaseIdToken } from "../utils/firebaseAdmin.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
};

const generateAccessAndRefreshToken = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

const issueLoginResponse = async (user, res, message) => {
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, message)
    );
};

const usernameFromEmail = async (email) => {
  const base = (email?.split("@")[0] || "user")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .slice(0, 16);
  let candidate = base || "user";
  let suffix = 0;
  while (await User.findOne({ username: candidate })) {
    suffix += 1;
    candidate = `${base}_${suffix}`;
  }
  return candidate;
};

/**
 * POST /admin/google-login
 * Body: { idToken, fcmToken? }
 */
export const loginWithGoogle = asyncHandler(async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    throw new ApiError(400, "Google idToken is required");
  }

  let decoded;
  try {
    decoded = await verifyFirebaseIdToken(idToken);
  } catch {
    throw new ApiError(401, "Invalid or expired Google sign-in");
  }

  const email = decoded.email?.toLowerCase();
  if (!email) {
    throw new ApiError(400, "Google account must include an email address");
  }

  let user = await User.findOne({
    $or: [{ firebaseUid: decoded.uid }, { email }],
  });

  if (!user) {
    return res.status(404).json(
      new ApiResponse(
        404,
        {
          needsRegistration: true,
          email,
          fullName: decoded.name || email.split("@")[0],
          photoURL: decoded.picture || null,
          firebaseUid: decoded.uid,
        },
        "Complete your Sangam profile to continue"
      )
    );
  }

  if (!user.firebaseUid) {
    user.firebaseUid = decoded.uid;
  }
  if (decoded.picture) {
    user.photoURL = decoded.picture;
  }
  if (user.authProvider === "local") {
    user.authProvider = "google";
  }
  if (req.body.fcmToken) {
    user.fcmToken = req.body.fcmToken;
  }
  await user.save({ validateBeforeSave: false });

  return issueLoginResponse(user, res, "Signed in with Google");
});

/**
 * POST /admin/google-register
 * Body: { idToken, role, department?, username?, fullName? }
 */
export const completeGoogleRegistration = asyncHandler(async (req, res) => {
  const { idToken, role, department, username, fullName } = req.body;

  if (!idToken || !role) {
    throw new ApiError(400, "idToken and role are required");
  }

  let decoded;
  try {
    decoded = await verifyFirebaseIdToken(idToken);
  } catch {
    throw new ApiError(401, "Invalid or expired Google sign-in");
  }

  const email = decoded.email?.toLowerCase();
  if (!email) {
    throw new ApiError(400, "Google account must include an email");
  }

  const existing = await User.findOne({
    $or: [{ email }, { firebaseUid: decoded.uid }],
  });
  if (existing) {
    throw new ApiError(409, "Account already exists. Please sign in.");
  }

  if (role !== "Main Admin") {
    if (!department?.trim()) {
      throw new ApiError(400, "Department is required for this role");
    }
    const dept = await Department.findOne({ name: department.trim() });
    if (!dept) {
      throw new ApiError(404, "Department not found");
    }
  }

  const chosenUsername = username?.trim()
    ? username.trim().toLowerCase()
    : await usernameFromEmail(email);

  const taken = await User.findOne({ username: chosenUsername });
  if (taken) {
    throw new ApiError(409, "Username already taken");
  }

  const randomPassword = await bcryptjs.hash(crypto.randomBytes(32).toString("hex"), 10);

  const user = await User.create({
    fullName: fullName?.trim() || decoded.name || email.split("@")[0],
    email,
    username: chosenUsername,
    password: randomPassword,
    role,
    department: role !== "Main Admin" ? department.trim() : null,
    authProvider: "google",
    firebaseUid: decoded.uid,
    photoURL: decoded.picture || null,
    fcmToken: req.body.fcmToken || null,
  });

  return issueLoginResponse(user, res, "Google account registered successfully");
});

/**
 * PATCH /admin/fcm-token — save device push token (JWT required)
 */
export const updateFcmToken = asyncHandler(async (req, res) => {
  const { fcmToken } = req.body;
  if (!fcmToken) {
    throw new ApiError(400, "fcmToken is required");
  }

  await User.findByIdAndUpdate(req.user._id, { fcmToken });
  res.status(200).json(new ApiResponse(200, { saved: true }, "FCM token saved"));
});
