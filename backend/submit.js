import { google } from 'googleapis';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const credsPath  = path.join(__dirname, 'service-account.json'); // ← paste JSON here

/* configure sheets client once */
const auth  = new google.auth.GoogleAuth({
  keyFile: credsPath,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

/* your spreadsheet ID (from its URL) */
const SPREADSHEET_ID = '1kmEKzaM4J1FSZq9OASmVqcR2bbi8yGoJgRI7v8-NYxM';
const RANGE          = 'Submissions!A:C';   // tab + columns

export async function appendRow(team, show) {
  const values = [[new Date().toISOString(), team, show]];
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: RANGE,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values }
  });
}


