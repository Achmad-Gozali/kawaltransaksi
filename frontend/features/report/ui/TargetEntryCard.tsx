'use client';

import { X, Phone, Building2, Wallet, AlertTriangle, ShieldAlert, Flame } from 'lucide-react';
import { Label, Input, Sel } from './primitives';
import { bankList, ewalletList } from '@/features/report/constants';
import type { TargetEntry, TargetType } from '@/features/report/types';
import { useState, useEffect, useRef } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? '';

interface DuplicateInfo {
  exists: boolean;
  totalReports: number;
  level?: 'medium' | 'high' | 'critical';
}

interface TargetEntryCardProps {
  entry: TargetEntry;
  index: number;
  isPrimary: boolean;
  onChange: (updated: TargetEntry) => void;
  onRemove?: () => void;
}

const typeOptions: { id: TargetType; label: string; icon: React.ElementType }[] = [
  { id: 'phone',        label: 'HP / WA',  icon: Phone     },
  { id: 'bank_account', label: 'Rekening', icon: Building2 },
  { id: 'ewallet',      label: 'E-Wallet', icon: Wallet    },
];

const levelConfig = {
  medium:   { icon: AlertTriangle, color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200',  label: 'Terindikasi Penipu'   },
  high:     { icon: ShieldAlert,   color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: 'Penipu Terkonfirmasi' },
  critical: { icon: Flame,         color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    label: 'Penipu Berbahaya'     },
};

export function TargetEntryCard({
  entry, index, isPrimary, onChange, onRemove,
}: TargetEntryCardProps) {
  const [duplicate,         setDuplicate]         = useState<DuplicateInfo | null>(null);
  const [customBank,        setCustomBank]        = useState('');
  const [customEwallet,     setCustomEwallet]     = useState('');
  const [showCustomBank,    setShowCustomBank]    = useState(false);
  const [showCustomEwallet, setShowCustomEwallet] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isBank       = entry.type === 'bank_account';
  const providerList = isBank ? bankList : ewalletList;
  const providerValue = isBank ? entry.bank_name : entry.ewallet_name;
  const providerKey   = isBank ? 'bank_name' : 'ewallet_name';
  const customValue   = isBank ? customBank   : customEwallet;
  const showCustom    = isBank ? showCustomBank : showCustomEwallet;

  const setCustom     = isBank ? setCustomBank     : setCustomEwallet;
  const setShowCustom = isBank ? setShowCustomBank : setShowCustomEwallet;

  // Reset saat type berubah — valid pattern untuk sync derived state
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCustomBank('');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCustomEwallet('');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowCustomBank(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowCustomEwallet(false);
  }, [entry.type]);

  // Cek duplicate (debounce 600ms)
  useEffect(() => {
    const num = entry.number.replace(/[^0-9]/g, '');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (num.length < 6) { setDuplicate(null); return; }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res  = await fetch(`${BACKEND_URL}/api/reports/check-number/${num}`);
        const data = await res.json();
        if (data.success) setDuplicate(data.data);
      } catch { /* silent fail */ }
    }, 600);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [entry.number]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!entry.number) setDuplicate(null);
  }, [entry.number]);

  const handleProviderChange = (val: string) => {
    if (val === 'Lainnya') {
      setShowCustom(true);
      setCustom('');
      onChange({ ...entry, [providerKey]: '' });
    } else {
      setShowCustom(false);
      setCustom('');
      onChange({ ...entry, [providerKey]: val });
    }
  };

  const handleCustomChange = (val: string) => {
    setCustom(val);
    onChange({ ...entry, [providerKey]: val });
  };

  const cfg = duplicate?.level ? levelConfig[duplicate.level] : null;

  return (
    <div className={`rounded-2xl border p-4 space-y-4 ${
      isPrimary ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50'
    }`}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
            isPrimary ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
          }`}>
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-slate-700">
            {isPrimary ? 'Nomor Utama' : `Nomor Tambahan ${index}`}
          </span>
        </div>
        {!isPrimary && onRemove && (
          <button type="button" onClick={onRemove}
            className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Type selector */}
      <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
        {typeOptions.map((item) => (
          <button key={item.id} type="button"
            onClick={() => onChange({ ...entry, type: item.id })}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-1 rounded-lg text-xs font-semibold transition-all leading-tight ${
              entry.type === item.id
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-400 hover:text-slate-600'
            }`}>
            <item.icon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Provider selector */}
      {entry.type !== 'phone' && (
        <div className="space-y-2">
          <Sel
            value={showCustom ? 'Lainnya' : providerValue}
            onChange={(e) => handleProviderChange(e.target.value)}
          >
            <option value="">
              Pilih {isBank ? 'bank' : 'e-wallet'}...
            </option>
            {providerList.map((item: { value: string; label: string }) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </Sel>

          {showCustom && (
            <Input
              type="text"
              value={customValue}
              onChange={(e) => handleCustomChange(e.target.value)}
              placeholder={isBank ? 'Tuliskan nama bank...' : 'Tuliskan nama e-wallet...'}
              maxLength={100}
            />
          )}
        </div>
      )}

      {/* Input nomor + nama */}
      <div className="flex flex-col gap-3">
        <div>
          <Label>
            Nomor {
              entry.type === 'phone'        ? 'HP / WA'  :
              entry.type === 'bank_account' ? 'Rekening' : 'E-Wallet'
            }
          </Label>
          <Input
            type="text" inputMode="numeric" value={entry.number}
            onChange={(e) =>
              onChange({ ...entry, number: e.target.value.replace(/[^0-9+]/g, '') })
            }
            placeholder={entry.type === 'phone' ? '0812xxxxxxxx' : '12345678...'}
          />
        </div>

        {/* Duplicate detector */}
        {duplicate?.exists && cfg && (
          <div className={`flex items-start gap-2.5 p-3 rounded-xl border ${cfg.bg} ${cfg.border}`}>
            <cfg.icon className={`w-4 h-4 shrink-0 mt-0.5 ${cfg.color}`} />
            <div>
              <p className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</p>
              <p className={`text-xs mt-0.5 ${cfg.color} opacity-80 leading-relaxed`}>
                Nomor ini sudah dilaporkan{' '}
                <span className="font-bold">{duplicate.totalReports}x</span>{' '}
                oleh pengguna lain. Laporan kamu akan memperkuat data yang ada
                -- sertakan bukti yang berbeda.
              </p>
            </div>
          </div>
        )}

        {duplicate?.exists && !duplicate.level && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl border bg-slate-50 border-slate-200">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
            <p className="text-xs text-slate-500 leading-relaxed">
              Nomor ini sudah pernah dilaporkan{' '}
              <span className="font-bold">{duplicate.totalReports}x</span>.
              Laporan kamu akan membantu memperkuat data.
            </p>
          </div>
        )}

        <div>
          <Label optional>Nama Pemilik</Label>
          <Input type="text" value={entry.name}
            onChange={(e) => onChange({ ...entry, name: e.target.value })}
            placeholder="Nama Penipu"
          />
        </div>
      </div>
    </div>
  );
}