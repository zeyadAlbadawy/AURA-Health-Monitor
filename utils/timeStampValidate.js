const AppError = require('./appError.js');
const validateTime = (time, next) => {
  // 1. Check if the input is a string (like the ISO format)
  if (typeof time === 'string') {
    dateObject = new Date(time);
  }
  // 2. Otherwise, treat it as a number (like the Unix timestamp)
  else if (typeof time === 'number') {
    // The number 1763411263 is 10 digits, indicating seconds.
    // We convert it to milliseconds for the JavaScript Date object.
    finalTimestamp = time.toString().length === 10 ? time * 1000 : time;
    dateObject = new Date(finalTimestamp);
  } else {
    // Catches null, undefined, or other non-string/non-number types
    return next(
      new AppError(
        'Invalid time format. Time must be a date string or a number.',
        400
      )
    );
  }

  // 3. Final Validation Check
  // The getTime() method returns NaN for an "Invalid Date" object.
  if (isNaN(dateObject.getTime())) {
    return next(
      new AppError(
        'Invalid booking time provided. Please use a valid timestamp or ISO date string.',
        400
      )
    );
  }

  // 4. Use the valid Date object to get the milliseconds timestamp
  finalTimestamp = dateObject.getTime();
  return finalTimestamp;
};

module.exports = { validateTime };
