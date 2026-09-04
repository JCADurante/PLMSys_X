import React, { useState } from 'react';
import { X, UserPlus, Trash2, AlertTriangle, ShieldAlert, Lock, Shield } from 'lucide-react';
import { Personnel, PersonnelRole, User, getPersonnelRole } from '../types';

interface RegistryModalProps {
  personnel: Personnel[];
  currentUser?: User;
  onAdd: (personnel: Omit<Personnel, 'id'>) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

const AVAILABLE_ROLES: PersonnelRole[] = ['Leadman', 'Operator', 'Supervisor', 'Admin'];

export const RegistryModal: React.FC<RegistryModalProps> = ({
  personnel,
  currentUser,
  onAdd,
  onRemove,
  onClose
}) => {
  const [fullName, setFullName] = useState('');
  const [shortName, setShortName] = useState('');
  const [position, setPosition] = useState('Operator');
  const [selectedRole, setSelectedRole] = useState<PersonnelRole>('Operator');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [duplicatePasswordError, setDuplicatePasswordError] = useState<{
    title: string;
    message: string;
    existingUserName?: string;
  } | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Allowed roles based on logged-in user permissions:
  // - Leadman cannot create Supervisor or Admin accounts
  // - Supervisor cannot create Admin accounts
  // - Admin can create any account
  const allowedRoles: PersonnelRole[] = React.useMemo(() => {
    if (currentUser?.role === 'LEADMAN') {
      return ['Operator', 'Leadman'];
    }
    if (currentUser?.role === 'SUPERVISOR') {
      return ['Operator', 'Leadman', 'Supervisor'];
    }
    if (currentUser?.role === 'ADMIN') {
      return ['Operator', 'Leadman', 'Supervisor', 'Admin'];
    }
    return ['Operator'];
  }, [currentUser?.role]);

  const handleRoleChange = (newRole: PersonnelRole) => {
    if (!allowedRoles.includes(newRole)) {
      if (currentUser?.role === 'LEADMAN') {
        setFormError('Access Denied: Leadman accounts cannot create accounts for Supervisor or Admin.');
      } else if (currentUser?.role === 'SUPERVISOR') {
        setFormError('Access Denied: Supervisor accounts cannot create accounts for Admin.');
      } else {
        setFormError(`Access Denied: You do not have permission to assign the ${newRole} role.`);
      }
      return;
    }
    setFormError('');
    setSelectedRole(newRole);
    setPosition(newRole);
    if (newRole === 'Leadman' || newRole === 'Supervisor' || newRole === 'Admin') {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
      setPassword('');
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (currentUser?.role === 'OPERATOR') {
      setFormError('Access Denied: Operator accounts do not have permission to register personnel.');
      return;
    }

    if (!allowedRoles.includes(selectedRole)) {
      if (currentUser?.role === 'LEADMAN') {
        setFormError('Access Denied: Leadman accounts cannot create accounts for Supervisor or Admin.');
      } else if (currentUser?.role === 'SUPERVISOR') {
        setFormError('Access Denied: Supervisor accounts cannot create accounts for Admin.');
      } else {
        setFormError(`Access Denied: You do not have permission to create ${selectedRole} accounts.`);
      }
      return;
    }

    const lowerPos = position.trim().toLowerCase();
    if (currentUser?.role === 'LEADMAN' && (lowerPos.includes('supervisor') || lowerPos.includes('admin'))) {
      setFormError('Access Denied: Leadman accounts cannot assign Supervisor or Admin titles/designations.');
      return;
    }
    if (currentUser?.role === 'SUPERVISOR' && lowerPos.includes('admin')) {
      setFormError('Access Denied: Supervisor accounts cannot assign Admin titles/designations.');
      return;
    }

    if (!fullName.trim() || !shortName.trim() || !position.trim()) {
      setFormError('Please fill in all required fields (Full Name, Short Name, Position).');
      return;
    }

    const needsPassword = isAuthorized || selectedRole !== 'Operator';
    if (needsPassword && !password.trim()) {
      setFormError(`Please set a unique password for ${selectedRole} account.`);
      return;
    }

    const trimmedPassword = password.trim();
    if (trimmedPassword) {
      // Check if password already matches an existing personnel member
      const duplicateUser = personnel.find(
        (p) => p.password && p.password.trim() === trimmedPassword
      );

      if (duplicateUser) {
        setDuplicatePasswordError({
          title: 'Duplicate Password Detected',
          message: `The password "${trimmedPassword}" is already assigned to "${duplicateUser.fullName}" (${getPersonnelRole(duplicateUser)}). Since user accounts are automatically identified and logged in based solely on their password, every password must be completely unique.`,
          existingUserName: duplicateUser.fullName
        });
        return;
      }

      // Check if matches the system master password
      if (trimmedPassword === 'JADB1994') {
        setDuplicatePasswordError({
          title: 'Reserved Password Detected',
          message: `The password "JADB1994" is reserved as the system master administrator password. Please choose a different unique password.`,
          existingUserName: 'Master Administrator'
        });
        return;
      }
    }

    onAdd({
      fullName: fullName.trim(),
      shortName: shortName.trim(),
      position: position.trim(),
      role: selectedRole,
      isAuthorized: needsPassword,
      password: needsPassword ? trimmedPassword : ''
    });

    setFullName('');
    setShortName('');
    setPosition('Operator');
    setSelectedRole('Operator');
    setIsAuthorized(false);
    setPassword('');
    setFormError('');
  };

  // Check delete permission
  const checkDeletePermission = (target: Personnel): { allowed: boolean; reason?: string } => {
    const targetRole = getPersonnelRole(target);

    // Leadman cannot delete Supervisor or Admin accounts
    if (currentUser?.role === 'LEADMAN') {
      if (targetRole === 'Supervisor' || targetRole === 'Admin') {
        return {
          allowed: false,
          reason: `Access Denied: Leadman accounts cannot delete ${targetRole} accounts.`
        };
      }
      return { allowed: true };
    }

    // Supervisor cannot delete Admin accounts
    if (currentUser?.role === 'SUPERVISOR') {
      if (targetRole === 'Admin') {
        return {
          allowed: false,
          reason: 'Access Denied: Supervisor accounts cannot delete registered Admin accounts.'
        };
      }
      return { allowed: true };
    }

    // Admin can delete any account
    if (currentUser?.role === 'ADMIN') {
      return { allowed: true };
    }

    // Operator cannot delete accounts
    return {
      allowed: false,
      reason: 'Access Denied: Operator accounts do not have permission to delete personnel records.'
    };
  };

  const handleRemoveClick = (target: Personnel) => {
    const perm = checkDeletePermission(target);
    if (!perm.allowed) {
      setPermissionError(perm.reason || 'You do not have permission to delete this account.');
      return;
    }

    if (window.confirm(`Are you sure you want to remove ${target.fullName} (${getPersonnelRole(target)})?`)) {
      onRemove(target.id);
    }
  };

  const getRoleBadgeStyle = (role: PersonnelRole) => {
    switch (role) {
      case 'Admin':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Supervisor':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'Leadman':
        return 'bg-teal-500/15 text-teal-400 border-teal-500/30';
      case 'Operator':
      default:
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0B0E]/80 backdrop-blur-sm p-4">
      <div className="bg-[#0F1117] rounded-2xl shadow-2xl border border-[#1E222A] w-full max-w-xl p-6 space-y-4 relative max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center border-b border-[#1E222A] pb-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#F27D26]" /> Personnel Registry
            </h2>
            <p className="text-xs text-[#8E9299] mt-0.5">
              Configure system user roles: Leadman, Operator, Supervisor, and Admin
            </p>
          </div>
          <button onClick={onClose} className="text-[#8E9299] hover:text-white"><X /></button>
        </div>

        {formError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-lg">
            {formError}
          </div>
        )}
        
        {permissionError && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold rounded-lg flex items-center justify-between">
            <span>{permissionError}</span>
            <button onClick={() => setPermissionError(null)} className="text-amber-400 hover:text-white ml-2 text-xs font-bold">
              Dismiss
            </button>
          </div>
        )}

        <form onSubmit={handleAdd} className="space-y-3 p-4 bg-[#191D28] rounded-xl border border-[#1E222A]">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Register New Personnel
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-[#8E9299] uppercase tracking-wider block mb-1">
                Full Name *
              </label>
              <input 
                type="text" 
                placeholder="e.g. Robert Johnson"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2.5 bg-[#0F1117] text-white rounded-lg border border-[#1E222A] focus:ring-2 focus:ring-[#F27D26] outline-none text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#8E9299] uppercase tracking-wider block mb-1">
                Short Name / Initials *
              </label>
              <input 
                type="text" 
                placeholder="e.g. RJ"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                className="w-full p-2.5 bg-[#0F1117] text-white rounded-lg border border-[#1E222A] focus:ring-2 focus:ring-[#F27D26] outline-none text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-[#8E9299] uppercase tracking-wider block">
                  System Role Selection *
                </label>
                {currentUser?.role === 'LEADMAN' && (
                  <span className="text-[10px] text-teal-400 font-semibold">
                    Operator & Leadman only
                  </span>
                )}
                {currentUser?.role === 'SUPERVISOR' && (
                  <span className="text-[10px] text-purple-400 font-semibold">
                    Cannot create Admin
                  </span>
                )}
              </div>
              <select
                value={selectedRole}
                onChange={(e) => handleRoleChange(e.target.value as PersonnelRole)}
                className="w-full p-2.5 bg-[#0F1117] text-white rounded-lg border border-[#1E222A] focus:ring-2 focus:ring-[#F27D26] outline-none text-xs font-semibold cursor-pointer"
              >
                {allowedRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {currentUser?.role === 'LEADMAN' && (
                <span className="text-[10px] text-[#8E9299] mt-1 block">
                  Leadman accounts cannot create accounts for Supervisor or Admin.
                </span>
              )}
              {currentUser?.role === 'SUPERVISOR' && (
                <span className="text-[10px] text-[#8E9299] mt-1 block">
                  Supervisor accounts cannot create accounts for Admin.
                </span>
              )}
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#8E9299] uppercase tracking-wider block mb-1">
                Designation / Position *
              </label>
              <input 
                type="text" 
                placeholder="e.g. Leadman, Shift Supervisor"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full p-2.5 bg-[#0F1117] text-white rounded-lg border border-[#1E222A] focus:ring-2 focus:ring-[#F27D26] outline-none text-xs"
              />
            </div>
          </div>

          {selectedRole !== 'Operator' && (
            <div>
              <label className="text-[11px] font-bold text-[#8E9299] uppercase tracking-wider block mb-1">
                Unique Password for {selectedRole} *
              </label>
              <input 
                type="password" 
                placeholder={`Set unique password for ${selectedRole}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 bg-[#0F1117] text-white rounded-lg border border-[#1E222A] focus:ring-2 focus:ring-[#F27D26] outline-none text-xs"
              />
              <span className="text-[10px] text-[#8E9299] mt-1 block">
                Users automatically log in with their unique password. No duplicate passwords allowed.
              </span>
            </div>
          )}

          {selectedRole === 'Operator' && (
            <div className="flex items-center justify-between gap-2 text-white">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                <input 
                  type="checkbox" 
                  checked={isAuthorized}
                  onChange={(e) => setIsAuthorized(e.target.checked)}
                  className="accent-[#F27D26]"
                />
                <span>Set personal password for Operator (Optional)</span>
              </label>
            </div>
          )}

          {selectedRole === 'Operator' && isAuthorized && (
            <div>
              <label className="text-[11px] font-bold text-[#8E9299] uppercase tracking-wider block mb-1">
                Operator Password
              </label>
              <input 
                type="password" 
                placeholder="Optional personal password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2.5 bg-[#0F1117] text-white rounded-lg border border-[#1E222A] focus:ring-2 focus:ring-[#F27D26] outline-none text-xs"
              />
            </div>
          )}

          <button type="submit" className="w-full p-2.5 bg-[#F27D26] text-white rounded-xl font-bold hover:bg-[#d96a1f] flex items-center justify-center gap-2 cursor-pointer transition-colors text-xs">
            <UserPlus size={16} /> Add Personnel ({selectedRole})
          </button>
        </form>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <div className="text-xs font-bold text-[#8E9299] uppercase tracking-wider mb-1">
            Registered Personnel ({personnel.length})
          </div>
          {personnel.map(p => {
            const role = getPersonnelRole(p);
            const perm = checkDeletePermission(p);

            return (
              <div key={p.id} className="flex justify-between items-center p-3 bg-[#191D28] rounded-xl border border-[#1E222A]">
                <div className="text-white text-sm flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{p.shortName}</span>
                    <span className="text-[#8E9299] text-xs">/ {p.fullName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRoleBadgeStyle(role)}`}>
                      {role}
                    </span>
                  </div>
                  <div className="text-[#8E9299] text-xs mt-0.5">
                    {p.position} {p.password && '• 🔑 Password Protected'}
                  </div>
                </div>

                {perm.allowed ? (
                  <button 
                    onClick={() => handleRemoveClick(p)} 
                    title={`Delete ${p.fullName}`}
                    className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                ) : (
                  <button 
                    onClick={() => setPermissionError(perm.reason || 'Restricted action')} 
                    title={perm.reason}
                    className="p-2 text-[#5A6070] hover:text-amber-400 hover:bg-amber-500/10 rounded-lg cursor-not-allowed transition-colors"
                  >
                    <Lock size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Duplicate Password Error Pop-up Modal */}
      {duplicatePasswordError && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0F1117] rounded-2xl shadow-2xl border border-rose-500/40 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E222A] pb-3">
              <div className="flex items-center gap-2.5 text-rose-400">
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{duplicatePasswordError.title}</h3>
                  <span className="text-[11px] text-[#8E9299]">Personnel Registry Control</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDuplicatePasswordError(null)}
                className="text-[#8E9299] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-200 leading-relaxed font-medium">
                  {duplicatePasswordError.message}
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#191D28] border border-[#1E222A] rounded-xl text-xs text-[#8E9299] space-y-1">
              <span className="font-semibold text-slate-300 block">Why is this required?</span>
              <span>
                Users log in directly with their unique password. This ensures the system always recognizes exactly who is logged in for audit trail logging and role permissions.
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setDuplicatePasswordError(null)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-900/30 cursor-pointer"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
