// frontend/src/components/RollPurchase.jsx
import React, { useEffect } from 'react';

/**
 * PayPal / Venmo Smart Button for purchasing 3 extra rolls.
 * Mounts exactly once and never unmounts mid‐game, avoiding the
 * “Detected container element removed from DOM” error.
 *
 * Props
 * -----
 * onSuccess: () => void   // callback to grant the extra rolls
 */
export default function RollPurchase({ onSuccess }) {
  useEffect(() => {
    if (!window.paypal) return;

    // Create the Buttons instance once
    const buttons = window.paypal.Buttons({
      style: {
        layout : 'horizontal',
        color  : 'gold',
        tagline: false
      },

      createOrder: (_data, actions) =>
        actions.order.create({
          purchase_units: [
            {
              amount:      { value: '5.00' },
              description: 'Three extra rolls'
            }
          ],
          application_context: {
            shipping_preference: 'NO_SHIPPING'  // skip address collection
          }
        }),

      onApprove: async (_data, actions) => {
        // Capture the order on the client
        const order = await actions.order.capture();

        // Optional: verify server-side
        await fetch('/api/paypal/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderID: order.id })
        }).catch(console.error);

        // Grant the rolls in the UI
        onSuccess();
      },

      onError: err => {
        console.error('PayPal error', err);
        alert('Payment failed, please try again.');
      }
    });

    // Render into our fixed container
    buttons.render('#paypal-roll-btn');

    // Clean up only on final unmount
    return () => {
      buttons.close();
    };
  }, []);  // <-- run once, on mount

  return <div id="paypal-roll-btn" />;
}
