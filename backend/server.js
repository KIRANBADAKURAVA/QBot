// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./db.js";
import { generateSQL, resetChat, getCleanSQL, resolveError } from "./queryllm.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Run SQL safely
const runQuery = (sql) => {
  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Chat endpoint (same as Flask `/chat`)
app.post("/api/query", async (req, res) => {
  const { prompt, reset } = req.body;

  if (reset) resetChat();

  try {
    console.log("Received prompt:", prompt);

    // Step 1: Generate SQL
    const sql = await generateSQL(prompt);
    let cleanSQL = await getCleanSQL(sql);

    try {
      const rows = await runQuery(cleanSQL);
      return res.json({ sql: cleanSQL, rows });
    } catch (err) {
      console.log("SQL error:", err.message);
      const fixedSQL = await resolveError(cleanSQL, err.message);
      const rows = await runQuery(fixedSQL);
      res.json({ sql: fixedSQL, rows });
    }
  } catch (err) {
    console.error("Processing error:", err);
    res.status(500).json({
      error: "Failed to process query",
      message: err.message,
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
