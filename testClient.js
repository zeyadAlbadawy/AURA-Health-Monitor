const { io } = require('socket.io-client');

// Connect to backend
const socket = io('http://localhost:3000');

// sending single data

// socket.on('connect', () => {
//   console.log('Test client connected, id:', socket.id);

//   // Send a test vitals message
//   socket.emit('test', {
//     user_id: 'user123',
//     timestamp: Date.now(),
//     data: {
//       heartRate: 140,
//       sp02: 100,
//       temp: 38,
//       'Walking or Running': 0,
//     },
//   });
// });

// sending continuous data

socket.on('connect', () => {
  console.log('Test client connected, id:', socket.id);

  const userId = 'user123';

  // send vitals every 10 seconds for 2+ minutes
  let count = 0;
  const interval = setInterval(() => {
    const data = {
      user_id: userId,
      timestamp: Date.now(),
      data: {
        heartRate: 125 + Math.floor(Math.random() * 5), // 120 resting , 180 active
        sp02: 90, // 90
        temp: 36.5, // 38
        'Walking or Running': 0, //Math.random() < 0.7 ? 0 : 1,
      },
    };

    console.log('Sending vitals:', data);
    socket.emit('test', data);

    count += 1;
    if (count > 120) {
      // 2 minutes
      clearInterval(interval);
      console.log('Done sending 2-min test data');
    }
  }, 10000);
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
