const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const db = new sqlite3.Database('./database/catalog.db');

const upload = multer({ dest: 'uploads/' });

// Mapping function to standardize sizes
const standardizeSize = (size) => {
    const sizeMapping = {
        'LG': 'L',
        'MD': 'M',
        'SM': 'S',
        'PCS': 'PCS'
    };
    return sizeMapping[size] || size; // Return standardized size if found, else return original size
};

router.get('/upload', (req, res) => {
    res.render('upload');
});

router.post('/upload', upload.single('catalog'), (req, res) => {
    const file = req.file;
    if (file) {
        console.log('File uploaded:', file.path);
        const workbook = xlsx.readFile(file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        console.log('Rows extracted from spreadsheet:', rows);
        rows.slice(1).forEach(row => {
            const style = row[0];
            const upc = row[1];
            const clrDesc = row[2];
            const size = standardizeSize(row[3]);
            const styleColSize = row[4];
            console.log('Inserting row into database:', { style, upc, clrDesc, size, styleColSize });
            db.run('INSERT INTO catalog (style, upc, clr_desc, size, style_col_size) VALUES (?, ?, ?, ?, ?)', [style, upc, clrDesc, size, styleColSize], (err) => {
                if (err) {
                    console.error('Error inserting row:', err.message);
                }
            });
        });
        fs.unlinkSync(file.path); // Remove the file after processing
        res.redirect('/');
    } else {
        res.send('No file uploaded');
    }
});

router.get('/lookup', (req, res) => {
    res.render('lookup');
});

router.post('/lookup', (req, res) => {
    const style = req.body.style;
    const size = req.body.size || ''; // Allow size to be empty
    const clrDesc = req.body.clr_desc || '';
    console.log('Lookup request received:', { style, size, clrDesc });

    // Function to standardize size
    const standardizedSize = size ? standardizeSize(size) : '';
    console.log('Standardized size:', standardizedSize);

    const handleLookup = (stylePattern, colorDesc, standardizedSize, callback) => {
        console.log('Executing handleLookup with:', { stylePattern, colorDesc, standardizedSize });
        db.all('SELECT * FROM catalog WHERE style LIKE ? AND clr_desc = ? AND size LIKE ?', [stylePattern, colorDesc, standardizedSize || '%'], (err, rows) => {
            if (err) {
                console.error('Database error:', err.message);
                res.status(500).send('Database error');
            } else {
                console.log('Lookup results:', rows);
                callback(rows);
            }
        });
    };

    if (!clrDesc && !standardizedSize) {
        // No size and no color provided
        db.all('SELECT DISTINCT clr_desc FROM catalog WHERE style LIKE ?', [`%${style}%`], (err, rows) => {
            if (err) {
                console.error('Database error:', err.message);
                res.status(500).send('Database error');
            } else if (rows.length === 0) {
                console.log('No colors found for style:', style);
                res.render('lookup', { error: 'No match found for the given style' });
            } else if (rows.length > 1) {
                console.log('Multiple colors found for style:', style, 'Colors:', rows);
                res.render('lookup', { promptColor: true, colors: rows.map(row => row.clr_desc), style });
            } else {
                // Only one color found, proceed to fetch all sizes
                const finalClrDesc = rows[0].clr_desc;
                console.log('Single color found:', finalClrDesc);
                db.all('SELECT DISTINCT size FROM catalog WHERE style LIKE ? AND clr_desc = ?', [`%${style}%`, finalClrDesc], (err, rows) => {
                    if (err) {
                        console.error('Database error:', err.message);
                        res.status(500).send('Database error');
                    } else if (rows.length === 1) {
                        console.log('Single style and size found:', rows[0]);
                        res.render('lookup', { style_col_size: rows[0].style_col_size, upc: rows[0].upc });
                    } else {
                        console.log('Multiple sizes found for style:', style, 'and color:', finalClrDesc);
                        res.render('lookup', { promptStyle: true, styles: rows.map(row => row.size), style, clrDesc: finalClrDesc });
                    }
                });
            }
        });
    } else if (!clrDesc) {
        // Size provided but no color
        db.all('SELECT DISTINCT clr_desc FROM catalog WHERE style LIKE ? AND size = ?', [`%${style}%`, standardizedSize], (err, rows) => {
            if (err) {
                console.error('Database error:', err.message);
                res.status(500).send('Database error');
            } else if (rows.length === 0) {
                console.log('No colors found for style:', style, 'and size:', standardizedSize);
                res.render('lookup', { error: 'No match found for the given style and size' });
            } else if (rows.length > 1) {
                console.log('Multiple colors found for style:', style, 'Colors:', rows);
                res.render('lookup', { promptColor: true, colors: rows.map(row => row.clr_desc), style, size });
            } else {
                // Only one color found, proceed with lookup
                const finalClrDesc = rows[0].clr_desc;
                console.log('Single color found:', finalClrDesc);
                handleLookup(`%${style}%`, finalClrDesc, standardizedSize, (rows) => {
                    if (rows.length > 0) {
                        if (rows.length === 1) {
                            console.log('Single match found:', rows[0]);
                            res.render('lookup', { style_col_size: rows[0].style_col_size, upc: rows[0].upc });
                        } else {
                            console.log('Multiple sizes found, prompting user to choose:', rows);
                            res.render('lookup', { promptStyle: true, styles: rows.map(row => row.size), style, clrDesc: finalClrDesc });
                        }
                    } else {
                        console.log('No match found for:', { style, finalClrDesc, size });
                        res.render('lookup', { error: 'No match found' });
                    }
                });
            }
        });
    } else {
        // Color provided, proceed with lookup
        handleLookup(`%${style}%`, clrDesc, standardizedSize, (rows) => {
            if (rows.length > 0) {
                if (rows.length === 1) {
                    console.log('Single match found:', rows[0]);
                    res.render('lookup', { style_col_size: rows[0].style_col_size, upc: rows[0].upc });
                } else if (standardizedSize) {
                    // Only prompt for size if size was not provided initially
                    console.log('Multiple sizes found, prompting user to choose:', rows);
                    res.render('lookup', { promptStyle: true, styles: rows.map(row => row.size), style, clrDesc });
                } else {
                    console.log('Multiple matches found:', rows);
                    res.render('lookup', { promptStyle: true, styles: rows.map(row => row.size), style, clrDesc });
                }
            } else {
                console.log('No match found for:', { style, clrDesc, size });
                res.render('lookup', { error: 'No match found' });
            }
        });
    }
});

router.post('/choose-style', (req, res) => {
    const style = req.body.style;
    const size = req.body.size;
    const clrDesc = req.body.clrDesc;
    console.log('User chose style:', { style, size, clrDesc });

    db.get('SELECT * FROM catalog WHERE style LIKE ? AND clr_desc = ? AND size = ?', [`%${style}%`, clrDesc, size], (err, row) => {
        if (err) {
            console.error('Database error:', err.message);
            res.status(500).send('Database error');
        } else if (row) {
            console.log('Chosen style found:', row);
            res.render('lookup', { style_col_size: row.style_col_size, upc: row.upc });
        } else {
            console.log('No match found for chosen style:', { style, size, clrDesc });
            res.render('lookup', { error: 'No match found for the chosen style' });
        }
    });
});

module.exports = router;