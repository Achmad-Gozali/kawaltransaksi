'use client';

import Image from 'next/image';
import { Plus, Upload, X, Trash2 } from 'lucide-react';
import { Card, SectionTitle, Label, Input, Sel } from '@/features/report/ui/primitives';
import { TargetEntryCard } from '@/features/report/ui/TargetEntryCard';
import {
  categoryList,
  platformList,
  provinsiList,
} from '@/features/report/constants';
import type { TargetEntry, ReportFormData } from '@/features/report/types';

export type Step1SubStep = 1 | 2 | 3 | 4;

interface Step1Props {
  subStep: Step1SubStep;
  target: TargetEntry;
  formData: ReportFormData;
  suspectPhotoPreview: string | null;
  customCategory: string;
  customPlatform: string;
  onUpdateTarget: (updated: TargetEntry) => void;
  onQrisEvidenceFile: (file: File, preview: string) => void;
  onClearQrisEvidence: () => void;
  onFormDataChange: (data: ReportFormData) => void;
  onSuspectPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveSuspectPhoto: () => void;
  onAddSocialField: () => void;
  onRemoveSocialField: (index: number) => void;
  onUpdateSocialField: (index: number, value: string) => void;
  onCustomCategoryChange: (val: string) => void;
  onCustomPlatformChange: (val: string) => void;
}

/** Indikator kecil untuk 4 sub-layar internal Step 1 -- terpisah dari
 *  progress indicator besar (3 langkah) di ReportForm. */
function SubStepDots({ current }: { current: Step1SubStep }) {
  return (
    <div className="flex items-center justify-center gap-1.5" aria-label={`Bagian ${current} dari 4`}>
      {[1, 2, 3, 4].map((n) => (
        <span
          key={n}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            n === current ? 'w-5 bg-slate-900' : 'w-1.5 bg-slate-200'
          }`}
        />
      ))}
    </div>
  );
}

export function Step1DataPenipu({
  subStep, target, formData, suspectPhotoPreview,
  customCategory, customPlatform,
  onUpdateTarget, onQrisEvidenceFile, onClearQrisEvidence,
  onFormDataChange, onSuspectPhotoChange, onRemoveSuspectPhoto,
  onAddSocialField, onRemoveSocialField, onUpdateSocialField,
  onCustomCategoryChange, onCustomPlatformChange,
}: Step1Props) {
  const dataPelakuSubtitle =
    target.type === 'qris'      ? 'Unggah atau pindai foto QRIS asli — data merchant terbaca otomatis'
    : target.type === 'bank_account' ? 'Pilih bank lalu masukkan nomor rekening pelaku'
    : target.type === 'ewallet' ? 'Pilih e-wallet lalu masukkan nomor HP yang terdaftar'
    : 'Masukkan nomor HP atau WhatsApp yang dipakai pelaku';

  return (
    <div className="space-y-4">
      <SubStepDots current={subStep} />

      {/* ── 1a — Pilih Tipe ─────────────────────────────────────────────── */}
      {subStep === 1 && (
        <Card>
          <div className="p-4 sm:p-5">
            <SectionTitle
              title="Tipe Laporan"
              subtitle="Pilih jenis identitas pelaku yang ingin Anda laporkan"
            />
            <TargetEntryCard
              section="type"
              entry={target}
              onChange={onUpdateTarget}
              onClearQrisEvidence={onClearQrisEvidence}
            />
          </div>
        </Card>
      )}

      {/* ── 1b — Data Pelaku ────────────────────────────────────────────── */}
      {subStep === 2 && (
        <Card>
          <div className="p-4 sm:p-5">
            <SectionTitle title="Data Pelaku" subtitle={dataPelakuSubtitle} />
            <TargetEntryCard
              section="details"
              entry={target}
              onChange={onUpdateTarget}
              onQrisEvidenceFile={onQrisEvidenceFile}
            />
          </div>
        </Card>
      )}

      {/* ── 1c — Kategori & Toko ────────────────────────────────────────── */}
      {subStep === 3 && (
        <Card>
          <div className="p-4 sm:p-5 space-y-5">
            <div>
              <SectionTitle
                title="Kategori Penipuan"
                subtitle="Pilih kategori yang paling sesuai dengan modus yang dialami"
              />
              <Sel
                value={formData.category}
                onChange={(e) => {
                  onFormDataChange({ ...formData, category: e.target.value });
                  if (e.target.value !== 'Lainnya') onCustomCategoryChange('');
                }}
              >
                <option value="">Pilih kategori penipuan...</option>
                {categoryList.map((cat: { value: string; label: string }) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </Sel>
              {formData.category === 'Lainnya' && (
                <div className="mt-3">
                  <Input
                    type="text"
                    value={customCategory}
                    onChange={(e) => onCustomCategoryChange(e.target.value)}
                    placeholder="Tuliskan kategori penipuan yang dialami..."
                    maxLength={100}
                  />
                </div>
              )}
            </div>

            <div>
              <Label optional>Nama toko / akun marketplace</Label>
              <Input
                type="text"
                value={formData.store_name}
                onChange={(e) => onFormDataChange({ ...formData, store_name: e.target.value })}
                placeholder="Contoh: Toko Elektronik Murah, @jualhp_murah"
                maxLength={150}
              />
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Nama toko di Shopee, Tokopedia, Instagram, Facebook, dll.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── 1d — Detail Tambahan (semua opsional) ───────────────────────── */}
      {subStep === 4 && (
        <>
          <Card>
            <div className="p-4 sm:p-5">
              <SectionTitle
                title="Detail Tambahan"
                subtitle="Semua opsional. Semakin lengkap, semakin cepat laporan diverifikasi."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label optional>Kerugian</Label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold select-none">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formData.loss_amount}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        onFormDataChange({
                          ...formData,
                          loss_amount: val ? new Intl.NumberFormat('id-ID').format(parseInt(val)) : '',
                        });
                      }}
                      placeholder="0"
                      className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 font-medium focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <Label optional>Tanggal kejadian</Label>
                  <input
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    value={formData.incident_date}
                    onChange={(e) => onFormDataChange({ ...formData, incident_date: e.target.value })}
                    className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none transition-all [&::-webkit-datetime-edit]:text-slate-800 [&::-webkit-date-and-time-value]:text-slate-800 ${
                      !formData.incident_date ? 'text-slate-300' : 'text-slate-800'
                    }`}
                  />
                </div>

                <div className={formData.platform === 'Lainnya' ? 'sm:col-span-2' : ''}>
                  <Label optional>Platform</Label>
                  <Sel
                    value={formData.platform}
                    onChange={(e) => {
                      onFormDataChange({ ...formData, platform: e.target.value });
                      if (e.target.value !== 'Lainnya') onCustomPlatformChange('');
                    }}
                  >
                    <option value="">Pilih platform...</option>
                    {platformList.map((p: { value: string; label: string }) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </Sel>
                  {formData.platform === 'Lainnya' && (
                    <div className="mt-2">
                      <Input
                        type="text"
                        value={customPlatform}
                        onChange={(e) => onCustomPlatformChange(e.target.value)}
                        placeholder="Tuliskan nama platform..."
                        maxLength={100}
                      />
                    </div>
                  )}
                </div>

                {formData.platform !== 'Lainnya' && (
                  <div>
                    <Label optional>Link / URL</Label>
                    <Input
                      type="url"
                      inputMode="url"
                      value={formData.link_url}
                      onChange={(e) => onFormDataChange({ ...formData, link_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                )}
              </div>

              {formData.platform === 'Lainnya' && (
                <div className="mt-4">
                  <Label optional>Link / URL</Label>
                  <Input
                    type="url"
                    inputMode="url"
                    value={formData.link_url}
                    onChange={(e) => onFormDataChange({ ...formData, link_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              )}

              <div className="mt-4">
                <Label optional>Provinsi pelaku</Label>
                <Sel
                  value={formData.suspect_city}
                  onChange={(e) => onFormDataChange({ ...formData, suspect_city: e.target.value })}
                >
                  <option value="">Pilih provinsi...</option>
                  {provinsiList.map((p: string) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </Sel>
              </div>

              <div className="mt-4">
                <Label optional>Ada korban lain yang Anda ketahui?</Label>
                <div className="flex gap-3 mt-1.5">
                  {[
                    { val: 'yes', label: 'Ya, ada korban lain' },
                    { val: 'no',  label: 'Hanya saya' },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() =>
                        onFormDataChange({
                          ...formData,
                          has_other_victims: formData.has_other_victims === opt.val ? '' : (opt.val as 'yes' | 'no'),
                        })
                      }
                      className={`flex-1 py-3 px-3 rounded-xl text-sm font-semibold border transition-all active:scale-95 ${
                        formData.has_other_victims === opt.val
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4 sm:p-5">
              <SectionTitle
                title="Akun media sosial pelaku"
                subtitle="Opsional — Instagram, TikTok, Facebook, Telegram, dll."
              />
              <div className="space-y-3">
                {formData.social_media_accounts.map((val: string, i: number) => (
                  <div key={i} className="flex gap-2">
                    <div className="relative flex-1 min-w-0">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-sm font-medium select-none">@</span>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => onUpdateSocialField(i, e.target.value)}
                        placeholder="username atau link profil"
                        className="w-full pl-7 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 font-medium focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none transition-all"
                      />
                    </div>
                    {formData.social_media_accounts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveSocialField(i)}
                        className="p-2.5 text-slate-300 hover:text-red-400 rounded-xl border border-slate-200 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {formData.social_media_accounts.length < 4 && (
                  <button
                    type="button"
                    onClick={onAddSocialField}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-emerald-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Tambah akun lain
                  </button>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-4 sm:p-5">
              <SectionTitle
                title="Foto profil pelaku"
                subtitle="Opsional — foto wajah atau identitas pelaku kalau ada"
              />
              {!suspectPhotoPreview ? (
                <label className="border-2 border-dashed border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col items-center gap-3 hover:border-emerald-300 transition-colors cursor-pointer">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-50 flex items-center justify-center">
                    <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-600">Pilih untuk mengunggah foto pelaku</p>
                    <p className="text-xs text-slate-400 mt-1">JPG / PNG · maks 5MB</p>
                  </div>
                  <input type="file" onChange={onSuspectPhotoChange} className="hidden" accept="image/*" />
                </label>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
                    <Image
                      src={suspectPhotoPreview}
                      alt="Foto pelaku"
                      fill
                      className="object-cover rounded-2xl border border-slate-200"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={onRemoveSuspectPhoto}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Foto berhasil dipilih. Tekan tanda silang untuk mengganti.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
