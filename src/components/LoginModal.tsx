import React, { useState } from 'react';
import { User as UserIcon, Lock, Shield, ArrowRight } from 'lucide-react';
import { User, Personnel } from '../types';

interface LoginModalProps {
  onClose?: () => void;
  onLogin: (user: User) => void;
  personnel: Personnel[];
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onLogin, personnel }) => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');

  const handleOperatorLogin = () => {
    onLogin({
      name: 'Operator',
      role: 'OPERATOR'
    });
    if (onClose) onClose();
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword.trim()) {
      setError('Please enter administrator password');
      return;
    }

    const matchedAdmin = personnel.find(
      (p) =>
        (p.position === 'Admin' || p.fullName === 'Administrator' || p.isAuthorized) &&
        (p.password === adminPassword || adminPassword === 'JADB1994')
    );

    if (matchedAdmin || adminPassword === 'JADB1994') {
      onLogin({
        name: matchedAdmin ? matchedAdmin.fullName : 'Administrator',
        role: 'ADMIN'
      });
      if (onClose) onClose();
    } else {
      setError('Invalid password. Default admin password is JADB1994.');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0B0E]/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-[#0F1117] rounded-2xl shadow-2xl border border-[#1E222A] w-full max-w-md overflow-hidden flex flex-col">
        {/* Body */}
        <div className="p-6 space-y-4">
          {!isAdminMode ? (
            <div className="space-y-3">
              {/* Option 1: Log as Operator */}
              <button
                type="button"
                onClick={handleOperatorLogin}
                className="w-full p-4 bg-[#141720] hover:bg-[#191E2B] border border-[#1E222A] hover:border-sky-500/50 rounded-xl text-left transition-all cursor-pointer group flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors">
                      Log as Operator
                    </div>
                    <div className="text-xs text-[#8E9299]">
                      Standard access for production logs, sets & plate monitoring
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[#8E9299] group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
              </button>

              {/* Option 2: Log as Admin */}
              <button
                type="button"
                onClick={() => {
                  setIsAdminMode(true);
                  setError('');
                  setAdminPassword('');
                }}
                className="w-full p-4 bg-[#141720] hover:bg-[#1E1918] border border-[#1E222A] hover:border-[#F27D26]/50 rounded-xl text-left transition-all cursor-pointer group flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#F27D26]/10 border border-[#F27D26]/20 flex items-center justify-center text-[#F27D26] group-hover:scale-105 transition-transform">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-[#F27D26] transition-colors">
                      Log as Admin
                    </div>
                    <div className="text-xs text-[#8E9299]">
                      Full access to Admin Dashboard, DB Studio & System Controls
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-[#8E9299] group-hover:text-[#F27D26] group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          ) : (
            /* Admin Password Form */
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#F27D26] uppercase tracking-wider">
                <Lock className="w-4 h-4" />
                Administrator Password Required
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-[#8E9299] uppercase tracking-wider block mb-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter Admin Password (e.g. JADB1994)"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full p-3 bg-[#141720] text-white rounded-lg border border-[#1E222A] focus:border-[#F27D26] text-xs outline-none"
                  autoFocus
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdminMode(false)}
                  className="px-4 py-2.5 bg-[#141720] hover:bg-[#191D28] border border-[#1E222A] text-gray-400 hover:text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  Back
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#F27D26] hover:bg-[#d96a1f] text-white text-xs font-bold rounded-lg shadow-lg shadow-[#F27D26]/20 cursor-pointer transition-all flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Sign In as Admin
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
