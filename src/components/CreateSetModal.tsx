import React, { useState, useEffect } from 'react';
import { X, Layers, Plus, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { SetRecord } from '../types';

interface CreateSetModalProps {
  sets: SetRecord[];
  onClose: () => void;
  onCreateSet: (
    setNumber: number,
    displayName: string,
    shortCode: string,
    initialCycle: number,
    numPlates: number,
    creationDate?: string,
    finish?: 'Matte' | 'Glossy',
    numberOfOuts?: number
  ) => Promise<void>;
}

export const CreateSetModal: React.FC<CreateSetModalProps> = ({
  sets,
  onClose,
  onCreateSet,
}) => {
  const nextNum = sets.length > 0 ? Math.max(...sets.map(s => s.setNumber)) + 1 : 1;
  const todayStr = new Date().toISOString().split('T')[0];

  const [finish, setFinish] = useState<'Matte' | 'Glossy'>(() => {
    const saved = localStorage.getItem('draft_set_finish');
    return (saved === 'Matte' || saved === 'Glossy') ? saved : 'Glossy';
  });

  const [numberOfOuts, setNumberOfOuts] = useState<20 | 32>(() => {
    const saved = localStorage.getItem('draft_set_numberOfOuts');
    return (saved === '20' || saved === '32') ? (parseInt(saved, 10) as 20 | 32) : 32;
  });

  const [setNumber, setSetNumber] = useState<number>(() => {
    const saved = localStorage.getItem('draft_set_number');
    return saved ? parseInt(saved, 10) : nextNum;
  });

  const generateSuggestedName = (f: string, outs: number, sNum: number) => {
    const formatted = sNum < 10 ? '0' + sNum : `${sNum}`;
    return `${f.toUpperCase()} ${outs} OUTS SET ${formatted}`;
  };

  const generateSuggestedShortCode = (f: string, outs: number, sNum: number) => {
    const finLetter = f.toUpperCase().startsWith('M') ? 'M' : 'G';
    const formatted = sNum < 10 ? '0' + sNum : `${sNum}`;
    return `${finLetter}${outs}-S${formatted}`;
  };

  const [displayName, setDisplayName] = useState(() => {
    const saved = localStorage.getItem('draft_set_displayName');
    return saved || generateSuggestedName('Glossy', 32, nextNum);
  });

  const [shortCode, setShortCode] = useState(() => {
    const saved = localStorage.getItem('draft_set_shortCode');
    return saved || generateSuggestedShortCode('Glossy', 32, nextNum);
  });

  const [creationDate, setCreationDate] = useState(() => {
    return localStorage.getItem('draft_set_creationDate') || todayStr;
  });

  const [initialCycle, setInitialCycle] = useState(() => {
    const saved = localStorage.getItem('draft_set_initialCycle');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [numPlates, setNumPlates] = useState<number>(() => {
    const saved = localStorage.getItem('draft_set_numPlates');
    return saved ? parseInt(saved, 10) : 11;
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Synchronize localStorage drafts
  useEffect(() => {
    localStorage.setItem('draft_set_finish', finish);
    localStorage.setItem('draft_set_numberOfOuts', String(numberOfOuts));
    localStorage.setItem('draft_set_number', String(setNumber));
    localStorage.setItem('draft_set_displayName', displayName);
    localStorage.setItem('draft_set_shortCode', shortCode);
    localStorage.setItem('draft_set_creationDate', creationDate);
    localStorage.setItem('draft_set_initialCycle', String(initialCycle));
    localStorage.setItem('draft_set_numPlates', String(numPlates));
  }, [finish, numberOfOuts, setNumber, displayName, shortCode, creationDate, initialCycle, numPlates]);

  const clearDrafts = () => {
    localStorage.removeItem('draft_set_finish');
    localStorage.removeItem('draft_set_numberOfOuts');
    localStorage.removeItem('draft_set_number');
    localStorage.removeItem('draft_set_displayName');
    localStorage.removeItem('draft_set_shortCode');
    localStorage.removeItem('draft_set_creationDate');
    localStorage.removeItem('draft_set_initialCycle');
    localStorage.removeItem('draft_set_numPlates');
  };

  // Helper to re-apply suggested name
  const handleAutoSuggest = (newFinish = finish, newOuts = numberOfOuts, newSetNum = setNumber) => {
    const suggestedName = generateSuggestedName(newFinish, newOuts, newSetNum);
    const suggestedCode = generateSuggestedShortCode(newFinish, newOuts, newSetNum);
    setDisplayName(suggestedName);
    setShortCode(suggestedCode);
  };

  const handleFinishChange = (newFinish: 'Matte' | 'Glossy') => {
    setFinish(newFinish);
    handleAutoSuggest(newFinish, numberOfOuts, setNumber);
  };

  const handleOutsChange = (newOuts: 20 | 32) => {
    setNumberOfOuts(newOuts);
    handleAutoSuggest(finish, newOuts, setNumber);
  };

  const handleSetNumberChange = (newSetNum: number) => {
    setSetNumber(newSetNum);
    handleAutoSuggest(finish, numberOfOuts, newSetNum);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      await onCreateSet(
        setNumber,
        displayName.trim(),
        shortCode.trim(),
        initialCycle,
        numPlates,
        creationDate,
        finish,
        numberOfOuts
      );
      clearDrafts();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create set.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0B0E]/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#0F1117] rounded-2xl shadow-2xl border border-[#1E222A] w-full max-w-lg overflow-hidden flex flex-col text-[#E0E2E5] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#191D28] text-white px-6 py-4 flex items-center justify-between border-b border-[#1E222A] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-[#F27D26] p-2 rounded-lg text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Create New Set</h3>
              <p className="text-xs text-[#8E9299]">Configure cylinder finish, outs, and plate construction</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#8E9299] hover:text-white hover:bg-[#2D333E] rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl flex items-start gap-2.5 text-rose-400 text-xs font-semibold animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Construction Selector Row: Finish + Number of Outs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 bg-[#141722] rounded-xl border border-[#1E222A]">
            <div>
              <label className="block text-xs font-bold text-[#F27D26] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Finish *</span>
                <span className="text-[10px] text-[#8E9299] font-normal">Surface type</span>
              </label>
              <select
                value={finish}
                onChange={(e) => handleFinishChange(e.target.value as 'Matte' | 'Glossy')}
                className="w-full px-3 py-2.5 bg-[#191D28] border border-[#252A38] rounded-lg text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#F27D26] cursor-pointer"
              >
                <option value="Glossy">Glossy</option>
                <option value="Matte">Matte</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#F27D26] uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Number of Outs *</span>
                <span className="text-[10px] text-[#8E9299] font-normal">Capacity</span>
              </label>
              <select
                value={numberOfOuts}
                onChange={(e) => handleOutsChange(parseInt(e.target.value, 10) as 20 | 32)}
                className="w-full px-3 py-2.5 bg-[#191D28] border border-[#252A38] rounded-lg text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#F27D26] cursor-pointer"
              >
                <option value={32}>32 Outs</option>
                <option value={20}>20 Outs</option>
              </select>
            </div>
          </div>

          {/* Set Number */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#8E9299] uppercase">Set Number *</label>
              <span className="text-[11px] text-[#8E9299]">Can be duplicated across different constructions</span>
            </div>
            <input
              type="number"
              required
              min={1}
              value={setNumber}
              onChange={(e) => handleSetNumberChange(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#191D28] border border-[#1E222A] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F27D26] font-mono font-bold"
            />
          </div>

          {/* Display Name with Auto-Suggest indication */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-[#8E9299] uppercase">
                Display Name (Auto-suggested / Editable) *
              </label>
              <button
                type="button"
                onClick={() => handleAutoSuggest()}
                className="text-[11px] text-[#F27D26] hover:text-[#ffa057] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Reset name to auto-suggested format"
              >
                <Sparkles className="w-3 h-3" /> Auto Suggest
              </button>
            </div>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. GLOSSY 32 OUTS SET 01"
              className="w-full px-3 py-2 bg-[#191D28] border border-[#1E222A] rounded-lg text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#F27D26] tracking-wide"
            />
            <span className="text-[11px] text-[#8E9299] mt-1 block">
              Auto format: <strong className="text-white">{generateSuggestedName(finish, numberOfOuts, setNumber)}</strong> (editable)
            </span>
          </div>

          {/* Short Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#8E9299] uppercase mb-1">
                Short Code *
              </label>
              <input
                type="text"
                required
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value)}
                className="w-full px-3 py-2 bg-[#191D28] border border-[#1E222A] rounded-lg text-sm font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#F27D26]"
              />
              <span className="text-[10px] text-[#8E9299] mt-1 block font-mono">
                Used in plate codes (e.g. {shortCode}-P01)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8E9299] uppercase mb-1">Creation Date *</label>
              <input
                type="date"
                required
                value={creationDate}
                onChange={(e) => setCreationDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#191D28] border border-[#1E222A] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#F27D26]"
              />
            </div>
          </div>

          {/* Number of Plates & Starting Cycle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#8E9299] uppercase mb-1">Plates per Set</label>
              <input
                type="number"
                required
                min={1}
                max={50}
                value={numPlates}
                onChange={(e) => setNumPlates(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#191D28] border border-[#1E222A] rounded-lg text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-[#F27D26]"
              />
              <span className="text-[10px] text-[#8E9299] mt-1 block">
                Initializes P01 to P{numPlates < 10 ? '0' + numPlates : numPlates}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8E9299] uppercase mb-1">Starting Cycle</label>
              <input
                type="number"
                required
                min={0}
                step={1000}
                value={initialCycle}
                onChange={(e) => setInitialCycle(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#191D28] border border-[#1E222A] rounded-lg text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-[#F27D26]"
              />
              <span className="text-[10px] text-[#8E9299] mt-1 block">
                Starting baseline cycle count
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E222A]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#191D28] text-[#8E9299] hover:text-white hover:bg-[#252A38] text-sm font-medium border border-[#1E222A] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#F27D26] hover:bg-[#d96a1f] disabled:opacity-50 text-white text-sm font-semibold shadow-md cursor-pointer transition-all"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Creating Set...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Set</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
