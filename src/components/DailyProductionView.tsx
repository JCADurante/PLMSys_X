import React, { useState, useEffect } from 'react';
import { DailyProductionRecord, SetRecord, JobOrderRecord } from '../types';
import { Activity, Calendar, FileText, CheckCircle2, Search, Plus, Clock, Filter, Radio } from 'lucide-react';
import { getTodayStr, getNowTimeStr, getTotalTodayProduction, getTodayLogEntriesCount } from '../utils';

interface DailyProductionViewProps {
  dailyProductions: DailyProductionRecord[];
  sets: SetRecord[];
  jobOrders: JobOrderRecord[];
  onOpenLogProduction?: () => void;
}

export const DailyProductionView: React.FC<DailyProductionViewProps> = ({
  dailyProductions,
  sets,
  jobOrders,
  onOpenLogProduction,
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

  // Real-time calculations
  const totalProductionToday = getTotalTodayProduction(sets, dailyProductions, todayStr);
  const todayEntriesCount = getTodayLogEntriesCount(dailyProductions, todayStr);
  const setsUpdatedToday = new Set(
    dailyProductions.filter((dp) => dp.date === todayStr).map((dp) => dp.setId)
  ).size;

  const sortedProductions = [...dailyProductions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filteredProductions = sortedProductions.filter((prod) => {
    const matchesOperator = prod.operatorId.toLowerCase().includes(operatorFilter.toLowerCase());
    const matchesSet = setFilter === 'ALL' || prod.setId === setFilter;
    const matchesDate = dateFilterMode === 'ALL' || prod.date === todayStr;
    return matchesOperator && matchesSet && matchesDate;
  });

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

      <div className="bg-[#0F1117] p-6 rounded-2xl shadow-sm border border-[#1E222A] text-[#E0E2E5]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#F27D26]" /> Daily Production Records
            </h2>
            <p className="text-xs text-[#8E9299]">
              Set production logs showing previous cycle, today's added production, and current cumulative cycle.
            </p>
          </div>
          {onOpenLogProduction && (
            <button
              onClick={onOpenLogProduction}
              className="flex items-center gap-2 px-4 py-2 bg-[#F27D26] hover:bg-[#d96a1a] text-white rounded-lg text-sm font-bold transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Log Production
            </button>
          )}
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
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                dateFilterMode === 'ALL'
                  ? 'bg-[#F27D26] text-white'
                  : 'text-[#8E9299] hover:text-white'
              }`}
            >
              All Records ({sortedProductions.length})
            </button>
            <button
              onClick={() => setDateFilterMode('TODAY')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
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

        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#191D28] text-xs font-semibold text-[#8E9299] uppercase">
                <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A]">Date</th>
                <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A]">Set</th>
                <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A]">Job Order</th>
                <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A] text-right">Previous Cycle</th>
                <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A] text-right">Added Production</th>
                <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A] text-right">Current Cycle</th>
                <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A]">Operator</th>
                <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A]">Checked By</th>
                <th className="p-3 bg-[#191D28] border-b-2 border-[#1E222A]">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E222A] text-sm">
              {filteredProductions.map((prod) => {
                const setRecord = sets.find((s) => s.id === prod.setId);
                const isToday = prod.date === todayStr;

                return (
                  <tr key={prod.id} className={`hover:bg-[#191D28]/50 ${isToday ? 'bg-sky-500/5' : ''}`}>
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
                    <td className="p-3 text-xs font-medium text-white">{prod.operatorId}</td>
                    <td className="p-3 text-xs text-[#8E9299]">{prod.checkedBy}</td>
                    <td className="p-3 text-xs text-[#8E9299] max-w-xs break-words whitespace-normal">{prod.remarks || '—'}</td>
                  </tr>
                );
              })}
              {filteredProductions.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-[#8E9299]">
                    No daily production logs found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
