import { ChevronDown } from 'lucide-react';

export function Label({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <p className="text-sm font-semibold text-slate-700 mb-2">
      {children}
      {optional && (
        <span className="ml-1.5 text-slate-300 font-normal text-xs">(opsional)</span>
      )}
    </p>
  );
}

export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 placeholder:text-slate-300 font-medium focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none transition-all ${className}`}
    />
  );
}

export function Sel({
  children,
  className = '',
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-800 font-medium focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 outline-none appearance-none transition-all ${className}`}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <p className="text-base font-semibold text-slate-800">{title}</p>
      {subtitle && (
        <p className="text-sm text-slate-400 mt-0.5 leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}
