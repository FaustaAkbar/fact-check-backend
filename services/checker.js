import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || '';
const MOCK_MODE = !ML_SERVICE_URL || process.env.MOCK_MODE === 'true';

export async function checkText({ text, id }) {
  if (MOCK_MODE) return mockResult(text);

  const resp = await axios.post(
    ML_SERVICE_URL,
    { id, text, source: 'text' },
    { timeout: 20000 }
  );
  return resp.data;
}

export async function checkFile({ filePath, originalname, id }) {
  if (MOCK_MODE) {
    const text = tryReadSmallFile(filePath);
    return mockResult(text || originalname);
  }
  const form = new FormData();
  form.append('id', id);
  form.append('file', fs.createReadStream(filePath), { filename: originalname });
  const resp = await axios.post(ML_SERVICE_URL, form, {
    headers: form.getHeaders(),
    maxBodyLength: Infinity,
    timeout: 60000
  });
  return resp.data;
}

function tryReadSmallFile(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.txt') return fs.readFileSync(filePath, 'utf8').slice(0, 2000);
  } catch (e) {}
  return null;
}

function mockResult(seedText) {
  const lower = (seedText || '').toLowerCase();
  const label = lower.includes('hoax') || lower.includes('tidak benar')
    ? 'HOAX'
    : (lower.includes('benar') || Math.random() > 0.5) ? 'FAKTA' : 'HOAX';
  const similarity = Math.floor(50 + Math.random() * 50);
  return {
    label,
    similarity,
    matchedArticle: {
      title: label === 'FAKTA'
        ? 'Berita referensi (contoh) — sumber resmi'
        : 'Sumber klaim yang dikontraskan (contoh)',
      url: label === 'FAKTA'
        ? 'https://example.com/referensi'
        : 'https://example.com/klaim'
    },
    details: {
      note: 'Hasil mock (testing). Ganti ML_SERVICE_URL untuk panggil model nyata.'
    }
  };
}
