import express from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { checkText, checkFile } from '../services/checker.js';

const router = express.Router();

// setup folder uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// --- POST /submissions/text ---
router.post(
  '/text',
  body('text').isString().isLength({ min: 5 }).withMessage('text is required (min 5 chars)'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { text } = req.body;
      const result = await checkText(text);
      return res.json(result);
    } catch (err) {
      console.error('error check text:', err.message);
      return res.status(500).json({ error: 'Failed to check text', details: err.message });
    }
  }
);

// --- POST /submissions/file ---
router.post('/file', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file is required' });

  try {
    const { path: filepath, originalname } = req.file;
    const result = await checkFile(filepath, originalname);

    // optional: delete file after processed
    fs.unlink(filepath, (err) => {
      if (err) console.warn('delete temp file failed', err.message);
    });

    return res.json(result);
  } catch (err) {
    console.error('error check file:', err.message);
    return res.status(500).json({ error: 'Failed to check file', details: err.message });
  }
});

export default router;
