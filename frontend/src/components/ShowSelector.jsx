// frontend/src/components/ShowSelector.jsx
import React, { useState } from 'react';

export default function ShowSelector() {
  const [show, setShow]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  async function pickRandom() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/random-show');
      if (!res.ok) throw new Error(res.statusText);
      const { show } = await res.json();
      setShow(show);
    } catch (e) {
      setError('Couldn’t load a show. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col items-center space-y-4">
      <button
        onClick={pickRandom}
        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition"
        disabled={loading}
      >
        {loading ? 'Loading…' : 'Pick a Random Show'}
      </button>

      {error && (
        <p className="text-red-500">{error}</p>
      )}

      {show && !loading && (
        <h2 className="mt-4 text-3xl font-bold text-center">
          {show}
        </h2>
      )}
    </div>
  );
}
