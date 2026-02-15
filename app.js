const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

// Initialize SQLite database
const db = new sqlite3.Database('./data/visitors.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    // Create table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS visitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address TEXT UNIQUE,
      visit_count INTEGER DEFAULT 1,
      first_visit DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_visit DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating table:', err);
      }
    });
  }
});

// Main route
app.get('/', (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
  
  // Insert or update visitor
  db.run(
    `INSERT INTO visitors (ip_address, visit_count, last_visit) 
     VALUES (?, 1, CURRENT_TIMESTAMP)
     ON CONFLICT(ip_address) 
     DO UPDATE SET visit_count = visit_count + 1, last_visit = CURRENT_TIMESTAMP`,
    [ip],
    function(err) {
      if (err) {
        console.error('Error recording visit:', err);
      }
    }
  );
  
  // Fetch all visitors
  db.all('SELECT * FROM visitors ORDER BY last_visit DESC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching visitors:', err);
      res.status(500).send('Error fetching data');
      return;
    }
    
    const uniqueVisitors = rows.length;
    const totalVisits = rows.reduce((sum, row) => sum + row.visit_count, 0);
    
    // Generate HTML response
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Visitor Tracker</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
          }
          
          .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
          }
          
          .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
          }
          
          .your-ip {
            background: rgba(255,255,255,0.2);
            padding: 15px;
            margin: 20px 30px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
            font-size: 1.2em;
          }
          
          .ip-address {
            font-family: 'Courier New', monospace;
            background: rgba(255,255,255,0.3);
            padding: 5px 15px;
            border-radius: 5px;
            margin-left: 10px;
          }
          
          .image-container {
            text-align: center;
            padding: 30px;
            background: #f8f9fa;
          }
          
          .image-container img {
            max-width: 100%;
            height: auto;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          }
          
          .visitors-section {
            padding: 30px;
          }
          
          .visitors-section h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 2em;
          }
          
          .stats {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
            flex-wrap: wrap;
          }
          
          .stat-card {
            flex: 1;
            min-width: 200px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
          }
          
          .stat-card h3 {
            font-size: 2.5em;
            margin-bottom: 5px;
          }
          
          .stat-card p {
            opacity: 0.9;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          }
          
          thead {
            background: #667eea;
            color: white;
          }
          
          th, td {
            padding: 15px;
            text-align: left;
          }
          
          th {
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.85em;
            letter-spacing: 0.5px;
          }
          
          tbody tr {
            border-bottom: 1px solid #eee;
            transition: background 0.2s;
          }
          
          tbody tr:hover {
            background: #f8f9fa;
          }
          
          tbody tr:last-child {
            border-bottom: none;
          }
          
          .ip-cell {
            font-family: 'Courier New', monospace;
            background: #f0f0f0;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 0.9em;
          }
          
          .timestamp {
            color: #666;
            font-size: 0.9em;
          }
          
          @media (max-width: 768px) {
            table {
              font-size: 0.85em;
            }
            
            th, td {
              padding: 10px 8px;
            }
            
            .header h1 {
              font-size: 1.8em;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>👁️ Visitor Tracker</h1>
            <div class="your-ip">
              Your IP: <span class="ip-address">${ip}</span>
            </div>
          </div>
          
          <div class="image-container">
            <img src="https://elab.fon.bg.ac.rs/wp-content/uploads/2020/08/elab-logo.png" alt="Elab Logo">
          </div>
          
          <div class="visitors-section">
            <h2>Visitor Statistics</h2>
            
            <div class="stats">
              <div class="stat-card">
                <h3>${uniqueVisitors}</h3>
                <p>Unique Visitors</p>
              </div>
              <div class="stat-card">
                <h3>${totalVisits}</h3>
                <p>Total Visits</p>
              </div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>IP Address</th>
                  <th>Visit Count</th>
                  <th>First Visit</th>
                  <th>Last Visit</th>
                </tr>
              </thead>
              <tbody>
                ${rows.map((row, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td><span class="ip-cell">${row.ip_address}</span></td>
                    <td>${row.visit_count}</td>
                    <td class="timestamp">${new Date(row.first_visit).toLocaleString()}</td>
                    <td class="timestamp">${new Date(row.last_visit).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </body>
      </html>
    `;
    
    res.send(html);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});