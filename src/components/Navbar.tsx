import React, { useEffect } from 'react';
import {
  Layers,
  Activity,
  Search,
  FileText,
  Sliders,
  Shield,
  HelpCircle,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { User as UserType, SetRecord } from '../types';
import { centralSync, SyncStatus } from '../services/centralSyncService';

interface NavbarProps {
  activeTab: 'dashboard' | 'manage-set' | 'production' | 'search' | 'audit' | 'database' | 'admin';
  setActiveTab: (tab: 'dashboard' | 'manage-set' | 'production' | 'search' | 'audit' | 'database' | 'admin') => void;
  totalPositions: number;
  activeSetsCount: number;
  currentUser: UserType;
  sets?: SetRecord[];
  selectedSetId?: string | null;
  onSelectSet?: (setId: string) => void;
  onOpenLogin: () => void;
  onOpenAdminLogin?: () => void;
  onLogout?: () => void;
  onOpenTutorial: () => void;
  onOpenCreateSet?: () => void;
  onOpenLogProduction?: () => void;
  onOpenRegistry?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  selectedSetId,
  onOpenLogin,
  onLogout,
  onOpenTutorial,
}) => {
  const [syncStatus, setSyncStatus] = React.useState<SyncStatus>(centralSync.getStatus());
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  useEffect(() => {
    return centralSync.subscribeStatus((st) => setSyncStatus(st));
  }, []);

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    try {
      await centralSync.forceHardRefreshFromServer();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Global Keyboard Shortcuts (Alt+1 to Alt+6)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.altKey) {
        if (e.key === '1') {
          e.preventDefault();
          setActiveTab('dashboard');
        } else if (e.key === '2') {
          e.preventDefault();
          setActiveTab('manage-set');
        } else if (e.key === '3') {
          e.preventDefault();
          setActiveTab('production');
        } else if (e.key === '4') {
          e.preventDefault();
          setActiveTab('search');
        } else if (e.key === '5') {
          e.preventDefault();
          setActiveTab('audit');
        } else if ((e.key === '6' || e.key.toLowerCase() === 'a') && (currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR')) {
          e.preventDefault();
          setActiveTab('admin');
        }
      } else if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onOpenTutorial();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab, onOpenTutorial, currentUser.role]);

  const getRoleBadge = () => {
    switch (currentUser.role) {
      case 'ADMIN':
        return {
          bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-400',
          label: currentUser.name && currentUser.name !== 'Admin' && currentUser.name !== 'Administrator' ? `${currentUser.name} (Admin)` : 'Admin'
        };
      case 'SUPERVISOR':
        return {
          bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
          dot: 'bg-purple-400',
          label: currentUser.name && currentUser.name !== 'Supervisor' ? `${currentUser.name} (Supervisor)` : 'Supervisor'
        };
      case 'LEADMAN':
        return {
          bg: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
          dot: 'bg-teal-400',
          label: currentUser.name && currentUser.name !== 'Leadman' ? `${currentUser.name} (Leadman)` : 'Leadman'
        };
      case 'OPERATOR':
      default:
        return {
          bg: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
          dot: 'bg-sky-400',
          label: 'Operator'
        };
    }
  };

  const badge = getRoleBadge();

  return (
    <header className="navbar-custom sticky-top shadow-sm border-bottom border-secondary">
      <div className="container-fluid d-flex align-items-center justify-content-between gap-3 px-3 px-md-4 px-lg-5 h-100">
        
        {/* Left: Brand Identity + Logged Account (Operator/Admin) + Walkthrough Button */}
        <div className="d-flex align-items-center gap-2.5 flex-shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="navbar-brand-btn d-flex align-items-center gap-2.5 text-decoration-none border-0 bg-transparent p-0 text-start"
            title="PLM System Dashboard"
          >
            <div className="brand-icon-box bg-primary rounded d-flex align-items-center justify-content-center text-white shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div className="d-flex flex-column justify-content-center">
              <div className="d-flex align-items-center gap-1.5">
                <span className="brand-title text-white fw-bold text-uppercase tracking-wider">
                  PLM System
                </span>
                <span className="badge bg-dark-subtle text-primary border border-secondary px-1.5 py-0.5 rounded text-[10px] fw-semibold">
                  v1.1
                </span>
              </div>
              <div className="d-flex align-items-center gap-1 mt-0.5">
                <span className={`badge px-1.5 py-0.5 rounded text-[10px] fw-bold d-inline-flex align-items-center gap-1 border ${badge.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                  {badge.label}
                </span>
              </div>
            </div>
          </button>

          {/* PLM System Walkthrough button (Icon only, placed beside PLM System on left side top most part) */}
          <button
            type="button"
            onClick={onOpenTutorial}
            className="d-flex align-items-center justify-content-center p-2 rounded bg-[#161B26] hover:bg-[#202738] border border-[#2A3142] text-sky-400 hover:text-sky-300 transition-all cursor-pointer shadow-sm"
            title="PLM System Interactive Walkthrough & Guide (Press ?)"
            aria-label="Walkthrough Guide"
          >
            <HelpCircle className="w-4 h-4 text-sky-400" />
          </button>
        </div>

        {/* Center: Main Direct Navigation (Dashboard, Monitoring, Production, Search, Audit, Admin) */}
        <nav className="header-nav-container d-flex align-items-center gap-1 mx-2 flex-grow-1 justify-content-center" aria-label="Main navigation">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`header-nav-btn ${activeTab === 'dashboard' && !selectedSetId ? 'active' : ''}`}
            title="Alt+1: Sets Overview Dashboard"
          >
            <Layers className="w-4 h-4 flex-shrink-0" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('manage-set')}
            className={`header-nav-btn ${activeTab === 'manage-set' ? 'active' : ''}`}
            title="Alt+2: Set & Plate Monitoring"
          >
            <Sliders className="w-4 h-4 flex-shrink-0" />
            <span>Monitoring</span>
          </button>

          <button
            onClick={() => setActiveTab('production')}
            className={`header-nav-btn ${activeTab === 'production' ? 'active' : ''}`}
            title="Alt+3: Daily Production Logs"
          >
            <Activity className="w-4 h-4 flex-shrink-0" />
            <span>Production</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`header-nav-btn ${activeTab === 'search' ? 'active' : ''}`}
            title="Alt+4: Global Plate & JO Search"
          >
            <Search className="w-4 h-4 flex-shrink-0" />
            <span>Plate Search</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`header-nav-btn ${activeTab === 'audit' ? 'active' : ''}`}
            title="Alt+5: Audit Log & History"
          >
            <FileText className="w-4 h-4 flex-shrink-0" />
            <span>Audit Log</span>
          </button>

          {(currentUser.role === 'ADMIN' || currentUser.role === 'SUPERVISOR') && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`header-nav-btn ${activeTab === 'admin' || activeTab === 'database' ? 'active' : ''}`}
              title="Alt+6: Admin Dashboard, DB Studio & System Settings"
            >
              <Shield className="w-4 h-4 text-warning flex-shrink-0" />
              <span>Admin</span>
            </button>
          )}
        </nav>

        {/* Right: Real-time Central PC Sync Indicator + Force Refresh + Log Out */}
        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          {/* Quick Clear Cache & Load Central DB Button */}
          <button
            type="button"
            onClick={handleForceRefresh}
            disabled={isRefreshing}
            className={`d-flex align-items-center justify-content-center p-2 rounded border transition-all cursor-pointer shadow-sm ${
              syncStatus.connected
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-400'
            }`}
            title={
              syncStatus.connected
                ? `Connected to Central Main PC (rev ${syncStatus.serverRevision}). Click to clear browser cache and reload latest database instantly.`
                : 'Attempting connection to Central Main PC... Click to retry and reload database.'
            }
            aria-label="Refresh and sync database"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onLogout || onOpenLogin}
            className="d-flex align-items-center justify-content-center p-2 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 transition-all cursor-pointer shadow-sm"
            title="Log Out / Switch User"
            aria-label="Log Out"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
          </button>
        </div>

      </div>
    </header>
  );
};
