import React, { useState, useEffect } from 'react';
import { db, seedDatabase, generateUUID } from './db/db';
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
  Personnel,
  User,
  PlateStatus,
  RejectType,
  getPersonnelRole
} from './types';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { SetDetail } from './components/SetDetail';
import { PositionModal } from './components/PositionModal';
import { DailyProductionView } from './components/DailyProductionView';
import { GlobalSearch } from './components/GlobalSearch';
import { AuditLogView } from './components/AuditLogView';
import { DatabaseManagerView } from './components/DatabaseManagerView';
import { CreateSetModal } from './components/CreateSetModal';
import { LogProductionModal } from './components/LogProductionModal';
import { ManageSetView } from './components/ManageSetView';
import { LoginModal } from './components/LoginModal';
import { RegistryModal } from './components/RegistryModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { TutorialModal } from './components/TutorialModal';
import { useAutoBackup } from './hooks/useAutoBackup';
import { centralSync } from './services/centralSyncService';
import { exportAllDataToExcel } from './services/excelExportService';
import { Shield } from 'lucide-react';
import { getTodayStr, getSetTodayProduction } from './utils';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [sets, setSets] = useState<SetRecord[]>([]);
  const [positions, setPositions] = useState<PositionRecord[]>([]);
  const [plates, setPlates] = useState<PlateRecord[]>([]);
  const [installations, setInstallations] = useState<PlateInstallationRecord[]>([]);
  const [removals, setRemovals] = useState<PlateRemovalRecord[]>([]);
  const [dailyProductions, setDailyProductions] = useState<DailyProductionRecord[]>([]);
  const [replacements, setReplacements] = useState<ReplacementRecord[]>([]);
  const [jobOrders, setJobOrders] = useState<JobOrderRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>([]);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'manage-set' | 'production' | 'search' | 'audit' | 'database' | 'admin'>('dashboard');
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User>({ name: 'Operator', role: 'OPERATOR' });
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showRegistryModal, setShowRegistryModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);

  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showCreateSetModal, setShowCreateSetModal] = useState(false);
  const [showLogProductionModal, setShowLogProductionModal] = useState(false);

  const [selectedPosModal, setSelectedPosModal] = useState<{
    position: PositionRecord;
    action: 'install' | 'replace' | 'history';
  } | null>(null);

  useAutoBackup({
    onBackup: async () => {
      console.log('Performing scheduled/threshold auto-backup');
      await handleExportBackup();
    },
    logCount: auditLogs.length,
    activityThreshold: 50
  });

  const loadData = async () => {
    try {
      // Use a timeout safeguard so the app never gets stuck on a loading screen
      const loadPromise = (async () => {
        try {
          await seedDatabase(0, false);
        } catch (seedErr) {
          console.warn('Database seed error, continuing with available data:', seedErr);
        }

        const [
          sData,
          pData,
          plData,
          iData,
          rData,
          dpData,
          repData,
          joData,
          aData,
          persData,
        ] = await Promise.all([
          db.sets.toArray().catch(() => []),
          db.positions.toArray().catch(() => []),
          db.plates.toArray().catch(() => []),
          db.plateInstallations.toArray().catch(() => []),
          db.plateRemovals.toArray().catch(() => []),
          db.dailyProduction.toArray().catch(() => []),
          db.replacements.toArray().catch(() => []),
          db.jobOrders.toArray().catch(() => []),
          db.auditLogs.toArray().catch(() => []),
          db.personnel.toArray().catch(() => []),
        ]);

        return { sData, pData, plData, iData, rData, dpData, repData, joData, aData, persData };
      })();

      const timeoutPromise = new Promise<{
        sData: SetRecord[];
        pData: PositionRecord[];
        plData: PlateRecord[];
        iData: PlateInstallationRecord[];
        rData: PlateRemovalRecord[];
        dpData: DailyProductionRecord[];
        repData: ReplacementRecord[];
        joData: JobOrderRecord[];
        aData: AuditRecord[];
        persData: Personnel[];
      }>((resolve) => {
        setTimeout(() => {
          resolve({
            sData: [],
            pData: [],
            plData: [],
            iData: [],
            rData: [],
            dpData: [],
            repData: [],
            joData: [],
            aData: [],
            persData: []
          });
        }, 3000);
      });

      const { sData, pData, plData, iData, rData, dpData, repData, joData, aData, persData } =
        await Promise.race([loadPromise, timeoutPromise]);

      sData.sort((a, b) => b.setNumber - a.setNumber);

      const todayStr = getTodayStr();
      const sanitizedSets = sData.map((s) => {
        if (s.lastProductionDate !== todayStr) {
          return { ...s, todayProduction: 0 };
        }
        return s;
      });

      setSets(sanitizedSets);
      setPositions(pData);
      setPlates(plData);
      setInstallations(iData);
      setRemovals(rData);
      setDailyProductions(dpData);
      setReplacements(repData);
      setJobOrders(
        joData.length > 0
          ? joData
          : [
              { id: 'jo-1', jobOrderNumber: '0626-26', description: 'Heavy Production Run Q3', date: todayStr, status: 'IN_PROGRESS' },
              { id: 'jo-2', jobOrderNumber: '0712-26', description: 'High Speed Strip Rollout', date: todayStr, status: 'OPEN' }
            ]
      );
      setAuditLogs(aData);
      setPersonnel(
        persData.length > 0
          ? persData
          : [
              { id: 'pers-1', fullName: 'Jane Smith', shortName: 'JS', position: 'Supervisor', isAuthorized: true, password: 'password123' },
              { id: 'pers-2', fullName: 'John Doe', shortName: 'JD', position: 'Operator', isAuthorized: false, password: '' },
              { id: 'pers-3', fullName: 'Administrator', shortName: 'Admin', position: 'Admin', isAuthorized: true, password: 'JADB1994' }
            ]
      );

      // Clean up stale todayProduction in database in background
      sData.forEach(async (s) => {
        if (s.lastProductionDate !== todayStr && s.todayProduction !== 0) {
          try {
            await db.sets.update(s.id, { todayProduction: 0 });
          } catch (e) {
            console.warn('Set update cleanup warning:', e);
          }
        }
      });
    } catch (err) {
      console.error('Failed to load database:', err);
    } finally {
      setLoading(false);
    }
  };

  // Persist locally and synchronize across the LAN network to Node.js backend
  const mutateAndSync = async () => {
    try {
      await centralSync.pushToServer();
    } catch (err) {
      console.warn('[PLMSys] Push to central server deferred:', err);
    }
    await loadData();
  };

  useEffect(() => {
    let isMounted = true;
    const initApp = async () => {
      // 1. Check & sync with central Node server
      await centralSync.initSync();
      if (isMounted) {
        await loadData();
      }
      // 2. Listen for real-time updates from other shop-floor tablets/browsers
      centralSync.setOnRemoteDataChanged(async () => {
        if (isMounted) {
          await loadData();
        }
      });
    };

    initApp();

    return () => {
      isMounted = false;
      centralSync.stopBackgroundSync();
    };
  }, []);

  // Handlers
  const handleUpdateSet = async (
    setId: string,
    displayName: string,
    shortCode: string,
    status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE',
    currentTotalCycle: number
  ) => {
    const originalSet = sets.find(s => s.id === setId);
    if (!originalSet) return;

    await db.sets.update(setId, {
      displayName,
      shortCode,
      status,
      currentTotalCycle,
      updatedAt: new Date().toISOString(),
    });

    // Add Audit Log
    const auditCode = `AUD-${String(auditLogs.length + 1).padStart(6, '0')}`;
    await db.auditLogs.put({
      id: generateUUID(),
      auditCode,
      user: currentUser.name || (currentUser.role === 'ADMIN' ? 'Admin' : 'Operator'),
      operator: '-',
      userRole: currentUser.role === 'ADMIN' ? 'Admin' : 'Operator',
      action: 'EDIT_SET',
      timestamp: new Date().toISOString(),
      recordId: setId,
      oldValue: `${originalSet.displayName} (${originalSet.shortCode}) - ${originalSet.status} - ${originalSet.currentTotalCycle}`,
      newValue: `${displayName} (${shortCode}) - ${status} - ${currentTotalCycle}`,
      reason: `Updated details of Set: ${displayName}`,
      deviceInfo: navigator.userAgent,
    });

    await mutateAndSync();
  };

  const handleAddProduction = async (
    setId: string,
    positionId: string | 'ALL',
    cycles: number,
    jobOrderId: string,
    operatorName: string,
    checkedBy: string,
    remarks: string
  ) => {
    const targetSet = sets.find(s => s.id === setId);
    if (!targetSet) return;
    
    const todayStr = getTodayStr();

    if (positionId !== 'ALL') {
      const position = positions.find(p => p.id === positionId);
      if (position && position.currentPlateId) {
        const plateInst = installations.find(i => i.plateId === position.currentPlateId && i.positionId === position.id);
        if (plateInst) {
          const oldInitial = plateInst.initialCycles || 0;
          const newInitial = oldInitial + cycles;
          await db.plateInstallations.update(plateInst.id, {
            initialCycles: newInitial
          });

          const auditCode = `AUD-${String(auditLogs.length + 1).padStart(6, '0')}`;
          await db.auditLogs.put({
            id: generateUUID(),
            auditCode,
            user: operatorName,
            action: 'ADD_PRODUCTION',
            timestamp: new Date().toISOString(),
            recordId: position.currentPlateId,
            oldValue: String(oldInitial),
            newValue: String(newInitial),
            reason: `Added +${cycles} cycles to plate in position ${position.fullCode} (JO: ${jobOrderId})`,
            deviceInfo: navigator.userAgent,
            checkedBy,
          });
          await mutateAndSync();
          return;
        }
      }
    }

    const prevCycle = targetSet.currentTotalCycle;
    const newCycle = prevCycle + cycles;

    const isSameDay = targetSet.lastProductionDate === todayStr;
    const currentTodayProd = isSameDay ? (targetSet.todayProduction || 0) : 0;
    const newTodayProd = currentTodayProd + cycles;

    // Update set
    await db.sets.update(setId, {
      currentTotalCycle: newCycle,
      todayProduction: newTodayProd,
      lastProductionDate: todayStr,
      updatedAt: new Date().toISOString(),
    });

    // Create daily production record
    const newProdRecord: DailyProductionRecord = {
      id: generateUUID(),
      setId,
      date: todayStr,
      jobOrderId,
      previousTotalCycle: prevCycle,
      productionCycles: cycles,
      currentTotalCycle: newCycle,
      operatorId: operatorName,
      checkedBy,
      remarks,
      createdAt: new Date().toISOString(),
    };
    await db.dailyProduction.put(newProdRecord);

    // Audit log
    const auditCode = `AUD-${String(auditLogs.length + 1).padStart(6, '0')}`;
    await db.auditLogs.put({
      id: generateUUID(),
      auditCode,
      user: operatorName,
      action: 'ADD_PRODUCTION',
      timestamp: new Date().toISOString(),
      recordId: setId,
      oldValue: String(prevCycle),
      newValue: String(newCycle),
      reason: `Added +${cycles} cycles to ${targetSet.displayName} (JO: ${jobOrderId})`,
      deviceInfo: navigator.userAgent,
      checkedBy,
    });

    await mutateAndSync();
  };

  const handleAddProductionRange = async (
    fromSetNum: number,
    toSetNum: number,
    cycles: number,
    jobOrderNumber: string,
    operatorName: string,
    checkedBy: string,
    remarks: string
  ) => {
    const targetSets = sets.filter(s => s.setNumber >= fromSetNum && s.setNumber <= toSetNum);
    if (targetSets.length === 0) {
      alert('No sets found in the specified range.');
      return;
    }

    const todayStr = getTodayStr();

    for (const targetSet of targetSets) {
      const prevCycle = targetSet.currentTotalCycle;
      const newCycle = prevCycle + cycles;

      const isSameDay = targetSet.lastProductionDate === todayStr;
      const currentTodayProd = isSameDay ? (targetSet.todayProduction || 0) : 0;
      const newTodayProd = currentTodayProd + cycles;

      await db.sets.update(targetSet.id, {
        currentTotalCycle: newCycle,
        todayProduction: newTodayProd,
        lastProductionDate: todayStr,
        updatedAt: new Date().toISOString(),
      });

      const newProdRecord: DailyProductionRecord = {
        id: generateUUID(),
        setId: targetSet.id,
        date: todayStr,
        jobOrderId: jobOrderNumber,
        previousTotalCycle: prevCycle,
        productionCycles: cycles,
        currentTotalCycle: newCycle,
        operatorId: operatorName,
        checkedBy,
        remarks,
        createdAt: new Date().toISOString(),
      };
      await db.dailyProduction.put(newProdRecord);
    }

    const auditCode = `AUD-${String(auditLogs.length + 1).padStart(6, '0')}`;
    await db.auditLogs.put({
      id: generateUUID(),
      auditCode,
      user: operatorName,
      action: 'ADD_PRODUCTION',
      timestamp: new Date().toISOString(),
      recordId: `range-${fromSetNum}-${toSetNum}`,
      reason: `Added +${cycles} cycles to sets range ${fromSetNum} - ${toSetNum} (JO: ${jobOrderNumber})`,
      deviceInfo: navigator.userAgent,
      checkedBy,
    });

    await mutateAndSync();
  };

  const handleDeleteSet = async (setId: string, reason?: string) => {
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPERVISOR' && currentUser.role !== 'LEADMAN') {
      alert('Access Denied: Only authorized personnel (Admin, Supervisor, Leadman) can delete machine sets.');
      return;
    }
    try {
      const targetSet = sets.find(s => s.id === setId);
      const displayName = targetSet ? targetSet.displayName : `Set ${setId}`;

      // 1. Delete the set from db.sets
      await db.sets.delete(setId);
      
      // 2. Cascade delete all positions associated with this set
      const allPositions = await db.positions.toArray();
      for (const p of allPositions.filter(pos => pos.setId === setId)) {
        await db.positions.delete(p.id);
      }

      // 3. Cascade delete all plates assigned to this set
      const allPlates = await db.plates.toArray();
      for (const pl of allPlates.filter(p => p.currentSetId === setId)) {
        await db.plates.delete(pl.id);
      }

      // 4. Cascade delete all plate installations for this set
      const allInstallations = await db.plateInstallations.toArray();
      for (const inst of allInstallations.filter(i => i.setId === setId)) {
        await db.plateInstallations.delete(inst.id);
      }

      // 5. Cascade delete all plate removals for this set
      const allRemovals = await db.plateRemovals.toArray();
      for (const rem of allRemovals.filter(r => r.setId === setId)) {
        await db.plateRemovals.delete(rem.id);
      }

      // 6. Cascade delete all daily production logs for this set
      const allDailyProds = await db.dailyProduction.toArray();
      for (const dp of allDailyProds.filter(d => d.setId === setId)) {
        await db.dailyProduction.delete(dp.id);
      }

      // 7. Cascade delete all replacements for this set
      const allReplacements = await db.replacements.toArray();
      for (const rep of allReplacements.filter(r => r.setId === setId)) {
        await db.replacements.delete(rep.id);
      }

      // 8. Add audit log record
      const auditCode = `AUD-${String(auditLogs.length + 1).padStart(6, '0')}`;
      await db.auditLogs.put({
        id: generateUUID(),
        auditCode,
        user: currentUser.name || (currentUser.role === 'ADMIN' ? 'Admin' : 'Operator'),
        operator: '-',
        userRole: currentUser.role === 'ADMIN' ? 'Admin' : 'Operator',
        action: 'DELETE_SET',
        timestamp: new Date().toISOString(),
        recordId: setId,
        oldValue: displayName,
        reason: reason || `Permanently deleted master set ${displayName} and all its positions, plates, and installations.`,
        deviceInfo: navigator.userAgent,
      });

      if (selectedSetId === setId) {
        setSelectedSetId(null);
      }
      
      await mutateAndSync();
    } catch (err) {
      console.error('Error deleting set:', err);
      alert(`Error deleting set: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  };

  const handleDeleteProduction = async (prodId: string, reason?: string) => {
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPERVISOR' && currentUser.role !== 'LEADMAN') {
      alert('Access Denied: Only authorized personnel (Admin, Supervisor, Leadman) can delete production logs.');
      return;
    }
    try {
      const prod = dailyProductions.find(p => p.id === prodId);
      if (!prod) return;

      const targetSet = sets.find(s => s.id === prod.setId);
      const setDisplayName = targetSet ? targetSet.displayName : 'Unknown Set';

      // 1. Permanently delete from dailyProduction
      await db.dailyProduction.delete(prodId);

      // 2. Adjust Set current cycle counts if the Set still exists
      if (targetSet) {
        const prevCycle = targetSet.currentTotalCycle;
        const newCycle = Math.max(targetSet.initialCycle || 0, prevCycle - prod.productionCycles);

        // Decrement today's production if the record is on the same day as today
        const todayStr = getTodayStr();
        let newTodayProd = targetSet.todayProduction || 0;
        if (prod.date === todayStr && targetSet.lastProductionDate === todayStr) {
          newTodayProd = Math.max(0, targetSet.todayProduction - prod.productionCycles);
        } else if (targetSet.lastProductionDate !== todayStr) {
          newTodayProd = 0;
        }

        await db.sets.update(prod.setId, {
          currentTotalCycle: newCycle,
          todayProduction: newTodayProd,
          updatedAt: new Date().toISOString(),
        });
      }

      // 3. Log on audit log
      const auditCode = `AUD-${String(auditLogs.length + 1).padStart(6, '0')}`;
      await db.auditLogs.put({
        id: generateUUID(),
        auditCode,
        user: currentUser.name,
        action: 'DELETE_PRODUCTION',
        timestamp: new Date().toISOString(),
        recordId: prodId,
        oldValue: `Set: ${setDisplayName}, Cycles: +${prod.productionCycles}, Date: ${prod.date}, JO: ${prod.jobOrderId}`,
        reason: reason || `Admin deleted production log of +${prod.productionCycles.toLocaleString()} cycles for ${setDisplayName} (Job Order: ${prod.jobOrderId || 'N/A'}).`,
        deviceInfo: navigator.userAgent,
      });

      await mutateAndSync();
    } catch (err) {
      console.error('Error deleting production log:', err);
      alert(`Error deleting production log: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleEditProduction = async (
    prodId: string,
    updatedFields: Partial<DailyProductionRecord>,
    reason: string
  ) => {
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPERVISOR' && currentUser.role !== 'LEADMAN') {
      alert('Access Denied: Only authorized personnel (Admin, Supervisor, Leadman) can edit production logs.');
      return;
    }
    try {
      const prod = dailyProductions.find(p => p.id === prodId);
      if (!prod) {
        throw new Error('Production log not found.');
      }

      const oldSet = sets.find(s => s.id === prod.setId);
      const newSetId = updatedFields.setId || prod.setId;
      const newSet = sets.find(s => s.id === newSetId);

      const oldCycles = prod.productionCycles;
      const newCycles = updatedFields.productionCycles !== undefined ? Number(updatedFields.productionCycles) : oldCycles;
      const oldDate = prod.date;
      const newDate = updatedFields.date || oldDate;
      const todayStr = getTodayStr();

      // Recalculate set cycles
      if (oldSet && newSet && oldSet.id === newSet.id) {
        const cycleDelta = newCycles - oldCycles;
        const newTotalCycle = Math.max(oldSet.initialCycle || 0, oldSet.currentTotalCycle + cycleDelta);

        let newTodayProd = oldSet.todayProduction || 0;
        if (newDate === todayStr && oldDate === todayStr) {
          newTodayProd = Math.max(0, newTodayProd + cycleDelta);
        } else if (newDate === todayStr && oldDate !== todayStr) {
          newTodayProd = Math.max(0, newTodayProd + newCycles);
        } else if (newDate !== todayStr && oldDate === todayStr) {
          newTodayProd = Math.max(0, newTodayProd - oldCycles);
        }

        await db.sets.update(oldSet.id, {
          currentTotalCycle: newTotalCycle,
          todayProduction: newTodayProd,
          updatedAt: new Date().toISOString(),
        });
      } else if (oldSet && newSet && oldSet.id !== newSet.id) {
        // Old set has cycles deducted
        const oldSetNewTotal = Math.max(oldSet.initialCycle || 0, oldSet.currentTotalCycle - oldCycles);
        let oldSetTodayProd = oldSet.todayProduction || 0;
        if (oldDate === todayStr) {
          oldSetTodayProd = Math.max(0, oldSetTodayProd - oldCycles);
        }
        await db.sets.update(oldSet.id, {
          currentTotalCycle: oldSetNewTotal,
          todayProduction: oldSetTodayProd,
          updatedAt: new Date().toISOString(),
        });

        // New set has cycles added
        const newSetNewTotal = (newSet.currentTotalCycle || 0) + newCycles;
        let newSetTodayProd = newSet.todayProduction || 0;
        if (newDate === todayStr) {
          newSetTodayProd = newSetTodayProd + newCycles;
        }
        await db.sets.update(newSet.id, {
          currentTotalCycle: newSetNewTotal,
          todayProduction: newSetTodayProd,
          updatedAt: new Date().toISOString(),
        });
      }

      // Update the dailyProduction record
      const updatedRecord: DailyProductionRecord = {
        ...prod,
        ...updatedFields,
        productionCycles: newCycles,
        currentTotalCycle: newSet ? (newSet.currentTotalCycle + (newCycles - oldCycles)) : prod.currentTotalCycle
      };
      await db.dailyProduction.update(prodId, updatedRecord);

      // Audit Log
      const auditCode = `AUD-${String(auditLogs.length + 1).padStart(6, '0')}`;
      const changesSummary = [
        oldCycles !== newCycles ? `Cycles: ${oldCycles.toLocaleString()} -> ${newCycles.toLocaleString()}` : null,
        prod.jobOrderId !== updatedFields.jobOrderId && updatedFields.jobOrderId ? `JO: ${prod.jobOrderId} -> ${updatedFields.jobOrderId}` : null,
        prod.date !== updatedFields.date && updatedFields.date ? `Date: ${prod.date} -> ${updatedFields.date}` : null,
        prod.operatorId !== updatedFields.operatorId && updatedFields.operatorId ? `Operator: ${prod.operatorId} -> ${updatedFields.operatorId}` : null,
        prod.checkedBy !== updatedFields.checkedBy && updatedFields.checkedBy ? `CheckedBy: ${prod.checkedBy} -> ${updatedFields.checkedBy}` : null,
      ].filter(Boolean).join(', ');

      await db.auditLogs.put({
        id: generateUUID(),
        auditCode,
        user: currentUser.name,
        action: 'EDIT_PRODUCTION',
        timestamp: new Date().toISOString(),
        recordId: prodId,
        oldValue: `Set: ${oldSet?.displayName || prod.setId}, Cycles: +${oldCycles}, JO: ${prod.jobOrderId}, Date: ${prod.date}, Op: ${prod.operatorId}`,
        newValue: `Set: ${newSet?.displayName || updatedFields.setId || prod.setId}, Cycles: +${newCycles}, JO: ${updatedFields.jobOrderId || prod.jobOrderId}, Date: ${updatedFields.date || prod.date}, Op: ${updatedFields.operatorId || prod.operatorId}`,
        reason: reason || `Admin modified production log (${changesSummary || 'Details updated'}).`,
        deviceInfo: navigator.userAgent,
      });

      await mutateAndSync();
    } catch (err) {
      console.error('Error editing production log:', err);
      alert(`Error editing production log: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleDeletePlateLog = async (
    logId: string,
    logType: 'installation' | 'removal' | 'replacement',
    reason?: string
  ) => {
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPERVISOR' && currentUser.role !== 'LEADMAN') {
      alert('Access Denied: Only authorized personnel (Admin, Supervisor, Leadman) can delete plate logs.');
      return;
    }
    try {
      let logDesc = '';
      if (logType === 'installation') {
        const inst = installations.find(i => i.id === logId);
        logDesc = `Installation log for plate ${inst?.plateId || logId}`;
        await db.plateInstallations.delete(logId);
      } else if (logType === 'removal') {
        const rem = removals.find(r => r.id === logId);
        logDesc = `Removal/Reject log for plate ${rem?.plateId || logId}`;
        await db.plateRemovals.delete(logId);
      } else if (logType === 'replacement') {
        const rep = replacements.find(r => r.id === logId);
        logDesc = `Replacement log (${rep?.oldPlateId} -> ${rep?.newPlateId})`;
        await db.replacements.delete(logId);
      }

      const auditCode = `AUD-${String(auditLogs.length + 1).padStart(6, '0')}`;
      await db.auditLogs.put({
        id: generateUUID(),
        auditCode,
        user: currentUser.name,
        action: 'DELETE_PLATE_LOG',
        timestamp: new Date().toISOString(),
        recordId: logId,
        oldValue: logDesc,
        reason: reason || `Admin manually deleted ${logType} log (${logDesc}).`,
        deviceInfo: navigator.userAgent,
      });

      await mutateAndSync();
    } catch (err) {
      console.error('Error deleting plate log:', err);
      alert(`Error deleting plate log: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleExportExcel = async () => {
    try {
      await exportAllDataToExcel();
      const auditCode = `AUD-${String(auditLogs.length + 1).padStart(6, '0')}`;
      await db.auditLogs.put({
        id: generateUUID(),
        auditCode,
        user: currentUser.name,
        action: 'BACKUP',
        timestamp: new Date().toISOString(),
        reason: 'Exported complete database to Excel workbook (.xlsx)',
        deviceInfo: navigator.userAgent,
      });
      await mutateAndSync();
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      alert(`Error exporting to Excel: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleCreateSet = async (
    setNumber: number,
    displayName: string,
    shortCode: string,
    initialCycle: number,
    numPlates: number = 11,
    creationDate?: string,
    finish: 'Matte' | 'Glossy' = 'Glossy',
    numberOfOuts: number = 32
  ) => {
    const constructionName = displayName.trim() || `${finish.toUpperCase()} ${numberOfOuts} OUTS SET ${setNumber < 10 ? '0' + setNumber : setNumber}`;

    // Validate that the full construction is unique (Set Number can be duplicated across different finishes/outs, but not the same construction)
    const duplicateConstruction = sets.find(s => 
      s.displayName.trim().toLowerCase() === constructionName.toLowerCase() ||
      (s.finish === finish && s.numberOfOuts === numberOfOuts && s.setNumber === setNumber)
    );
    if (duplicateConstruction) {
      throw new Error(`A set with construction "${duplicateConstruction.displayName}" already exists. Set number can be duplicated across different finishes or outs, but the full construction must be unique.`);
    }

    const existingCode = sets.find(s => s.shortCode.trim().toLowerCase() === shortCode.trim().toLowerCase());
    if (existingCode) {
      throw new Error(`Short Code "${shortCode}" is already assigned to ${existingCode.displayName}. Please use a unique Short Code.`);
    }

    const setId = generateUUID();
    const setDateStr = creationDate || new Date().toISOString().split('T')[0];
    const dateParts = setDateStr.split('-');
    const dateObj = new Date(setDateStr + 'T00:00:00');
    const mm = String(dateParts[1] || dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateParts[2] || dateObj.getDate()).padStart(2, '0');
    const yy = String(dateParts[0] || dateObj.getFullYear()).slice(-2);
    const dateFormatted = `${mm}${dd}${yy}`;
    const setCreatedAt = new Date(setDateStr + 'T00:00:00').toISOString();

    const newSet: SetRecord = {
      id: setId,
      setNumber,
      displayName: constructionName,
      shortCode,
      finish,
      numberOfOuts,
      construction: constructionName,
      status: 'ACTIVE',
      currentTotalCycle: initialCycle,
      initialCycle,
      todayProduction: 0,
      lastProductionDate: setDateStr,
      createdAt: setCreatedAt,
      updatedAt: new Date().toISOString()
    };

    await db.sets.put(newSet);

    const positionsToCreate: PositionRecord[] = [];
    const platesToCreate: PlateRecord[] = [];
    const installationsToCreate: PlateInstallationRecord[] = [];

    for (let p = 1; p <= numPlates; p++) {
      const posId = generateUUID();
      const pNumStr = p < 10 ? `0${p}` : `${p}`;
      const positionCode = `P${pNumStr}`;
      const fullCode = `${shortCode}-${positionCode}`;
      const plateId = generateUUID();
      const serialNumber = `${dateFormatted}-${setNumber < 10 ? '0' + setNumber : setNumber}-${pNumStr}`;

      platesToCreate.push({
        id: plateId,
        plateSerialNumber: serialNumber,
        manufacturingDate: setDateStr,
        finish,
        numberOfOuts,
        construction: constructionName,
        status: 'ACTIVE',
        currentSetId: setId,
        currentPositionId: posId,
        createdAt: setCreatedAt,
        updatedAt: new Date().toISOString()
      });

      positionsToCreate.push({
        id: posId,
        setId,
        setNumber,
        positionNumber: p,
        positionCode,
        fullCode,
        status: 'OCCUPIED',
        currentPlateId: plateId,
        createdAt: setCreatedAt,
        updatedAt: new Date().toISOString()
      });

      installationsToCreate.push({
        id: generateUUID(),
        plateId,
        setId,
        positionId: posId,
        installationDate: setDateStr,
        installationCycle: initialCycle,
        finish,
        numberOfOuts,
        construction: constructionName,
        operatorId: '-',
        remarks: 'Initial installation on set creation',
        createdAt: setCreatedAt
      });
    }

    await db.positions.bulkPut(positionsToCreate);
    await db.plates.bulkPut(platesToCreate);
    await db.plateInstallations.bulkPut(installationsToCreate);

    const userRoleText = currentUser.role === 'ADMIN' ? 'Admin' : 'Operator';
    const auditCode = `AUD-${String(auditLogs.length + 1).padStart(6, '0')}`;
    await db.auditLogs.put({
      id: generateUUID(),
      auditCode,
      user: userRoleText,
      operator: '-',
      userRole: userRoleText,
      action: 'CREATE_SET',
      timestamp: new Date().toISOString(),
      recordId: setId,
      reason: `Created new master set ${constructionName} (${shortCode}) with ${numPlates} positions [${finish}, ${numberOfOuts} Outs]`,
      deviceInfo: navigator.userAgent
    });

    await mutateAndSync();
    setSelectedSetId(setId);
  };

  const handleInstallPlate = async (
    positionId: string,
    setId: string,
    serialNumber: string,
    mfgDate: string,
    operatorId: string,
    remarks: string,
    initialCycles: number = 0
  ) => {
    // Check duplicates
    const existingPlate = plates.find(p => p.plateSerialNumber === serialNumber);
    if (existingPlate && existingPlate.status === 'ACTIVE') {
      alert(`Plate serial number ${serialNumber} is already active elsewhere!`);
      return;
    }

    const targetSet = sets.find(s => s.id === setId);
    if (!targetSet) return;

    const setFinish = targetSet.finish;
    const setOuts = targetSet.numberOfOuts;
    const setConstruction = targetSet.construction || targetSet.displayName;

    const plateId = existingPlate ? existingPlate.id : generateUUID();
    const nowIso = new Date().toISOString();

    if (!existingPlate) {
      const newPlate: PlateRecord = {
        id: plateId,
        plateSerialNumber: serialNumber,
        manufacturingDate: mfgDate,
        finish: setFinish,
        numberOfOuts: setOuts,
        construction: setConstruction,
        status: 'ACTIVE',
        currentSetId: setId,
        currentPositionId: positionId,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      await db.plates.put(newPlate);
    } else {
      await db.plates.update(plateId, {
        finish: setFinish || existingPlate.finish,
        numberOfOuts: setOuts || existingPlate.numberOfOuts,
        construction: setConstruction || existingPlate.construction,
        status: 'ACTIVE',
        currentSetId: setId,
        currentPositionId: positionId,
        updatedAt: nowIso,
      });
    }

    // Update position
    await db.positions.update(positionId, {
      status: 'OCCUPIED',
      currentPlateId: plateId,
      updatedAt: nowIso,
    });

    // Create installation record
    const installation: PlateInstallationRecord = {
      id: generateUUID(),
      plateId,
      setId,
      positionId,
      installationDate: nowIso.split('T')[0],
      installationCycle: targetSet.currentTotalCycle,
      initialCycles,
      finish: setFinish,
      numberOfOuts: setOuts,
      construction: setConstruction,
      operatorId,
      remarks,
      createdAt: nowIso,
    };
    await db.plateInstallations.put(installation);

    // Audit log
    const auditCode = `AUD-${String(auditLogs.length + 1).padStart(6, '0')}`;
    await db.auditLogs.put({
      id: generateUUID(),
      auditCode,
      user: operatorId,
      action: 'INSTALL_PLATE',
      timestamp: nowIso,
      recordId: plateId,
      newValue: serialNumber,
      reason: `Installed plate at position in ${setConstruction}`,
      deviceInfo: navigator.userAgent,
    });

    setSelectedPosModal(null);
    await mutateAndSync();
  };

  const handleRemovePlate = async (
    positionId: string,
    setId: string,
    plateId: string,
    status: PlateStatus,
    rejectType?: RejectType,
    rejectDesc?: string,
    source?: string,
    corrective?: string,
    remarks?: string
  ) => {
    const targetSet = sets.find(s => s.id === setId);
    const installation = installations.find(i => i.plateId === plateId && i.setId === setId && i.positionId === positionId);
    if (!targetSet) return;

    const removalCycle = targetSet.currentTotalCycle;
    const installationCycle = installation ? installation.installationCycle : removalCycle;
    const totalCyclesAchieved = removalCycle - installationCycle;
    const nowIso = new Date().toISOString();

    // Update plate status
    await db.plates.update(plateId, {
      status,
      currentSetId: undefined,
      currentPositionId: undefined,
      updatedAt: nowIso,
    });

    // Free up position
    await db.positions.update(positionId, {
      status: 'EMPTY',
      currentPlateId: undefined,
      updatedAt: nowIso,
    });

    // Create removal record
    const removal: PlateRemovalRecord = {
      id: generateUUID(),
      plateId,
      setId,
      positionId,
      removalDate: nowIso.split('T')[0],
      removalCycle,
      totalCyclesAchieved,
      finish: targetSet.finish,
      numberOfOuts: targetSet.numberOfOuts,
      construction: targetSet.construction || targetSet.displayName,
      status,
      rejectType,
      rejectDescription: rejectDesc,
      sourceOfReject: source,
      correctiveAction: corrective,
      operatorId: currentUser.name,
      createdAt: nowIso,
    };
    await db.plateRemovals.put(removal);

    // Audit log
    const auditCode = `AUD-${String(auditLogs.length + 1).padStart(6, '0')}`;
    await db.auditLogs.put({
      id: generateUUID(),
      auditCode,
      user: currentUser.name,
      action: status === 'REJECTED' ? 'REJECT_PLATE' : 'REMOVE_PLATE',
      timestamp: nowIso,
      recordId: plateId,
      newValue: status,
      reason: remarks || `Removed plate with achieved life ${totalCyclesAchieved} cycles from ${targetSet.displayName}`,
      deviceInfo: navigator.userAgent,
    });

    setSelectedPosModal(null);
    await mutateAndSync();
  };

  const handleReplacePlate = async (
    positionId: string,
    setId: string,
    oldPlateId: string,
    newSerialNumber: string,
    installDate: string,
    reason: string,
    operatorId: string,
    initialCycles: number = 0,
    evaluationStatus: 'RETIRED' | 'REJECTED' = 'REJECTED',
    rejectTypes: string[] = [],
    rejectDescription?: string,
    sourceOfReject?: string,
    correctiveAction?: string
  ) => {
    const targetSet = sets.find(s => s.id === setId);
    const installation = installations.find(i => i.plateId === oldPlateId && i.setId === setId && i.positionId === positionId);
    if (!targetSet) return;

    const removalCycle = targetSet.currentTotalCycle;
    const installationCycle = installation ? installation.installationCycle : removalCycle;
    const totalCyclesAchieved = removalCycle - installationCycle;
    const nowIso = new Date().toISOString();

    // Map reject types to primary RejectType enum
    let primaryRejectType: RejectType = 'WEAR';
    if (rejectTypes.some(t => t.includes('Surface'))) primaryRejectType = 'SURFACE';
    else if (rejectTypes.some(t => t.includes('Crack'))) primaryRejectType = 'CRACK';
    else if (rejectTypes.some(t => t.includes('Dimension'))) primaryRejectType = 'DIM';
    else if (rejectTypes.some(t => t.includes('Chipping'))) primaryRejectType = 'CHIP';
    else if (rejectTypes.some(t => t.includes('Dent'))) primaryRejectType = 'DENT';
    else if (rejectTypes.some(t => t.includes('Other'))) primaryRejectType = 'OTHER';

    const fullRejectDesc = rejectDescription || reason;

    // 1. Remove old plate and update status to RETIRED or REJECTED
    await db.plates.update(oldPlateId, {
      status: evaluationStatus,
      currentSetId: undefined,
      currentPositionId: undefined,
      updatedAt: nowIso,
    });

    const removal: PlateRemovalRecord = {
      id: generateUUID(),
      plateId: oldPlateId,
      setId,
      positionId,
      removalDate: installDate,
      removalCycle,
      totalCyclesAchieved,
      finish: targetSet.finish,
      numberOfOuts: targetSet.numberOfOuts,
      construction: targetSet.construction || targetSet.displayName,
      status: evaluationStatus,
      rejectType: primaryRejectType,
      rejectDescription: fullRejectDesc,
      sourceOfReject: sourceOfReject || 'QA Inspection',
      correctiveAction: correctiveAction || 'Plate swapped and replaced',
      operatorId,
      createdAt: nowIso,
    };
    await db.plateRemovals.put(removal);

    // 2. Create and install new plate
    const newPlateId = generateUUID();
    const newPlate: PlateRecord = {
      id: newPlateId,
      plateSerialNumber: newSerialNumber,
      manufacturingDate: installDate,
      finish: targetSet.finish,
      numberOfOuts: targetSet.numberOfOuts,
      construction: targetSet.construction || targetSet.displayName,
      status: 'ACTIVE',
      currentSetId: setId,
      currentPositionId: positionId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    await db.plates.put(newPlate);

    await db.positions.update(positionId, {
      status: 'OCCUPIED',
      currentPlateId: newPlateId,
      updatedAt: nowIso,
    });

    const newInstallation: PlateInstallationRecord = {
      id: generateUUID(),
      plateId: newPlateId,
      setId,
      positionId,
      installationDate: installDate,
      installationCycle: removalCycle, // Set Total Cycle does not reset!
      initialCycles: 0,
      finish: targetSet.finish,
      numberOfOuts: targetSet.numberOfOuts,
      construction: targetSet.construction || targetSet.displayName,
      operatorId,
      remarks: `Replacement for plate (${evaluationStatus}). Reason: ${reason}`,
      createdAt: nowIso,
    };
    await db.plateInstallations.put(newInstallation);

    // Replacement record link
    const replacementRecord: ReplacementRecord = {
      id: generateUUID(),
      setId,
      positionId,
      oldPlateId,
      newPlateId: newPlateId,
      oldRemovalCycle: removalCycle,
      newInstallationCycle: removalCycle,
      reason,
      operatorId,
      createdAt: nowIso,
    };
    await db.replacements.put(replacementRecord);

    // Audit log
    const auditCode = `AUD-${String(auditLogs.length + 1).padStart(6, '0')}`;
    await db.auditLogs.put({
      id: generateUUID(),
      auditCode,
      user: operatorId,
      action: 'REPLACE_PLATE',
      timestamp: nowIso,
      recordId: positionId,
      oldValue: oldPlateId,
      newValue: newPlateId,
      reason,
      deviceInfo: navigator.userAgent,

    });

    setSelectedPosModal(null);
    await mutateAndSync();
  };

  const handleExportBackup = async () => {
    const insts = await db.plateInstallations.toArray();
    const rems = await db.plateRemovals.toArray();
    const backupData = {
      sets: await db.sets.toArray(),
      positions: await db.positions.toArray(),
      plates: await db.plates.toArray(),
      plateInstallations: insts,
      installations: insts,
      plateRemovals: rems,
      removals: rems,
      dailyProduction: await db.dailyProduction.toArray(),
      replacements: await db.replacements.toArray(),
      jobOrders: await db.jobOrders.toArray(),
      auditLogs: await db.auditLogs.toArray(),
      personnel: await db.personnel.toArray(),
    };

    const backupText = JSON.stringify(backupData, null, 2);
    const blob = new Blob([backupText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plate-lifecycle-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const instData = json.plateInstallations || json.installations || [];
        const remData = json.plateRemovals || json.removals || [];
        if (json.sets || json.positions) {
          await db.sets.clear();
          await db.positions.clear();
          await db.plates.clear();
          await db.plateInstallations.clear();
          await db.plateRemovals.clear();
          await db.dailyProduction.clear();
          await db.replacements.clear();
          await db.jobOrders.clear();
          await db.auditLogs.clear();
          await db.personnel.clear();

          if (json.sets?.length) await db.sets.bulkPut(json.sets);
          if (json.positions?.length) await db.positions.bulkPut(json.positions);
          if (json.plates?.length) await db.plates.bulkPut(json.plates);
          if (instData.length) await db.plateInstallations.bulkPut(instData);
          if (remData.length) await db.plateRemovals.bulkPut(remData);
          if (json.dailyProduction?.length) await db.dailyProduction.bulkPut(json.dailyProduction);
          if (json.replacements?.length) await db.replacements.bulkPut(json.replacements);
          if (json.jobOrders?.length) await db.jobOrders.bulkPut(json.jobOrders);
          if (json.auditLogs?.length) await db.auditLogs.bulkPut(json.auditLogs);
          if (json.personnel?.length) await db.personnel.bulkPut(json.personnel);

          alert('Database backup restored successfully!');
          await mutateAndSync();
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        console.error(err);
        alert('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreFactory = async () => {
    setLoading(true);
    try {
      setSelectedSetId(null);
      setSelectedPosModal(null);
      await seedDatabase(0, true);
      await mutateAndSync();
    } catch (err) {
      console.error('Failed to restore factory settings:', err);
      alert('Failed to restore factory settings: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleAddPersonnel = async (personnelData: Omit<Personnel, 'id'>) => {
    const targetRole = personnelData.role || (
      personnelData.position?.toLowerCase().includes('admin') ? 'Admin' :
      personnelData.position?.toLowerCase().includes('supervisor') ? 'Supervisor' :
      personnelData.position?.toLowerCase().includes('leadman') ? 'Leadman' : 'Operator'
    );

    if (currentUser.role === 'LEADMAN' && (targetRole === 'Supervisor' || targetRole === 'Admin')) {
      alert('Access Denied: Leadman accounts cannot create accounts for Supervisor or Admin.');
      return;
    }
    if (currentUser.role === 'SUPERVISOR' && targetRole === 'Admin') {
      alert('Access Denied: Supervisor accounts cannot create accounts for Admin.');
      return;
    }
    if (currentUser.role === 'OPERATOR') {
      alert('Access Denied: Operator accounts do not have permission to register personnel.');
      return;
    }

    const id = generateUUID();
    await db.personnel.put({ id, ...personnelData });
    await mutateAndSync();
  };

  const handleRemovePersonnel = async (id: string) => {
    const target = personnel.find(p => p.id === id);
    if (target) {
      const targetRole = getPersonnelRole(target);
      if (currentUser.role === 'LEADMAN' && (targetRole === 'Admin' || targetRole === 'Supervisor')) {
        alert('Access Denied: Leadman accounts cannot delete Supervisor or Admin accounts.');
        return;
      }
      if (currentUser.role === 'SUPERVISOR' && targetRole === 'Admin') {
        alert('Access Denied: Supervisor accounts cannot delete Admin accounts.');
        return;
      }
      if (currentUser.role === 'OPERATOR') {
        alert('Access Denied: Operator accounts cannot delete personnel records.');
        return;
      }
    }
    await db.personnel.delete(id);
    await mutateAndSync();
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role !== 'ADMIN' && user.role !== 'SUPERVISOR' && (activeTab === 'admin' || activeTab === 'database')) {
      setActiveTab('dashboard');
    }
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setCurrentUser({ name: 'Operator', role: 'OPERATOR' });
    setActiveTab('dashboard');
    setShowLoginModal(true);
  };

  const handleAdminLogin = (user?: User) => {
    if (user) {
      setCurrentUser(user);
    } else {
      setCurrentUser({ name: 'Admin', role: 'ADMIN' });
    }
    setShowAdminLoginModal(false);
  };

  const handleOpenCreateSet = () => {
    setShowCreateSetModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-sm font-medium text-slate-300">Loading Plate Lifecycle Monitoring System...</div>
        </div>
      </div>
    );
  }

  const selectedSet = sets.find(s => s.id === selectedSetId);
  const totalPositionsCount = sets.length * 11;

  return (
    <div className="min-vh-100 bg-dark text-light d-flex flex-column font-sans" data-bs-theme="dark">
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedSetId(null);
        }}
        totalPositions={totalPositionsCount}
        activeSetsCount={sets.length}
        currentUser={currentUser}
        sets={sets}
        selectedSetId={selectedSetId}
        onSelectSet={(id) => {
          setSelectedSetId(id);
          setActiveTab('dashboard');
        }}
        onOpenLogin={() => setShowLoginModal(true)}
        onOpenAdminLogin={() => setShowAdminLoginModal(true)}
        onLogout={handleLogout}
        onOpenTutorial={() => setShowTutorialModal(true)}
        onOpenCreateSet={() => setShowCreateSetModal(true)}
        onOpenLogProduction={() => setShowLogProductionModal(true)}
        onOpenRegistry={() => setShowRegistryModal(true)}
      />

      <main className="flex-grow-1 w-100 px-3 px-md-4 px-lg-5 py-4">
        {selectedSetId && selectedSet ? (
          <SetDetail
            setRecord={selectedSet}
            sets={sets}
            positions={positions}
            plates={plates}
            installations={installations}
            jobOrders={jobOrders}
            dailyProductions={dailyProductions}
            personnel={personnel}
            currentUser={currentUser}
            onBack={() => setSelectedSetId(null)}
            onSelectSet={(id) => setSelectedSetId(id)}
            onAddProduction={handleAddProduction}
            onOpenPositionModal={(pos, action) => {
              setSelectedPosModal({ position: pos, action });
            }}
            onDeleteSet={handleDeleteSet}
            onDeleteProduction={handleDeleteProduction}
            onEditProduction={handleEditProduction}
            onDeletePlateLog={handleDeletePlateLog}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                sets={sets}
                positions={positions}
                plates={plates}
                installations={installations}
                removals={removals}
                dailyProductions={dailyProductions}
                currentUser={currentUser}
                personnel={personnel}
                onOpenRegistry={() => setShowRegistryModal(true)}
                onSelectSet={(setId) => setSelectedSetId(setId)}
                onOpenCreateSet={handleOpenCreateSet}
                onOpenLogProduction={() => setShowLogProductionModal(true)}
                onUpdateSet={handleUpdateSet}
              />
            )}
            {activeTab === 'manage-set' && (
              <ManageSetView
                sets={sets}
                positions={positions}
                plates={plates}
                dailyProductions={dailyProductions}
                currentUser={currentUser}
                onSelectSet={(setId) => setSelectedSetId(setId)}
                onOpenCreateSet={handleOpenCreateSet}
                onUpdateSet={handleUpdateSet}
                onDeleteSet={handleDeleteSet}
              />
            )}
            {activeTab === 'production' && (
              <DailyProductionView
                dailyProductions={dailyProductions}
                sets={sets}
                jobOrders={jobOrders}
                personnel={personnel}
                currentUser={currentUser}
                onOpenLogProduction={() => setShowLogProductionModal(true)}
                onDeleteProduction={handleDeleteProduction}
                onEditProduction={handleEditProduction}
              />
            )}
            {activeTab === 'search' && (
              <GlobalSearch
                plates={plates}
                sets={sets}
                positions={positions}
                installations={installations}
                removals={removals}
                onSelectSet={(setId) => {
                  setSelectedSetId(setId);
                  setActiveTab('dashboard');
                }}
                onOpenPositionModal={(pos) => {
                  setSelectedPosModal({ position: pos, action: 'history' });
                }}
              />
            )}
            {activeTab === 'audit' && (
              <AuditLogView auditLogs={auditLogs} sets={sets} positions={positions} plates={plates} />
            )}
            {(activeTab === 'admin' || activeTab === 'database') && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR') && (
              <AdminDashboard 
                sets={sets}
                positions={positions}
                plates={plates}
                installations={installations}
                removals={removals}
                dailyProductions={dailyProductions}
                replacements={replacements}
                auditLogs={auditLogs}
                personnel={personnel}
                currentUser={currentUser}
                onDeleteSet={handleDeleteSet}
                onDeleteProduction={handleDeleteProduction}
                onEditProduction={handleEditProduction}
                onDeletePlateLog={handleDeletePlateLog}
                onExportBackup={handleExportBackup} 
                onExportExcel={handleExportExcel}
                onImportBackup={handleImportBackup} 
                onRestoreFactory={handleRestoreFactory}
                onDataChanged={loadData}
                initialTab={activeTab === 'database' ? 'database' : 'maintenance'}
              />
            )}
          </>
        )}
      </main>

      {/* Modals for App Operations */}
      {showLoginModal && (
        <LoginModal
          personnel={personnel}
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLogin}
        />
      )}

      {selectedPosModal && (
        <PositionModal
          position={selectedPosModal.position}
          setRecord={sets.find(s => s.id === selectedPosModal.position.setId) || {
            id: selectedPosModal.position.setId,
            setNumber: selectedPosModal.position.setNumber,
            displayName: `SET ${selectedPosModal.position.setNumber}`,
            shortCode: `S${selectedPosModal.position.setNumber}`,
            status: 'ACTIVE',
            currentTotalCycle: 0,
            initialCycle: 0,
            todayProduction: 0,
            lastProductionDate: getTodayStr(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }}
          currentPlate={plates.find(p => p.id === selectedPosModal.position.currentPlateId)}
          installation={installations.find(i => i.positionId === selectedPosModal.position.id && i.plateId === selectedPosModal.position.currentPlateId)}
          removals={removals}
          personnel={personnel}
          onClose={() => setSelectedPosModal(null)}
          onInstallPlate={handleInstallPlate}
          onReplacePlate={handleReplacePlate}
          action={selectedPosModal.action}
          installations={installations}
          plates={plates}
        />
      )}

          {showCreateSetModal && (
            <CreateSetModal
              sets={sets}
              onClose={() => setShowCreateSetModal(false)}
              onCreateSet={handleCreateSet}
            />
          )}

          {showLogProductionModal && (
            <LogProductionModal
              sets={sets}
              personnel={personnel}
              onClose={() => setShowLogProductionModal(false)}
              onAddProductionRange={handleAddProductionRange}
            />
          )}

          {showRegistryModal && (
            <RegistryModal
              personnel={personnel}
              currentUser={currentUser}
              onAdd={handleAddPersonnel}
              onRemove={handleRemovePersonnel}
              onClose={() => setShowRegistryModal(false)}
            />
          )}

          {showAdminLoginModal && (
            <AdminLoginModal
              personnel={personnel}
              onClose={() => setShowAdminLoginModal(false)}
              onLogin={handleAdminLogin}
            />
          )}

      {/* Footer */}
      <footer className="w-full py-4 px-6 text-center text-xs text-[#8E9299] border-t border-[#1E222A] bg-[#0A0B0E] mt-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
          <div>
            <strong className="text-white">Plate Lifecycle Monitoring System (PLMSys)</strong>
          </div>
        </div>
      </footer>

      <TutorialModal
        isOpen={showTutorialModal}
        onClose={() => {
          setShowTutorialModal(false);
          setActiveTab('dashboard');
          setSelectedSetId(null);
        }}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedSetId(null);
        }}
      />
    </div>
  );
}
