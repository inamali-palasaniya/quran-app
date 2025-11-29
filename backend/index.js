// backend/index.js
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Quran App Backend is running');
});

// Routes

// --- Auth ---
app.post('/auth/register', async (req, res) => {
    try {
        const { email, password, name, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role || 'user'
            }
        });
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        const { password: _, ...userWithoutPassword } = user;
        res.json({ token, user: userWithoutPassword });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- Kitabs ---
app.get('/kitabs', async (req, res) => {
    const kitabs = await prisma.kitab.findMany();
    res.json(kitabs);
});

app.get('/kitabs/:id', async (req, res) => {
    const kitab = await prisma.kitab.findUnique({ where: { id: Number(req.params.id) } });
    res.json(kitab);
});

app.post('/kitabs', async (req, res) => {
    try {
        const kitab = await prisma.kitab.create({ data: req.body });
        res.json(kitab);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/kitabs/:id', async (req, res) => {
    try {
        const kitab = await prisma.kitab.update({
            where: { id: Number(req.params.id) },
            data: req.body
        });
        res.json(kitab);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/kitabs/:id', async (req, res) => {
    try {
        await prisma.kitab.delete({ where: { id: Number(req.params.id) } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Surahs ---
app.get('/surahs', async (req, res) => {
    const { kitabId } = req.query;
    const where = kitabId ? { kitabId: Number(kitabId) } : {};
    const surahs = await prisma.surah.findMany({
        where,
        orderBy: { surahNumber: 'asc' }
    });
    res.json(surahs);
});

app.get('/surahs/:id', async (req, res) => {
    const surah = await prisma.surah.findUnique({
        where: { id: Number(req.params.id) },
        include: { ayahs: { orderBy: { ayahNumber: 'asc' }, include: { translation: true, tafsirs: true } } }
    });
    res.json(surah);
});

app.post('/surahs', async (req, res) => {
    try {
        const surah = await prisma.surah.create({ data: req.body });
        res.json(surah);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/surahs/:id', async (req, res) => {
    try {
        const surah = await prisma.surah.update({
            where: { id: Number(req.params.id) },
            data: req.body
        });
        res.json(surah);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/surahs/:id', async (req, res) => {
    try {
        await prisma.surah.delete({ where: { id: Number(req.params.id) } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Ayahs ---
app.get('/ayahs', async (req, res) => {
    const { surahId } = req.query;
    const where = surahId ? { surahId: Number(surahId) } : {};
    const ayahs = await prisma.ayah.findMany({
        where,
        orderBy: { ayahNumber: 'asc' },
        include: { translation: true, tafsirs: true }
    });
    res.json(ayahs);
});

app.get('/ayahs/:id', async (req, res) => {
    const ayah = await prisma.ayah.findUnique({
        where: { id: Number(req.params.id) },
        include: { translation: true, tafsirs: true }
    });
    res.json(ayah);
});

app.post('/ayahs', async (req, res) => {
    try {
        const { translation, ...ayahData } = req.body;
        // Handle translation if provided
        const data = {
            ...ayahData,
            translation: translation ? {
                create: {
                    text: translation,
                    language: 'en', // Default
                    translator: 'Default'
                }
            } : undefined
        };

        const ayah = await prisma.ayah.create({ data });
        res.json(ayah);
    } catch (e) {
        console.error('Create Ayah Error:', e);
        res.status(500).json({ error: e.message });
    }
});

app.put('/ayahs/:id', async (req, res) => {
    try {
        const { translation, ...ayahData } = req.body;

        // First update the Ayah scalar fields
        const ayah = await prisma.ayah.update({
            where: { id: Number(req.params.id) },
            data: ayahData
        });

        // If translation is provided, we need to update or create it
        // For simplicity, we'll delete existing and create new, or find and update.
        // Let's try to find existing translation for this Ayah
        if (translation) {
            const existingTranslation = await prisma.translation.findFirst({
                where: { ayahId: ayah.id }
            });

            if (existingTranslation) {
                await prisma.translation.update({
                    where: { id: existingTranslation.id },
                    data: { text: translation }
                });
            } else {
                await prisma.translation.create({
                    data: {
                        ayahId: ayah.id,
                        text: translation,
                        language: 'en',
                        translator: 'Default'
                    }
                });
            }
        }

        res.json(ayah);
    } catch (e) {
        console.error('Update Ayah Error:', e);
        res.status(500).json({ error: e.message });
    }
});

app.delete('/ayahs/:id', async (req, res) => {
    try {
        await prisma.ayah.delete({ where: { id: Number(req.params.id) } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- Tafseer ---
app.post('/tafsir', async (req, res) => {
    const { ayahId, scholar, text } = req.body;
    try {
        const tafsir = await prisma.tafsir.create({
            data: {
                ayahId: Number(ayahId),
                scholar,
                text
            }
        });
        res.json(tafsir);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save tafsir' });
    }
});

app.put('/tafsir/:id', async (req, res) => {
    try {
        const tafsir = await prisma.tafsir.update({
            where: { id: Number(req.params.id) },
            data: req.body
        });
        res.json(tafsir);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/tafsir/:id', async (req, res) => {
    try {
        await prisma.tafsir.delete({ where: { id: Number(req.params.id) } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 8000;

// Only listen if not in production (Vercel handles listening)
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Backend running on http://localhost:${PORT}`);
    });
}

module.exports = app;
// Comment out app.listen if you want, or keep it for local dev
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log('...'));
}