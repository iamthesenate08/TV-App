// backend/submit.js
import { google } from 'googleapis';

//
// Load & decode the service account JSON from an env-var (base64-encoded)
//
const raw = process.env.GOOGLE_SERVICE_ACCOUNT_B64;
if (!raw) {
  throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_B64 environment variable');
}
const credentials = JSON.parse(
  Buffer.from(raw, 'base64').toString('utf8')
);

//
// Configure the Google Sheets client
//
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

//
// Your spreadsheet & range
//
const SPREADSHEET_ID = '1kmEKzaM4J1FSZq9OASmVqcR2bbi8yGoJgRI7v8-NYxM'
const RANGE          = 'Submissions!A:C';

//
// Append a row of [ timestamp, team, show ] to the sheet
//
export async function appendRow(team, show) {
  const values = [[ new Date().toISOString(), team, show ]];
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values }
  });
}
