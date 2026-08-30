'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Upload, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import { Input, Sel, Label } from '@/features/report/ui/primitives';
import { bankList, ewalletList } from '@/features/report/constants';
import { decodeQrisFromFile } from '@/core/qris';
import type { TargetEntry } from '@/features/report/types';

interface Props {
  entry: TargetEntry;
  // Sub-layar mana yang dirender:
  //  - 'type'    : hanya dropdown pilih tipe (Step 1a)
  //  - 'details' : field target sesuai tipe yang sudah dipilih (Step 1b)
  section: 'type' | 'details';
  onChange: (updated: TargetEntry) => void;
  // Dipanggil saat foto QRIS berhasil didecode -- file-nya ikut jadi bagian
  // dari evidence laporan (mengikuti pola evidence yang sudah ada), dikelola
  // ReportForm lewat state evidenceFiles yang sama dipakai Step 3.
  onQrisEvidenceFile?: (file: File, preview: string) => void;
  // Dipanggil saat user mengganti tipe target DARI "qris" ke tipe lain --
  // ReportForm membuang item isQrisSource dari evidenceFiles supaya foto QRIS
  // lama tidak nyasar jadi bukti biasa di laporan phone/bank/ewallet.
  onClearQrisEvidence?: () => void;
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

  const preview = entry.qris_preview ?? null;
  const isConfirmed = !!entry.number && !!entry.qris_payload;

  const handleFile = async (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setDecodeError('Ukuran file melebihi 5MB.'); return; }

    setIsDecoding(true);
    setDecodeError(null);
    const dataUrl = await readFileAsDataUrl(file);

    const result = await decodeQrisFromFile(file);
    setIsDecoding(false);

    if (!result.valid || !result.payload) {
      setDecodeError(result.error ?? 'Gagal membaca kode QRIS dari foto ini. Coba foto ulang dengan lebih jelas.');
      onChange({ ...entry, number: '', name: '', qris_payload: undefined, qris_merchant_city: undefined, qris_preview: undefined });
      return;
    }

    onChange({
      ...entry,
      number: result.nmid!,
      name: result.merchantName!,
      qris_payload: result.payload,
      qris_merchant_city: result.merchantCity,
      qris_preview: dataUrl,
    });
    onQrisEvidenceFile?.(file, dataUrl);
  };

  const reset = () => {
    setDecodeError(null);
    onChange({ ...entry, number: '', name: '', qris_payload: undefined, qris_merchant_city: undefined, qris_preview: undefined });
  };

  if (isConfirmed && preview) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          <div className="relative w-14 h-14 shrink-0">
            <Image src={preview} alt="Foto QRIS" fill className="object-cover rounded-lg border border-emerald-200" unoptimized />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-emerald-700 mb-1">QRIS berhasil dibaca</p>
            <p className="text-sm font-bold text-slate-900 truncate">{entry.name}</p>
            <p className="text-[11px] text-slate-500 truncate">
              NMID {entry.number}{entry.qris_merchant_city ? ` · ${entry.qris_merchant_city}` : ''}
            </p>
          </div>
          <button type="button" onClick={reset}
            className="shrink-0 p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Data merchant dibaca otomatis dari kode QR dan tidak bisa diubah manual. Kalau keliru, tekan ikon ganti foto.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2.5 transition-colors cursor-pointer ${
        decodeError ? 'border-red-200 bg-red-50/30' : 'border-slate-200 hover:border-emerald-300'
      }`}>
        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
          {isDecoding ? <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" /> : <Upload className="w-4 h-4 text-slate-300" />}
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-600">
            {isDecoding ? 'Membaca kode QRIS...' : 'Unggah atau pindai foto QRIS asli'}
          </p>
          <p className="text-xs text-slate-400 mt-1">Kode QR harus utuh dan jelas · JPG / PNG · maks 5MB</p>
        </div>
        {/* Tanpa atribut `capture`: di HP, tap akan memunculkan pilihan
            Kamera ATAU Galeri (dgn `capture` browser langsung buka kamera). */}
        <input
          type="file"
          accept="image/*"
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

export function TargetEntryCard({ entry, section, onChange, onQrisEvidenceFile, onClearQrisEvidence }: Props) {
  // ── Step 1a: pilih tipe ──────────────────────────────────────────────────
  if (section === 'type') {
    return (
      <Sel
        value={entry.type}
        onChange={e => {
          const nextType = e.target.value as TargetEntry['type'];
          // Foto QRIS yang sudah didorong ke evidence ikut dibersihkan saat
          // pindah dari qris ke tipe lain -- target-nya di-reset di bawah.
          if (entry.type === 'qris' && nextType !== 'qris') onClearQrisEvidence?.();
          onChange({
            ...entry, type: nextType, bank_name: '', ewallet_name: '',
            number: '', name: '', qris_payload: undefined, qris_merchant_city: undefined,
            qris_preview: undefined,
          });
        }}
      >
        <option value="">Pilih tipe laporan...</option>
        <option value="phone">Nomor HP / WhatsApp</option>
        <option value="bank_account">Rekening Bank</option>
        <option value="ewallet">E-Wallet / Dompet Digital</option>
        <option value="qris">QRIS</option>
      </Sel>
    );
  }

  // ── Step 1b: data pelaku sesuai tipe ─────────────────────────────────────
  if (entry.type === 'qris') {
    return <QrisTargetInput entry={entry} onChange={onChange} onQrisEvidenceFile={onQrisEvidenceFile} />;
  }

  if (entry.type !== 'phone' && entry.type !== 'bank_account' && entry.type !== 'ewallet') {
    return null; // tipe belum dipilih -- seharusnya tidak sampai sini (dicegah navigasi)
  }

  return (
    <div className="space-y-4">
      {entry.type === 'bank_account' && (
        <div>
          <Label>Bank</Label>
          <Sel value={entry.bank_name} onChange={e => onChange({ ...entry, bank_name: e.target.value })}>
            <option value="">Pilih bank...</option>
            {bankList.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
          </Sel>
          {entry.bank_name === 'Lainnya' && (
            <div className="mt-2">
              <Input
                type="text"
                value={entry.custom_bank_name ?? ''}
                onChange={e => onChange({ ...entry, custom_bank_name: e.target.value })}
                placeholder="Tuliskan nama bank..."
                maxLength={100}
              />
            </div>
          )}
        </div>
      )}

      {entry.type === 'ewallet' && (
        <div>
          <Label>E-Wallet</Label>
          <Sel value={entry.ewallet_name} onChange={e => onChange({ ...entry, ewallet_name: e.target.value })}>
            <option value="">Pilih e-wallet...</option>
            {ewalletList.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
          </Sel>
          {entry.ewallet_name === 'Lainnya' && (
            <div className="mt-2">
              <Input
                type="text"
                value={entry.custom_ewallet_name ?? ''}
                onChange={e => onChange({ ...entry, custom_ewallet_name: e.target.value })}
                placeholder="Tuliskan nama e-wallet..."
                maxLength={100}
              />
            </div>
          )}
        </div>
      )}

      <div>
        <Label>
          {entry.type === 'phone' ? 'Nomor HP / WhatsApp'
            : entry.type === 'bank_account' ? 'Nomor rekening'
            : 'Nomor HP terdaftar e-wallet'}
        </Label>
        <Input
          type={entry.type === 'phone' ? 'tel' : 'text'}
          inputMode="numeric"
          value={entry.number}
          onChange={e => onChange({ ...entry, number: e.target.value.replace(/\D/g, '') })}
          placeholder={
            entry.type === 'phone' ? '08xxxxxxxxxx'
            : entry.type === 'bank_account' ? 'Nomor rekening tujuan'
            : 'Nomor HP terdaftar e-wallet'
          }
          maxLength={entry.type === 'phone' ? 15 : 20}
        />
      </div>

      <div>
        <Label optional>Nama pemilik</Label>
        <Input
          type="text"
          value={entry.name}
          onChange={e => onChange({ ...entry, name: e.target.value })}
          placeholder="Nama sesuai rekening / akun"
          maxLength={100}
        />
      </div>
    </div>
  );
}
