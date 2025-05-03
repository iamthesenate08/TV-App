import React from 'react';
import FlipRoller from './components/FlipRoller';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100">
      {/* header */}
      <header className="p-6 text-white bg-gradient-to-r from-indigo-500 to-purple-600">
        <h1 className="text-3xl font-extrabold">Choose a Show</h1>
      </header>

      {/* main — flexbox centers its child */}
      <main className="flex-1 flex items-center justify-center px-4">
        <FlipRoller />
      </main>

      {/* footer */}
      <footer className="py-4 text-center text-sm bg-gray-800">
        © 2025 Cinemadrome
      </footer>
    </div>
  );
}
