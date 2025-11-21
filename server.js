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
  // Assign a unique ID
  const id = Date.now() + Math.random();
  players[id] = { x: 0, y: 0, z: 0 };

  // Send initial info about existing players to the new client
  ws.send(JSON.stringify({ type: 'init', id, players }));

  ws.on('message', (message) => {
    // Expect JSON with position updates
    const data = JSON.parse(message);
    if (data.type === 'update') {
      players[id] = data.position;

      // Broadcast this update to all other players
      wss.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: 'update', id, position: data.position }));
        }
      });
    }
  });

  ws.on('close', () => {
    delete players[id];
    // Notify all clients this player disconnected
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'remove', id }));
      }
    });
  });
});
