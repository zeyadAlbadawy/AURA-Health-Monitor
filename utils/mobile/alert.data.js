const EventEmitter = require('events'); // class
class AlertEmitter extends EventEmitter {}
const alertEmitter = new AlertEmitter();

// Current alert string
let currentAlert =
  'The alert logic which I will push to mobile app will be implemented here!!';

let prevAlert = null;
// update the alert

const updateAlert = (newAlert) => {
  if (newAlert && newAlert !== prevAlert) {
    prevAlert = newAlert;
    currentAlert = newAlert;
    console.log('Emitted new alert:', newAlert);
    alertEmitter.emit('newAlert', newAlert);
  }
};

// get current alert
const getAlert = () => currentAlert;

module.exports = { alertEmitter, updateAlert, getAlert };
