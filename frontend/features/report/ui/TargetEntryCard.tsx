'use client';

import { Input, Sel } from '@/features/report/ui/primitives';
import { bankList, ewalletList } from '@/features/report/constants';
import type { TargetEntry } from '@/features/report/types';

interface Props {
  entry: TargetEntry;
  onChange: (updated: TargetEntry) => void;
}

export function TargetEntryCard({ entry, onChange }: Props) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      <div>
        <Sel value={entry.type} onChange={e => onChange({ ...entry, type: e.target.value as any, bank_name: '', ewallet_name: '' })}>
          <option value="phone">Nomor HP / WhatsApp</option>
          <option value="bank_account">Rekening Bank</option>
          <option value="ewallet">E-Wallet / Dompet Digital</option>
        </Sel>
        {entry.type === 'phone' && (
          <p className="mt-1.5 text-[11px] text-slate-400">
            Melaporkan rekening atau e-wallet?{' '}
            <span className="text-emerald-600 font-semibold">Ganti tipe di atas ↑</span>
          </p>
        )}
      </div>

      {entry.type === 'bank_account' && (
        <div className="space-y-2">
          <Sel value={entry.bank_name} onChange={e => onChange({ ...entry, bank_name: e.target.value })}>
            <option value="">Pilih bank...</option>
            {bankList.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
          </Sel>
          {entry.bank_name === 'Lainnya' && (
            <Input
              type="text"
              value={entry.custom_bank_name ?? ''}
              onChange={e => onChange({ ...entry, custom_bank_name: e.target.value })}
              placeholder="Tuliskan nama bank..."
              maxLength={100}
            />
          )}
        </div>
      )}

      {entry.type === 'ewallet' && (
        <div className="space-y-2">
          <Sel value={entry.ewallet_name} onChange={e => onChange({ ...entry, ewallet_name: e.target.value })}>
            <option value="">Pilih e-wallet...</option>
            {ewalletList.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </Sel>
          {entry.ewallet_name === 'Lainnya' && (
            <Input
              type="text"
              value={entry.custom_ewallet_name ?? ''}
              onChange={e => onChange({ ...entry, custom_ewallet_name: e.target.value })}
              placeholder="Tuliskan nama e-wallet..."
              maxLength={100}
            />
          )}
        </div>
      )}

      <Input
        type={entry.type === 'phone' ? 'tel' : 'text'}
        inputMode="numeric"
        value={entry.number}
        onChange={e => onChange({ ...entry, number: e.target.value })}
        placeholder={
          entry.type === 'phone' ? '08xxxxxxxxxx'
          : entry.type === 'bank_account' ? 'Nomor rekening'
          : 'Nomor HP terdaftar e-wallet'
        }
        maxLength={entry.type === 'phone' ? 15 : 20}
      />

      <Input
        type="text"
        value={entry.name}
        onChange={e => onChange({ ...entry, name: e.target.value })}
        placeholder="Nama pemilik (opsional)"
        maxLength={100}
      />
    </div>
  );
}