import * as XLSX from 'xlsx';
import { db } from '../db/db';
import { getTodayStr } from '../utils';
import { 
  SetRecord, 
  PositionRecord, 
  PlateRecord, 
  PlateInstallationRecord, 
  PlateRemovalRecord, 
  DailyProductionRecord, 
  ReplacementRecord, 
  JobOrderRecord, 
  AuditRecord, 
  Personnel 
} from '../types';

export async function exportAllDataToExcel(): Promise<void> {
  // Fetch all tables from IndexedDB
  const [
    sets,
    positions,
    plates,
    installations,
    removals,
    dailyProductions,
    replacements,
    jobOrders,
    auditLogs,
    personnel
  ]: [
    SetRecord[],
    PositionRecord[],
    PlateRecord[],
    PlateInstallationRecord[],
    PlateRemovalRecord[],
    DailyProductionRecord[],
    ReplacementRecord[],
    JobOrderRecord[],
    AuditRecord[],
    Personnel[]
  ] = await Promise.all([
    db.sets.toArray().catch(() => [] as SetRecord[]),
    db.positions.toArray().catch(() => [] as PositionRecord[]),
    db.plates.toArray().catch(() => [] as PlateRecord[]),
    db.plateInstallations.toArray().catch(() => [] as PlateInstallationRecord[]),
    db.plateRemovals.toArray().catch(() => [] as PlateRemovalRecord[]),
    db.dailyProduction.toArray().catch(() => [] as DailyProductionRecord[]),
    db.replacements.toArray().catch(() => [] as ReplacementRecord[]),
    db.jobOrders.toArray().catch(() => [] as JobOrderRecord[]),
    db.auditLogs.toArray().catch(() => [] as AuditRecord[]),
    db.personnel.toArray().catch(() => [] as Personnel[])
  ]);

  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Helper maps for fast lookups
  const setMap = new Map<string, SetRecord>();
  sets.forEach(s => setMap.set(s.id, s));

  const plateMap = new Map<string, PlateRecord>();
  plates.forEach(p => plateMap.set(p.id, p));

  const posMap = new Map<string, PositionRecord>();
  positions.forEach(p => posMap.set(p.id, p));

  // 1. MASTER SETS SHEET
  const setsData = sets
    .sort((a, b) => a.setNumber - b.setNumber)
    .map(s => ({
      'Set Number': s.setNumber,
      'Display Name': s.displayName,
      'Short Code': s.shortCode,
      'Status': s.status,
      'Total Accumulated Cycles': s.currentTotalCycle,
      'Today Production Cycles': s.todayProduction || 0,
      'Initial Baseline Cycle': s.initialCycle || 0,
      'Last Production Date': s.lastProductionDate || '—',
      'Created Date': s.createdAt ? s.createdAt.split('T')[0] : '—'
    }));
  const setsSheet = XLSX.utils.json_to_sheet(setsData);
  XLSX.utils.book_append_sheet(workbook, setsSheet, 'Master Sets');

  // 2. POSITIONS & ACTIVE PLATES SHEET
  const positionsData = positions
    .sort((a, b) => {
      if (a.setNumber !== b.setNumber) return a.setNumber - b.setNumber;
      return a.positionNumber - b.positionNumber;
    })
    .map(pos => {
      const set = setMap.get(pos.setId);
      const plate = pos.currentPlateId ? plateMap.get(pos.currentPlateId) : null;
      const inst = plate ? installations.find(i => i.plateId === plate.id && i.positionId === pos.id) : null;
      
      const setCycles = set ? set.currentTotalCycle : 0;
      const instCycles = inst ? inst.installationCycle : 0;
      const initCycles = inst ? (inst.initialCycles || 0) : 0;
      const currentLife = plate ? ((setCycles - instCycles) + initCycles) : 0;

      return {
        'Set': set ? set.displayName : `Set ${pos.setNumber}`,
        'Position Code': pos.positionCode,
        'Full Position Code': pos.fullCode,
        'Position Status': pos.status,
        'Plate Serial Number': plate ? plate.plateSerialNumber : '— (EMPTY)',
        'Plate Status': plate ? plate.status : '—',
        'Plate Mfg Date': plate ? plate.manufacturingDate : '—',
        'Installation Date': inst ? inst.installationDate : '—',
        'Installed At Set Cycle': inst ? inst.installationCycle : '—',
        'Initial Plate Cycles': initCycles,
        'Current Achieved Plate Cycles': plate ? currentLife : 0,
        'Installed By': inst ? inst.operatorId : '—',
        'Remarks': inst ? (inst.remarks || '—') : '—'
      };
    });
  const positionsSheet = XLSX.utils.json_to_sheet(positionsData);
  XLSX.utils.book_append_sheet(workbook, positionsSheet, 'Positions & Plates');

  // 3. DAILY PRODUCTION LOGS SHEET
  const productionData = dailyProductions
    .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())
    .map(p => {
      const set = setMap.get(p.setId);
      return {
        'Log ID': p.id,
        'Date': p.date,
        'Set': set ? set.displayName : 'Unknown Set',
        'Job Order Number': p.jobOrderId || '—',
        'Added Production Cycles': p.productionCycles,
        'Previous Total Cycles': p.previousTotalCycle,
        'Current Total Cycles': p.currentTotalCycle,
        'Operator': p.operatorId,
        'Checked By': p.checkedBy || '—',
        'Remarks': p.remarks || '—',
        'Recorded Timestamp': p.createdAt || '—'
      };
    });
  const productionSheet = XLSX.utils.json_to_sheet(productionData);
  XLSX.utils.book_append_sheet(workbook, productionSheet, 'Production Logs');

  // 4. PLATE INSTALLATION HISTORY SHEET
  const instData = installations
    .sort((a, b) => new Date(b.createdAt || b.installationDate).getTime() - new Date(a.createdAt || a.installationDate).getTime())
    .map(inst => {
      const plate = plateMap.get(inst.plateId);
      const set = setMap.get(inst.setId);
      const pos = posMap.get(inst.positionId);
      return {
        'Installation ID': inst.id,
        'Plate Serial Number': plate ? plate.plateSerialNumber : inst.plateId,
        'Set': set ? set.displayName : '—',
        'Position': pos ? pos.fullCode : '—',
        'Installation Date': inst.installationDate,
        'Installation Cycle': inst.installationCycle,
        'Initial Added Cycles': inst.initialCycles || 0,
        'Operator': inst.operatorId,
        'Remarks': inst.remarks || '—',
        'Timestamp': inst.createdAt || '—'
      };
    });
  const instSheet = XLSX.utils.json_to_sheet(instData);
  XLSX.utils.book_append_sheet(workbook, instSheet, 'Plate Installations');

  // 5. PLATE REMOVALS & REJECTIONS SHEET
  const removalData = removals
    .sort((a, b) => new Date(b.createdAt || b.removalDate).getTime() - new Date(a.createdAt || a.removalDate).getTime())
    .map(rem => {
      const plate = plateMap.get(rem.plateId);
      const set = setMap.get(rem.setId);
      const pos = posMap.get(rem.positionId);
      return {
        'Removal ID': rem.id,
        'Plate Serial Number': plate ? plate.plateSerialNumber : rem.plateId,
        'Set': set ? set.displayName : '—',
        'Position': pos ? pos.fullCode : '—',
        'Removal Date': rem.removalDate,
        'Removal Cycle': rem.removalCycle,
        'Total Cycles Achieved': rem.totalCyclesAchieved,
        'Plate Status': rem.status,
        'Reject Category': rem.rejectType || '—',
        'Reject Reason & Description': rem.rejectDescription || '—',
        'Source of Reject': rem.sourceOfReject || '—',
        'Corrective Action': rem.correctiveAction || '—',
        'Operator': rem.operatorId,
        'Timestamp': rem.createdAt || '—'
      };
    });
  const removalSheet = XLSX.utils.json_to_sheet(removalData);
  XLSX.utils.book_append_sheet(workbook, removalSheet, 'Plate Removals & Rejects');

  // 6. PLATE REPLACEMENTS SHEET
  const replacementData = replacements
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(rep => {
      const set = setMap.get(rep.setId);
      const pos = posMap.get(rep.positionId);
      const oldPlate = plateMap.get(rep.oldPlateId);
      const newPlate = plateMap.get(rep.newPlateId);
      return {
        'Replacement ID': rep.id,
        'Set': set ? set.displayName : '—',
        'Position': pos ? pos.fullCode : '—',
        'Old Plate Serial': oldPlate ? oldPlate.plateSerialNumber : rep.oldPlateId,
        'Old Removal Cycle': rep.oldRemovalCycle,
        'New Plate Serial': newPlate ? newPlate.plateSerialNumber : rep.newPlateId,
        'New Installation Cycle': rep.newInstallationCycle,
        'Reason for Replacement': rep.reason,
        'Operator': rep.operatorId,
        'Timestamp': rep.createdAt
      };
    });
  const replacementSheet = XLSX.utils.json_to_sheet(replacementData);
  XLSX.utils.book_append_sheet(workbook, replacementSheet, 'Plate Replacements');

  // 7. AUDIT TRAIL LOGS SHEET
  const auditData = auditLogs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .map(log => ({
      'Audit Code': log.auditCode,
      'Timestamp': log.timestamp,
      'User / Operator': log.user,
      'Action Performed': log.action,
      'Record ID': log.recordId || '—',
      'Old Value': log.oldValue || '—',
      'New Value': log.newValue || '—',
      'Reason / Details': log.reason || '—',
      'Checked By Signoff': log.checkedBy || '—',
      'Device Info': log.deviceInfo || '—'
    }));
  const auditSheet = XLSX.utils.json_to_sheet(auditData);
  XLSX.utils.book_append_sheet(workbook, auditSheet, 'Audit Trail');

  // 8. PERSONNEL REGISTRY SHEET
  const personnelData = personnel.map(pers => ({
    'ID': pers.id,
    'Full Name': pers.fullName,
    'Short Code / Initials': pers.shortName,
    'Position / Designation': pers.position,
    'Authorized Sign-off': pers.isAuthorized ? 'YES' : 'NO'
  }));
  const personnelSheet = XLSX.utils.json_to_sheet(personnelData);
  XLSX.utils.book_append_sheet(workbook, personnelSheet, 'Personnel');

  // Set column widths dynamically for all sheets
  [setsSheet, positionsSheet, productionSheet, instSheet, removalSheet, replacementSheet, auditSheet, personnelSheet].forEach(sheet => {
    if (sheet['!ref']) {
      const range = XLSX.utils.decode_range(sheet['!ref']);
      const colWidths: { wch: number }[] = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        let maxLen = 12;
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cell = sheet[XLSX.utils.encode_cell({ r: R, c: C })];
          if (cell && cell.v) {
            const valStr = String(cell.v);
            if (valStr.length > maxLen) {
              maxLen = Math.min(valStr.length, 50);
            }
          }
        }
        colWidths.push({ wch: maxLen + 2 });
      }
      sheet['!cols'] = colWidths;
    }
  });

  // Write workbook and trigger download
  const today = getTodayStr();
  const filename = `PLMSys_Master_Database_Export_${today}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
