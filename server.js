// =============================================================
// PLMSys Zero-Dependency High-Performance Centralized Server
// Works directly with: node server.js (NO npm install needed!)
// =============================================================

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'plmsys_database.json');
const DIST_DIR = path.join(__dirname, 'dist');

// MIME types for static asset serving
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

// Database structure in memory
let serverDb = {
  revision: 1,
  lastUpdated: new Date().toISOString(),
  sets: [],
  positions: [],
  plates: [],
  installations: [],
  removals: [],
  production: [],
  replacements: [],
  jobOrders: [
    { id: 'jo-1', jobOrderNumber: '0626-26', description: 'Heavy Production Run Q3', date: new Date().toISOString().split('T')[0], status: 'IN_PROGRESS' },
    { id: 'jo-2', jobOrderNumber: '0712-26', description: 'High Speed Strip Rollout', date: new Date().toISOString().split('T')[0], status: 'OPEN' }
  ],
  auditLogs: [],
  personnel: [
    { id: 'pers-1', fullName: 'Jane Smith', shortName: 'JS', position: 'Supervisor', isAuthorized: true, password: 'password123' },
    { id: 'pers-2', fullName: 'John Doe', shortName: 'JD', position: 'Operator', isAuthorized: false, password: '' },
    { id: 'pers-3', fullName: 'Administrator', shortName: 'Admin', position: 'Admin', isAuthorized: true, password: 'JADB1994' }
  ]
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
}

function persistDatabase() {
  try {
    serverDb.revision = (serverDb.revision || 0) + 1;
    serverDb.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(serverDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('[PLMSys Server] Failed to persist database:', err);
  }
}

function loadOrInitDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.sets)) {
        serverDb = Object.assign({}, serverDb, parsed);
        console.log(`[PLMSys Server] Database loaded from disk (Revision: ${serverDb.revision}, Sets: ${serverDb.sets.length}, Plates: ${serverDb.plates.length})`);
        return;
      }
    }
  } catch (err) {
    console.warn('[PLMSys Server] Could not read existing database, generating initial data:', err);
  }

  // Generate initial factory sets
  const todayStr = new Date().toISOString().split('T')[0];
  const nowObj = new Date();
  const mm = String(nowObj.getMonth() + 1).padStart(2, '0');
  const dd = String(nowObj.getDate()).padStart(2, '0');
  const yy = String(nowObj.getFullYear()).slice(-2);
  const dateFormatted = `${mm}${dd}${yy}`;

  for (let i = 1; i <= 2; i++) {
    const setId = `set-${i}`;
    const shortCode = `S0${i}`;
    serverDb.sets.push({
      id: setId,
      setNumber: i,
      displayName: `SET 0${i}`,
      shortCode,
      status: 'ACTIVE',
      currentTotalCycle: 0,
      initialCycle: 0,
      todayProduction: 0,
      lastProductionDate: todayStr,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    for (let p = 1; p <= 11; p++) {
      const pNumStr = p < 10 ? `0${p}` : `${p}`;
      const posCode = `P${pNumStr}`;
      const fullCode = `${shortCode}-${posCode}`;
      const plateId = `plate-${i}-${p}`;
      const serial = `${dateFormatted}-0${i}-${pNumStr}`;
      const posId = `pos-${i}-${p}`;

      serverDb.plates.push({
        id: plateId,
        plateSerialNumber: serial,
        manufacturingDate: todayStr,
        status: 'ACTIVE',
        currentSetId: setId,
        currentPositionId: posId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      serverDb.positions.push({
        id: posId,
        setId,
        setNumber: i,
        positionNumber: p,
        positionCode: posCode,
        fullCode,
        status: 'OCCUPIED',
        currentPlateId: plateId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      serverDb.installations.push({
        id: `inst-${i}-${p}`,
        plateId,
        setId,
        positionId: posId,
        installationDate: todayStr,
        installationCycle: 0,
        initialCycles: 0,
        operatorId: 'Admin',
        remarks: 'Factory Setup',
        createdAt: new Date().toISOString()
      });
    }
  }

  persistDatabase();
}

loadOrInitDatabase();

// CORS Headers helper
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control');
}

// Request parser
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname || '/';

  // API Routes
  if (pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (pathname === '/api/health') {
      res.writeHead(200);
      res.end(JSON.stringify({
        status: 'ok',
        system: 'Plate Lifecycle Monitoring System (PLMSys)',
        revision: serverDb.revision,
        timestamp: new Date().toISOString()
      }));
      return;
    }

    if (pathname === '/api/sync/version') {
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        revision: serverDb.revision || 1,
        lastUpdated: serverDb.lastUpdated,
        counts: {
          sets: serverDb.sets.length,
          positions: serverDb.positions.length,
          plates: serverDb.plates.length,
          production: serverDb.production.length,
          auditLogs: serverDb.auditLogs.length
        }
      }));
      return;
    }

    if (pathname === '/api/sync/all') {
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const data = body.data;
        if (data) {
          if (Array.isArray(data.sets)) serverDb.sets = data.sets;
          if (Array.isArray(data.positions)) serverDb.positions = data.positions;
          if (Array.isArray(data.plates)) serverDb.plates = data.plates;
          if (Array.isArray(data.installations)) serverDb.installations = data.installations;
          if (Array.isArray(data.removals)) serverDb.removals = data.removals;
          if (Array.isArray(data.production)) serverDb.production = data.production;
          if (Array.isArray(data.replacements)) serverDb.replacements = data.replacements;
          if (Array.isArray(data.jobOrders)) serverDb.jobOrders = data.jobOrders;
          if (Array.isArray(data.auditLogs)) serverDb.auditLogs = data.auditLogs;
          if (Array.isArray(data.personnel)) serverDb.personnel = data.personnel;
          persistDatabase();
          console.log(`[PLMSys Sync] Central database updated by client (Revision ${serverDb.revision})`);
        }
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          revision: serverDb.revision,
          lastUpdated: serverDb.lastUpdated
        }));
        return;
      } else {
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          revision: serverDb.revision || 1,
          lastUpdated: serverDb.lastUpdated,
          data: {
            sets: serverDb.sets,
            positions: serverDb.positions,
            plates: serverDb.plates,
            installations: serverDb.installations,
            removals: serverDb.removals,
            production: serverDb.production,
            replacements: serverDb.replacements,
            jobOrders: serverDb.jobOrders,
            auditLogs: serverDb.auditLogs,
            personnel: serverDb.personnel
          }
        }));
        return;
      }
    }

    if (pathname === '/api/server-info') {
      const nets = os.networkInterfaces();
      const addresses = [];
      for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
          if (net.family === 'IPv4' && !net.internal) {
            addresses.push(net.address);
          }
        }
      }
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        port: PORT,
        revision: serverDb.revision,
        localIps: addresses,
        urls: addresses.map(ip => `http://${ip}:${PORT}`)
      }));
      return;
    }

    if (pathname === '/api/sets') {
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: serverDb.sets }));
      return;
    }

    // Default API 404
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
    return;
  }

  // Static File Serving (SPA Mode)
  let filePath = path.join(DIST_DIR, pathname);
  
  // Prevent directory traversal
  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  // If path is a directory or does not exist, serve index.html (SPA Fallback)
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('PLMSys static web files not found. Please ensure dist/index.html is present.');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': mime });
      res.end(content);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('============================================================');
  console.log('  PLMSys Centralized Node.js Server is RUNNING!');
  console.log(`  Local Computer URL:  http://localhost:${PORT}`);

  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`  Factory Network URL: http://${net.address}:${PORT}`);
      }
    }
  }
  console.log('  Data Storage:        data/plmsys_database.json');
  console.log('============================================================');
  console.log('  Keep this window open. Press Ctrl+C to stop the server.');
});
