import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import multer from "multer";
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3000;

// Storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, '/tmp'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

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
  CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    name TEXT,
    type TEXT,
    size INTEGER,
    path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    message TEXT,
    type TEXT,
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
  const taskId = id || uuidv4();
  db.prepare("INSERT OR REPLACE INTO tasks (id, title, status) VALUES (?, ?, ?)").run(taskId, title, status);
  res.json({ success: true, id: taskId });
});

app.delete("/api/tasks/:id", (req, res) => {
  db.prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
  db.prepare("DELETE FROM logs WHERE task_id = ?").run(req.params.id);
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

app.get("/api/documents", (req, res) => {
  const docs = db.prepare("SELECT * FROM documents ORDER BY created_at DESC").all();
  res.json(docs);
});

app.post("/api/documents", upload.single('file'), (req: any, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
  const doc = {
    id: uuidv4(),
    name: req.file.originalname,
    type: req.file.mimetype,
    size: req.file.size,
    path: req.file.path
  };

  db.prepare("INSERT INTO documents (id, name, type, size, path) VALUES (?, ?, ?, ?, ?)").run(
    doc.id, doc.name, doc.type, doc.size, doc.path
  );
  
  // Add notification
  db.prepare("INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)").run(
    "Document Indexed",
    `Successfully indexed ${doc.name} into knowledge base.`,
    "success"
  );

  res.json(doc);
});

app.get("/api/notifications", (req, res) => {
  const notifications = db.prepare("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20").all();
  res.json(notifications);
});

app.post("/api/notifications/read", (req, res) => {
  db.prepare("UPDATE notifications SET read = 1").run();
  res.json({ success: true });
});

app.post("/api/notifications", (req, res) => {
  const { title, message, type } = req.body;
  db.prepare("INSERT INTO notifications (title, message, type) VALUES (?, ?, ?)").run(title, message, type);
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
