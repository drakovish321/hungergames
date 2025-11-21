const express = require('express');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname)));

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// WebSocket server
const wss = new WebSocket.Server({ server });

// Keep track of connected players
let players = {};

wss.on('connection', (ws) => {
  const id = Date.now() + Math.random().toString(36).substr(2, 9);
  players[id] = { x: 0, y: 0, z: 0 };

  // Send init message with current players
  ws.send(JSON.stringify({ type: 'init', id, players }));

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    if (data.type === 'update') {
      players[id] = data.position;

      // Broadcast to others
      wss.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'update', id, position: data.position }));
        }
      });
    }
  });

  ws.on('close', () => {
    delete players[id];
    // Notify all clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'remove', id }));
      }
    });
  });
});
