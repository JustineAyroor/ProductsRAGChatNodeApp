const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");

const modelsRouter = require("./routes/models");
const conversationsRouter = require("./routes/conversations");
const chatRouter = require("./routes/chat");
const exportRouter = require("./routes/export");
const logsRouter = require("./routes/logs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.use("/api/models", modelsRouter);
app.use("/api/conversations", conversationsRouter);
app.use("/api/conversations", chatRouter);
app.use("/api/conversations", exportRouter);
app.use("/api/logs", logsRouter);

if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the other process or set a different PORT in .env`
    );
    console.error(`  Example: lsof -ti :${PORT} | xargs kill`);
  } else {
    console.error("Server failed to start:", err.message);
  }
  process.exit(1);
});
