import express from 'express';
import cors from 'cors';
import db from './db.js';
import { generateSQL, resetChat , getcleanSQL} from './queryllm.js';
import dotenv from "dotenv";

dotenv.config();



const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/query', async (req, res) => {
  //console.log("Received request");
 const { prompt, reset } = req.body;
  //console.log(prompt, reset);

  if (reset) resetChat();

  try {
    console.log(prompt, reset);

    const sql = await generateSQL(prompt);
   // console.log('in server.js',sql);

    let cleanSQL = await getcleanSQL(sql);
  
    console.log(cleanSQL);

    db.all(cleanSQL, [], (err, rows) => {
      if (err) return res.status(400).json({ error: err.message });
      console.log('rows in server.js',rows);
      res.json({ sql: cleanSQL, rows: rows });
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process prompt.' });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
