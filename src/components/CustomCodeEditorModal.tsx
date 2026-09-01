import React, { useState } from 'react';
import { X, Plus, Zap, Trash2 } from 'lucide-react';
import { irBlaster } from '../services/irBlaster';
import { hapticFeedback } from '../services/haptics';

export interface CustomKey {
  id: string;
  name: string;
  hex: string;
  color: string;
}

interface CustomCodeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  customKeys: CustomKey[];
  onAddKey: (key: CustomKey) => void;
  onDeleteKey: (id: string) => void;
  isDarkMode?: boolean;
}

const COLOR_OPTIONS = ['#EF4444', '#3B82F6', '#D97706', '#10B981', '#8B5CF6', '#EC4899'];

export const CustomCodeEditorModal: React.FC<CustomCodeEditorModalProps> = ({
  isOpen,
  onClose,
  customKeys,
  onAddKey,
  onDeleteKey,
  isDarkMode = true,
}) => {
  const [newKeyName, setNewKeyName] = useState('');
  const [newHex, setNewHex] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);

  if (!isOpen) return null;

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || !newHex.trim()) return;

    let cleanHex = newHex.replace(/^0x/i, '').trim().toUpperCase();
    if (cleanHex.length !== 8) {
      alert('NEC Hex code must be 8 characters long (e.g. 00FF58A7)');
      return;
    }

    const key: CustomKey = {
      id: Math.random().toString(36).substring(2, 9),
      name: newKeyName.trim(),
      hex: cleanHex,
      color: selectedColor,
    };

    hapticFeedback.success();
    onAddKey(key);
    setNewKeyName('');
    setNewHex('');
  };

  const handleTestKey = (key: CustomKey) => {
    hapticFeedback.click();
    irBlaster.sendNec(key.hex, key.name, 'Custom Key');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div
        className={`w-full max-w-md rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border ${
          isDarkMode ? 'bg-[#18181B] border-surface-border text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between pb-3 border-b ${
            isDarkMode ? 'border-surface-border' : 'border-slate-200'
          }`}
        >
          <div>
            <h3 className="text-base font-bold">IR Key Manager</h3>
            <span className={`text-xs ${isDarkMode ? 'text-accent-muted' : 'text-slate-500'}`}>
              Custom 38kHz NEC Codes
            </span>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isDarkMode ? 'bg-surface text-white/60 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Existing Keys List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 my-2 no-scrollbar">
          <span className={`text-xs font-semibold block ${isDarkMode ? 'text-accent-muted' : 'text-slate-500'}`}>
            Saved Keys
          </span>
          {customKeys.length === 0 ? (
            <div className="text-xs text-zinc-500 py-4 text-center">
              No custom keys added yet. Add one below!
            </div>
          ) : (
            customKeys.map((k) => (
              <div
                key={k.id}
                className={`flex items-center justify-between p-3 rounded-2xl border ${
                  isDarkMode ? 'bg-surface border-surface-border' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3.5 h-3.5 rounded-full shadow-sm"
                    style={{ backgroundColor: k.color }}
                  />
                  <div>
                    <div className="text-xs font-bold">{k.name}</div>
                    <div className="text-[10px] font-mono text-sky-400">NEC 0x{k.hex}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestKey(k)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 active:scale-95 border ${
                      isDarkMode
                        ? 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                        : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-sm'
                    }`}
                  >
                    <Zap size={12} fill="currentColor" />
                    Test
                  </button>
                  <button
                    onClick={() => onDeleteKey(k.id)}
                    className="w-7 h-7 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add New Key Form */}
        <form
          onSubmit={handleCreateKey}
          className={`pt-3 border-t space-y-3 ${isDarkMode ? 'border-surface-border' : 'border-slate-200'}`}
        >
          <span className="text-xs font-semibold block">Add Blank Key +</span>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Key Name (e.g. Turbo)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className={`px-3 py-2 rounded-xl text-xs border outline-none ${
                isDarkMode
                  ? 'bg-surface text-white placeholder-zinc-500 border-surface-border focus:border-sky-400'
                  : 'bg-slate-50 text-slate-900 placeholder-slate-400 border-slate-200 focus:border-sky-500'
              }`}
            />
            <input
              type="text"
              placeholder="Hex (e.g. 00FF58A7)"
              value={newHex}
              onChange={(e) => setNewHex(e.target.value)}
              className={`px-3 py-2 rounded-xl text-xs font-mono border outline-none ${
                isDarkMode
                  ? 'bg-surface text-white placeholder-zinc-500 border-surface-border focus:border-sky-400'
                  : 'bg-slate-50 text-slate-900 placeholder-slate-400 border-slate-200 focus:border-sky-500'
              }`}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    selectedColor === c ? 'scale-125 ring-2 ring-sky-400' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-sky-400 text-black font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <Plus size={14} />
              Save Key
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
