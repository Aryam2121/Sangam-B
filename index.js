import dotenv from "dotenv"
import connectDB from "./db/index.js";
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import rateLimit from "express-rate-limit";
import http from "http";
import { Server as SocketServer } from "socket.io";
import authRouter from './routes/auth.js'
import apiRouter from './routes/api.js'
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.middleware.js";
import { logger, requestLogger, cleanOldLogs, rotateLogFiles } from "./utils/logger.js";
import { securityHeaders, apiSecurityHeaders, preventRateLimitBypass, validateInputPatterns } from "./middlewares/security.middleware.js";
import { Message } from "./models/message.model.js";
import { DiscussionMessage } from "./models/discussionForum.model.js";
import { initFirebaseAdmin } from "./utils/firebaseAdmin.js";

dotenv.config();
initFirebaseAdmin();

// Log application startup
logger.info('Starting SANGAM backend server...');

const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
    : ['https://sangam-frontend-two.vercel.app','https://sangam-b.onrender.com'];
connectDB()
.then(() => {
    logger.info("MongoDB connection successful");
})
.catch((err) => {
    logger.error("MongoDB connection failed", err);
    process.exit(1);
});

const app = express()
app.set("trust proxy", 1);
const server = http.createServer(app);
const io = new SocketServer(server, {
    cors: {
        origin: corsOrigin,
        credentials: true
    }
});

// CORS configuration
app.use(cors({
    origin: corsOrigin,
    credentials: true
}))

// Security headers middleware
app.use(securityHeaders);

// Prevent rate limit bypass
app.use(preventRateLimitBypass);

// Validate input patterns for XSS/injection attacks
app.use(validateInputPatterns);

// Request logging middleware - log all requests
app.use(requestLogger);

// Body parser middleware
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: false, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// Rate limiting middleware
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window for login/register
    message: {
        success: false,
        message: 'Too many login attempts. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'development', // Skip in development
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for ${req.ip} on ${req.path}`);
        res.status(429).json({
            success: false,
            message: 'Too many login attempts. Please try again later.'
        });
    }
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
        success: false,
        message: 'Too many requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'development',
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for ${req.ip} on ${req.path}`);
        res.status(429).json({
            success: false,
            message: 'Too many requests. Please try again later.'
        });
    }
});

const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 uploads per window
    message: {
        success: false,
        message: 'Too many uploads. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'development'
});

// Health check route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Server is live",
        timestamp: new Date().toISOString()
    })
})

app.get("/healthz", (req, res) => {
    res.status(200).json({
        success: true,
        service: "sangam-backend",
        status: "healthy",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "ok",
        environment: process.env.NODE_ENV || "development"
    });
});

// Apply rate limiters to auth routes
app.use("/admin/register", loginLimiter);
app.use("/admin/login", loginLimiter);

// Apply stricter rate limiting to upload endpoints
app.use("/api/uploadProjectReport", uploadLimiter);
app.use("/api/uploadtaskreport", uploadLimiter);
app.use("/api/updateprojectreport", uploadLimiter);
app.use("/api/updatetaskreport", uploadLimiter);

// API auth routes
app.use("/admin", authRouter);

// API security headers and routes
app.use("/api", apiSecurityHeaders);
app.use("/api", apiLimiter, apiRouter);

// 404 handler - must be before error handler
app.use(notFoundHandler);

// Error handling middleware - must be last
app.use(errorHandler);

const PORT = process.env.PORT || 3002;

io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on("chatMessage", async (payload) => {
        try {
            const { sender, receiver, text } = payload || {};
            if (!sender || !receiver || !text) return;
            const saved = await Message.create({ sender, receiver, text });
            io.emit("message", {
                sender: saved.sender,
                receiver: saved.receiver,
                text: saved.text,
                createdAt: saved.createdAt,
            });
        } catch (error) {
            logger.error("Socket chatMessage error", error);
        }
    });

    socket.on("typing", (payload) => {
        io.emit("typing", payload);
    });

    socket.on("joinDepartment", async (department) => {
        if (!department) return;
        socket.join(department);
        try {
            const history = await DiscussionMessage.find({ department })
                .sort({ createdAt: 1 })
                .lean();
            const shaped = history.map((msg) => ({
                id: msg._id.toString(),
                user: msg.user,
                department: msg.department,
                content: msg.content,
                time: new Date(msg.createdAt).toLocaleTimeString(),
                isFavorite: Boolean(msg.isFavorite),
            }));
            socket.emit("messageHistory", shaped);
        } catch (error) {
            logger.error("Socket joinDepartment error", error);
        }
    });

    socket.on("sendMessage", async (payload) => {
        try {
            const { department, user, content, isFavorite } = payload || {};
            if (!department || !user || !content) return;
            const saved = await DiscussionMessage.create({
                department,
                user,
                content,
                isFavorite: Boolean(isFavorite),
            });
            io.to(department).emit("newMessage", {
                id: saved._id.toString(),
                user: saved.user,
                department: saved.department,
                content: saved.content,
                time: new Date(saved.createdAt).toLocaleTimeString(),
                isFavorite: Boolean(saved.isFavorite),
            });
        } catch (error) {
            logger.error("Socket sendMessage error", error);
        }
    });

    socket.on("disconnect", () => {
        logger.info(`Socket disconnected: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    logger.info(`⚙️  Server is running at port: ${PORT}`);
    logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔗 CORS Origin: ${process.env.CORS_ORIGIN}`);
});

server.on('error', (error) => {
    logger.error('HTTP server error', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', error);
    process.exit(1);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', new Error(`Promise rejected: ${reason}`));
});

// Periodic log maintenance
if (process.env.NODE_ENV === 'production') {
    // Rotate logs daily
    setInterval(rotateLogFiles, 24 * 60 * 60 * 1000);
    // Clean old logs every 7 days
    setInterval(cleanOldLogs, 7 * 24 * 60 * 60 * 1000);
}

