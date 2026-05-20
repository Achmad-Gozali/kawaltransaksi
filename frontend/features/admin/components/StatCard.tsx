export default function StatCard({
  label,
  value,
  color,
  icon: Icon,
  bg,
}: {
  label: string;
  value: string;
  color: string;
  icon: React.ElementType;
  bg: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 transition-colors">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-4`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className={`text-2xl font-bold ${color} mb-0.5`}>{value}</p>
      <p className="text-xs text-slate-400 font-medium">{label}</p>
    </div>
  );
}
