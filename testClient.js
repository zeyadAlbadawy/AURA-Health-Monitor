const { io } = require('socket.io-client');

// Connect to backend
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Test client connected, id:', socket.id);

  // Send a test vitals message
  socket.emit('test', {
    user_id: 'user123',
    timestamp: Date.now(),
    data: {
      heartRate: 140,
      sp02: 100,
      temp: 38,
      'Walking or Running': 0,
    },
  });
});

socket.on('connect_error', (err) => {
  console.log('Connection error:', err.message);
});

socket.on('disconnect', () => {
  console.log('Test client disconnected');
});

socket.on('test response', (alert) => {
  console.log('Response from DS:', alert);
});
