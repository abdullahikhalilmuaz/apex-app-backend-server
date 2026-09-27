const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/socket.io",
  });

  // Auth middleware
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");
      if (!token) return next(new Error("No token"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.userName = decoded.name || "";
      next();
    } catch (e) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const { userId, userRole } = socket;
    console.log(`[socket] connected user=${userId} role=${userRole}`);

    // Personal room for direct messages + notifications
    socket.join(`user:${userId}`);

    // Anyone in the teachers group joins that room too
    if (userRole === "teacher" || userRole === "headmaster") {
      socket.join("group:teachers");
    }

    socket.on("join-conversation", (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("leave-conversation", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on("typing", ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit("typing", {
        conversationId,
        userId,
        userName: socket.userName,
        isTyping,
      });
    });

    socket.on("disconnect", () => {
      console.log(`[socket] disconnected user=${userId}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}

module.exports = { initSocket, getIO };
