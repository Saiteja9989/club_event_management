const axios = require('axios');

/**
 * Fire-and-forget email via n8n webhook.
 * @param {string} type  - email type (user_registration, FORGOT_PASSWORD, etc.)
 * @param {object} data  - payload fields specific to each type
 */
const sendEmail = (type, data) => {
  const url = process.env.N8N_EMAIL_WEBHOOK;
  if (!url) return;
  axios.post(url, { type, ...data }).catch((err) =>
    console.error(`[n8n email] type=${type} error:`, err.message)
  );
};

module.exports = { sendEmail };
