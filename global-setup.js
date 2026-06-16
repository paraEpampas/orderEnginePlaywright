const path = require('path');

const envFile = `.env.${process.env.ENV || 'local'}`;
require('dotenv').config({ path: path.resolve(__dirname, envFile) });

async function globalSetup() {
  console.log(`Order Engine tests — ENV: ${process.env.ENV || 'local'}, BASE_URL: ${process.env.BASE_URL}`);
}

module.exports = globalSetup;
