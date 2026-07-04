import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import fetch from "node-fetch";
import { createRoomStore } from "./rooms.js";

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const rooms = createRoomStore();

const PISTON_URL = "https://emkc.org/api/v2/piston";

let runtimesCache = [];

async function loadRuntimes() {
  try {
    const response = await fetch(`${PISTON_URL}/runtimes`);
    runtimesCache = await response.json();
    console.log(`Loaded ${runtimesCache.length} Piston runtimes`);
  } catch (err) {
    console.error("Failed to load Piston runtimes:", err.message);
  }
}

loadRuntimes();

app.post("/api/execute", async (req, res) => {
  const { language, code, stdin } = req.body;

  const runtime = runtimesCache.find(
    (r) =>
      r.language === language ||
      (r.aliases && r.aliases.includes(language))
  );

  if (!runtime) {
    return res.status(400).json({
      error: `Language "${language}" not supported`,
    });
  }

  try {
    const response = await fetch(`${PISTON_URL}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language: runtime.language,
        version: runtime.version,
        files: [
          {
            content: code,
          },
        ],
        stdin: stdin || "",
      }),
    });

    const data = await response.json();

console.log(JSON.stringify(data, null, 2));

res.json(data);
  } catch (err) {
    res.status(500).json({
      error: "Execution failed",
      details: err.message,
    });
  }
});

const COLORS = [
  "#f97316",
  "#22c55e",
  "#3b82f6",
  "#ec4899",
  "#eab308",
  "#a855f7",
  "#14b8a6",
  "#ef4444",
];

io.on("connection", (socket) => {
  socket.on("join-room", ({ roomId, name }) => {
    socket.join(roomId);

    const color =
      COLORS[Math.floor(Math.random() * COLORS.length)];

    const room = rooms.join(
      roomId,
      socket.id,
      name,
      color
    );

    socket.emit("room-state", {
      code: room.code,
      language: room.language,
      messages: room.messages,
      users: rooms.getUsers(roomId),
    });

    socket.to(roomId).emit("user-joined", {
      id: socket.id,
      name,
      color,
    });

    io.to(roomId).emit(
      "users-update",
      rooms.getUsers(roomId)
    );

    socket.data.roomId = roomId;
    socket.data.name = name;
  });

  socket.on("code-change", ({ roomId, code }) => {
    rooms.setCode(roomId, code);
    socket.to(roomId).emit("code-update", code);
  });

  socket.on("language-change", ({ roomId, language }) => {
    rooms.setLanguage(roomId, language);
    io.to(roomId).emit("language-update", language);
  });

  socket.on("chat-message", ({ roomId, text }) => {
    const message = {
      id: Date.now().toString(),
      sender: socket.data.name || "Anonymous",
      text,
      timestamp: new Date().toISOString(),
    };

    rooms.addMessage(roomId, message);

    io.to(roomId).emit("chat-message", message);
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;

    if (roomId) {
      rooms.leave(roomId, socket.id);

      io.to(roomId).emit("user-left", socket.id);

      io.to(roomId).emit(
        "users-update",
        rooms.getUsers(roomId)
      );
    }
  });
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`DevSync server running on port ${PORT}`);
});