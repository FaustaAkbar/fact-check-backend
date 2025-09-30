import express from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { checkText, checkFile } from '../services/checker.js';

const router = express.Router();

// storage config for multer
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname);
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.doc', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) return cb(new Error('Only pdf/doc/docx/txt allowed'));
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

// In-memory store for demo
const submissions = new Map(); // id -> object

function makeId() {
  return 's_' + Math.random().toString(36).slice(2, 10);
}

// POST text submission
router.post(
  '/text',
  body('text').isString().isLength({ min: 10 }).withMessage('text is required (min 10 chars)'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { text, submitter } = req.body;
    const id = makeId();
    const createdAt = new Date().toISOString();
    try {
      const result = await checkText({ text, id });
      const record = { id, type: 'text', text, submitter: submitter || null, result, createdAt };
      submissions.set(id, record);
      return res.status(201).json(record);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to check text', details: err.message });
    }
  }
);

// POST file submission
router.post('/file', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file is required' });

  const { originalname, filename, path: filepath, mimetype } = req.file;
  const id = makeId();
  const createdAt = new Date().toISOString();
  try {
    const result = await checkFile({ filePath: filepath, originalname, id });
    const record = {
      id, type: 'file', originalname, filename, filepath: `/uploads/${filename}`,
      mimetype, result, createdAt
    };
    submissions.set(id, record);
    return res.status(201).json(record);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to check file', details: err.message });
  }
});

// list submissions
router.get('/', (req, res) => {
  const limit = Math.min(100, parseInt(req.query.limit || '50', 10));
  const arr = Array.from(submissions.values())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
  res.json({ count: submissions.size, items: arr });
});

// detail submission
router.get('/:id', (req, res) => {
  const id = req.params.id;
  if (!submissions.has(id)) return res.status(404).json({ error: 'not found' });
  res.json(submissions.get(id));
});

export default router;
