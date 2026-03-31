const axios = require('axios');
/**
 * Fire-and-forget email via n8n webhook.
 * @param {string} type  - email type (user_registration, FORGOT_PASSWORD, etc.)
 * @param {object} data  - payload fields specific to each type
 */
const sendEmail = (type, data) => {
  const url = process.env.N8N_EMAIL_WEBHOOK;
  console.log(`[n8n email] sending type=${type} to url=${url}`);
  if (!url) return;
  axios.post(url, { type, ...data })
    .then(() => console.log(`[n8n email] SUCCESS type=${type}`))
    .catch((err) => console.error(`[n8n email] ERROR type=${type}:`, err.message));
};

module.exports = { sendEmail };
