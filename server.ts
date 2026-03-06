import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";

const app = express();
const PORT = 3000;

// Database setup
const db = new Database("flowpilot.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT,
    agent TEXT,
    message TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

app.use(express.json());

// API Routes
app.get("/api/tasks", (req, res) => {
  const tasks = db.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all();
  res.json(tasks);
});

app.post("/api/tasks", (req, res) => {
  const { id, title, status } = req.body;
  db.prepare("INSERT INTO tasks (id, title, status) VALUES (?, ?, ?)").run(id, title, status);
  res.json({ success: true });
});

app.get("/api/logs/:taskId", (req, res) => {
  const logs = db.prepare("SELECT * FROM logs WHERE task_id = ? ORDER BY timestamp ASC").all(req.params.taskId);
  res.json(logs);
});

app.post("/api/logs", (req, res) => {
  const { task_id, agent, message } = req.body;
  db.prepare("INSERT INTO logs (task_id, agent, message) VALUES (?, ?, ?)").run(task_id, agent, message);
  res.json({ success: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FlowPilot AI server running on http://localhost:${PORT}`);
  });
}

startServer();
