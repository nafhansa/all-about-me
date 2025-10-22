// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());              // hapus jika same-origin
app.use(express.json());
app.use(express.static('.')); // serve index.html kalau mau satu origin

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post('/api/nafhan-ai', async (req, res) => {
  try {
    if (!OPENAI_API_KEY) return res.status(500).json({ error: 'API key not set' });

    const { question, profile } = req.body || {};
    if (!question) return res.status(400).json({ error: 'question required' });
    if (!profile)  return res.status(400).json({ error: 'profile required (gabungan teks halaman)' });

    const system = [
      'Kamu adalah asisten AI untuk portfolio Nafhan Shafy Aulia.',
      'Jawab HANYA menggunakan informasi pada bagian "DATA" berikut.',
      'Jika jawabannya tidak ada di DATA, katakan dengan sopan: "Maaf, tidak ada di halaman ini."',
      'Gaya: ringkas, jelas, ramah.'
    ].join(' ');

    const payload = {
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: system + '\n\nDATA:\n' + profile },
        { role: 'user',   content: question }
      ]
    };

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const errTxt = await resp.text();
      return res.status(resp.status).json({ error: errTxt });
    }

    const json = await resp.json();
    const answer = json?.choices?.[0]?.message?.content || 'Maaf, tidak ada jawaban.';
    res.json({ answer });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`AI proxy running on http://localhost:${PORT}`));
