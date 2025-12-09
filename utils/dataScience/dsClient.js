const { io } = require('socket.io-client');

// Connect to Python DS server
const dsSocket = io('http://localhost:5000');

// Log connection
dsSocket.on('connect', () => {
  console.log('Connected to Data Science Server');
});

// Receive alerts/predictions from Python DS
dsSocket.on('prediction Result', (data) => {
  console.log('Received alert from DS:', data);
});

module.exports = dsSocket;
