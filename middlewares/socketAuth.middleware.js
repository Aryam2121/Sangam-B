import jwt from 'jsonwebtoken';
import cookie from 'cookie';
import { User } from '../models/user.model.js';

const extractToken = (socket) => {
  if (socket.handshake.auth?.token) {
    return socket.handshake.auth.token;
  }

  const authHeader = socket.handshake.headers?.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  const rawCookie = socket.handshake.headers?.cookie;
  if (rawCookie) {
    const cookies = cookie.parse(rawCookie);
    if (cookies.accessToken) {
      return cookies.accessToken;
    }
  }

  return null;
};

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = extractToken(socket);
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded?._id).select('-password -refreshToken');

    if (!user) {
      return next(new Error('Invalid access token'));
    }

    socket.data.user = user;
    const displayName = user.fullName || user.username;
    socket.join(`user:${displayName}`);
    if (user.username && user.username !== displayName) {
      socket.join(`user:${user.username}`);
    }

    next();
  } catch {
    next(new Error('Authentication failed'));
  }
};

export const getUserDisplayName = (user) => user.fullName || user.username;
