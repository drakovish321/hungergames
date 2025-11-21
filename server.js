​// server.js
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (your index.html)
app.use(express.static(path.join(__dirname)));

// Run server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
