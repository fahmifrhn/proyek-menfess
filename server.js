// ---------------------------------------------
// 1. Impor dan Konfigurasi
// ---------------------------------------------
const express = require('express');
const path = require('path');
const mongoose = require('mongoose'); // Impor Mongoose
require('dotenv').config(); // Muat variabel dari .env

const app = express();
const PORT = process.env.PORT || 3000; // Siap untuk Render/Railway

// Ambil URL DB dari file .env
const DATABASE_URL = process.env.DATABASE_URL;

// Pengaturan Moderasi (SAMA)
const ADMIN_PASSWORD = 'adminrahasia123';
const BAD_WORDS = ['kasar1', 'jelek', 'bodoh', 'anjing', 'babi'];
function filterText(text) {
    let filteredText = text;
    for (const word of BAD_WORDS) {
        const regex = new RegExp(word, 'gi');
        filteredText = filteredText.replace(regex, '***');
    }
    return filteredText;
}

// ---------------------------------------------
// 2. Koneksi ke Database MongoDB
// ---------------------------------------------
mongoose.connect(DATABASE_URL)
    .then(() => console.log('Berhasil terhubung ke MongoDB Atlas'))
    .catch(err => console.error('Gagal terhubung ke MongoDB:', err));

// ---------------------------------------------
// 3. Buat Skema (Struktur Data)
// ---------------------------------------------
const messageSchema = new mongoose.Schema({
    text: String,
    category: String,
    sender: String,
    time: String,
    likes: { type: Number, default: 0 },
});

const Message = mongoose.model('Message', messageSchema);

// ---------------------------------------------
// 4. Middleware (SAMA)
// ---------------------------------------------
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------
// 5. API Endpoints
// ---------------------------------------------

// GET /api/messages (MENGAMBIL SEMUA PESAN)
app.get('/api/messages', async (req, res) => {
    try {
        const { sort } = req.query;
        let sortQuery = {};

        if (sort === 'popular') {
            sortQuery = { likes: -1 }; // -1 = descending (terbanyak)
        } else {
            sortQuery = { _id: -1 }; // -1 = descending (terbaru)
        }

        const messages = await Message.find().sort(sortQuery);
        res.json(messages);

    } catch (err) {
        res.status(500).json({ error: 'Gagal mengambil pesan dari database.' });
    }
});

// GET /api/messages/:id (MENGAMBIL SATU PESAN)
app.get('/api/messages/:id', async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (message) {
            res.json(message);
        } else {
            res.status(404).json({ error: 'Cerita tidak ditemukan.' });
        }
    } catch (err) {
        res.status(500).json({ error: 'ID tidak valid atau error server.' });
    }
});

// POST /api/messages (MEMBUAT PESAN BARU - DIPERBARUI)
app.post('/api/messages', async (req, res) => {
    try {
        const { text, category, sender } = req.body;
        if (!text || text.trim() === '' || !category || category.trim() === '') {
            return res.status(400).json({ error: 'Pesan dan kategori tidak boleh kosong.' });
        }

        const filteredText = filterText(text);
        const finalSender = (sender && sender.trim() !== '') ? filterText(sender) : "Anonim";

        const newMessage = new Message({
            text: filteredText,
            category: category,
            sender: finalSender,
            // --- PERBAIKAN TIMEZONE DI SINI ---
            time: new Date().toLocaleString('id-ID', { 
                dateStyle: 'medium', 
                timeStyle: 'short', 
                timeZone: 'Asia/Jakarta' // Paksa ke GMT+7
            }),
            likes: 0
        });

        await newMessage.save();
        res.status(201).json(newMessage);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Gagal menyimpan pesan.' });
    }
});

// POST /api/messages/:id/like (MENAMBAH LIKE)
app.post('/api/messages/:id/like', async (req, res) => {
    try {
        const updatedMessage = await Message.findByIdAndUpdate(
            req.params.id,
            { $inc: { likes: 1 } }, 
            { new: true } 
        );

        if (!updatedMessage) {
            return res.status(404).json({ error: 'Pesan tidak ditemukan.' });
        }
        res.json(updatedMessage);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Gagal memproses like.' });
    }
});

// POST /api/admin/delete (MENGHAPUS PESAN)
app.post('/api/admin/delete', async (req, res) => {
    try {
        const { id, password } = req.body;
        if (password !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Kata sandi admin salah.' });
        }

        const deletedMessage = await Message.findByIdAndDelete(id);

        if (!deletedMessage) {
            return res.status(404).json({ error: 'ID pesan tidak ditemukan.' });
        }

        res.json({ success: true, message: `Pesan ${id} telah dihapus.` });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error internal server.' });
    }
});

// ---------------------------------------------
// 6. Jalankan Server (SAMA)
// ---------------------------------------------
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});

