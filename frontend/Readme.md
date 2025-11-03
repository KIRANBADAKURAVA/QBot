# 🏏 IPL Stats SQL Chatbot

A conversational **IPL statistics assistant** that converts **natural language queries** into **SQL statements**, executes them on a **SQLite IPL dataset**, and returns insightful results — built using **LangChain**, **OpenAI**, **FAISS**, and **Express.js**.

---

## 🚀 Features

- 💬 **Natural Language to SQL** — Ask IPL-related questions in plain English.  
- 🧠 **LangChain SQL Agent** — Automatically builds optimized SQL queries.  
- 🔍 **Semantic Similarity + FAISS** — Finds the most relevant examples and proper nouns (like player or team names).  
- 🧰 **Error Correction** — Automatically detects and repairs invalid SQL queries.  
- ⚡ **Fast API Server** — Built with Express and SQLite.  
- 🧩 **Retrieval-Augmented Generation (RAG)** — Uses vector search for schema-aware query accuracy.  

---

## 🧩 Approach

This project follows a **Retrieval-Augmented Generation (RAG)** based architecture to convert **natural language IPL queries** into **optimized SQL commands**, execute them, and return structured results.

### 1️⃣ Input: Natural Language Query
- The user sends a text prompt like  
  _“Show top 5 batsmen with most sixes in IPL 2019.”_
- The prompt is received through a POST request to `/api/query`.

### 2️⃣ Context Preparation
- The system defines an **IPL database schema context** (table names, columns, relationships).
- This schema acts as a **system prompt** for the LLM so it understands the database structure.

### 3️⃣ Query Generation (LLM)
- The user query is passed to the **Groq LLaMA 3 model** via LangChain.
- The model:
  - Parses intent from natural language.
  - Uses the IPL schema to form a syntactically correct **SQL query**.
  - Ensures only required columns are selected and limits are applied for performance.

### 4️⃣ Query Cleaning and Validation
- The generated SQL is checked using `getCleanSQL()`:
  - If the query is incomplete or invalid, the system refines it automatically.
  - It ensures compliance with the provided schema and fixes syntax issues.

### 5️⃣ Execution on SQLite Database
- The cleaned SQL query is executed on the local **SQLite IPL dataset**.
- The Express.js backend handles query execution securely using parameterized queries.

### 6️⃣ Error Handling & Auto-Correction
- If a SQL error occurs:
  - The system analyzes the error message.
  - It re-prompts the model with error context to **auto-correct the SQL**.
  - The corrected query is re-executed until a valid result is obtained.

### 7️⃣ Response to User
- Once the query executes successfully:
  - The SQL query and its results are sent back as a JSON response.
  - Example:
    ```json
    {
      "sql": "SELECT Player_Name, SUM(Runs_Scored) AS TotalRuns FROM Batsman_Scored ...",
      "rows": [
        { "Player_Name": "Virat Kohli", "TotalRuns": 6411 }
      ]
    }
    ```

### 8️⃣ Optional: Conversation Reset
- The `/api/query` endpoint includes a `reset` flag to clear previous context.
- This allows starting a fresh conversation for unrelated queries.

---

### 🧠 Summary
The workflow combines:
- **RAG (Retrieval-Augmented Generation)** → schema-based reasoning  
- **LLM (Groq LLaMA 3)** → natural language → SQL translation  
- **SQLite Execution Layer** → data retrieval  
- **Error Recovery Loop** → auto-fix invalid queries  

This makes the system both **intelligent** and **robust**, capable of understanding flexible human queries while always maintaining **valid SQL syntax and schema consistency**.


