import { X, Phone, Building2, Wallet } from 'lucide-react';
import { Label, Input, Sel } from './primitives';
import { bankList, ewalletList } from '@/features/report/constants';
import type { TargetEntry, TargetType } from '@/features/report/types';

interface TargetEntryCardProps {
  entry: TargetEntry;
  index: number;
  isPrimary: boolean;
  onChange: (updated: TargetEntry) => void;
  onRemove?: () => void;
}

const typeOptions: { id: TargetType; label: string; icon: React.ElementType }[] = [
  { id: 'phone', label: 'HP / WA', icon: Phone },
  { id: 'bank_account', label: 'Rekening', icon: Building2 },
  { id: 'ewallet', label: 'E-Wallet', icon: Wallet },
];

export function TargetEntryCard({
  entry,
  index,
  isPrimary,
  onChange,
  onRemove,
}: TargetEntryCardProps) {
  const providerList = entry.type === 'bank_account' ? bankList : ewalletList;
  const providerValue = entry.type === 'bank_account' ? entry.bank_name : entry.ewallet_name;
  const providerKey = entry.type === 'bank_account' ? 'bank_name' : 'ewallet_name';

  return (
    <div
      className={`rounded-2xl border p-4 space-y-4 ${
        isPrimary ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              isPrimary ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-slate-700">
            {isPrimary ? 'Nomor Utama' : `Nomor Tambahan ${index}`}
          </span>
        </div>
        {!isPrimary && onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
        {typeOptions.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange({ ...entry, type: item.id })}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-1 rounded-lg text-xs font-semibold transition-all leading-tight ${
              entry.type === item.id
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <item.icon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </div>

      {entry.type !== 'phone' && (
        <Sel
          value={providerValue}
          onChange={(e) => onChange({ ...entry, [providerKey]: e.target.value })}
        >
          <option value="">
            Pilih {entry.type === 'bank_account' ? 'bank' : 'e-wallet'}...
          </option>
          {providerList.map((item: { value: string; label: string }) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </Sel>
      )}

      <div className="flex flex-col gap-3">
        <div>
          <Label>
            Nomor{' '}
            {entry.type === 'phone'
              ? 'HP / WA'
              : entry.type === 'bank_account'
              ? 'Rekening'
              : 'E-Wallet'}
          </Label>
          <Input
            type="text"
            inputMode="numeric"
            value={entry.number}
            onChange={(e) =>
              onChange({ ...entry, number: e.target.value.replace(/[^0-9+]/g, '') })
            }
            placeholder={entry.type === 'phone' ? '0812xxxxxxxx' : '12345678...'}
          />
        </div>
        <div>
          <Label optional>Nama Pemilik</Label>
          <Input
            type="text"
            value={entry.name}
            onChange={(e) => onChange({ ...entry, name: e.target.value })}
            placeholder="Nama Penipu"
          />
        </div>
      </div>
    </div>
  );
}
