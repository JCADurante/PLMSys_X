/**
 * Formats a raw string into standard Job Order format: 4 digits, dash, 2 digits (e.g., 0000-00)
 */
export function formatJobOrder(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 6);
  if (digits.length <= 4) {
    return digits;
  }
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}`;
}

/**
 * Checks whether a string strictly matches the 4 digits - 2 digits Job Order pattern (e.g. 0000-00)
 */
export function isValidJobOrder(val: string): boolean {
  return /^\d{4}-\d{2}$/.test(val.trim());
}

/**
 * Returns today's date string in local timezone format (YYYY-MM-DD)
 */
export function getTodayStr(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns current local time string (e.g. 10:45:12 AM)
 */
export function getNowTimeStr(date: Date = new Date()): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * Returns a human-friendly formatted date string (e.g. "Aug 29, 2026")
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

/**
 * Calculates real-time today's production for a specific set.
 * Prioritizes summing actual daily production log entries for today's date from the dailyProductions ledger,
 * falling back to the set's todayProduction cache if matching today's date.
 */
export function getSetTodayProduction(
  set: { id?: string; todayProduction?: number; lastProductionDate?: string },
  dailyProductions?: { setId: string; date: string; productionCycles: number }[],
  targetDateStr?: string
): number {
  const today = targetDateStr || getTodayStr();
  
  if (dailyProductions && dailyProductions.length > 0 && set.id) {
    const logsToday = dailyProductions.filter(dp => dp.setId === set.id && dp.date === today);
    if (logsToday.length > 0) {
      return logsToday.reduce((sum, dp) => sum + (dp.productionCycles || 0), 0);
    }
  }

  if (set.lastProductionDate !== today) {
    return 0;
  }
  return set.todayProduction || 0;
}

/**
 * Calculates fleet-wide real-time today's production across all sets.
 */
export function getTotalTodayProduction(
  sets: { id?: string; todayProduction?: number; lastProductionDate?: string }[],
  dailyProductions?: { setId: string; date: string; productionCycles: number }[],
  targetDateStr?: string
): number {
  const today = targetDateStr || getTodayStr();

  if (dailyProductions && dailyProductions.length > 0) {
    const todayLogs = dailyProductions.filter(dp => dp.date === today);
    if (todayLogs.length > 0) {
      return todayLogs.reduce((sum, dp) => sum + (dp.productionCycles || 0), 0);
    }
  }

  return sets.reduce((sum, s) => sum + getSetTodayProduction(s, dailyProductions, today), 0);
}

/**
 * Returns the count of production log entries recorded today in real time.
 */
export function getTodayLogEntriesCount(
  dailyProductions: { date: string }[],
  targetDateStr?: string
): number {
  const today = targetDateStr || getTodayStr();
  return dailyProductions.filter(dp => dp.date === today).length;
}

