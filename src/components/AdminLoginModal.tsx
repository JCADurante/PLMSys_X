import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { Personnel, User, getAppRoleFromPersonnel } from '../types';

interface AdminLoginModalProps {
  onClose: () => void;
  onLogin: (user?: User) => void;
  personnel: Personnel[];
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onClose, onLogin, personnel }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPw = password.trim();
    if (!trimmedPw) {
      setError('Please enter password');
      return;
    }

    // Match solely based on the entered password
    const matchedUser = personnel.find(
      (p) => p.password && p.password.trim() === trimmedPw
    );

    if (matchedUser) {
      const appRole = getAppRoleFromPersonnel(matchedUser);
      onLogin({ name: matchedUser.fullName, role: appRole });
      return;
    }

    if (trimmedPw === 'JADB1994') {
      const defaultAdmin = personnel.find(
        (p) => p.fullName === 'Administrator' || p.position === 'Admin' || p.role === 'Admin'
      );
      onLogin({
        name: defaultAdmin ? defaultAdmin.fullName : 'Administrator',
        role: 'ADMIN'
      });
      return;
    }

    setError('Invalid password');
    setTimeout(() => setError(''), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0B0E]/80 backdrop-blur-sm p-4">
      <form onSubmit={handleLogin} className="bg-[#0F1117] rounded-2xl shadow-2xl border border-[#1E222A] w-full max-w-sm p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><Lock size={20} /> Admin Login</h2>
          <button type="button" onClick={onClose} className="text-[#8E9299] hover:text-white"><X /></button>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-lg">
            {error}
          </div>
        )}

        <input 
          type="password" 
          placeholder="Enter Admin Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 bg-[#191D28] text-white rounded-lg border border-[#1E222A] focus:ring-2 focus:ring-[#F27D26] outline-none text-xs"
          autoFocus
        />
        <button type="submit" className="w-full p-3 bg-[#F27D26] text-white rounded-lg font-bold hover:bg-[#d96a1f]">Login</button>
      </form>
    </div>
  );
};
