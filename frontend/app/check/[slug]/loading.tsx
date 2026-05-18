export default function CheckLoading() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans animate-pulse">

      {/* Status bar skeleton */}
      <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-slate-300" />
          <div className="h-3 w-28 bg-slate-300 rounded-full" />
          <div className="ml-auto h-3 w-20 bg-slate-200 rounded-full" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-24 space-y-3 sm:space-y-4">

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 sm:p-5">
              <div className="h-7 w-10 bg-slate-200 rounded-lg mb-2" />
              <div className="h-2 w-16 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>

        {/* Number card skeleton */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 sm:p-6 space-y-3">
            <div className="h-8 sm:h-12 w-48 sm:w-72 bg-slate-200 rounded-lg" />
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-slate-100 rounded-lg" />
              <div className="h-6 w-16 bg-slate-100 rounded-lg" />
            </div>
          </div>
          <div className="px-4 sm:px-6 py-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-2 w-14 bg-slate-100 rounded-full" />
                <div className="h-3.5 w-24 bg-slate-200 rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* Report list skeleton */}
        <div className="space-y-1">
          <div className="h-2.5 w-24 bg-slate-200 rounded-full mb-2" />
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
              <div className="h-2.5 w-32 bg-slate-200 rounded-full" />
            </div>
            {[...Array(2)].map((_, i) => (
              <div key={i} className="px-4 py-4 border-b border-slate-100 space-y-2">
                <div className="h-3 w-full bg-slate-100 rounded-full" />
                <div className="h-3 w-4/5 bg-slate-100 rounded-full" />
                <div className="h-3 w-3/5 bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* CTA skeleton */}
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-200 px-5 py-5 space-y-2.5">
            <div className="h-4 w-40 bg-slate-300 rounded-lg" />
            <div className="h-3 w-52 bg-slate-300/70 rounded-full" />
            <div className="h-10 w-full bg-slate-300 rounded-lg mt-1" />
          </div>
          <div className="bg-white px-5 py-4 space-y-2">
            <div className="h-2.5 w-24 bg-slate-100 rounded-full" />
            <div className="h-9 w-full bg-slate-100 rounded-lg" />
            <div className="h-9 w-full bg-slate-100 rounded-lg" />
          </div>
        </div>

      </div>
    </div>
  );
}