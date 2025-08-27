// backend/index.js
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require('dotenv').config();
const rootRouter = require("./routes/index");
const socketHandler = require("./routes/socket");

const app = express();
const server = http.createServer(app);

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- API Routes ---
app.use("/api/v1", rootRouter);

// --- Socket.IO Setup ---
const io = new Server(server, {
  cors: {
    origin: "*", // ⚠️ allow all for now, restrict in production
  },
});
socketHandler(io);

// --- Start Server ---
const PORT = 3006;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
