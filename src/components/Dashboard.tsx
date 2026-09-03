import React, { useState, useEffect } from 'react';
import { SetRecord, PositionRecord, PlateRecord, PlateInstallationRecord, PlateRemovalRecord, DailyProductionRecord, User, Personnel } from '../types';
import { Layers, Activity, Search, Plus, ArrowRight, Sliders, Edit2, Check, X, AlertCircle, CheckCircle2, Calendar, Archive, Clock, TrendingUp, BarChart2, Radio } from 'lucide-react';
import { getTodayStr, getNowTimeStr, getTotalTodayProduction, getTodayLogEntriesCount } from '../utils';

interface DashboardProps {
  sets: SetRecord[];
  positions: PositionRecord[];
  plates: PlateRecord[];
  installations: PlateInstallationRecord[];
  removals: PlateRemovalRecord[];
  dailyProductions?: DailyProductionRecord[];
  currentUser: User;
  personnel: Personnel[];
  onSelectSet: (setId: string) => void;
  onOpenCreateSet: () => void;
  onOpenLogProduction: () => void;
  onOpenRegistry: () => void;
  onUpdateSet?: (
    setId: string,
    displayName: string,
    shortCode: string,
    status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE',
    currentTotalCycle: number
  ) => Promise<void>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  sets,
  positions,
  plates,
  installations,
  removals,
  dailyProductions = [],
  currentUser,
  personnel,
  onSelectSet,
  onOpenCreateSet,
  onOpenLogProduction,
  onOpenRegistry,
  onUpdateSet,
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

  const activePlatesCount = plates.filter(p => p.status === 'ACTIVE').length;
  const rejectedPlatesCount = plates.filter(p => p.status === 'REJECTED').length;
  const retiredPlatesCount = plates.filter(p => p.status === 'RETIRED').length;
  
  // Real-time calculation of today's production from actual logs & sets
  const totalProductionToday = getTotalTodayProduction(sets, dailyProductions, todayStr);
  const todayEntriesCount = getTodayLogEntriesCount(dailyProductions, todayStr);

  // 1. Average Lifespan of Rejected Plates
  const rejectedRemovals = removals.filter(r => r.status === 'REJECTED');
  let rejectedTotalLifespan = 0;
  rejectedRemovals.forEach(rem => {
    const inst = installations.find(i => i.plateId === rem.plateId && i.setId === rem.setId && i.positionId === rem.positionId);
    const lifespan = rem.totalCyclesAchieved + (inst?.initialCycles || 0);
    rejectedTotalLifespan += lifespan;
  });
  const avgRejectedLifespan = rejectedRemovals.length > 0 ? Math.round(rejectedTotalLifespan / rejectedRemovals.length) : 0;

  // 2. Average Lifespan of Retired Plates
  const retiredRemovals = removals.filter(r => r.status === 'RETIRED');
  let retiredTotalLifespan = 0;
  retiredRemovals.forEach(rem => {
    const inst = installations.find(i => i.plateId === rem.plateId && i.setId === rem.setId && i.positionId === rem.positionId);
    const lifespan = rem.totalCyclesAchieved + (inst?.initialCycles || 0);
    retiredTotalLifespan += lifespan;
  });
  const avgRetiredLifespan = retiredRemovals.length > 0 ? Math.round(retiredTotalLifespan / retiredRemovals.length) : 0;

  // 3. Average Total Lifespan (Retired + Rejected)
  const combinedRemovals = removals.filter(r => r.status === 'RETIRED' || r.status === 'REJECTED');
  let combinedTotalLifespan = 0;
  combinedRemovals.forEach(rem => {
    const inst = installations.find(i => i.plateId === rem.plateId && i.setId === rem.setId && i.positionId === rem.positionId);
    const lifespan = rem.totalCyclesAchieved + (inst?.initialCycles || 0);
    combinedTotalLifespan += lifespan;
  });
  const avgTotalLifespan = combinedRemovals.length > 0 ? Math.round(combinedTotalLifespan / combinedRemovals.length) : 0;

  return (
    <div className="container-fluid py-4">
      {/* Top Banner & Quick Actions */}
      <div className="card shadow-sm border-secondary mb-4">
        <div className="card-body d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h2 className="card-title fw-bolder text-light mb-0">Plate Lifecycle & Set Operations</h2>
            </div>
            <p className="text-secondary small mb-0 font-mono">
              System Time: <span className="text-light fw-bold">{currentTimeStr}</span> · Shift Date: <span className="text-light fw-bold">{todayStr}</span>
            </p>
          </div>
          <div className="d-flex align-items-center gap-3 flex-wrap">
            {(currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR' || currentUser.role === 'LEADMAN') && (
              <button
                onClick={onOpenRegistry}
                className="btn btn-primary d-inline-flex align-items-center gap-2 shadow-sm"
              >
                <Layers className="w-4 h-4" /> Registry
              </button>
            )}
            <button
              onClick={onOpenLogProduction}
              className="btn btn-primary d-inline-flex align-items-center gap-2 shadow-sm"
            >
              <Activity className="w-4 h-4" /> Log Production
            </button>
            <button
              onClick={onOpenCreateSet}
              className="btn btn-primary d-inline-flex align-items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> New Set
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Section: Operational Counts */}
      <div className="mb-4">
        <div className="text-muted small fw-bold text-uppercase tracking-wider mb-3 d-flex align-items-center justify-content-between">
          <span className="d-flex align-items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" /> Operational Plate Metrics
          </span>
        </div>
        <div className="row g-3">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card h-100 shadow-sm border-secondary bg-dark-subtle">
              <div className="card-body d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-muted small fw-semibold text-uppercase">Active Plates</div>
                  <div className="fs-3 fw-bolder text-success mt-1">{activePlatesCount.toLocaleString()}</div>
                  <div className="text-muted small mt-1">Currently installed & running</div>
                </div>
                <div className="p-2 bg-success bg-opacity-10 rounded text-success">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card h-100 shadow-sm border-info bg-dark-subtle position-relative overflow-hidden">
              <div className="position-absolute top-0 end-0 px-2 py-0.5 bg-info/20 text-info border-bottom-start rounded-bl text-[10px] font-mono fw-bold d-flex align-items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-info animate-pulse" /> LIVE TODAY
              </div>
              <div className="card-body d-flex justify-content-between align-items-start pt-3">
                <div>
                  <div className="text-info small fw-bold text-uppercase d-flex align-items-center gap-1">
                    Today's Production
                  </div>
                  <div className="fs-3 fw-bolder text-info mt-1">+{totalProductionToday.toLocaleString()}</div>
                  <div className="text-muted small mt-1 font-mono">
                    {todayEntriesCount > 0 ? (
                      <span className="text-sky-300">
                        {todayEntriesCount} {todayEntriesCount === 1 ? 'log' : 'logs'} recorded today
                      </span>
                    ) : (
                      <span>0 cycles logged today yet</span>
                    )}
                  </div>
                </div>
                <div className="p-2 bg-info bg-opacity-10 rounded text-info mt-2">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card h-100 shadow-sm border-secondary bg-dark-subtle">
              <div className="card-body d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-muted small fw-semibold text-uppercase">Rejected Plates</div>
                  <div className="fs-3 fw-bolder text-danger mt-1">{rejectedPlatesCount.toLocaleString()}</div>
                  <div className="text-muted small mt-1">Logged with reject / defect reason</div>
                </div>
                <div className="p-2 bg-danger bg-opacity-10 rounded text-danger">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card h-100 shadow-sm border-secondary bg-dark-subtle">
              <div className="card-body d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-muted small fw-semibold text-uppercase">Retired Plates</div>
                  <div className="fs-3 fw-bolder text-warning mt-1">{retiredPlatesCount.toLocaleString()}</div>
                  <div className="text-muted small mt-1">Scheduled end-of-life retirement</div>
                </div>
                <div className="p-2 bg-warning bg-opacity-10 rounded text-warning">
                  <Archive className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Section: Lifespan & Performance Analytics */}
      <div className="mb-4">
        <div className="text-muted small fw-bold text-uppercase tracking-wider mb-3 d-flex align-items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Lifespan Performance Analytics
        </div>
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <div className="card h-100 shadow-sm border-secondary bg-dark-subtle">
              <div className="card-body d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-muted small fw-semibold text-uppercase">Avg Lifespan (Rejected)</div>
                  <div className="fs-3 fw-bolder text-danger mt-1">
                    {avgRejectedLifespan > 0 ? `${avgRejectedLifespan.toLocaleString()}` : '—'}
                    {avgRejectedLifespan > 0 && <span className="text-muted fs-6 fw-normal ms-1">cycles</span>}
                  </div>
                  <div className="text-muted small mt-1">Average cycles reached before rejection</div>
                </div>
                <div className="p-2 bg-danger bg-opacity-10 rounded text-danger">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card h-100 shadow-sm border-secondary bg-dark-subtle">
              <div className="card-body d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-muted small fw-semibold text-uppercase">Avg Lifespan (Retired)</div>
                  <div className="fs-3 fw-bolder text-warning mt-1">
                    {avgRetiredLifespan > 0 ? `${avgRetiredLifespan.toLocaleString()}` : '—'}
                    {avgRetiredLifespan > 0 && <span className="text-muted fs-6 fw-normal ms-1">cycles</span>}
                  </div>
                  <div className="text-muted small mt-1">Average cycles reached upon planned retirement</div>
                </div>
                <div className="p-2 bg-warning bg-opacity-10 rounded text-warning">
                  <Archive className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4">
            <div className="card h-100 shadow-sm border-secondary bg-dark-subtle">
              <div className="card-body d-flex justify-content-between align-items-start">
                <div>
                  <div className="text-muted small fw-semibold text-uppercase">Ave Total Lifespan</div>
                  <div className="fs-3 fw-bolder text-success mt-1">
                    {avgTotalLifespan > 0 ? `${avgTotalLifespan.toLocaleString()}` : '—'}
                    {avgTotalLifespan > 0 && <span className="text-muted fs-6 fw-normal ms-1">cycles</span>}
                  </div>
                  <div className="text-muted small mt-1">Combined fleet average terminal lifespan</div>
                </div>
                <div className="p-2 bg-success bg-opacity-10 rounded text-success">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

