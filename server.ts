import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// In-memory / server-side state for local web app synchronization
let serverDb: {
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
} = {
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
    mode: 'LOCAL',
    networkPath: '',
    serverHost: 'localhost',
    serverPort: 3000,
    isHost: true,
    revision: 1,
    status: 'CONNECTED'
  }
};

// Initialize default SET 01 & SET 02 if empty
function initDefaultSets() {
  if (serverDb.sets.length === 0) {
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
  }
}
initDefaultSets();

// -------------------------------------------------------------
// REST API Routes (Matching PHP 8 Backend specifications)
// -------------------------------------------------------------

// 1. Health & Status
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    system: 'Plate Lifecycle Monitoring System (PLMSys)',
    webApp: 'Local Web App (TypeScript + Bootstrap 5 Frontend / PHP 8 & Node Backend)',
    timestamp: new Date().toISOString(),
    databaseEngines: ['MySQL 8.0+', 'PostgreSQL 14+', 'IndexedDB (Browser)', 'In-Memory API Proxy']
  });
});

// 2. Database Status & Diagnostics
app.get('/api/db/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    driver: 'mysql_or_postgres',
    activeMode: 'LOCAL_WEB_APP',
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
      owner: 'Web Client Local Worker',
      operation: 'Idle',
      started: new Date().toISOString(),
      heartbeat: new Date().toISOString(),
      status: 'HEALTHY'
    }
  });
});

// 3. Live SQL Export for MySQL
app.get('/api/db/export/mysql', (req: Request, res: Response) => {
  let sql = `-- ==========================================================\n`;
  sql += `-- PLMSys Live MySQL 8.0+ Export\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n`;
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

// 4. Live SQL Export for PostgreSQL
app.get('/api/db/export/postgres', (req: Request, res: Response) => {
  let sql = `-- ==========================================================\n`;
  sql += `-- PLMSys Live PostgreSQL 14+ Export\n`;
  sql += `-- Generated: ${new Date().toISOString()}\n`;
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

// 5. Query execution simulator / runner
app.post('/api/db/query', (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query) {
    res.status(400).json({ success: false, error: 'Query parameter is required' });
    return;
  }

  const q = query.trim().toUpperCase();
  if (q.startsWith('SELECT COUNT(*) FROM SETS') || q.startsWith('SELECT * FROM SETS')) {
    res.json({ success: true, count: serverDb.sets.length, rows: serverDb.sets });
  } else if (q.startsWith('SELECT COUNT(*) FROM PLATES') || q.startsWith('SELECT * FROM PLATES')) {
    res.json({ success: true, count: serverDb.plates.length, rows: serverDb.plates });
  } else {
    res.json({
      success: true,
      message: `Query processed successfully by SQL parser`,
      affectedRows: 1,
      rows: []
    });
  }
});

// 6. Sets Endpoints
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
  res.json({ success: true, data: s });
});

app.delete('/api/sets/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  serverDb.sets = serverDb.sets.filter(s => s.id !== id);
  serverDb.positions = serverDb.positions.filter(p => p.setId !== id);
  serverDb.plates = serverDb.plates.filter(pl => pl.currentSetId !== id);
  res.json({ success: true, message: 'Set deleted' });
});

// 7. Positions Endpoints
app.get('/api/positions', (req: Request, res: Response) => {
  res.json({ success: true, data: serverDb.positions });
});

app.put('/api/positions/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const pIdx = serverDb.positions.findIndex(p => p.id === id);
  if (pIdx >= 0) {
    serverDb.positions[pIdx] = { ...serverDb.positions[pIdx], ...req.body, updatedAt: new Date().toISOString() };
    res.json({ success: true, data: serverDb.positions[pIdx] });
  } else {
    res.status(404).json({ success: false, error: 'Position not found' });
  }
});

// 8. Plates Endpoints
app.get('/api/plates', (req: Request, res: Response) => {
  res.json({ success: true, data: serverDb.plates });
});

// 9. Daily Production Endpoints
app.get('/api/production', (req: Request, res: Response) => {
  res.json({ success: true, data: serverDb.production });
});

app.post('/api/production', (req: Request, res: Response) => {
  const dp = req.body;
  serverDb.production.push(dp);
  
  // Update target set
  const s = serverDb.sets.find(x => x.id === dp.setId);
  if (s) {
    s.currentTotalCycle = dp.currentTotalCycle;
    s.todayProduction = (s.lastProductionDate === dp.date ? s.todayProduction : 0) + dp.productionCycles;
    s.lastProductionDate = dp.date;
    s.updatedAt = new Date().toISOString();
  }
  res.json({ success: true, data: dp });
});

// 10. Audit Logs Endpoints
app.get('/api/audit-logs', (req: Request, res: Response) => {
  res.json({ success: true, data: serverDb.auditLogs });
});

app.post('/api/audit-logs', (req: Request, res: Response) => {
  const log = req.body;
  serverDb.auditLogs.unshift(log);
  if (serverDb.auditLogs.length > 500) {
    serverDb.auditLogs.pop();
  }
  res.json({ success: true, data: log });
});

// 11. Personnel Endpoints
app.get('/api/personnel', (req: Request, res: Response) => {
  res.json({ success: true, data: serverDb.personnel });
});

// 12. Full Database Sync / Import / Export API
app.get('/api/sync/all', (req: Request, res: Response) => {
  res.json({
    success: true,
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
    if (data.sets) serverDb.sets = data.sets;
    if (data.positions) serverDb.positions = data.positions;
    if (data.plates) serverDb.plates = data.plates;
    if (data.installations) serverDb.installations = data.installations;
    if (data.removals) serverDb.removals = data.removals;
    if (data.production) serverDb.production = data.production;
    if (data.replacements) serverDb.replacements = data.replacements;
    if (data.jobOrders) serverDb.jobOrders = data.jobOrders;
    if (data.auditLogs) serverDb.auditLogs = data.auditLogs;
    if (data.personnel) serverDb.personnel = data.personnel;
  }
  res.json({ success: true, message: 'All tables synced to web server memory' });
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
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PLMSys Local Web App Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer();
