// backend/paypal.js
import fetch from 'node-fetch';
const { PAYPAL_CLIENT, PAYPAL_SECRET } = process.env;

const BASE = 'https://api-m.sandbox.paypal.com';  // use api-m.paypal.com for live

async function getAccessToken() {
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
    auth: { user: PAYPAL_CLIENT, pass: PAYPAL_SECRET }
  });
  const data = await res.json();
  return data.access_token;
}

export async function captureOrder(orderId) {
  const token = await getAccessToken();
  const res   = await fetch(`${BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Capture failed');
  return res.json();          // contains payer info, amounts, etc.
}
