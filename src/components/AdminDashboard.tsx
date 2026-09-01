import React, { useRef, useState, useEffect } from 'react';
import { 
  Download, 
  Upload, 
  Shield, 
  Database, 
  Clock, 
  Activity, 
  AlertCircle, 
  RefreshCw, 
  CheckCircle2, 
  X, 
  Server, 
  FileSpreadsheet, 
  Trash2, 
  Pencil, 
  Layers, 
  Search,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'motion/react';
import { DatabaseManagerView } from './DatabaseManagerView';
import { 
  SetRecord, 
  PositionRecord, 
  PlateRecord, 
  PlateInstallationRecord, 
  PlateRemovalRecord, 
  DailyProductionRecord, 
  ReplacementRecord, 
  AuditRecord, 
  Personnel, 
  User 
} from '../types';
import { formatJobOrder } from '../utils';

interface AdminDashboardProps {
  sets?: SetRecord[];
  positions?: PositionRecord[];
  plates?: PlateRecord[];
  installations?: PlateInstallationRecord[];
  removals?: PlateRemovalRecord[];
  dailyProductions?: DailyProductionRecord[];
  replacements?: ReplacementRecord[];
  auditLogs?: AuditRecord[];
  personnel?: Personnel[];
  currentUser?: User;
  onDeleteSet?: (setId: string, reason?: string) => Promise<void>;
  onDeleteProduction?: (prodId: string, reason?: string) => Promise<void>;
  onEditProduction?: (prodId: string, updatedFields: Partial<DailyProductionRecord>, reason: string) => Promise<void>;
  onDeletePlateLog?: (logId: string, logType: 'installation' | 'removal' | 'replacement', reason?: string) => Promise<void>;
  onExportBackup: () => Promise<void>;
  onExportExcel?: () => Promise<void>;
  onImportBackup: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onRestoreFactory: () => Promise<void>;
  onDataChanged?: () => void;
  initialTab?: 'maintenance' | 'admin-records' | 'database';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  sets = [],
  positions = [],
  plates = [],
  installations = [],
  removals = [],
  dailyProductions = [],
  replacements = [],
  auditLogs = [],
  personnel = [],
  currentUser,
  onDeleteSet,
  onDeleteProduction,
  onEditProduction,
  onDeletePlateLog,
  onExportBackup, 
  onExportExcel,
  onImportBackup, 
  onRestoreFactory,
  onDataChanged,
  initialTab = 'maintenance'
}) => {
  const [adminSubTab, setAdminSubTab] = useState<'maintenance' | 'admin-records' | 'database'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setAdminSubTab(initialTab);
    }
  }, [initialTab]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [restoreError, setRestoreError] = useState('');
  const [confirmationText, setConfirmationText] = useState('');

  // Excel Export State
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [excelSuccess, setExcelSuccess] = useState(false);

  // Production Record Search & Filters
  const [prodSearchTerm, setProdSearchTerm] = useState('');
  const [prodSetFilter, setProdSetFilter] = useState('ALL');

  // Edit Production Log State
  const [editingLog, setEditingLog] = useState<DailyProductionRecord | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editSetId, setEditSetId] = useState('');
  const [editJobOrderId, setEditJobOrderId] = useState('');
  const [editCycles, setEditCycles] = useState('');
  const [editOperatorId, setEditOperatorId] = useState('');
  const [editCheckedBy, setEditCheckedBy] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [editReason, setEditReason] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete Production Log State
  const [deletingProdLog, setDeletingProdLog] = useState<DailyProductionRecord | null>(null);
  const [deleteProdReason, setDeleteProdReason] = useState('');
  const [isDeletingProd, setIsDeletingProd] = useState(false);

  // Delete Set Modal State
  const [setToDelete, setSetToDelete] = useState<SetRecord | null>(null);
  const [deleteSetReason, setDeleteSetReason] = useState('');
  const [isDeletingSet, setIsDeletingSet] = useState(false);

  // Delete Plate Log State
  const [selectedPlateLogType, setSelectedPlateLogType] = useState<'installation' | 'removal' | 'replacement'>('installation');
  const [plateLogSearch, setPlateLogSearch] = useState('');
  const [isDeletingPlateLog, setIsDeletingPlateLog] = useState(false);
  const [deletingPlateLog, setDeletingPlateLog] = useState<{
    id: string;
    type: 'installation' | 'removal' | 'replacement';
    title: string;
    details: string;
  } | null>(null);
  const [deletePlateLogReason, setDeletePlateLogReason] = useState('');

  // Search in Sets
  const [setSearchTerm, setSetSearchTerm] = useState('');

  const handleExportExcelClick = async () => {
    if (!onExportExcel) return;
    setIsExportingExcel(true);
    setExcelSuccess(false);
    try {
      await onExportExcel();
      setExcelSuccess(true);
      setTimeout(() => setExcelSuccess(false), 3000);
    } catch (err: any) {
      alert(`Export error: ${err?.message || String(err)}`);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (confirmationText.trim().toUpperCase() !== 'RESET') {
      setRestoreError('Please type RESET in capital letters to confirm.');
      return;
    }

    setIsRestoring(true);
    setRestoreError('');
    try {
      await onRestoreFactory();
      setRestoreSuccess(true);
      if (onDataChanged) {
        onDataChanged();
      }
      setTimeout(() => {
        setShowRestoreModal(false);
        setRestoreSuccess(false);
        setConfirmationText('');
      }, 1500);
    } catch (err: any) {
      setRestoreError(err.message || 'Failed to restore factory settings.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleOpenEditProduction = (log: DailyProductionRecord) => {
    setEditingLog(log);
    setEditDate(log.date);
    setEditSetId(log.setId);
    setEditJobOrderId(log.jobOrderId || '');
    setEditCycles(String(log.productionCycles));
    setEditOperatorId(log.operatorId || '');
    setEditCheckedBy(log.checkedBy || '');
    setEditRemarks(log.remarks || '');
    setEditReason('');
    setEditError('');
  };

  const handleSaveEditProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog || !onEditProduction) return;
    setEditError('');

    const cyclesNum = parseInt(editCycles, 10);
    if (isNaN(cyclesNum) || cyclesNum <= 0) {
      setEditError('Please enter a valid positive cycle number.');
      return;
    }

    if (!editSetId) {
      setEditError('Please select a target machine set.');
      return;
    }

    if (!editReason.trim()) {
      setEditError('Please provide a reason for editing this production log.');
      return;
    }

    setIsSavingEdit(true);
    try {
      await onEditProduction(
        editingLog.id,
        {
          date: editDate,
          setId: editSetId,
          jobOrderId: editJobOrderId.trim(),
          productionCycles: cyclesNum,
          operatorId: editOperatorId.trim(),
          checkedBy: editCheckedBy.trim(),
          remarks: editRemarks.trim(),
        },
        editReason.trim()
      );
      setEditingLog(null);
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      setEditError(err?.message || 'Failed to save production changes.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDeleteProduction = async () => {
    if (!deletingProdLog || !onDeleteProduction) return;
    setIsDeletingProd(true);
    try {
      await onDeleteProduction(deletingProdLog.id, deleteProdReason.trim() || undefined);
      setDeletingProdLog(null);
      setDeleteProdReason('');
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      alert(`Error deleting production log: ${err?.message || String(err)}`);
    } finally {
      setIsDeletingProd(false);
    }
  };

  const handleConfirmDeleteSet = async () => {
    if (!setToDelete || !onDeleteSet) return;
    setIsDeletingSet(true);
    try {
      await onDeleteSet(setToDelete.id, deleteSetReason.trim() || undefined);
      setSetToDelete(null);
      setDeleteSetReason('');
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      alert(`Error deleting set: ${err?.message || String(err)}`);
    } finally {
      setIsDeletingSet(false);
    }
  };

  const handleConfirmDeletePlateLog = async () => {
    if (!deletingPlateLog || !onDeletePlateLog) return;
    setIsDeletingPlateLog(true);
    try {
      await onDeletePlateLog(deletingPlateLog.id, deletingPlateLog.type, deletePlateLogReason.trim() || undefined);
      setDeletingPlateLog(null);
      setDeletePlateLogReason('');
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      alert(`Error deleting plate log: ${err?.message || String(err)}`);
    } finally {
      setIsDeletingPlateLog(false);
    }
  };

  const filteredSets = sets.filter(s => 
    s.displayName.toLowerCase().includes(setSearchTerm.toLowerCase()) ||
    s.shortCode.toLowerCase().includes(setSearchTerm.toLowerCase()) ||
    String(s.setNumber).includes(setSearchTerm)
  );

  const sortedProductions = [...dailyProductions].sort(
    (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
  );

  const filteredProductions = sortedProductions.filter((prod) => {
    const matchesSearch = 
      prod.jobOrderId.toLowerCase().includes(prodSearchTerm.toLowerCase()) ||
      prod.operatorId.toLowerCase().includes(prodSearchTerm.toLowerCase()) ||
      prod.date.includes(prodSearchTerm);
    const matchesSet = prodSetFilter === 'ALL' || prod.setId === prodSetFilter;
    return matchesSearch && matchesSet;
  });

  // Calculate live delta for Edit modal
  const editTargetSet = sets.find((s) => s.id === editSetId);
  const oldCyclesVal = editingLog ? editingLog.productionCycles : 0;
  const newCyclesVal = parseInt(editCycles, 10) || 0;
  const cycleDelta = newCyclesVal - oldCyclesVal;
  const projectedSetCycle = editTargetSet
    ? Math.max(editTargetSet.initialCycle || 0, editTargetSet.currentTotalCycle + cycleDelta)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#F27D26]/10 p-2 rounded-lg border border-[#F27D26]/20">
            <Shield className="w-6 h-6 text-[#F27D26]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">Admin Dashboard & Control Center</h2>
            <p className="text-sm text-[#8E9299]">Admin-only deletion controls, production log editing, Excel data exports, and schema studio</p>
          </div>
        </div>

        {/* Global Export Excel Action */}
        {onExportExcel && (
          <button
            type="button"
            onClick={handleExportExcelClick}
            disabled={isExportingExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20 cursor-pointer whitespace-nowrap"
          >
            {isExportingExcel ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating Excel...</span>
              </>
            ) : excelSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Downloaded .xlsx</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export All Data to Excel</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Admin Section Tabs */}
      <div className="flex items-center gap-1.5 bg-[#0F1117] p-1 rounded-xl border border-[#1E222A] overflow-x-auto">
        <button
          type="button"
          onClick={() => setAdminSubTab('maintenance')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            adminSubTab === 'maintenance'
              ? 'bg-[#F27D26] text-white shadow-md shadow-[#F27D26]/20'
              : 'text-[#8E9299] hover:text-white hover:bg-[#191D28]'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Maintenance & Backups</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminSubTab('admin-records')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            adminSubTab === 'admin-records'
              ? 'bg-[#F27D26] text-white shadow-md shadow-[#F27D26]/20'
              : 'text-[#8E9299] hover:text-white hover:bg-[#191D28]'
          }`}
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Admin Data & Delete Controls</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminSubTab('database')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
            adminSubTab === 'database'
              ? 'bg-[#F27D26] text-white shadow-md shadow-[#F27D26]/20'
              : 'text-[#8E9299] hover:text-white hover:bg-[#191D28]'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>DB & Schema Studio</span>
        </button>
      </div>

      {/* SUB-TAB 1: SYSTEM MAINTENANCE & BACKUPS */}
      {adminSubTab === 'maintenance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          {/* Backup & Recovery Card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#14171F] border border-[#1E222A] rounded-xl overflow-hidden shadow-xl"
          >
            <div className="p-6 border-b border-[#1E222A] bg-[#191D28]/50">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white uppercase text-sm tracking-wider">Database Backups & Exports</h3>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex flex-col gap-4">
                {/* Excel Export Card */}
                {onExportExcel && (
                  <div className="flex items-start gap-3 p-4 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                    <div className="p-2 bg-emerald-500/10 rounded text-emerald-400">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-white mb-1">Export All Data to Excel (.xlsx)</h4>
                      <p className="text-xs text-[#8E9299] mb-3">Download comprehensive multi-sheet Excel workbook containing sets, active plates, production records, plate lifecycle logs, audit trail, and personnel.</p>
                      <button 
                        onClick={handleExportExcelClick}
                        disabled={isExportingExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        {isExportingExcel ? 'Generating Workbook...' : 'Export Excel Workbook (.xlsx)'}
                      </button>
                    </div>
                  </div>
                )}

                {/* JSON Export Card */}
                <div className="flex items-start gap-3 p-4 bg-indigo-500/5 rounded-lg border border-indigo-500/10">
                  <div className="p-2 bg-indigo-500/10 rounded text-indigo-400">
                    <Download className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white mb-1">Manual JSON Backup</h4>
                    <p className="text-xs text-[#8E9299] mb-3">Download a complete raw JSON snapshot of the local database directly to your computer.</p>
                    <button 
                      onClick={onExportBackup}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Export JSON Backup
                    </button>
                  </div>
                </div>

                {/* Restore Backup Card */}
                <div className="flex items-start gap-3 p-4 bg-amber-500/5 rounded-lg border border-amber-500/10">
                  <div className="p-2 bg-amber-500/10 rounded text-amber-400">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white mb-1">Restore from Backup</h4>
                    <p className="text-xs text-[#8E9299] mb-3 leading-relaxed">Restore database from a previously exported JSON file. <span className="text-amber-500 font-bold">WARNING: This will overwrite current data.</span></p>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={async (e) => {
                        try {
                          await onImportBackup(e);
                        } finally {
                          if (e.target) e.target.value = '';
                        }
                      }} 
                      accept=".json" 
                      className="hidden" 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      Import Backup
                    </button>
                  </div>
                </div>

                {/* Factory Reset Card */}
                <div className="flex items-start gap-3 p-4 bg-rose-500/5 rounded-lg border border-rose-500/10">
                  <div className="p-2 bg-rose-500/10 rounded text-rose-400">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-white mb-1">Factory Reset</h4>
                    <p className="text-xs text-[#8E9299] mb-3 leading-relaxed">Wipe all data and return the system to its original state. <span className="text-rose-500 font-bold underline">THIS CANNOT BE UNDONE.</span></p>
                    <button 
                      onClick={() => {
                        setRestoreSuccess(false);
                        setRestoreError('');
                        setConfirmationText('');
                        setShowRestoreModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-rose-500/20 cursor-pointer"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Restore Factory Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* System Auto-Monitoring Card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-[#14171F] border border-[#1E222A] rounded-xl overflow-hidden shadow-xl"
          >
            <div className="p-6 border-b border-[#1E222A] bg-[#191D28]/50">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white uppercase text-sm tracking-wider">Storage Engine & Telemetry</h3>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[#0A0B0E] rounded-lg border border-[#1E222A]">
                  <div className="flex items-center gap-3">
                    <Database className="w-4 h-4 text-[#8E9299]" />
                    <span className="text-sm text-[#E0E2E5]">Local Storage Engine</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">IndexedDB (Dexie)</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#0A0B0E] rounded-lg border border-[#1E222A]">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-[#8E9299]" />
                    <span className="text-sm text-[#E0E2E5]">Auto-Backup Frequency</span>
                  </div>
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded">Daily at Midnight</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#0A0B0E] rounded-lg border border-[#1E222A]">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-[#8E9299]" />
                    <span className="text-sm text-[#E0E2E5]">Active Machine Sets</span>
                  </div>
                  <span className="text-xs font-bold text-sky-400 bg-sky-400/10 px-2 py-1 rounded">{sets.length} Sets</span>
                </div>
                
                <div className="p-4 bg-[#0A0B0E] rounded-lg border border-[#1E222A] mt-2">
                  <p className="text-xs text-[#8E9299] leading-relaxed">
                    This system operates as a high-performance offline local web application. All plate positions, cylinder sets, production histories, personnel records, and audit logs are safely stored locally in your browser's persistent database.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* SUB-TAB 2: ADMIN DATA & DELETE CONTROLS */}
      {adminSubTab === 'admin-records' && (
        <div className="space-y-6 animate-fadeIn">
          {/* SECTION 1: PRODUCTION LOGS MANAGEMENT (EDIT & DELETE) */}
          <div className="bg-[#0F1117] border border-[#1E222A] rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E222A] pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400 border border-sky-500/20">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-tight">Production Records Management (Edit & Delete)</h3>
                  <p className="text-xs text-[#8E9299]">Admin-only controls to edit production cycle logs or permanently delete logs with automatic cumulative set cycle recalculation and full audit trails.</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                ADMIN RESTRICTED
              </span>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 flex-wrap flex-1">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#8E9299]" />
                  <input
                    type="text"
                    placeholder="Search by JO#, operator, or date..."
                    value={prodSearchTerm}
                    onChange={(e) => setProdSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-[#191D28] border border-[#1E222A] rounded-lg text-xs text-white placeholder-[#8E9299] focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
                  />
                </div>
                <select
                  value={prodSetFilter}
                  onChange={(e) => setProdSetFilter(e.target.value)}
                  className="px-3 py-1.5 bg-[#191D28] border border-[#1E222A] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
                >
                  <option value="ALL">All Machine Sets</option>
                  {sets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName} ({s.shortCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-[#8E9299] font-mono">
                Showing <strong>{filteredProductions.length}</strong> of {dailyProductions.length} records
              </div>
            </div>

            {/* Records Table */}
            <div className="overflow-x-auto max-h-[380px] overflow-y-auto rounded-xl border border-[#1E222A]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#191D28] text-xs font-semibold text-[#8E9299] uppercase">
                    <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A]">Date</th>
                    <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A]">Set</th>
                    <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A]">Job Order</th>
                    <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A] text-right">Added Cycles</th>
                    <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A] text-right">Total Set Cycles</th>
                    <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A]">Operator</th>
                    <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A]">Checked By</th>
                    <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E222A] text-xs">
                  {filteredProductions.map((prod) => {
                    const setRecord = sets.find((s) => s.id === prod.setId);
                    return (
                      <tr key={prod.id} className="hover:bg-[#191D28]/50">
                        <td className="p-3 font-medium text-white whitespace-nowrap">{prod.date}</td>
                        <td className="p-3 font-mono font-bold text-[#F27D26] whitespace-nowrap">
                          {setRecord?.displayName || 'Unknown'}
                        </td>
                        <td className="p-3 font-mono text-[#E0E2E5] whitespace-nowrap">
                          <span className="bg-[#191D28] px-2 py-0.5 rounded text-[11px] font-semibold text-[#8E9299] border border-[#1E222A]">
                            {prod.jobOrderId || 'N/A'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-sky-400">
                          +{prod.productionCycles.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono text-white">
                          {prod.currentTotalCycle.toLocaleString()}
                        </td>
                        <td className="p-3 text-white whitespace-nowrap">{prod.operatorId}</td>
                        <td className="p-3 text-[#8E9299] whitespace-nowrap">{prod.checkedBy || '—'}</td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditProduction(prod)}
                              className="p-1.5 bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white border border-sky-500/20 rounded text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                              title="Edit Production Log"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingProdLog(prod);
                                setDeleteProdReason('');
                              }}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                              title="Delete Production Log"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProductions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-[#8E9299]">
                        No production records found matching your filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 2: MASTER SET DELETION */}
          <div className="bg-[#0F1117] border border-[#1E222A] rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E222A] pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400 border border-rose-500/20">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-tight">Master Set Deletion (Admin Only)</h3>
                  <p className="text-xs text-[#8E9299]">Permanently delete a machine set and cascade removal of all its positions and plate records.</p>
                </div>
              </div>

              {/* Set Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#8E9299]" />
                <input
                  type="text"
                  placeholder="Search sets..."
                  value={setSearchTerm}
                  onChange={(e) => setSetSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-[#191D28] border border-[#1E222A] rounded-lg text-xs text-white placeholder-[#8E9299] focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[350px] overflow-y-auto pr-1">
              {filteredSets.map((set) => (
                <div
                  key={set.id}
                  className="bg-[#14171F] border border-[#1E222A] hover:border-[#F27D26]/30 p-4 rounded-xl flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 bg-[#191D28] text-[#F27D26] font-bold rounded border border-[#1E222A]">
                        {set.shortCode}
                      </span>
                      <h4 className="font-bold text-white text-sm">{set.displayName}</h4>
                    </div>
                    <div className="text-xs text-[#8E9299] mt-1 font-mono">
                      Cycles: <strong className="text-white">{set.currentTotalCycle.toLocaleString()}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSetToDelete(set);
                      setDeleteSetReason('');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              ))}
              {filteredSets.length === 0 && (
                <div className="col-span-full py-8 text-center text-xs text-[#8E9299]">
                  No machine sets match your search filter.
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: MANUALLY DELETE PRODUCTION & PLATE LOGS */}
          <div className="bg-[#0F1117] border border-[#1E222A] rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E222A] pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/20">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-tight">Manual Plate Log Deletion</h3>
                  <p className="text-xs text-[#8E9299]">Admin-only deletion for individual plate installations, removals, and replacements.</p>
                </div>
              </div>

              {/* Log Type Selector */}
              <div className="flex items-center gap-1 bg-[#191D28] p-1 rounded-lg border border-[#1E222A]">
                <button
                  onClick={() => setSelectedPlateLogType('installation')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    selectedPlateLogType === 'installation'
                      ? 'bg-[#F27D26] text-white'
                      : 'text-[#8E9299] hover:text-white'
                  }`}
                >
                  Installations ({installations.length})
                </button>
                <button
                  onClick={() => setSelectedPlateLogType('removal')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    selectedPlateLogType === 'removal'
                      ? 'bg-[#F27D26] text-white'
                      : 'text-[#8E9299] hover:text-white'
                  }`}
                >
                  Removals ({removals.length})
                </button>
                <button
                  onClick={() => setSelectedPlateLogType('replacement')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    selectedPlateLogType === 'replacement'
                      ? 'bg-[#F27D26] text-white'
                      : 'text-[#8E9299] hover:text-white'
                  }`}
                >
                  Replacements ({replacements.length})
                </button>
              </div>
            </div>

            {/* Table of Plate Logs */}
            <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#191D28] text-xs font-semibold text-[#8E9299] uppercase">
                    <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A]">Date</th>
                    <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A]">Plate Serial</th>
                    <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A]">Set & Position</th>
                    <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A]">Cycles</th>
                    <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A]">Operator / Reason</th>
                    <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A] text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E222A] text-xs">
                  {selectedPlateLogType === 'installation' && installations.map((inst) => {
                    const plate = plates.find(p => p.id === inst.plateId);
                    const set = sets.find(s => s.id === inst.setId);
                    const pos = positions.find(p => p.id === inst.positionId);
                    return (
                      <tr key={inst.id} className="hover:bg-[#191D28]/50">
                        <td className="p-3 font-medium text-white whitespace-nowrap">{inst.installationDate}</td>
                        <td className="p-3 font-mono font-bold text-sky-400 whitespace-nowrap">
                          {plate?.plateSerialNumber || inst.plateId}
                        </td>
                        <td className="p-3 text-white whitespace-nowrap">
                          {set?.displayName || 'Set'} · {pos?.fullCode || 'Pos'}
                        </td>
                        <td className="p-3 font-mono text-[#8E9299]">
                          Install Cycle: {inst.installationCycle.toLocaleString()}
                        </td>
                        <td className="p-3 text-[#8E9299] max-w-xs truncate">
                          {inst.operatorId} {inst.remarks ? `· ${inst.remarks}` : ''}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingPlateLog({
                                id: inst.id,
                                type: 'installation',
                                title: `Plate Installation Record: ${plate?.plateSerialNumber || inst.plateId}`,
                                details: `Set: ${set?.displayName || 'Set'}, Position: ${pos?.fullCode || 'Pos'}, Date: ${inst.installationDate}, Install Cycle: ${inst.installationCycle.toLocaleString()}`
                              });
                              setDeletePlateLogReason('');
                            }}
                            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded text-[11px] font-bold transition-all cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {selectedPlateLogType === 'removal' && removals.map((rem) => {
                    const plate = plates.find(p => p.id === rem.plateId);
                    const set = sets.find(s => s.id === rem.setId);
                    const pos = positions.find(p => p.id === rem.positionId);
                    return (
                      <tr key={rem.id} className="hover:bg-[#191D28]/50">
                        <td className="p-3 font-medium text-white whitespace-nowrap">{rem.removalDate}</td>
                        <td className="p-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                          {plate?.plateSerialNumber || rem.plateId}
                        </td>
                        <td className="p-3 text-white whitespace-nowrap">
                          {set?.displayName || 'Set'} · {pos?.fullCode || 'Pos'}
                        </td>
                        <td className="p-3 font-mono text-[#8E9299]">
                          Achieved: {rem.totalCyclesAchieved.toLocaleString()}
                        </td>
                        <td className="p-3 text-[#8E9299] max-w-xs truncate">
                          {rem.status} · {rem.rejectDescription || rem.rejectType || 'Standard Removal'}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingPlateLog({
                                id: rem.id,
                                type: 'removal',
                                title: `Plate Removal Record: ${plate?.plateSerialNumber || rem.plateId}`,
                                details: `Set: ${set?.displayName || 'Set'}, Position: ${pos?.fullCode || 'Pos'}, Date: ${rem.removalDate}, Achieved: ${rem.totalCyclesAchieved.toLocaleString()} cycles`
                              });
                              setDeletePlateLogReason('');
                            }}
                            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded text-[11px] font-bold transition-all cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {selectedPlateLogType === 'replacement' && replacements.map((rep) => {
                    const oldPlate = plates.find(p => p.id === rep.oldPlateId);
                    const newPlate = plates.find(p => p.id === rep.newPlateId);
                    const set = sets.find(s => s.id === rep.setId);
                    const pos = positions.find(p => p.id === rep.positionId);
                    return (
                      <tr key={rep.id} className="hover:bg-[#191D28]/50">
                        <td className="p-3 font-medium text-white whitespace-nowrap">
                          {rep.createdAt ? rep.createdAt.split('T')[0] : '—'}
                        </td>
                        <td className="p-3 font-mono text-white whitespace-nowrap">
                          <span className="text-amber-400">{oldPlate?.plateSerialNumber || rep.oldPlateId}</span>
                          <span className="text-[#8E9299] mx-1">→</span>
                          <span className="text-emerald-400">{newPlate?.plateSerialNumber || rep.newPlateId}</span>
                        </td>
                        <td className="p-3 text-white whitespace-nowrap">
                          {set?.displayName || 'Set'} · {pos?.fullCode || 'Pos'}
                        </td>
                        <td className="p-3 font-mono text-[#8E9299]">
                          Install: {rep.newInstallationCycle.toLocaleString()}
                        </td>
                        <td className="p-3 text-[#8E9299] max-w-xs truncate">
                          {rep.reason || '—'}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingPlateLog({
                                id: rep.id,
                                type: 'replacement',
                                title: `Plate Replacement Record: ${oldPlate?.plateSerialNumber || rep.oldPlateId} → ${newPlate?.plateSerialNumber || rep.newPlateId}`,
                                details: `Set: ${set?.displayName || 'Set'}, Position: ${pos?.fullCode || 'Pos'}, Reason: ${rep.reason || 'Standard'}`
                              });
                              setDeletePlateLogReason('');
                            }}
                            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded text-[11px] font-bold transition-all cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {((selectedPlateLogType === 'installation' && installations.length === 0) ||
                    (selectedPlateLogType === 'removal' && removals.length === 0) ||
                    (selectedPlateLogType === 'replacement' && replacements.length === 0)) && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-[#8E9299]">
                        No {selectedPlateLogType} logs recorded in the system.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: DATABASE & SCHEMA STUDIO */}
      {adminSubTab === 'database' && (
        <div className="animate-fadeIn">
          <DatabaseManagerView onDataChanged={onDataChanged} />
        </div>
      )}

      {/* EDIT PRODUCTION MODAL */}
      {editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#0F1117] border border-[#1E222A] rounded-2xl p-6 w-full max-w-xl space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E222A] pb-3">
              <div className="flex items-center gap-2 text-sky-400">
                <Pencil className="w-5 h-5" />
                <h3 className="text-base font-bold text-white uppercase tracking-tight">Edit Production Record</h3>
              </div>
              {!isSavingEdit && (
                <button
                  type="button"
                  onClick={() => setEditingLog(null)}
                  className="text-[#8E9299] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <form onSubmit={handleSaveEditProduction} className="space-y-4">
              <p className="text-xs text-[#8E9299]">
                Modify production log details. Total machine set cycles will be automatically recalculated based on the cycle difference.
              </p>

              {editError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#8E9299] uppercase mb-1 block">
                    Production Date *
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#191D28] border border-[#1E222A] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#8E9299] uppercase mb-1 block">
                    Target Machine Set *
                  </label>
                  <select
                    value={editSetId}
                    onChange={(e) => setEditSetId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#191D28] border border-[#1E222A] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
                  >
                    {sets.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.displayName} ({s.shortCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#8E9299] uppercase mb-1 block">
                    Job Order Number *
                  </label>
                  <input
                    type="text"
                    value={editJobOrderId}
                    onChange={(e) => setEditJobOrderId(formatJobOrder(e.target.value))}
                    required
                    placeholder="0000-00"
                    maxLength={7}
                    className="w-full px-3 py-2 bg-[#191D28] border border-[#1E222A] rounded-lg text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#8E9299] uppercase mb-1 block">
                    Added Production Cycles *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editCycles}
                    onChange={(e) => setEditCycles(e.target.value)}
                    required
                    placeholder="e.g. 2500"
                    className="w-full px-3 py-2 bg-[#191D28] border border-[#1E222A] rounded-lg text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#8E9299] uppercase mb-1 block">
                    Operator *
                  </label>
                  <input
                    type="text"
                    list="admin-operator-list-edit"
                    value={editOperatorId}
                    onChange={(e) => setEditOperatorId(e.target.value)}
                    required
                    placeholder="Operator name"
                    className="w-full px-3 py-2 bg-[#191D28] border border-[#1E222A] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
                  />
                  <datalist id="admin-operator-list-edit">
                    {personnel.map((p) => (
                      <option key={p.id} value={p.fullName}>
                        {p.position} ({p.shortName})
                      </option>
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#8E9299] uppercase mb-1 block">
                    Checked By
                  </label>
                  <input
                    type="text"
                    value={editCheckedBy}
                    onChange={(e) => setEditCheckedBy(e.target.value)}
                    placeholder="Supervisor name"
                    className="w-full px-3 py-2 bg-[#191D28] border border-[#1E222A] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8E9299] uppercase mb-1 block">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  value={editRemarks}
                  onChange={(e) => setEditRemarks(e.target.value)}
                  placeholder="Optional remarks"
                  className="w-full px-3 py-2 bg-[#191D28] border border-[#1E222A] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8E9299] uppercase mb-1 block">
                  Reason for Modification *
                </label>
                <input
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  required
                  placeholder="e.g. Correcting typos in cycle count or job order number"
                  className="w-full px-3 py-2 bg-[#191D28] border border-[#1E222A] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
                />
              </div>

              {/* Cycle Impact Preview */}
              {editTargetSet && (
                <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-xl space-y-1.5 text-xs text-sky-300">
                  <div className="font-bold flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    <span>Recalculation Impact:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-300">
                    <div>Original Cycles: <strong className="text-white">+{oldCyclesVal.toLocaleString()}</strong></div>
                    <div>New Cycles: <strong className="text-white">+{newCyclesVal.toLocaleString()}</strong></div>
                    <div>Cycle Difference: <strong className={cycleDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{cycleDelta >= 0 ? `+${cycleDelta.toLocaleString()}` : cycleDelta.toLocaleString()}</strong></div>
                    <div>Set New Total: <strong className="text-sky-400 font-mono">{projectedSetCycle.toLocaleString()} cycles</strong></div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1E222A]">
                <button
                  type="button"
                  disabled={isSavingEdit}
                  onClick={() => setEditingLog(null)}
                  className="px-4 py-2 bg-[#191D28] hover:bg-[#252A38] text-gray-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex items-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 transition-all"
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save & Recalculate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE PRODUCTION LOG MODAL */}
      {deletingProdLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#0F1117] border border-[#1E222A] rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E222A] pb-3">
              <div className="flex items-center gap-2 text-rose-500">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-white uppercase tracking-tight">Delete Production Log</h3>
              </div>
              {!isDeletingProd && (
                <button
                  type="button"
                  onClick={() => setDeletingProdLog(null)}
                  className="text-[#8E9299] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-300 leading-relaxed">
                Are you sure you want to permanently delete this production log?
              </p>

              <div className="p-3 bg-[#191D28] rounded-xl border border-[#1E222A] space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8E9299]">Date:</span>
                  <span className="text-white font-medium">{deletingProdLog.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E9299]">Set:</span>
                  <span className="text-[#F27D26] font-bold">
                    {sets.find((s) => s.id === deletingProdLog.setId)?.displayName || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E9299]">Job Order:</span>
                  <span className="text-white font-mono">{deletingProdLog.jobOrderId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E9299]">Cycles to Deduct:</span>
                  <span className="text-rose-400 font-mono font-bold">
                    -{deletingProdLog.productionCycles.toLocaleString()} cycles
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E9299]">Operator:</span>
                  <span className="text-white">{deletingProdLog.operatorId}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#8E9299] uppercase tracking-wider block mb-1">
                  Reason for Deletion (Optional):
                </label>
                <input
                  type="text"
                  value={deleteProdReason}
                  onChange={(e) => setDeleteProdReason(e.target.value)}
                  placeholder="e.g. Duplicate entry / wrong machine set selected"
                  className="w-full px-3 py-2 bg-[#0A0B0E] border border-[#1E222A] text-white rounded-lg text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1E222A]">
              <button
                type="button"
                disabled={isDeletingProd}
                onClick={() => setDeletingProdLog(null)}
                className="px-4 py-2 bg-[#191D28] hover:bg-[#252A38] text-gray-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingProd}
                onClick={handleConfirmDeleteProduction}
                className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 transition-all"
              >
                {isDeletingProd ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Delete Log</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE SET CONFIRMATION MODAL */}
      {setToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#0F1117] border border-[#1E222A] rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E222A] pb-3">
              <div className="flex items-center gap-2 text-rose-500">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Delete Master Set</h3>
              </div>
              {!isDeletingSet && (
                <button
                  type="button"
                  onClick={() => setSetToDelete(null)}
                  className="text-[#8E9299] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-300 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-white">{setToDelete.displayName} ({setToDelete.shortCode})</strong>?
              </p>
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400">
                ⚠️ This will cascade and delete all associated plate positions (P01-P11), plate tracking history, and daily production records for this set.
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-bold text-[#8E9299] uppercase tracking-wider block">
                  Deletion Reason (Optional):
                </label>
                <input
                  type="text"
                  value={deleteSetReason}
                  onChange={(e) => setDeleteSetReason(e.target.value)}
                  placeholder="e.g. Machine decommissioned / Duplicate set created by error"
                  className="w-full px-3 py-2 bg-[#0A0B0E] border border-[#1E222A] text-white rounded-lg text-xs focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1E222A]">
              <button
                type="button"
                disabled={isDeletingSet}
                onClick={() => setSetToDelete(null)}
                className="px-4 py-2 bg-[#191D28] hover:bg-[#252A38] border border-[#1E222A] text-gray-300 rounded-lg text-xs font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingSet}
                onClick={handleConfirmDeleteSet}
                className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 transition-all"
              >
                {isDeletingSet ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deleting Set...</span>
                  </>
                ) : (
                  <span>Yes, Delete Set</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE PLATE LOG CONFIRMATION MODAL */}
      {deletingPlateLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#0F1117] border border-[#1E222A] rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E222A] pb-3">
              <div className="flex items-center gap-2 text-rose-500">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-white uppercase tracking-tight">Delete Plate Log</h3>
              </div>
              {!isDeletingPlateLog && (
                <button
                  type="button"
                  onClick={() => setDeletingPlateLog(null)}
                  className="text-[#8E9299] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-300 leading-relaxed">
                Are you sure you want to permanently delete this {deletingPlateLog.type} log?
              </p>

              <div className="p-3 bg-[#191D28] rounded-xl border border-[#1E222A] space-y-1 text-xs">
                <div className="text-white font-bold">{deletingPlateLog.title}</div>
                <div className="text-[#8E9299]">{deletingPlateLog.details}</div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#8E9299] uppercase tracking-wider block mb-1">
                  Reason for Deletion (Optional):
                </label>
                <input
                  type="text"
                  value={deletePlateLogReason}
                  onChange={(e) => setDeletePlateLogReason(e.target.value)}
                  placeholder="e.g. Test entry / duplicated plate swap"
                  className="w-full px-3 py-2 bg-[#0A0B0E] border border-[#1E222A] text-white rounded-lg text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1E222A]">
              <button
                type="button"
                disabled={isDeletingPlateLog}
                onClick={() => setDeletingPlateLog(null)}
                className="px-4 py-2 bg-[#191D28] hover:bg-[#252A38] text-gray-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingPlateLog}
                onClick={handleConfirmDeletePlateLog}
                className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 transition-all"
              >
                {isDeletingPlateLog ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Yes, Delete Log</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTORE FACTORY CONFIRMATION MODAL */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#0F1117] border border-[#1E222A] rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E222A] pb-3">
              <div className="flex items-center gap-2 text-rose-500">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Factory Reset</h3>
              </div>
              {!isRestoring && (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmationText('');
                    setShowRestoreModal(false);
                  }}
                  className="text-[#8E9299] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {restoreSuccess ? (
              <div className="py-6 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                <h4 className="text-lg font-bold text-white">Factory Reset Complete</h4>
                <p className="text-xs text-[#8E9299]">System has been restored to default factory settings.</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <p className="text-xs text-rose-400 uppercase font-bold tracking-wider">Warning: Critical Action</p>
                  <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    This will permanently erase ALL PLMSys data, including personnel, plates, job orders, production records, history, and settings.

This action cannot be undone.

Do you want to continue?
                  </p>
                  
                  <div className="space-y-1.5 pt-2">
                    <label className="text-[10px] font-bold text-[#8E9299] uppercase tracking-wider block">
                      Type <span className="text-rose-400">RESET</span> to confirm:
                    </label>
                    <input
                      type="text"
                      value={confirmationText}
                      onChange={(e) => setConfirmationText(e.target.value)}
                      placeholder="RESET"
                      disabled={isRestoring}
                      className="w-full px-3 py-2 bg-[#0A0B0E] border border-[#1E222A] text-white rounded-lg text-xs focus:outline-none focus:border-rose-500 transition-colors uppercase font-mono tracking-widest text-center"
                    />
                  </div>
                </div>

                {restoreError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 font-semibold">
                    {restoreError}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1E222A]">
                  <button
                    type="button"
                    disabled={isRestoring}
                    onClick={() => {
                      setConfirmationText('');
                      setShowRestoreModal(false);
                    }}
                    className="px-4 py-2 bg-[#191D28] hover:bg-[#252A38] border border-[#1E222A] text-gray-300 rounded-lg text-xs font-semibold disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isRestoring || confirmationText.trim().toUpperCase() !== 'RESET'}
                    onClick={handleConfirmRestore}
                    className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-600/30 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 transition-all"
                  >
                    {isRestoring ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Restoring...
                      </>
                    ) : (
                      'Yes, Restore Factory Settings'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
