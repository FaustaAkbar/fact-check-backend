# 📖 Fact-Check Backend

Backend sederhana untuk memeriksa apakah sebuah berita merupakan
**FAKTA** atau **HOAX** menggunakan model dari **Hugging Face**.\
Mendukung input berupa **string teks** maupun **file** (.txt, .pdf,
.docx, .doc).

---

## 🚀 Setup Project

### 1. Clone Repository

```bash
git clone https://github.com/your-repo/fact-check-backend.git
cd fact-check-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Konfigurasi Environment

Buat file `.env` berdasarkan `.env.example`

```env
PORT=3000
ML_SERVICE_URL=https://api-inference.huggingface.co/models/<username>/<model>
HF_API_KEY=hf_xxxYOURTOKENxxx
MOCK_MODE=true
```

- `PORT` → port server backend (default 3000)\
- `ML_SERVICE_URL` → endpoint model di Hugging Face\
- `HF_API_KEY` → Hugging Face access token\
- `MOCK_MODE` → `true` jika hanya ingin menggunakan data dummy (tanpa
  panggil Hugging Face)

### 4. Run Server

```bash
npm run dev   # dengan nodemon (hot reload)
# atau
npm start     # biasa
```

Server berjalan di:

    http://localhost:3000

---

## 📌 API Endpoints

### 1. **Submit Berita (String)**

    POST /api/submissions/text

**Headers**

    Content-Type: application/json

**Body**

```json
{
  "text": "Vaksin Covid-19 aman digunakan"
}
```

**Response (FAKTA)**

```json
{
  "label": "FAKTA",
  "presentaseKemiripan": 90,
  "beritaSebenarnya": "Fakta sesuai dengan berita yang disubmit"
}
```

**Response (HOAX)**

```json
{
  "label": "HOAX",
  "presentaseKemiripan": 82,
  "beritaSebenarnya": "Fakta: tidak ada bukti kopi bisa menyembuhkan Covid-19"
}
```

---

### 2. **Submit Berita (File)**

    POST /api/submissions/file

**Headers**

    Content-Type: multipart/form-data

**Body (form-data)**\

- Key: `file`\
- Value: upload file (`.txt`, `.pdf`, `.docx`, `.doc`)

**Contoh cURL**

```bash
curl -X POST http://localhost:3000/api/submissions/file   -H "Content-Type: multipart/form-data"   -F "file=@/path/to/berita.pdf"
```

**Response (FAKTA)**

```json
{
  "label": "FAKTA",
  "presentaseKemiripan": 88,
  "beritaSebenarnya": "Fakta sesuai dengan berita yang disubmit"
}
```

**Response (HOAX)**

```json
{
  "label": "HOAX",
  "presentaseKemiripan": 76,
  "beritaSebenarnya": "Fakta: Vaksin Covid-19 aman dan efektif, klaim sebaliknya adalah hoax"
}
```

---

## ⚠️ Error Response

- **400 Bad Request**

```json
{ "error": "file is required" }
```

- **500 Internal Server Error**

```json
{
  "error": "Failed to check text",
  "details": "connection timeout"
}
```

---

## 📋 Response Format

---

Field Type Keterangan

---

`label` string `"FAKTA"` atau `"HOAX"`

`presentaseKemiripan` number Persentase kemiripan (0--100)

`beritaSebenarnya` string Penjelasan atau fakta referensi terkait berita
yang disubmit user

---

---

## 👨‍💻 Development Notes

- Project pakai **Express.js** dengan **ES Modules**\
- Input bisa berupa **text** atau **file**\
- Folder `uploads/` digunakan sementara untuk menyimpan file sebelum
  diproses\
- Jika tidak ingin menyimpan file, bisa hapus setelah diproses (kode
  sudah ada `fs.unlink`)

---
