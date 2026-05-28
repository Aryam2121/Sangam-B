import admin from "firebase-admin";
import { logger } from "./logger.js";

let initialized = false;

export const initFirebaseAdmin = () => {
  if (initialized) return admin.apps.length > 0;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    logger.warn(
      "Firebase Admin not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY for Google login."
    );
    return false;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    initialized = true;
    logger.info("Firebase Admin initialized for Google auth");
    return true;
  } catch (error) {
    logger.error("Firebase Admin init failed", error);
    return false;
  }
};

export const verifyFirebaseIdToken = async (idToken) => {
  if (!initFirebaseAdmin()) {
    throw new Error("Firebase Admin is not configured on the server");
  }
  return admin.auth().verifyIdToken(idToken);
};
