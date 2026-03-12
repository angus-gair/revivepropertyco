import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// Serve static files from the 'dist' directory created by Vite build
app.use(express.static(path.join(__dirname, 'dist')));

// Support client-side routing by serving index.html for all non-static requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Bind to 0.0.0.0 as required by Cloud Run
app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});