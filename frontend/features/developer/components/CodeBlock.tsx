'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-slate-900 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/50 border-b border-slate-700/50">
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{language}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 text-[10px] text-slate-400 hover:text-white transition-colors">
          {copied
            ? <><Check className="w-3 h-3 text-emerald-400" /> Tersalin</>
            : <><Copy className="w-3 h-3" /> Salin</>}
        </button>
      </div>
      <pre className="p-4 sm:p-5 text-xs sm:text-sm text-slate-300 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const CODE_EXAMPLES = {
  cURL: `curl -X GET "https://api.kawaltransaksi.com/api/v1/check?number=08123456789&type=phone" \\
  -H "X-API-Key: kt_your_api_key_here"`,

  Python: `import requests

response = requests.get(
    "https://api.kawaltransaksi.com/api/v1/check",
    params={"number": "08123456789", "type": "phone"},
    headers={"X-API-Key": "kt_your_api_key_here"}
)

data = response.json()
if data["success"]:
    status = data["data"]["status"]  # safe | warning | danger
    print(f"Status: {status}")
    print(f"Laporan terverifikasi: {data['data']['verified_reports']}")
    print(f"Sisa request: {data['meta']['requests_remaining']}")`,

  JavaScript: `const response = await fetch(
  "https://api.kawaltransaksi.com/api/v1/check?number=08123456789&type=phone",
  { headers: { "X-API-Key": "kt_your_api_key_here" } }
);

const data = await response.json();
if (data.success) {
  const { status, verified_reports } = data.data; // safe | warning | danger
  const { requests_remaining } = data.meta;
  console.log({ status, verified_reports, requests_remaining });
}`,
};

export function CodeTabs() {
  const [active, setActive] = useState<keyof typeof CODE_EXAMPLES>('cURL');
  return (
    <div>
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {(Object.keys(CODE_EXAMPLES) as (keyof typeof CODE_EXAMPLES)[]).map((lang) => (
          <button key={lang} onClick={() => setActive(lang)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              active === lang
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-400'
            }`}>
            {lang}
          </button>
        ))}
      </div>
      <CodeBlock code={CODE_EXAMPLES[active]} language={active} />
    </div>
  );
}