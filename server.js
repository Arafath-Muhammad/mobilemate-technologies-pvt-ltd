const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'erp_database.json');
const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Helper to get local IP address
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return 'localhost';
}

// Built-in CORS middleware (eliminates external dependency on 'cors')
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Multipart file upload handler for /upload without external dependencies
app.post('/upload', (req, res, next) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
        return next();
    }

    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    if (!boundaryMatch) {
        return res.status(400).json({ error: 'No multipart boundary found' });
    }
    const boundary = boundaryMatch[1] || boundaryMatch[2];
    const boundaryBuffer = Buffer.from('--' + boundary);

    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
        try {
            const buffer = Buffer.concat(chunks);
            const strHead = buffer.subarray(0, 4096).toString('binary');
            const fileMatch = strHead.match(/filename="([^"]+)"/);
            const rawFilename = fileMatch ? path.basename(fileMatch[1]) : `file_${Date.now()}.bin`;
            const cleanFilename = rawFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
            const finalFilename = cleanFilename.startsWith(Date.now().toString().slice(0, 6))
                ? cleanFilename
                : `${Date.now()}_${cleanFilename}`;

            const headerDelim = Buffer.from('\r\n\r\n');
            const headerEnd = buffer.indexOf(headerDelim);
            if (headerEnd === -1) {
                return res.status(400).json({ error: 'Malformed multipart body' });
            }

            const fileStart = headerEnd + 4;
            const endBoundaryIndex = buffer.indexOf(boundaryBuffer, fileStart);
            const fileEnd = endBoundaryIndex > 2 ? endBoundaryIndex - 2 : buffer.length;
            const fileContent = buffer.subarray(fileStart, fileEnd);

            const filePath = path.join(uploadDir, finalFilename);
            fs.writeFileSync(filePath, fileContent);

            console.log(`[Upload] File saved successfully: ${finalFilename} (${fileContent.length} bytes)`);
            return res.json({
                success: true,
                filename: finalFilename,
                path: `/uploads/${finalFilename}`
            });
        } catch (err) {
            console.error('[Upload] Error saving uploaded file:', err);
            return res.status(500).json({ error: 'Failed to process file upload: ' + err.message });
        }
    });
});

// Middleware for large JSON payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static uploads
app.use('/uploads', express.static(uploadDir));

// Serve root static files
app.use(express.static(__dirname));

// GET /get-ip endpoint
app.get('/get-ip', (req, res) => {
    res.json({ ip: getLocalIP() });
});

// GET /get-data endpoint
app.get('/get-data', (req, res) => {
    if (!fs.existsSync(DB_FILE)) {
        return res.json({});
    }

    fs.readFile(DB_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading database file:", err);
            return res.status(500).json({ error: "Failed to read database file." });
        }
        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData);
        } catch (parseErr) {
            console.error("Error parsing database file:", parseErr);
            res.status(500).json({ error: "Invalid JSON format in database file." });
        }
    });
});

// POST /save-data endpoint
app.post('/save-data', (req, res) => {
    const data = req.body;
    fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8', (err) => {
        if (err) {
            console.error("Error writing database file:", err);
            return res.status(500).json({ error: "Failed to save data." });
        }
        res.json({ success: true, message: "Data saved successfully to erp_database.json" });
    });
});

app.listen(PORT, () => {
    const ip = getLocalIP();
    console.log(`====================================================`);
    console.log(` MobileMate POS Server is running!`);
    console.log(` - Local:   http://localhost:${PORT}`);
    console.log(` - Network: http://${ip}:${PORT}`);
    console.log(`====================================================`);
});
