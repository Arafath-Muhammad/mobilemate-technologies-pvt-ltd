const http = require('http');
const fs = require('fs');
const formidable = require('formidable');
const path = require('path');
const connectDB = require('./db');

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.csv': 'text/csv',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm'
};

// Directory to store uploaded files
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Attempt DB connection, but continue regardless
(async () => {
    try {
        await connectDB();
        console.log('MongoDB connected');
    } catch (e) {
        console.warn('MongoDB connection failed, proceeding without DB:', e.message);
    }

    http.createServer((req, res) => {
    // Handle file upload via POST to /upload
    if (req.method === 'POST' && req.url === '/upload') {
        const form = new formidable.IncomingForm({ uploadDir, keepExtensions: true });
        form.parse(req, (err, fields, files) => {
            if (err) {
                res.writeHead(500);
                res.end('Upload error');
                return;
            }
            // Ensure a file was uploaded
            if (!files.file) {
                res.writeHead(400);
                res.end('No file uploaded');
                return;
            }
            const file = files.file; // Expected field name 'file'
            const oldPath = file.path;
            const newPath = path.join(uploadDir, file.name);
            fs.rename(oldPath, newPath, (err) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Rename error');
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('File uploaded');
            });
        });
        return;
    }
    // Existing static file serving for GET requests
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }
    const ext = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Internal server error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
    }).listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}/`);
    });
})();
