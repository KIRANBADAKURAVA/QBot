import React, { useState } from 'react';
import './App.css';

function App() {
  const [prompt, setPrompt] = useState("Find the matches with the highest aggregate score.");
  const [sql, setSql] = useState("");
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    setResult([]);
    setSql("");
    try {
      const response = await fetch('http://localhost:5000/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, reset: true }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSql(data.sql || "");
      setResult(data.rows || []);
      console.log(data);
    } catch (err) {
      console.error('Error fetching data:', error);
      setError("Something went wrong. Please be a bit more clear with prompt and try again", error.toString());
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  return (
    <div className="container">
      <h2 className="title">🧠 IPL Stats Assistant</h2>

      <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your natural language query..."
        />
        <button type="submit">Submit</button>
      </form>

      {loading && <p className="info">Fetching data...</p>}
      {error && <p className="error">{error}</p>}

      {sql && (
        <div className="card sql-block">
          <h4>Generated SQL Query:</h4>
          <pre>{sql}</pre>
        </div>
      )}

      {result.length > 0 && (
        <div className="card table-wrapper">
          <h4>Result Table:</h4>
          <table>
            <thead>
              <tr>
                {Object.keys(result[0]).map((key) => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((value, idx) => (
                    <td key={idx}>{value}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !sql && !error && result.length === 0 && (
        <p className="info">Enter a prompt and hit submit to see results.</p>
      )}
    </div>
  );
}

export default App;
