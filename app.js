// app.js
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const app = express();
const PORT = 3000;

// Ensure the database directory exists
const dbPath = './database/catalog.db';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Database setup
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        db.run(`CREATE TABLE IF NOT EXISTS catalog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            style TEXT NOT NULL,
            upc TEXT NOT NULL,
            clr_desc TEXT NOT NULL,
            size TEXT NOT NULL,
            style_col_size TEXT NOT NULL
        )`, (err) => {
            if (err) {
                console.error('Error creating table ' + err.message);
            }
        });
    }
});

// Middleware setup
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));

// Routes
const indexRouter = require('./routes/index');
const catalogRouter = require('./routes/catalog');

app.use('/', indexRouter);
app.use('/catalog', catalogRouter);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
