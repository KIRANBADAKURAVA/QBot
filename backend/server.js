import express from 'express';
import cors from 'cors';
import db from './db.js';
import { generateSQL, resetChat, getCleanSQL, resolveError } from './queryllm.js';
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const runQuery = (sql) => {
  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

app.post('/api/query', async (req, res) => {
  const { prompt, reset } = req.body;

  if (reset) resetChat();

  try {
    console.log(prompt, reset);

    // Generate initial SQL query
    const sql = await generateSQL(prompt);
    let cleanSQL = await getCleanSQL(sql);
    
    try {
      const rows = await runQuery(cleanSQL);
      console.log('rows in server.js', rows);
      res.json({ sql: cleanSQL, rows: rows });
    } catch (err) {
      console.log('SQL Error, attempting to fix:', err);
      
      try {
        const newQuery = await getCleanSQL(sql, err);
        console.log('New Query:', newQuery);
        
        const rows = await runQuery(newQuery);
        res.json({ sql: newQuery, rows: rows });
      } catch (secondErr) {
        console.log('Failed with second query attempt:', secondErr);
        res.status(400).json({ 
          error: 'SQL Error', 
          message: secondErr.message,
          originalSql: cleanSQL 
        });
      }
    }
  } catch (err) {
    console.error('Failed to process prompt:', err);
    res.status(500).json({ 
      error: 'Failed to process prompt.', 
      message: err.message 
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
