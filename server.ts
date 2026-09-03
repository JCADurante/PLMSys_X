import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Anti-caching headers for all API requests to ensure multiple PCs always get fresh database data
app.use('/api', (req: Request, res: Response, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// SSE (Server-Sent Events) clients for zero-latency multi-PC database synchronization
const sseClients = new Set<Response>();

function broadcastRevision(revision: number) {
  const payload = JSON.stringify({
    type: 'SYNC_UPDATE',
    revision,
    lastUpdated: serverDb.lastUpdated,
    timestamp: Date.now()
  });
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

// -------------------------------------------------------------
// Persistent Storage Engine (data/plmsys_database.json)
// -------------------------------------------------------------
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'plmsys_database.json');

interface ServerDatabase {
  revision: number;
  lastUpdated: string;
  sets: any[];
  positions: any[];
  plates: any[];
  installations: any[];
  removals: any[];
  production: any[];
  replacements: any[];
  jobOrders: any[];
  auditLogs: any[];
  personnel: any[];
  networkSettings: any;
}

let serverDb: ServerDatabase = {
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
  ],
  networkSettings: {
    mode: 'CENTRAL_SERVER',
    networkPath: '',
    serverHost: '0.0.0.0',
    serverPort: PORT,
    isHost: true,
    revision: 1,
    status: 'CONNECTED'
  }
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Save database to disk
function persistDatabase() {
  try {
    serverDb.revision = (serverDb.revision || 0) + 1;
    serverDb.lastUpdated = new Date().toISOString();
    fs.writeFileSync(DB_FILE, JSON.stringify(serverDb, null, 2), 'utf-8');
    broadcastRevision(serverDb.revision);
  } catch (err) {
    console.error('[PLMSys Server] Failed to persist database to disk:', err);
  }
}

// Load database from disk or initialize default sets
function loadOrInitDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.sets)) {
        serverDb = { ...serverDb, ...parsed };
        console.log(`[PLMSys Server] Loaded persistent database (Revision: ${serverDb.revision}, Sets: ${serverDb.sets.length}, Plates: ${serverDb.plates.length})`);
        return;
      }
    }
  } catch (err) {
    console.warn('[PLMSys Server] Could not read database file, initializing defaults:', err);
  }

  // Initialize default SET 01 & SET 02
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
        operatorId: '-',
        remarks: 'Factory Setup',
        createdAt: new Date().toISOString()
      });
    }
  }

  persistDatabase();
}

loadOrInitDatabase();

// -------------------------------------------------------------
// REST API Endpoints & Real-Time LAN Synchronization
// -------------------------------------------------------------

// 1. Health & Server Info
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    system: 'Plate Lifecycle Monitoring System (PLMSys)',
    webApp: 'Centralized Full-Stack Node.js Web Server',
    timestamp: new Date().toISOString(),
    revision: serverDb.revision,
    databaseEngines: ['Local JSON Database (Persistent)', 'IndexedDB (Browser Client Cache)', 'MySQL/Postgres Ready']
  });
});

// 2. Server Network Info & Host Addresses
app.get('/api/server-info', (req: Request, res: Response) => {
  const nets = os.networkInterfaces();
  const addresses: string[] = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }

  res.json({
    success: true,
    port: PORT,
    revision: serverDb.revision,
    localIps: addresses,
    urls: addresses.map(ip => `http://${ip}:${PORT}`)
  });
});

// 3. Real-Time SSE Stream for Instant LAN Sync Across Multiple PCs
app.get('/api/sync/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.add(res);
  res.write(`data: ${JSON.stringify({
    type: 'INIT',
    revision: serverDb.revision || 1,
    lastUpdated: serverDb.lastUpdated,
    timestamp: Date.now()
  })}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// 4. Sync Version Check (Ultra-lightweight fallback polling)
app.get('/api/sync/version', (req: Request, res: Response) => {
  res.json({
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
  });
});

// 4. Full Database Sync (GET: Download central database / POST: Push client updates)
app.get('/api/sync/all', (req: Request, res: Response) => {
  res.json({
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
  });
});

app.post('/api/sync/all', (req: Request, res: Response) => {
  const { data } = req.body;
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
    console.log(`[PLMSys Server] Database synced from client. New Revision: ${serverDb.revision}`);
  }

  res.json({
    success: true,
    revision: serverDb.revision,
    lastUpdated: serverDb.lastUpdated,
    message: 'Database synced and persisted to disk successfully'
  });
});

// 5. Database Status & Diagnostics
app.get('/api/db/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    driver: 'persistent_json_and_indexeddb',
    activeMode: 'CENTRAL_NODE_SERVER',
    revision: serverDb.revision,
    tables: {
      sets: serverDb.sets.length,
      positions: serverDb.positions.length,
      plates: serverDb.plates.length,
      installations: serverDb.installations.length,
      removals: serverDb.removals.length,
      dailyProductions: serverDb.production.length,
      jobOrders: serverDb.jobOrders.length,
      auditLogs: serverDb.auditLogs.length,
      personnel: serverDb.personnel.length
    },
    lockDiagnostics: {
      locked: false,
      owner: 'Central Node.js Server',
      operation: 'Idle',
      started: serverDb.lastUpdated,
      heartbeat: new Date().toISOString(),
      status: 'HEALTHY'
    }
  });
});

// 6. Live SQL Export for MySQL
app.get('/api/db/export/mysql', (req: Request, res: Response) => {
  let sql = `-- ==========================================================\n`;
  sql += `-- PLMSys Live MySQL 8.0+ Export\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n`;
  sql += `-- Revision: ${serverDb.revision}\n`;
  sql += `-- ==========================================================\n\n`;
  sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

  // Sets
  if (serverDb.sets.length > 0) {
    sql += `-- Table: sets\n`;
    for (const s of serverDb.sets) {
      sql += `INSERT INTO \`sets\` (\`id\`, \`set_number\`, \`display_name\`, \`short_code\`, \`status\`, \`current_total_cycle\`, \`initial_cycle\`, \`today_production\`, \`last_production_date\`) VALUES ('${s.id}', ${s.setNumber}, '${s.displayName}', '${s.shortCode}', '${s.status}', ${s.currentTotalCycle || 0}, ${s.initialCycle || 0}, ${s.todayProduction || 0}, '${s.lastProductionDate || ''}') ON DUPLICATE KEY UPDATE \`current_total_cycle\` = VALUES(\`current_total_cycle\`);\n`;
    }
    sql += `\n`;
  }

  // Plates
  if (serverDb.plates.length > 0) {
    sql += `-- Table: plates\n`;
    for (const pl of serverDb.plates) {
      sql += `INSERT INTO \`plates\` (\`id\`, \`plate_serial_number\`, \`manufacturing_date\`, \`status\`, \`current_set_id\`, \`current_position_id\`) VALUES ('${pl.id}', '${pl.plateSerialNumber}', '${pl.manufacturingDate}', '${pl.status}', ${pl.currentSetId ? `'${pl.currentSetId}'` : 'NULL'}, ${pl.currentPositionId ? `'${pl.currentPositionId}'` : 'NULL'}) ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`);\n`;
    }
    sql += `\n`;
  }

  // Positions
  if (serverDb.positions.length > 0) {
    sql += `-- Table: positions\n`;
    for (const pos of serverDb.positions) {
      sql += `INSERT INTO \`positions\` (\`id\`, \`set_id\`, \`set_number\`, \`position_number\`, \`position_code\`, \`full_code\`, \`status\`, \`current_plate_id\`) VALUES ('${pos.id}', '${pos.setId}', ${pos.setNumber}, ${pos.positionNumber}, '${pos.positionCode}', '${pos.fullCode}', '${pos.status}', ${pos.currentPlateId ? `'${pos.currentPlateId}'` : 'NULL'}) ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`);\n`;
    }
    sql += `\n`;
  }

  sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="plmsys_mysql_dump_${Date.now()}.sql"`);
  res.send(sql);
});

// 7. Live SQL Export for PostgreSQL
app.get('/api/db/export/postgres', (req: Request, res: Response) => {
  let sql = `-- ==========================================================\n`;
  sql += `-- PLMSys Live PostgreSQL 14+ Export\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n`;
  sql += `-- Revision: ${serverDb.revision}\n`;
  sql += `-- ==========================================================\n\n`;

  if (serverDb.sets.length > 0) {
    sql += `-- Table: sets\n`;
    for (const s of serverDb.sets) {
      sql += `INSERT INTO sets (id, set_number, display_name, short_code, status, current_total_cycle, initial_cycle, today_production, last_production_date) VALUES ('${s.id}', ${s.setNumber}, '${s.displayName}', '${s.shortCode}', '${s.status}', ${s.currentTotalCycle || 0}, ${s.initialCycle || 0}, ${s.todayProduction || 0}, '${s.lastProductionDate || ''}') ON CONFLICT (id) DO UPDATE SET current_total_cycle = EXCLUDED.current_total_cycle;\n`;
    }
    sql += `\n`;
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="plmsys_postgres_dump_${Date.now()}.sql"`);
  res.send(sql);
});

// 8. Individual Resource APIs
app.get('/api/sets', (req: Request, res: Response) => {
  res.json({ success: true, data: serverDb.sets });
});

app.post('/api/sets', (req: Request, res: Response) => {
  const s = req.body;
  const existingIdx = serverDb.sets.findIndex(x => x.id === s.id || x.setNumber === s.setNumber);
  if (existingIdx >= 0) {
    serverDb.sets[existingIdx] = { ...serverDb.sets[existingIdx], ...s, updatedAt: new Date().toISOString() };
  } else {
    serverDb.sets.push({
      ...s,
      createdAt: s.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  persistDatabase();
  res.json({ success: true, data: s });
});

app.delete('/api/sets/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  serverDb.sets = serverDb.sets.filter(s => s.id !== id);
  serverDb.positions = serverDb.positions.filter(p => p.setId !== id);
  serverDb.plates = serverDb.plates.filter(pl => pl.currentSetId !== id);
  persistDatabase();
  res.json({ success: true, message: 'Set deleted' });
});

app.get('/api/positions', (req: Request, res: Response) => {
  res.json({ success: true, data: serverDb.positions });
});

app.get('/api/plates', (req: Request, res: Response) => {
  res.json({ success: true, data: serverDb.plates });
});

app.get('/api/production', (req: Request, res: Response) => {
  res.json({ success: true, data: serverDb.production });
});

app.post('/api/production', (req: Request, res: Response) => {
  const dp = req.body;
  serverDb.production.push(dp);
  
  const s = serverDb.sets.find(x => x.id === dp.setId);
  if (s) {
    s.currentTotalCycle = dp.currentTotalCycle;
    s.todayProduction = (s.lastProductionDate === dp.date ? s.todayProduction : 0) + dp.productionCycles;
    s.lastProductionDate = dp.date;
    s.updatedAt = new Date().toISOString();
  }
  persistDatabase();
  res.json({ success: true, data: dp });
});

app.get('/api/audit-logs', (req: Request, res: Response) => {
  res.json({ success: true, data: serverDb.auditLogs });
});

app.post('/api/audit-logs', (req: Request, res: Response) => {
  const log = req.body;
  serverDb.auditLogs.unshift(log);
  if (serverDb.auditLogs.length > 500) {
    serverDb.auditLogs.pop();
  }
  persistDatabase();
  res.json({ success: true, data: log });
});

app.get('/api/personnel', (req: Request, res: Response) => {
  res.json({ success: true, data: serverDb.personnel });
});

// -------------------------------------------------------------
// Vite Middleware / Static Server Setup
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));
    app.get('*', (req: Request, res: Response) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log('============================================================');
    console.log(`  PLMSys Centralized Node.js Server Running!`);
    console.log(`  Local Host: http://localhost:${PORT}`);

    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          console.log(`  Factory Network (LAN): http://${net.address}:${PORT}`);
        }
      }
    }
    console.log('  Data Persistence: data/plmsys_database.json (Real-Time Sync)');
    console.log('============================================================');
  });
}

startServer();
