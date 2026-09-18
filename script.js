const fs = require('fs/promises');
const { google } = require('googleapis');

async function run() {
  const query = process.argv.slice(2).join(' ').trim();
  if (!query) {
    throw new Error('Uso: node script.js <consulta de Gmail>');
  }

  const tokensStr = await fs.readFile('tmp/gmail_tokens.json', 'utf8');
  const tokens = JSON.parse(tokensStr);
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID || 'dummy',
    process.env.GMAIL_CLIENT_SECRET || 'dummy',
    'http://localhost:3000/api/auth/gmail/callback'
  );
  oauth2Client.setCredentials(tokens);
  
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: query,
  });
  
  if (!res.data.messages || res.data.messages.length === 0) {
    console.log('No messages found');
    return;
  }
  
  const mailId = res.data.messages[0].id;
  console.log('Found mailId:', mailId);
  
  const formData = new FormData();
  formData.append('mailId', mailId);
  
  const extractRes = await fetch('http://localhost:3000/api/extract', {
    method: 'POST',
    body: formData
  });
  
  console.log('Extraction status:', extractRes.status);
  const json = await extractRes.json();
  console.log('Extraction result:', JSON.stringify(json, null, 2));
}
run().catch(console.error);
