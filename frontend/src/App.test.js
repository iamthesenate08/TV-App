import React from 'react';
import ReactDOMServer from 'react-dom/server';
import App from './App';

// Ensure the main header renders
test('renders the app header', () => {
  const html = ReactDOMServer.renderToString(<App />);
  expect(html).toMatch(/choose a show/i);
});
