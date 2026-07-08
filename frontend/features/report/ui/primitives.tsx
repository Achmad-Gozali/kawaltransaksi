import React from 'react';

export function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">{children}</div>;
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <p className="text-sm font-bold text-slate-900">{title}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{subtitle}</p>}
    </div>
  );
}

export function Label({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
      {children}
      {optional && <span className="ml-1 text-slate-300 normal-case tracking-normal font-normal">(opsional)</span>}
    </label>
  );
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-300 font-medium focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none transition-all ${className ?? ''}`}
    />
  );
}

export function Sel({ children, className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      {...props}
      className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none transition-all appearance-none ${className ?? ''}`}
    >
      {children}
    </select>
  );
}