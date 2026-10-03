import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { apiRouter } from './server/routes';
import { getDatabase } from './server/db';

dotenv.config();

// Pre-initialize persistent database
getDatabase();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Mount production REST APIs
app.use('/api', apiRouter);

// Vite Middleware for Fullstack React SPA
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`🦅 AGILA Hub Production Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
