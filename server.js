const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const FileType = require('file-type'); // librería para detectar el tipo real del archivo 
const app = express();
const port = 3000;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase(); // obtener la extensión segura a partir del original
        const safeName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext; //generar nombre único 
        cb(null, safeName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // limitar tamaño máximo del archivo
});

app.use(express.static('public')); 

app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).send('No se envió ningún archivo');

    const filePath = path.join(__dirname, 'uploads', req.file.filename);

    
    // validar el tipo real del archivo leyendo desde disco
    let ft;
    try {
        ft = await FileType.fromFile(filePath);
    } catch (err) {
        // si ocurre un error al leer/detectar, borrar y responder
        try { fs.unlinkSync(filePath); } catch (e) {}
        console.error('Error detectando tipo de archivo:', err);
        return res.status(400).send('No se pudo verificar el archivo');
    }

    if (!ft || ft.mime !== 'application/pdf') {
        // borrar si no es un PDF válido
        try { fs.unlinkSync(filePath); } catch (e) {}
        return res.status(400).send('El archivo no es un PDF válido');
    }

    // comprobar que la extensión original coincide con la extensión detectada
    const detectedExt = ft.ext ? String(ft.ext).toLowerCase() : null; // extensión detectada por file-type
    const origExt = path.extname(req.file.originalname).replace('.', '').toLowerCase(); // extensión enviada por el cliente

    if (!detectedExt || detectedExt !== origExt) {
        // si hay discrepancia, borrar el archivo por seguridad y rechazar
        try { fs.unlinkSync(filePath); } catch (e) {}
        console.log(`Upload rechazado: mismatch extensión (original=${origExt} detected=${detectedExt}) from ${req.ip}`);
        return res.status(400).send('Extensión del archivo no coincide con su contenido');
    }

    res.send('Archivo subido correctamente.');
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
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
