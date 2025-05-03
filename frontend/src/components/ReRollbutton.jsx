import React, { useState } from 'react';

export default function ReRollButton() {
  const [canReroll, setCanReroll] = useState(true);

  function handleReroll() {
    if (!canReroll) {
      alert('Reroll locked – payment integration to be added!');
      return;
    }
    // This would trigger ShowSelector.pickRandom via props or context
    // For now, just simulate:
    window.dispatchEvent(new Event('reroll'));
  }

  return (
    <button
      className={`mt-2 px-5 py-2 rounded-lg transition ${
        canReroll
          ? 'bg-green-600 hover:bg-green-700 text-white'
          : 'bg-gray-400 text-gray-200 cursor-not-allowed'
      }`}
      onClick={handleReroll}
    >
      {canReroll ? 'Re‑roll' : 'Locked'}
    </button>
  );
}
