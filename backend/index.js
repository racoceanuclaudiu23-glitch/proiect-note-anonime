// index.js - backend pentru aplicatia de note anonime

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// 1. Middleware de baza
// - cors pentru acces din frontend
// - express.json pentru body in format JSON
app.use(cors());
app.use(express.json());

// 2. Conexiune la baza de date SQLite
// Fisierul bazei de date se numeste note.db si este in folderul backend
const DB_FILE = path.join(__dirname, 'note.db');

const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error('Eroare la conectarea la baza de date:', err.message);
    } else {
        console.log('Conectat la baza de date SQLite');
    }
});

// 3. Creare tabele (users si note) daca nu exista
db.serialize(() => {
    // Tabela users pentru utilizatori (profesori si studenti)
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            rol TEXT NOT NULL CHECK (rol IN ('profesor', 'student')),
            creat_la TEXT NOT NULL DEFAULT (datetime('now'))
        )
    `, (err) => {
        if (err) {
            console.error('Eroare la crearea tabelei users:', err.message);
        } else {
            console.log('Tabela users este pregatita');
        }
    });

    // Tabela note pentru notele date de profesori
    db.run(`
        CREATE TABLE IF NOT EXISTS note (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            valoare REAL NOT NULL,
            comentariu TEXT,
            profesor_id TEXT NOT NULL,
            student_id TEXT NOT NULL,
            data TEXT NOT NULL DEFAULT (datetime('now'))
        )
    `, (err) => {
        if (err) {
            console.error('Eroare la crearea tabelei note:', err.message);
        } else {
            console.log('Tabela note este pregatita');
        }
    });
});

// 4. Endpoint simplu pentru test (health check)
// Se poate testa in browser la /api/health
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Backend note anonime este pornit'
    });
});

// 5. Endpoint GET pentru inserarea unei note demo
// Folosit doar pentru testare rapida
app.get('/api/note/demo', (req, res) => {
    const valoare = 8.75;
    const comentariu = 'Nota demo inserata automat';
    const profesorId = 'prof_demo';
    const studentId  = 'student_demo';

    const sql = `
        INSERT INTO note (valoare, comentariu, profesor_id, student_id)
        VALUES (?, ?, ?, ?)
    `;

    db.run(sql, [valoare, comentariu, profesorId, studentId], function (err) {
        if (err) {
            console.error('Eroare la inserarea notei demo:', err.message);
            return res.status(500).json({ error: 'Eroare la inserarea notei demo' });
        }

        res.json({
            message: 'Nota demo a fost inserata',
            nota: {
                id: this.lastID,
                valoare,
                comentariu,
                profesor_id: profesorId,
                student_id: studentId,
                data: new Date().toISOString()
            }
        });
    });
});

// 6. Endpoint POST pentru adaugarea unei note reale
// Frontend-ul trimite un obiect JSON cu profesor_id, student_id, valoare, comentariu
app.post('/api/note', (req, res) => {
    console.log('Cerere POST /api/note, body:', req.body);

    const { profesor_id, student_id, valoare, comentariu } = req.body;

    // Verificari simple pentru datele primite
    const valoareNum = parseFloat(valoare);
    if (!profesor_id || !student_id || isNaN(valoareNum)) {
        console.error('Date invalide primite pentru nota');
        return res.status(400).json({ error: 'Date invalide pentru nota' });
    }

    const sql = `
        INSERT INTO note (valoare, comentariu, profesor_id, student_id)
        VALUES (?, ?, ?, ?)
    `;

    db.run(sql, [valoareNum, comentariu || null, profesor_id, student_id], function (err) {
        if (err) {
            console.error('Eroare la inserarea notei:', err.message);
            return res.status(500).json({ error: 'Eroare la inserarea notei' });
        }

        const notaSalvata = {
            id: this.lastID,
            valoare: valoareNum,
            comentariu: comentariu || null,
            profesor_id,
            student_id,
            data: new Date().toISOString()
        };

        console.log('Nota salvata:', notaSalvata);

        res.json({
            message: 'Nota a fost salvata cu succes',
            nota: notaSalvata
        });
    });
});

// 7. Endpoint GET pentru afisarea tuturor notelor
// Se foloseste la lista de note din frontend
app.get('/api/note', (req, res) => {
    const sql = `
        SELECT id, valoare, comentariu, profesor_id, student_id, data
        FROM note
        ORDER BY datetime(data) DESC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Eroare la citirea notelor:', err.message);
            return res.status(500).json({ error: 'Eroare la citirea notelor' });
        }

        res.json({
            total: rows.length,
            note: rows
        });
    });
});

// 8. Pornire server pe portul 3000
app.listen(PORT, () => {
    console.log('Serverul ruleaza pe http://localhost:' + PORT);
});
