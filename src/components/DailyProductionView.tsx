import React, { useState, useEffect } from 'react';
import { DailyProductionRecord, SetRecord, JobOrderRecord, User, Personnel } from '../types';
import { 
  Activity, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Search, 
  Plus, 
  Clock, 
  Filter, 
  Pencil, 
  Trash2, 
  X, 
  RefreshCw, 
  AlertTriangle,
  Layers,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { 
  getTodayStr, 
  getNowTimeStr, 
  getTotalTodayProduction, 
  getTodayLogEntriesCount, 
  formatJobOrder
} from '../utils';

interface DailyProductionViewProps {
  dailyProductions: DailyProductionRecord[];
  sets: SetRecord[];
  jobOrders: JobOrderRecord[];
  personnel?: Personnel[];
  currentUser?: User;
  onOpenLogProduction?: () => void;
  onDeleteProduction?: (prodId: string, reason?: string) => Promise<void>;
  onEditProduction?: (prodId: string, updatedFields: Partial<DailyProductionRecord>, reason: string) => Promise<void>;
}

export const DailyProductionView: React.FC<DailyProductionViewProps> = ({
  dailyProductions,
  sets,
  jobOrders,
  personnel = [],
  currentUser,
  onOpenLogProduction,
  onDeleteProduction,
  onEditProduction,
}) => {
  const [liveTime, setLiveTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = getTodayStr(liveTime);
  const currentTimeStr = getNowTimeStr(liveTime);

  const [operatorFilter, setOperatorFilter] = useState('');
  const [setFilter, setSetFilter] = useState('ALL');
  const [dateFilterMode, setDateFilterMode] = useState<'ALL' | 'TODAY'>('ALL');

  // Edit Modal State
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

  // Delete Confirm Modal State
  const [deletingLog, setDeletingLog] = useState<DailyProductionRecord | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Real-time calculations
  const totalProductionToday = getTotalTodayProduction(sets, dailyProductions, todayStr);
  const todayEntriesCount = getTodayLogEntriesCount(dailyProductions, todayStr);
  const setsUpdatedToday = new Set(
    dailyProductions.filter((dp) => dp.date === todayStr).map((dp) => dp.setId)
  ).size;

  const sortedProductions = [...dailyProductions].sort(
    (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
  );

  const filteredProductions = sortedProductions.filter((prod) => {
    const matchesOperator = prod.operatorId.toLowerCase().includes(operatorFilter.toLowerCase());
    const matchesSet = setFilter === 'ALL' || prod.setId === setFilter;
    const matchesDate = dateFilterMode === 'ALL' || prod.date === todayStr;
    return matchesOperator && matchesSet && matchesDate;
  });

  const handleOpenEdit = (log: DailyProductionRecord) => {
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

  const handleSaveEdit = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      setEditError(err?.message || 'Failed to save changes.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingLog || !onDeleteProduction) return;
    setIsDeleting(true);
    try {
      await onDeleteProduction(deletingLog.id, deleteReason.trim() || undefined);
      setDeletingLog(null);
      setDeleteReason('');
    } catch (err: any) {
      alert(`Failed to delete production log: ${err?.message || String(err)}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Preview calculations for Edit modal
  const editTargetSet = sets.find((s) => s.id === editSetId);
  const oldCyclesVal = editingLog ? editingLog.productionCycles : 0;
  const newCyclesVal = parseInt(editCycles, 10) || 0;
  const cycleDelta = newCyclesVal - oldCyclesVal;
  const projectedSetCycle = editTargetSet
    ? Math.max(editTargetSet.initialCycle || 0, editTargetSet.currentTotalCycle + cycleDelta)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Real-time Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0F1117] p-5 rounded-2xl border border-sky-500/30 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Today's Real-Time Production</span>
            <span className="badge bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" /> LIVE
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white mt-2 font-mono">
            +{totalProductionToday.toLocaleString()} <span className="text-sm font-normal text-sky-400">cycles</span>
          </div>
          <div className="text-xs text-[#8E9299] mt-1 font-mono">
            Live as of {currentTimeStr} · {todayStr}
          </div>
        </div>

        <div className="bg-[#0F1117] p-5 rounded-2xl border border-[#1E222A] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8E9299] uppercase tracking-wider">Today's Log Batches</span>
            <Activity className="w-4 h-4 text-[#F27D26]" />
          </div>
          <div className="text-3xl font-extrabold text-white mt-2 font-mono">
            {todayEntriesCount.toLocaleString()} <span className="text-sm font-normal text-[#8E9299]">entries</span>
          </div>
          <div className="text-xs text-[#8E9299] mt-1">
            Recorded in current production shift
          </div>
        </div>

        <div className="bg-[#0F1117] p-5 rounded-2xl border border-[#1E222A] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#8E9299] uppercase tracking-wider">Sets Active Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono">
            {setsUpdatedToday} <span className="text-sm font-normal text-[#8E9299]">/ {sets.length} Sets</span>
          </div>
          <div className="text-xs text-[#8E9299] mt-1">
            Sets with cycles recorded today
          </div>
        </div>
      </div>

      {/* Main Records Table Card */}
      <div className="bg-[#0F1117] p-6 rounded-2xl shadow-sm border border-[#1E222A] text-[#E0E2E5]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#F27D26]" /> Daily Production Records
            </h2>
            <p className="text-xs text-[#8E9299]">
              Live production logs showing previous cycle, today's added production, and current cumulative cycle.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenLogProduction && (
              <button
                type="button"
                onClick={onOpenLogProduction}
                className="flex items-center gap-2 px-4 py-2 bg-[#F27D26] hover:bg-[#d96a1a] text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Log Production
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Filter by operator..."
              value={operatorFilter}
              onChange={(e) => setOperatorFilter(e.target.value)}
              className="px-3 py-2 bg-[#191D28] border border-[#1E222A] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F27D26]"
            />
            <select
              value={setFilter}
              onChange={(e) => setSetFilter(e.target.value)}
              className="px-3 py-2 bg-[#191D28] border border-[#1E222A] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F27D26]"
            >
              <option value="ALL">All Sets</option>
              {sets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.displayName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-[#191D28] p-1 rounded-lg border border-[#1E222A]">
            <button
              onClick={() => setDateFilterMode('ALL')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                dateFilterMode === 'ALL'
                  ? 'bg-[#F27D26] text-white'
                  : 'text-[#8E9299] hover:text-white'
              }`}
            >
              All Records ({sortedProductions.length})
            </button>
            <button
              onClick={() => setDateFilterMode('TODAY')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                dateFilterMode === 'TODAY'
                  ? 'bg-sky-500 text-white font-bold'
                  : 'text-[#8E9299] hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              Today Only ({todayEntriesCount})
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[520px] overflow-y-auto rounded-xl border border-[#1E222A]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#191D28] text-xs font-semibold text-[#8E9299] uppercase tracking-wider">
                <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A]">Date</th>
                <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A]">Set</th>
                <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A]">Job Order</th>
                <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A] text-right">Previous Cycle</th>
                <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A] text-right">Added Production</th>
                <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A] text-right">Current Cycle</th>
                <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A]">Operator</th>
                <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A]">Checked By</th>
                <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A]">Remarks</th>
                {currentUser?.role === 'ADMIN' && (
                  <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A] text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E222A] text-sm">
              {filteredProductions.map((prod) => {
                const setRecord = sets.find((s) => s.id === prod.setId);
                const isToday = prod.date === todayStr;

                return (
                  <tr key={prod.id} className={`hover:bg-[#191D28]/50 transition-colors ${isToday ? 'bg-sky-500/5' : ''}`}>
                    <td className="p-3 font-medium text-white whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{prod.date}</span>
                        {isToday && (
                          <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-mono px-1.5 py-0.2 rounded font-bold">
                            TODAY
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-[#F27D26] whitespace-nowrap">
                      {setRecord?.displayName || 'Unknown Set'}
                    </td>
                    <td className="p-3 text-[#E0E2E5] whitespace-nowrap">
                      <span className="bg-[#191D28] px-2 py-1 rounded text-xs font-mono font-semibold text-[#8E9299] border border-[#1E222A]">
                        {prod.jobOrderId || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-[#8E9299]">{prod.previousTotalCycle.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono font-bold text-sky-400">+{prod.productionCycles.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono font-extrabold text-white">{prod.currentTotalCycle.toLocaleString()}</td>
                    <td className="p-3 text-xs font-medium text-white whitespace-nowrap">{prod.operatorId}</td>
                    <td className="p-3 text-xs text-[#8E9299] whitespace-nowrap">{prod.checkedBy || '—'}</td>
                    <td className="p-3 text-xs text-[#8E9299] max-w-xs break-words whitespace-normal">{prod.remarks || '—'}</td>
                    {currentUser?.role === 'ADMIN' && (
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="Edit Production Log"
                            onClick={() => handleOpenEdit(prod)}
                            className="p-1.5 bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white border border-sky-500/20 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            type="button"
                            title="Delete Production Log"
                            onClick={() => {
                              setDeletingLog(prod);
                              setDeleteReason('');
                            }}
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              {filteredProductions.length === 0 && (
                <tr>
                  <td colSpan={currentUser?.role === 'ADMIN' ? 10 : 9} className="p-8 text-center text-[#8E9299]">
                    No daily production logs found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT PRODUCTION LOG MODAL (ADMIN ONLY) */}
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

            <form onSubmit={handleSaveEdit} className="space-y-4">
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
                    list="operator-list-edit"
                    value={editOperatorId}
                    onChange={(e) => setEditOperatorId(e.target.value)}
                    required
                    placeholder="Operator name"
                    className="w-full px-3 py-2 bg-[#191D28] border border-[#1E222A] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#F27D26]"
                  />
                  <datalist id="operator-list-edit">
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

      {/* DELETE PRODUCTION LOG CONFIRMATION MODAL */}
      {deletingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#0F1117] border border-[#1E222A] rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1E222A] pb-3">
              <div className="flex items-center gap-2 text-rose-500">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-white uppercase tracking-tight">Delete Production Log</h3>
              </div>
              {!isDeleting && (
                <button
                  type="button"
                  onClick={() => setDeletingLog(null)}
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
                  <span className="text-white font-medium">{deletingLog.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E9299]">Set:</span>
                  <span className="text-[#F27D26] font-bold">
                    {sets.find((s) => s.id === deletingLog.setId)?.displayName || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E9299]">Job Order:</span>
                  <span className="text-white font-mono">{deletingLog.jobOrderId || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E9299]">Cycles to Deduct:</span>
                  <span className="text-rose-400 font-mono font-bold">
                    -{deletingLog.productionCycles.toLocaleString()} cycles
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E9299]">Operator:</span>
                  <span className="text-white">{deletingLog.operatorId}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#8E9299] uppercase tracking-wider block mb-1">
                  Reason for Deletion (Optional):
                </label>
                <input
                  type="text"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="e.g. Duplicate entry / wrong machine set selected"
                  className="w-full px-3 py-2 bg-[#0A0B0E] border border-[#1E222A] text-white rounded-lg text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#1E222A]">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingLog(null)}
                className="px-4 py-2 bg-[#191D28] hover:bg-[#252A38] text-gray-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 transition-all"
              >
                {isDeleting ? (
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
    </div>
  );
};
