'use client';

import { useMemo, useRef, useState } from 'react';
import { FullMarksResult } from '@/lib/types';
import { TrackedDraft } from '@/components/TrackedDraft';

const loadingSteps = ['Parsing rubric', 'Evaluating draft', 'Improving content', 'Finalizing output'];

const placeholders = {
  prompt: 'Assignment Prompt:\nWrite an argumentative essay on whether social media helps or harms student learning.',
  rubric: 'Rubric:\n- Clear thesis\n- Evidence and analysis\n- Organization and transitions\n- Conclusion quality',
  draft: 'Draft:\nSocial media affects students in many ways. It can be helpful but also distracting...'
};

export default function Home() {
  const [input, setInput] = useState(`${placeholders.prompt}\n\n${placeholders.rubric}\n\n${placeholders.draft}`);
  const [result, setResult] = useState<FullMarksResult | null>(null);
  const [tab, setTab] = useState<'Improved Draft' | 'What Changed' | 'Needs Your Input' | 'Export Final'>('Improved Draft');
  const [view, setView] = useState<'improved' | 'side'>('improved');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  const finalVersion = useMemo(() => {
    if (!result) return '';
    return result.changes.reduce((acc, change) => {
      if (change.type === 'deletion' && change.original_text) return acc.replace(change.original_text, '');
      return acc;
    }, result.improved_draft);
  }, [result]);

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    let i = 0;
    const timer = setInterval(() => setStep((i = Math.min(i + 1, loadingSteps.length - 1))), 700);
    const res = await fetch('/api/improve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input })
    });
    const json = await res.json();
    clearInterval(timer);
    setStep(loadingSteps.length - 1);
    setResult(json);
    setLoading(false);
  };

  const syncScroll = (source: 'left' | 'right') => {
    const sourceEl = source === 'left' ? leftRef.current : rightRef.current;
    const targetEl = source === 'left' ? rightRef.current : leftRef.current;
    if (sourceEl && targetEl) targetEl.scrollTop = sourceEl.scrollTop;
  };

  const copyFinal = async () => navigator.clipboard.writeText(finalVersion || result?.improved_draft || '');
  const downloadFinal = () => {
    const blob = new Blob([finalVersion || result?.improved_draft || ''], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'fullmarks-final.txt';
    a.click();
  };

  return (
    <main className="min-h-screen p-5 md:p-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">FullMarks</h1>
          <p className="mt-2 text-slate-600">Paste your assignment, rubric, and draft. FullMarks optimizes your draft for maximum rubric performance.</p>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="mt-4 h-52 w-full rounded-xl border border-slate-300 p-4 text-sm focus:border-brand-500 focus:outline-none"
            placeholder="Paste your assignment prompt, rubric, and draft"
          />
          <button onClick={handleAnalyze} className="mt-4 rounded-lg bg-brand-600 px-5 py-2 font-semibold text-white hover:bg-brand-500">
            Analyze & Improve
          </button>
          {loading && (
            <div className="mt-4 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
              {loadingSteps.map((s, idx) => (
                <div key={s} className={idx <= step ? 'font-semibold' : 'opacity-60'}>{idx <= step ? '✓' : '…'} {s}</div>
              ))}
            </div>
          )}
        </header>

        {result && (
          <section className="grid gap-5 lg:grid-cols-[340px,1fr]">
            <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold">Context & Analysis</h2>
              <p className="text-sm">Score: <span className="font-semibold">{result.original_score}</span> → <span className="font-semibold text-emerald-600">{result.improved_score}</span></p>
              <div className="space-y-2">
                {result.criteria.map((item) => (
                  <div key={item.name} className="rounded-lg border border-slate-200 p-2 text-xs">
                    <p className="font-semibold">{item.name}</p>
                    <p>{item.status_before} → {item.status_after}</p>
                    <p className="text-slate-600">{item.reason}</p>
                  </div>
                ))}
              </div>
              {[
                ['Prompt', result.prompt || 'Detected from your input'],
                ['Rubric', result.rubric || 'Detected from your input'],
                ['Original Draft', result.original_draft || 'Detected from your input']
              ].map(([label, value]) => (
                <details key={label} className="rounded-lg border border-slate-200 p-2 text-xs">
                  <summary className="cursor-pointer font-semibold">{label}</summary>
                  <p className="mt-2 whitespace-pre-wrap text-slate-700">{value}</p>
                </details>
              ))}
            </aside>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 rounded-xl bg-slate-50 p-4">
                <p className="text-4xl font-bold text-brand-600">{result.improved_score}/100</p>
                <p className="font-medium text-emerald-600">+{result.improved_score - result.original_score} points</p>
                <p className="mt-1 text-sm text-slate-600">{result.insight}</p>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {['Improved Draft', 'What Changed', 'Needs Your Input', 'Export Final'].map((label) => (
                  <button
                    key={label}
                    className={`rounded-full px-3 py-1 text-sm ${tab === label ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`}
                    onClick={() => setTab(label as typeof tab)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {tab === 'Improved Draft' && (
                <>
                  <div className="mb-3 flex gap-2">
                    <button className={`rounded px-3 py-1 text-sm ${view === 'improved' ? 'bg-brand-600 text-white' : 'bg-slate-100'}`} onClick={() => setView('improved')}>Improved View</button>
                    <button className={`rounded px-3 py-1 text-sm ${view === 'side' ? 'bg-brand-600 text-white' : 'bg-slate-100'}`} onClick={() => setView('side')}>Side-by-Side</button>
                  </div>

                  {view === 'improved' ? (
                    <TrackedDraft improvedDraft={result.improved_draft} changes={result.changes} />
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      <div ref={leftRef} onScroll={() => syncScroll('left')} className="h-80 overflow-y-auto rounded-xl border border-slate-200 p-3 text-sm whitespace-pre-wrap">{result.original_draft}</div>
                      <div ref={rightRef} onScroll={() => syncScroll('right')} className="h-80 overflow-y-auto rounded-xl border border-slate-200 p-3 text-sm">
                        <TrackedDraft improvedDraft={result.improved_draft} changes={result.changes} />
                      </div>
                    </div>
                  )}
                </>
              )}

              {tab === 'What Changed' && (
                <div className="space-y-3 text-sm">
                  {(['high', 'medium', 'minor'] as const).map((impact) => (
                    <div key={impact}>
                      <h3 className="mb-2 font-semibold capitalize">{impact} Impact</h3>
                      <div className="space-y-2">
                        {result.changes.filter((change) => change.impact === impact).map((change) => (
                          <div key={change.id} className="rounded-lg border border-slate-200 p-3">
                            <p><span className="font-semibold">What:</span> {change.new_text}</p>
                            <p><span className="font-semibold">Why:</span> {change.reason}</p>
                            <p><span className="font-semibold">Criterion:</span> {change.criterion}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'Needs Your Input' && (
                <ul className="list-disc space-y-2 pl-5 text-sm text-amber-700">
                  {result.missing_information.map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}

              {tab === 'Export Final' && (
                <textarea readOnly value={finalVersion || result.improved_draft} className="h-64 w-full rounded-xl border border-slate-300 p-3 text-sm" />
              )}

              <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                <button className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white" onClick={() => setTab('Export Final')}>Accept All Changes</button>
                <button className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-800" onClick={() => setResult(null)}>Revert to Original</button>
                <button className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-800" onClick={copyFinal}>Copy Final Version</button>
                <button className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-800" onClick={downloadFinal}>Download</button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
