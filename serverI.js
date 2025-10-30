const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const app = express();
const port = 3000;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

app.use(express.static('public')); 

app.post('/upload', upload.single('file'), (req, res) => {
    res.send('Archivo subido Correctamente');
});

app.get('/uploads', (req, res) => {
    const uploadDir = path.join(__dirname, 'uploads');
    fs.readdir(uploadDir, (err, files) => {
        if (err) return res.send('Error al listar archivos.');

        let html = `
        <html>
        <head>
            <title>Directorio de Uploads</title>
            <style>
                body { font-family: Arial; background: #f4f4f4; padding: 20px; }
                h1 { color: #333; }
                ul { list-style: none; padding: 0; }
                li { margin: 8px 0; }
                a { text-decoration: none; color: #007bff; }
                a:hover { text-decoration: underline; }
            </style>
        </head>
        <body>
            <h1>Archivos en Uploads</h1>
            <ul>
        `;

        files.forEach(file => {
            const safeName = encodeURIComponent(file);
            html += `<li><a href="/uploads/${safeName}">${file}</a></li>`;
        });

        html += `
            </ul>
        </body>
        </html>
        `;

        res.send(html);
    });
});

app.get('/uploads/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);

    if (filePath.endsWith('.py')) {
        exec(`python "${filePath}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error al ejecutar: ${error.message}`);
                return res.send('Error al ejecutar el archivo.');
            }
            console.log(`Salida: ${stdout}`);
            res.send('Archivo ejecutado.');
        });
    } else {
        res.sendFile(filePath);
    }
});

app.listen(port, () => {
    console.log(`Servidor vulnerable corriendo en http://localhost:${port}`);
});
