import { Server } from "socket.io";

let io;
const userSocketMap = {}; // {userId: socketId}

export function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected", socket.id);

    const userId = socket.handshake.query.userId;
    const garageId = socket.handshake.query.garageId;

    const garages = garageId ? garageId.split(",").map((id) => id.trim()) : [];

    console.log(garages);

    if (garages.length > 0) {
      garages.forEach((garage) => {
        socket.join(garage);
      });
    }

    if (userId) userSocketMap[userId] = socket.id;

    socket.on("disconnect", () => {
      console.log("A user disconnected", socket.id);
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });

  return io;
}

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}
