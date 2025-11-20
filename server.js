// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files (your HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// Store connected clients
const clients = new Map();

wss.on('connection', (ws) => {
  const id = generateUniqueId();
  clients.set(id, ws);
  console.log(`Player ${id} connected`);

  // Send assigned ID to the client
  ws.send(JSON.stringify({ type: 'assign_id', id }));

  // Notify others
  broadcast({ type: 'player_join', id });

  ws.on('message', (message) => {
    const msg = JSON.parse(message);
    handleMessage(id, msg);
  });

  ws.on('close', () => {
    clients.delete(id);
    broadcast({ type: 'player_leave', id });
    console.log(`Player ${id} disconnected`);
  });
});

function handleMessage(id, msg) {
  if (msg.type === 'player_update') {
    // Broadcast position/health updates
    broadcast({ type: 'player_update', id, data: msg.data });
  } else if (msg.type === 'attack') {
    // Broadcast attack event
    broadcast({ type: 'attack', id });
  }
}

function broadcast(data) {
  const message = JSON.stringify(data);
  for (const [id, client] of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function generateUniqueId() {
  return Math.random().toString(36).substr(2, 9);
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
