export type PlateStatus = 'ACTIVE' | 'REMOVED' | 'REJECTED' | 'RETIRED' | 'REPLACED';

export type RejectType = 'WEAR' | 'SURFACE' | 'CRACK' | 'DIM' | 'CHIP' | 'DENT' | 'OTHER';

export interface SetRecord {
  id: string; // UUID
  setNumber: number; // 1 to 100+
  displayName: string; // "GLOSSY 32 OUTS SET 01"
  shortCode: string; // "G32-S01" or "S01"
  finish?: 'Matte' | 'Glossy' | string;
  numberOfOuts?: number; // 20 or 32
  construction?: string; // e.g. "GLOSSY 32 OUTS SET 01"
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  currentTotalCycle: number;
  initialCycle?: number; // Starting cycle on creation
  todayProduction: number;
  lastProductionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PositionRecord {
  id: string; // UUID
  setId: string; // Set UUID
  setNumber: number;
  positionNumber: number; // 1 to 11
  positionCode: string; // "P01"
  fullCode: string; // "S01-P01" or "G32-S01-P01"
  status: 'OCCUPIED' | 'EMPTY';
  currentPlateId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlateRecord {
  id: string; // UUID
  plateSerialNumber: string; // MMDDYY-SET-POSITION (e.g. 080826-01-05)
  manufacturingDate: string; // YYYY-MM-DD
  finish?: 'Matte' | 'Glossy' | string;
  numberOfOuts?: number; // 20 or 32
  construction?: string; // e.g. "GLOSSY 32 OUTS SET 01"
  status: PlateStatus;
  currentSetId?: string;
  currentPositionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlateInstallationRecord {
  id: string; // UUID
  plateId: string;
  setId: string;
  positionId: string;
  installationDate: string;
  installationCycle: number;
  initialCycles?: number; // Pre-existing cycles on the plate itself when installed
  finish?: string;
  numberOfOuts?: number;
  construction?: string;
  operatorId: string;
  remarks?: string;
  createdAt: string;
}

export interface PlateRemovalRecord {
  id: string; // UUID
  plateId: string;
  setId: string;
  positionId: string;
  removalDate: string;
  removalCycle: number;
  totalCyclesAchieved: number;
  finish?: string;
  numberOfOuts?: number;
  construction?: string;
  status: PlateStatus; // REMOVED, REJECTED, RETIRED, REPLACED
  rejectType?: RejectType;
  rejectDescription?: string;
  sourceOfReject?: string;
  correctiveAction?: string;
  operatorId: string;
  createdAt: string;
}

export interface DailyProductionRecord {
  id: string; // UUID
  setId: string;
  date: string; // YYYY-MM-DD
  jobOrderId: string;
  previousTotalCycle: number;
  productionCycles: number;
  currentTotalCycle: number;
  operatorId: string;
  checkedBy: string;
  remarks?: string;
  createdAt: string;
}

export interface ReplacementRecord {
  id: string; // UUID
  setId: string;
  positionId: string;
  oldPlateId: string;
  newPlateId: string;
  oldRemovalCycle: number;
  newInstallationCycle: number;
  reason: string;
  operatorId: string;
  createdAt: string;
}

export interface JobOrderRecord {
  id: string; // UUID
  jobOrderNumber: string;
  description: string;
  date: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface AuditRecord {
  id: string; // UUID
  auditCode: string; // "AUD-000001"
  user: string;
  action: 
    | 'LOGIN'
    | 'LOGOUT'
    | 'CREATE_SET'
    | 'EDIT_SET'
    | 'CREATE_PLATE'
    | 'INSTALL_PLATE'
    | 'REMOVE_PLATE'
    | 'REPLACE_PLATE'
    | 'REJECT_PLATE'
    | 'RETIRE_PLATE'
    | 'ADD_PRODUCTION'
    | 'EDIT_PRODUCTION'
    | 'DELETE_PRODUCTION'
    | 'UNDO_PRODUCTION'
    | 'DELETE_PLATE_LOG'
    | 'CORRECT_RECORD'
    | 'BACKUP'
    | 'RESTORE'
    | 'DELETE_ATTEMPT'
    | 'DELETE_SET'
    | 'SETTINGS_CHANGE';
  timestamp: string;
  recordId?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  deviceInfo: string;
  checkedBy?: string;
  operator?: string;
  userRole?: string;
}

export type PersonnelRole = 'Leadman' | 'Operator' | 'Supervisor' | 'Admin';

export type UserRole = 'ADMIN' | 'SUPERVISOR' | 'LEADMAN' | 'OPERATOR';

export interface User {
  name: string;
  role: UserRole;
}

export interface Personnel {
  id: string;
  fullName: string;
  shortName: string;
  position: string;
  role?: PersonnelRole;
  isAuthorized: boolean;
  password?: string;
}

export function getPersonnelRole(p: Personnel): PersonnelRole {
  if (p.role) return p.role;
  const pos = (p.position || '').toLowerCase();
  if (pos.includes('admin')) return 'Admin';
  if (pos.includes('supervisor')) return 'Supervisor';
  if (pos.includes('leadman')) return 'Leadman';
  return 'Operator';
}

export function getAppRoleFromPersonnel(p: Personnel): UserRole {
  const r = getPersonnelRole(p);
  switch (r) {
    case 'Admin':
      return 'ADMIN';
    case 'Supervisor':
      return 'SUPERVISOR';
    case 'Leadman':
      return 'LEADMAN';
    case 'Operator':
    default:
      return 'OPERATOR';
  }
}

