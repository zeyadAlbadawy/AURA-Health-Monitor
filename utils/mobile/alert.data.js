const EventEmitter = require('events'); // class
class AlertEmitter extends EventEmitter {}
const alertEmitter = new AlertEmitter();

// Current alert string
let currentAlert =
  'The alert logic which I will push to mobile app will be implemented here!';

// update the alert
const updateAlert = (newAlert) => {
  currentAlert = newAlert;
  alertEmitter.emit('newAlert', currentAlert);
};

// get current alert
const getAlert = () => currentAlert;

module.exports = { alertEmitter, updateAlert, getAlert };
