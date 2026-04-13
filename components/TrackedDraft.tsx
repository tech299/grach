'use client';

import { useMemo, useState } from 'react';
import { DraftChange } from '@/lib/types';

interface Props {
  improvedDraft: string;
  changes: DraftChange[];
}

export function TrackedDraft({ improvedDraft, changes }: Props) {
  const [active, setActive] = useState<string | null>(null);

  const rendered = useMemo(() => {
    let html = improvedDraft;
    changes.forEach((change) => {
      if (!change.new_text) return;
      const cls =
        change.type === 'addition'
          ? 'bg-emerald-100 text-emerald-900 rounded px-1'
          : change.type === 'deletion'
            ? 'line-through decoration-2 decoration-rose-500 text-rose-700 rounded px-1'
            : 'underline decoration-brand-500 decoration-2 underline-offset-2 bg-blue-50 rounded px-1';

      html = html.replace(
        change.new_text,
        `<button class="${cls} relative" data-change-id="${change.id}">${change.new_text}</button>`
      );
    });
    return html;
  }, [changes, improvedDraft]);

  const activeChange = changes.find((c) => c.id === active);

  return (
    <div className="space-y-3">
      <div
        className="prose prose-slate max-w-none whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-4 text-sm leading-7 shadow-sm"
        dangerouslySetInnerHTML={{ __html: rendered }}
        onClick={(event) => {
          const target = event.target as HTMLElement;
          const id = target.getAttribute('data-change-id');
          if (id) setActive(id);
        }}
      />

      {activeChange && (
        <div className="rounded-xl border border-brand-100 bg-brand-50 p-3 text-sm shadow-sm">
          <p className="font-semibold text-brand-600">Change details</p>
          <p>
            <span className="font-medium">What:</span> {activeChange.type} — {activeChange.original_text || 'Inserted new text'}
          </p>
          <p>
            <span className="font-medium">Why:</span> {activeChange.reason}
          </p>
          <p>
            <span className="font-medium">Rubric criterion:</span> {activeChange.criterion}
          </p>
        </div>
      )}
    </div>
  );
}
