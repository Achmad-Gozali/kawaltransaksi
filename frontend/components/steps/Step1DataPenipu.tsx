'use client';

import Image from 'next/image';
import { Plus, Upload, X, Trash2, AlertCircle } from 'lucide-react';
import { Card, SectionTitle, Label, Input, Sel } from '../ui/primitives';
import { TargetEntryCard } from '../ui/TargetEntryCard';
import {
  MAX_TARGET_NUMBERS,
  categoryList,
  platformList,
  provinsiList,
  reportedToOptions,
} from '../report/constants';
import type { TargetEntry, ReportFormData } from '../report/types';

interface Step1Props {
  targets: TargetEntry[];
  formData: ReportFormData;
  suspectPhotoPreview: string | null;
  onUpdateTarget: (index: number, updated: TargetEntry) => void;
  onAddTarget: () => void;
  onRemoveTarget: (index: number) => void;
  onFormDataChange: (data: ReportFormData) => void;
  onSuspectPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveSuspectPhoto: () => void;
  onAddSocialField: () => void;
  onRemoveSocialField: (index: number) => void;
  onUpdateSocialField: (index: number, value: string) => void;
  onToggleReportedTo: (value: string) => void;
}

export function Step1DataPenipu({
  targets,
  formData,
  suspectPhotoPreview,
  onUpdateTarget,
  onAddTarget,
  onRemoveTarget,
  onFormDataChange,
  onSuspectPhotoChange,
  onRemoveSuspectPhoto,
  onAddSocialField,
  onRemoveSocialField,
  onUpdateSocialField,
  onToggleReportedTo,
}: Step1Props) {
  return (
    <div className="space-y-4">

      {/* ── Nomor Penipu ──────────────────────────────────────────────────── */}
      <Card>
        <div className="p-4 sm:p-5">
          <SectionTitle
            title="Nomor Penipu"
            subtitle={`Tambahkan semua nomor terkait pelaku — maks ${MAX_TARGET_NUMBERS} nomor`}
          />
          <div className="space-y-3">
            {targets.map((entry: TargetEntry, index: number) => (
              <TargetEntryCard
                key={index}
                entry={entry}
                index={index}
                isPrimary={index === 0}
                onChange={(updated) => onUpdateTarget(index, updated)}
                onRemove={index > 0 ? () => onRemoveTarget(index) : undefined}
              />
            ))}
          </div>
          {targets.length < MAX_TARGET_NUMBERS && (
            <button
              type="button"
              onClick={onAddTarget}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-sm font-semibold text-slate-400 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Tambah Nomor Lain ({targets.length}/{MAX_TARGET_NUMBERS})
            </button>
          )}
        </div>
      </Card>

      {/* ── Kategori Penipuan (wajib) ─────────────────────────────────────── */}
      <Card>
        <div className="p-4 sm:p-5">
          <SectionTitle
            title="Kategori Penipuan"
            subtitle="Pilih kategori yang paling sesuai dengan modus yang dialami"
          />
          <Sel
            value={formData.category}
            onChange={(e) => onFormDataChange({ ...formData, category: e.target.value })}
          >
            {categoryList.map((cat: { value: string; label: string }) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </Sel>
        </div>
      </Card>

      {/* ── Identitas Tambahan ────────────────────────────────────────────── */}
      <Card>
        <div className="p-4 sm:p-5">
          <SectionTitle
            title="Identitas Tambahan Penipu"
            subtitle="Bantu orang lain mengenali penipu lebih cepat"
          />
          <div className="flex flex-col gap-4">
            <div>
              <Label optional>Nama Toko / Akun Marketplace</Label>
              <Input
                type="text"
                value={formData.store_name}
                onChange={(e) =>
                  onFormDataChange({ ...formData, store_name: e.target.value })
                }
                placeholder="Contoh: Toko Elektronik Murah, @jualhp_murah"
                maxLength={150}
              />
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Nama toko di Shopee, Tokopedia, Instagram, Facebook, dll.
              </p>
            </div>
            <div>
              <Label optional>Provinsi Penipu</Label>
              <Sel
                value={formData.suspect_city}
                onChange={(e) =>
                  onFormDataChange({ ...formData, suspect_city: e.target.value })
                }
              >
                <option value="">Pilih provinsi...</option>
                {provinsiList.map((p: string) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Sel>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Isi jika kamu mengetahui lokasi penipu dari percakapan atau profilnya.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Akun Media Sosial ─────────────────────────────────────────────── */}
      <Card>
        <div className="p-4 sm:p-5">
          <SectionTitle
            title="Akun Media Sosial Penipu"
            subtitle="Instagram, TikTok, Facebook, Telegram, dll."
          />
          <div className="space-y-3">
            {formData.social_media_accounts.map((val: string, i: number) => (
              <div key={i} className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 text-sm font-medium select-none">
                    @
                  </span>
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
                    className="p-2.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-xl border border-slate-200 transition-all shrink-0"
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
                className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-emerald-600 transition-colors mt-1"
              >
                <Plus className="w-4 h-4" /> Tambah akun lain
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* ── Foto Profil Penipu ────────────────────────────────────────────── */}
      <Card>
        <div className="p-4 sm:p-5">
          <SectionTitle
            title="Foto Profil Penipu"
            subtitle="Upload foto identitas visual pelaku jika tersedia"
          />
          {!suspectPhotoPreview ? (
            <label className="border-2 border-dashed border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col items-center gap-3 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all cursor-pointer group">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-all">
                <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-500 group-hover:text-slate-700 transition-colors">
                  Klik untuk upload foto penipu
                </p>
                <p className="text-xs text-slate-300 mt-1">JPG, PNG · maks 5MB</p>
              </div>
              <input
                type="file"
                onChange={onSuspectPhotoChange}
                className="hidden"
                accept="image/*"
              />
            </label>
          ) : (
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
                <Image
                  src={suspectPhotoPreview}
                  alt="Foto penipu"
                  fill
                  className="object-cover rounded-2xl border border-slate-200"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={onRemoveSuspectPhoto}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors shadow-sm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Foto berhasil dipilih. Klik ✕ untuk mengganti.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* ── Detail Tambahan ───────────────────────────────────────────────── */}
      <Card>
        <div className="p-4 sm:p-5">
          <SectionTitle
            title="Detail Tambahan"
            subtitle="Semakin lengkap, semakin cepat laporan diverifikasi"
          />

          {/* Info box — dorong user lengkapi data */}
          <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl mb-5">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Laporan dengan nominal kerugian, tanggal kejadian, dan platform lebih mudah diverifikasi oleh tim kami.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Kerugian */}
            <div>
              <Label optional>Kerugian</Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold select-none">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.loss_amount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    onFormDataChange({
                      ...formData,
                      loss_amount: val
                        ? new Intl.NumberFormat('id-ID').format(parseInt(val))
                        : '',
                    });
                  }}
                  placeholder="0"
                  className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 font-medium focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none transition-all"
                />
              </div>
            </div>

            {/* Tanggal Kejadian */}
            <div>
              <Label optional>Tanggal Kejadian</Label>
              <input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={formData.incident_date}
                onChange={(e) =>
                  onFormDataChange({ ...formData, incident_date: e.target.value })
                }
                className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none transition-all [&::-webkit-datetime-edit]:text-slate-800 [&::-webkit-date-and-time-value]:text-slate-800 ${
                  !formData.incident_date ? 'text-slate-300' : 'text-slate-800'
                }`}
              />
            </div>

            {/* Platform */}
            <div>
              <Label optional>Platform</Label>
              <Sel
                value={formData.platform}
                onChange={(e) =>
                  onFormDataChange({ ...formData, platform: e.target.value })
                }
              >
                <option value="">Pilih platform...</option>
                {platformList.map((p: { value: string; label: string }) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </Sel>
            </div>

            {/* Link URL */}
            <div>
              <Label optional>Link / URL</Label>
              <Input
                type="url"
                inputMode="url"
                value={formData.link_url}
                onChange={(e) =>
                  onFormDataChange({ ...formData, link_url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Korban lain */}
          <div className="space-y-5">
            <div>
              <Label optional>Ada korban lain yang kamu ketahui?</Label>
              <div className="flex gap-3 mt-1.5">
                {[
                  { val: 'yes', label: 'Ya, ada korban lain' },
                  { val: 'no', label: 'Hanya saya' },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() =>
                      onFormDataChange({
                        ...formData,
                        has_other_victims:
                          formData.has_other_victims === opt.val
                            ? ''
                            : (opt.val as 'yes' | 'no'),
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

            {/* Sudah lapor ke mana */}
            <div>
              <Label optional>Sudah lapor ke mana?</Label>
              <div className="grid grid-cols-2 gap-2.5 mt-1.5">
                {reportedToOptions.map((opt: { value: string; label: string }) => {
                  const active = formData.reported_to.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onToggleReportedTo(opt.value)}
                      className={`py-3 px-3 rounded-xl text-sm font-semibold border text-left transition-all active:scale-95 ${
                        active
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Card>

    </div>
  );
}