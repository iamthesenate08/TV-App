// backend/paypal.js

import checkoutNodeJssdk from '@paypal/checkout-server-sdk';

// Load your PayPal credentials directly from environment variables:
const CLIENT_ID     = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error(
    'Missing PayPal credentials. Make sure PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are set in your environment.'
  );
}

// Configure PayPal environment (Sandbox for testing; switch to LiveEnvironment in production)
function environment() {
  return new checkoutNodeJssdk.core.SandboxEnvironment(
    CLIENT_ID,
    CLIENT_SECRET
  );
}

// Create PayPal HTTP client instance with the above environment
function client() {
  return new checkoutNodeJssdk.core.PayPalHttpClient(environment());
}

/**
 * captureOrder
 * ------------
 * Given a PayPal order ID, sends a capture request to PayPal to finalize the payment.
 *
 * @param {string} orderID  — the ID returned by the PayPal Buttons client after approval
 * @returns {Promise<object>}  — the full capture response from PayPal
 * @throws {Error}  — if the capture request fails
 */
export async function captureOrder(orderID) {
  if (!orderID) {
    throw new Error('orderID is required to capture a PayPal order');
  }

  // Build the capture request
  const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderID);
  // Per PayPal SDK docs, you must include an empty body for a capture
  request.requestBody({});

  // Execute the request
  const response = await client().execute(request);

  // You can inspect `response.result` for details, e.g. response.result.status === 'COMPLETED'
  return response.result;
}
