import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';

import submissionsRouter from './routes/submissions.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// public folder for stored uploads
app.use('/uploads', express.static('uploads'));

// routes
app.use('/api/submissions', submissionsRouter);

// health
app.get('/health', (req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Fact-check backend listening on ${PORT}`)
);
