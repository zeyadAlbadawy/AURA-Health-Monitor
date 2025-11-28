const crypto = require('crypto');
const hmacVerification = function (query, hmacSecret) {
  const requiredFields = [
    'amount_cents',
    'created_at',
    'currency',
    'error_occured',
    'has_parent_transaction',
    'id',
    'integration_id',
    'is_3d_secure',
    'is_auth',
    'is_capture',
    'is_refunded',
    'is_standalone_payment',
    'is_voided',
    'order',
    'owner',
    'pending',
    'source_data.pan',
    'source_data.sub_type',
    'source_data.type',
    'success',
  ];

  const sortedFields = requiredFields.sort();
  let concatenatedHmac = '';
  for (const key of sortedFields) concatenatedHmac += query[key];
  const calculatedHmac = crypto
    .createHmac('sha512', hmacSecret)
    .update(concatenatedHmac)
    .digest('hex');

  return calculatedHmac === query.hmac;
};

module.exports = { hmacVerification };
