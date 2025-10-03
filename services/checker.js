import axios from 'axios';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || '';
const HF_API_KEY = process.env.HF_API_KEY || '';
const MOCK_MODE = process.env.MOCK_MODE === 'true' || !ML_SERVICE_URL || !HF_API_KEY;

export async function checkText(text) {
  if (MOCK_MODE) return mockResult(text);

  try {
    const resp = await axios.post(
      ML_SERVICE_URL,
      { inputs: text },
      { headers: { Authorization: `Bearer ${HF_API_KEY}` }, timeout: 30000 }
    );

    const data = resp.data;
    return formatResult(data, text);
  } catch (err) {
    console.error('HF error:', err?.response?.data || err.message);
    throw err;
  }
}

export async function checkFile(filepath, originalname) {
  let text = null;
  try {
    if (!fs.existsSync(filepath)) {
      throw new Error(`File not found: ${filepath}`);
    }
    const ext = path.extname(originalname).toLowerCase();
    if (ext === '.txt') text = fs.readFileSync(filepath, 'utf8');
    else if (ext === '.pdf') {
      const pdfBuffer = fs.readFileSync(filepath);
      const pdfData = await pdfParse(pdfBuffer);
      text = pdfData.text;
    } else if (ext === '.docx' || ext === '.doc') {
      const result = await mammoth.extractRawText({ path: filepath });
      text = result.value;
    }
  } catch (e) {
    console.warn('extract file failed:', e.message);
  }

  if (!text || text.length < 5) text = `File: ${originalname}`;

  return checkText(text);
}

// ---- Format result ----
function formatResult(data, text) {
  // case: model return structured
  if (data.label && data.similarity && data.reference) {
    return {
      label: normalizeLabel(data.label),
      presentaseKemiripan: data.similarity,
      beritaSebenarnya: data.reference
    };
  }

  // case: classification array
  if (Array.isArray(data)) {
    const top = data[0];
    return {
      label: normalizeLabel(top.label),
      presentaseKemiripan: Math.round(top.score * 100),
      beritaSebenarnya: "Referensi dari model tidak tersedia"
    };
  }

  return {
    label: "UNKNOWN",
    presentaseKemiripan: null,
    beritaSebenarnya: "Tidak tersedia"
  };
}

function normalizeLabel(raw) {
  if (!raw) return "UNKNOWN";
  const s = raw.toLowerCase();
  if (s.includes('hoax') || s.includes('fake') || s.includes('false')) return "HOAX";
  if (s.includes('fakta') || s.includes('true') || s.includes('real') || s.includes('fact')) return "FAKTA";
  return raw.toUpperCase();
}

// ---- Mock ----
function mockResult(text) {
  const isHoax = text.toLowerCase().includes("kopi") || text.toLowerCase().includes("hoax");
  return {
    label: isHoax ? "HOAX" : "FAKTA",
    presentaseKemiripan: Math.floor(70 + Math.random() * 25),
    beritaSebenarnya: isHoax
      ? "Fakta: tidak ada bukti kopi bisa menyembuhkan Covid-19"
      : "Fakta sesuai dengan berita yang disubmit"
  };
}
