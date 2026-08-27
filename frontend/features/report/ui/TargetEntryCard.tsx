'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Upload, CheckCircle2, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import { Input, Sel } from '@/features/report/ui/primitives';
import { bankList, ewalletList } from '@/features/report/constants';
import { decodeQrisFromFile } from '@/core/qris';
import type { TargetEntry } from '@/features/report/types';

interface Props {
  entry: TargetEntry;
  onChange: (updated: TargetEntry) => void;
  // Dipanggil saat foto QRIS berhasil didecode -- file-nya ikut jadi bagian
  // dari evidence laporan (mengikuti pola evidence yang sudah ada), dikelola
  // ReportForm lewat state evidenceFiles yang sama dipakai Step 3.
  onQrisEvidenceFile?: (file: File, preview: string) => void;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onloadend = () => res(r.result as string);
    r.onerror   = () => rej(new Error('Gagal membaca file'));
    r.readAsDataURL(file);
  });
}

function QrisTargetInput({ entry, onChange, onQrisEvidenceFile }: Required<Pick<Props, 'entry' | 'onChange'>> & Pick<Props, 'onQrisEvidenceFile'>) {
  const [isDecoding, setIsDecoding] = useState(false);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const isConfirmed = !!entry.number && !!entry.qris_payload;

  const handleFile = async (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setDecodeError('Ukuran file melebihi 5MB.'); return; }

    setIsDecoding(true);
    setDecodeError(null);
    const dataUrl = await readFileAsDataUrl(file);
    setPreview(dataUrl);

    const result = await decodeQrisFromFile(file);
    setIsDecoding(false);

    if (!result.valid || !result.payload) {
      setDecodeError(result.error ?? 'Gagal membaca QRIS dari foto ini.');
      onChange({ ...entry, number: '', name: '', qris_payload: undefined, qris_merchant_city: undefined });
      return;
    }

    onChange({
      ...entry,
      number: result.nmid!,
      name: result.merchantName!,
      qris_payload: result.payload,
      qris_merchant_city: result.merchantCity,
    });
    onQrisEvidenceFile?.(file, dataUrl);
  };

  const reset = () => {
    setPreview(null);
    setDecodeError(null);
    onChange({ ...entry, number: '', name: '', qris_payload: undefined, qris_merchant_city: undefined });
  };

  if (isConfirmed && preview) {
    return (
      <div className="space-y-2.5">
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          <div className="relative w-14 h-14 shrink-0">
            <Image src={preview} alt="Foto QRIS" fill className="object-cover rounded-lg border border-emerald-200" unoptimized />
          </div>
          <div className="flex-1 min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> QRIS berhasil dibaca
            </p>
            <p className="text-sm font-bold text-slate-900 truncate">{entry.name}</p>
            <p className="text-[11px] text-slate-500 truncate">
              NMID {entry.number} {entry.qris_merchant_city ? `- ${entry.qris_merchant_city}` : ''}
            </p>
          </div>
          <button type="button" onClick={reset}
            className="shrink-0 p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Data merchant di atas dibaca otomatis dari kode QR dan tidak dapat diubah manual. Apabila keliru atau merchant berbeda, tekan ikon ganti foto.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2.5 transition-all cursor-pointer group ${
        decodeError ? 'border-red-200 bg-red-50/30' : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20'
      }`}>
        <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-all">
          {isDecoding ? <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" /> : <Upload className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />}
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-500 group-hover:text-slate-700 transition-colors">
            {isDecoding ? 'Membaca kode QRIS...' : 'Unggah atau pindai foto QRIS asli'}
          </p>
          <p className="text-xs text-slate-300 mt-1">Foto harus menampilkan kode QR utuh dan jelas - JPG, PNG, maks 5MB</p>
        </div>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          disabled={isDecoding}
          onChange={e => handleFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
      </label>

      {decodeError && (
        <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{decodeError}</span>
        </div>
      )}
    </div>
  );
}

export function TargetEntryCard({ entry, onChange, onQrisEvidenceFile }: Props) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      <div>
        <Sel value={entry.type} onChange={e => onChange({
          ...entry, type: e.target.value as any, bank_name: '', ewallet_name: '',
          number: '', name: '', qris_payload: undefined, qris_merchant_city: undefined,
        })}>
          <option value="phone">Nomor HP / WhatsApp</option>
          <option value="bank_account">Rekening Bank</option>
          <option value="ewallet">E-Wallet / Dompet Digital</option>
          <option value="qris">QRIS</option>
        </Sel>
        {entry.type === 'phone' && (
          <p className="mt-1.5 text-[11px] text-slate-400">
            Melaporkan rekening atau e-wallet?{' '}
            <span className="text-emerald-600 font-semibold">Ganti tipe di atas ↑</span>
          </p>
        )}
      </div>

      {entry.type === 'qris' && (
        <QrisTargetInput entry={entry} onChange={onChange} onQrisEvidenceFile={onQrisEvidenceFile} />
      )}

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

      {entry.type !== 'qris' && (
        <>
          <Input
            type={entry.type === 'phone' ? 'tel' : 'text'}
            inputMode="numeric"
            value={entry.number}
            onChange={e => onChange({ ...entry, number: e.target.value.replace(/\D/g, '') })}
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
        </>
      )}
    </div>
  );
}