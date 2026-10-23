import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCmsPage, useCmsMutations } from '@/cms/store';
import { BLOCKS, blockDef } from '@/cms/blocks';
import type { BlockInstance, FieldDef } from '@/cms/types';
import { imgSrc } from '@/lib/img';
import { format, parseISO } from 'date-fns';

let uid = 0;
const newId = () => `blk-${Date.now()}-${uid++}`;

/* ---------- jedan blok na canvasu (sortable) ---------- */
function CanvasBlock({
  block, selected, onSelect, onDelete,
}: {
  block: BlockInstance; selected: boolean;
  onSelect: () => void; onDelete: () => void;
}) {
  const def = blockDef(block.type);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onSelect}
      className={`group relative border bg-card transition-shadow ${
        selected ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-muted-foreground'
      } ${isDragging ? 'z-20 opacity-90 shadow-xl' : ''}`}
    >
      <div className="flex items-center justify-between border-b border-border bg-surface-warm px-3 py-1.5">
        <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
          {def?.label ?? block.type}
          {def?.variants && (
            <span className="ml-2 text-primary">
              · {def.variants.find((m) => m.key === (block.props.variant ?? def.variants?.[0]?.key))?.label}
            </span>
          )}
        </span>
        <div className="flex items-center gap-1">
          <button {...attributes} {...listeners}
            className="cursor-grab px-2 py-0.5 font-mono-label text-xs text-muted-foreground hover:text-foreground active:cursor-grabbing"
            title="Povuci za promjenu redoslijeda" aria-label="Povuci blok">
            ⠿
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="px-2 py-0.5 font-mono-label text-xs text-muted-foreground hover:text-destructive"
            title="Ukloni blok" aria-label="Ukloni blok">
            ✕
          </button>
        </div>
      </div>
      <div className="pointer-events-none select-none">
        {def ? def.render(block.props) : <p className="p-6 text-sm text-destructive">Nepoznat blok: {block.type}</p>}
      </div>
    </div>
  );
}

/* ---------- inspektor ---------- */
function Inspector({ block, onChange }: { block: BlockInstance; onChange: (props: Record<string, unknown>) => void }) {
  const def = blockDef(block.type);
  if (!def) return null;

  const renderField = (f: FieldDef) => {
    const value = block.props[f.key];
    const set = (v: unknown) => onChange({ ...block.props, [f.key]: v });
    const labelEl = (
      <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">{f.label}</span>
    );

    switch (f.type) {
      case 'textarea':
        return (
          <label key={f.key} className="block">{labelEl}
            <textarea value={String(value ?? '')} onChange={(e) => set(e.target.value)} rows={4}
              className="mt-1 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>
        );
      case 'number':
        return (
          <label key={f.key} className="block">{labelEl}
            <input type="number" min={f.min} max={f.max} value={Number(value ?? 0)}
              onChange={(e) => set(Number(e.target.value))}
              className="mt-1 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>
        );
      case 'boolean':
        return (
          <label key={f.key} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={Boolean(value)} onChange={(e) => set(e.target.checked)}
              className="h-4 w-4 accent-[hsl(var(--primary))]" />
            {f.label}
          </label>
        );
      case 'select':
      case 'image':
        return (
          <div key={f.key}>
            <label className="block">{labelEl}
              <select value={String(value ?? '')} onChange={(e) => set(e.target.value)}
                className="mt-1 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary">
                {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          </div>
        );
      case 'images': {
        const selected = Array.isArray(value) ? value.map(String) : [];
        const toggle = (key: string) => {
          const next = selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key];
          set(next);
        };
        return (
          <div key={f.key}>
            {labelEl}
            <div className="mt-2 grid grid-cols-3 gap-2">
              {f.options?.map((o) => {
                const src = imgSrc(o.value);
                const on = selected.includes(o.value);
                return (
                  <button key={o.value} type="button" onClick={() => toggle(o.value)}
                    title={o.label}
                    className={`relative aspect-[4/3] overflow-hidden border transition-all ${
                      on ? 'border-primary ring-1 ring-primary' : 'border-border opacity-60 hover:opacity-100'
                    }`}>
                    {src && <img src={src} alt={o.label} className="h-full w-full object-cover" />}
                    {on && (
                      <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                        {selected.indexOf(o.value) + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{selected.length} odabranih — redoslijed = redoslijed klika</p>
          </div>
        );
      }
      default:
        return (
          <label key={f.key} className="block">{labelEl}
            <input value={String(value ?? '')} onChange={(e) => set(e.target.value)}
              className="mt-1 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>
        );
    }
  };

  return (
    <div className="space-y-4">
      <p className="border-b border-border pb-2 font-mono-label text-[11px] uppercase tracking-widest">
        {def.label}
      </p>

      {/* MODEL BLOKA — zamjena na jedan klik */}
      {def.variants && def.variants.length > 1 && (
        <div>
          <p className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">Model prikaza</p>
          <div className="mt-2 space-y-2">
            {def.variants.map((m) => {
              const active = String(block.props.variant ?? def.variants?.[0]?.key) === m.key;
              return (
                <button key={m.key} type="button"
                  onClick={() => onChange({ ...block.props, variant: m.key })}
                  className={`w-full border p-3 text-left transition-colors ${
                    active ? 'border-primary bg-secondary' : 'border-border bg-background hover:border-muted-foreground'
                  }`}>
                  <span className="flex items-center justify-between">
                    <span className="text-sm font-medium">{m.label}</span>
                    {active && <span className="font-mono-label text-[10px] uppercase tracking-widest text-primary">✓ Aktivan</span>}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{m.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {def.fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ovaj blok nema podesivih polja — sadrzaj dolazi iz baze objekata.</p>
      ) : (
        def.fields.map(renderField)
      )}
    </div>
  );
}

/* ---------- glavni builder ---------- */
export default function PageBuilder() {
  const { id } = useParams();
  const pageId = Number(id ?? 0);
  const { page, isLoading } = useCmsPage(pageId);
  const mutations = useCmsMutations();
  const navigate = useNavigate();

  const [blocks, setBlocks] = useState<BlockInstance[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);
  const [showSeo, setShowSeo] = useState(false);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [savedFlash, setSavedFlash] = useState('');

  useEffect(() => {
    if (page) {
      setBlocks([...page.draft]);
      setDirty(false);
      setSelectedId(null);
      setSeoTitle(page.seoTitle ?? '');
      setSeoDesc(page.seoDescription ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId, isLoading]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const selected = useMemo(() => blocks.find((b) => b.id === selectedId) ?? null, [blocks, selectedId]);

  if (isLoading) {
    return <div className="flex h-[60vh] items-center justify-center"><p className="font-mono-label text-sm text-muted-foreground">Ucitavanje…</p></div>;
  }

  if (!page) {
    return (
      <div className="mx-auto max-w-[800px] px-8 pt-20 text-center">
        <p className="font-display text-2xl">Stranica nije pronadjena</p>
        <button onClick={() => navigate('/admin')} className="link-underline-faint mt-4 text-sm">← Natrag</button>
      </div>
    );
  }

  const markDirty = (next: BlockInstance[]) => { setBlocks(next); setDirty(true); };

  const addBlock = (type: string) => {
    const def = blockDef(type);
    if (!def) return;
    const b: BlockInstance = { id: newId(), type, props: { ...def.defaultProps } };
    markDirty([...blocks, b]);
    setSelectedId(b.id);
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = blocks.findIndex((b) => b.id === active.id);
    const to = blocks.findIndex((b) => b.id === over.id);
    markDirty(arrayMove(blocks, from, to));
  };

  const flash = (msg: string) => { setSavedFlash(msg); setTimeout(() => setSavedFlash(''), 2000); };

  const save = () => {
    mutations.saveDraft.mutate({ id: page.id, blocks }, {
      onSuccess: () => { setDirty(false); flash('Skica spremljena'); },
    });
  };

  const doPublish = () => {
    mutations.saveDraft.mutate({ id: page.id, blocks }, {
      onSuccess: () => mutations.publish.mutate({ id: page.id }, {
        onSuccess: () => { setDirty(false); flash('Objavljeno!'); },
      }),
    });
  };

  const restore = (version: number) => {
    mutations.restoreRevision.mutate({ id: page.id, version }, {
      onSuccess: () => {
        const rev = page.revisions.find((r) => r.version === version);
        if (rev) { markDirty([...rev.blocks]); setShowRevisions(false); flash(`Vracena verzija v${version}`); }
      },
    });
  };

  const categories = Array.from(new Set(BLOCKS.map((b) => b.category)));

  return (
    <div className="flex h-[calc(100vh-96px)] flex-col">
      {/* GORNJA TRAKA */}
      <div className="flex items-center justify-between gap-4 border-b border-border bg-surface-warm px-6 py-3">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="font-mono-label text-xs text-muted-foreground hover:text-foreground">← Stranice</button>
          <input
            defaultValue={page.title}
            key={page.id}
            onBlur={(e) => { if (e.target.value.trim() && e.target.value !== page.title) mutations.renamePage.mutate({ id: page.id, title: e.target.value.trim() }); }}
            className="w-56 border-b border-transparent bg-transparent font-display text-lg outline-none focus:border-primary"
            aria-label="Naslov stranice"
          />
          <span className={`font-mono-label text-[10px] uppercase tracking-widest ${page.status === 'published' ? 'text-success' : 'text-muted-foreground'}`}>
            {page.status === 'published' ? 'Objavljeno' : 'Skica'}{dirty ? ' · nespremljeno' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {savedFlash && <span className="font-mono-label text-xs text-success">{savedFlash}</span>}
          <button onClick={() => { setShowSeo((s) => !s); setShowRevisions(false); }}
            className="border border-border px-3 py-1.5 font-mono-label text-[11px] uppercase tracking-wider transition-colors hover:bg-secondary">
            SEO
          </button>
          <button onClick={() => { setShowRevisions((s) => !s); setShowSeo(false); }}
            className="border border-border px-3 py-1.5 font-mono-label text-[11px] uppercase tracking-wider transition-colors hover:bg-secondary">
            Povijest ({page.revisions.length})
          </button>
          <button onClick={save} disabled={!dirty || mutations.saveDraft.isPending}
            className="border border-foreground px-3 py-1.5 font-mono-label text-[11px] uppercase tracking-wider transition-colors hover:bg-foreground hover:text-background disabled:opacity-30">
            Spremi skicu
          </button>
          <button onClick={doPublish} disabled={mutations.publish.isPending}
            className="bg-primary px-4 py-1.5 font-mono-label text-[11px] uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
            Objavi
          </button>
        </div>
      </div>

      {/* SEO PANEL */}
      {showSeo && (
        <div className="border-b border-border bg-card px-6 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
                SEO naslov ({seoTitle.length}/255)
              </span>
              <input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={255}
                placeholder={`${page.title} | naziv sajta`}
                className="mt-1 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </label>
            <label className="block">
              <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
                SEO opis ({seoDesc.length}/500)
              </span>
              <textarea value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} maxLength={500} rows={2}
                placeholder="Kratki opis stranice za Google i dijeljenje linkova…"
                className="mt-1 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </label>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() =>
                mutations.updateSeo.mutate(
                  { id: page.id, seoTitle: seoTitle.trim() || null, seoDescription: seoDesc.trim() || null },
                  { onSuccess: () => flash('SEO spremljen') }
                )
              }
              disabled={mutations.updateSeo.isPending}
              className="border border-foreground px-4 py-1.5 font-mono-label text-[11px] uppercase tracking-wider transition-colors hover:bg-foreground hover:text-background disabled:opacity-30">
              Spremi SEO
            </button>
            <p className="text-[11px] text-muted-foreground">
              Prazno polje = automatski se koristi naslov stranice i zadani opis sajta.
            </p>
          </div>
        </div>
      )}

      {/* POVIJEST / REVIZIJE */}
      {showRevisions && (
        <div className="max-h-44 overflow-y-auto border-b border-border bg-card px-6 py-3">
          {page.revisions.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">Jos nema objavljenih verzija.</p>
          ) : (
            <div className="space-y-1">
              {page.revisions.map((r) => (
                <div key={r.version} className="flex items-center justify-between py-1 text-sm">
                  <span className="font-mono-label text-xs">
                    v{r.version} · {format(typeof r.savedAt === 'string' ? parseISO(r.savedAt) : r.savedAt, 'd. MMM yyyy. HH:mm')} · {r.blocks.length} blokova
                  </span>
                  <button onClick={() => restore(r.version)} className="link-underline-faint text-xs">
                    Vrati u skicu
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TRI STUPCA */}
      <div className="flex min-h-0 flex-1">
        {/* BIBLIOTEKA BLOKOVA */}
        <div className="w-[240px] shrink-0 overflow-y-auto border-r border-border bg-card p-4">
          <p className="mb-3 font-mono-label text-[11px] uppercase tracking-widest text-muted-foreground">Biblioteka blokova</p>
          {categories.map((cat) => (
            <div key={cat} className="mb-5">
              <p className="mb-2 font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground/70">
                {cat === 'booking' ? 'Booking' : cat === 'layout' ? 'Layout' : 'Sadrzaj'}
              </p>
              <div className="space-y-2">
                {BLOCKS.filter((b) => b.category === cat).map((b) => (
                  <button key={b.type} onClick={() => addBlock(b.type)}
                    className="w-full border border-border bg-background p-3 text-left transition-colors hover:border-primary hover:bg-secondary">
                    <p className="text-sm font-medium">+ {b.label}</p>
                    <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{b.description}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CANVAS */}
        <div className="min-w-0 flex-1 overflow-y-auto bg-surface-warm/50 p-6">
          {blocks.length === 0 ? (
            <div className="mt-20 border border-dashed border-border p-16 text-center">
              <p className="font-display text-2xl">Prazna stranica</p>
              <p className="mt-2 text-sm text-muted-foreground">Dodajte blok iz biblioteke lijevo.</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                <div className="mx-auto max-w-[1100px] space-y-4">
                  {blocks.map((b) => (
                    <CanvasBlock
                      key={b.id}
                      block={b}
                      selected={b.id === selectedId}
                      onSelect={() => setSelectedId(b.id)}
                      onDelete={() => { markDirty(blocks.filter((x) => x.id !== b.id)); if (selectedId === b.id) setSelectedId(null); }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* INSPEKTOR */}
        <div className="w-[300px] shrink-0 overflow-y-auto border-l border-border bg-card p-5">
          {selected ? (
            <Inspector
              block={selected}
              onChange={(props) => markDirty(blocks.map((b) => (b.id === selected.id ? { ...b, props } : b)))}
            />
          ) : (
            <div className="pt-10 text-center">
              <p className="font-mono-label text-[11px] uppercase tracking-widest text-muted-foreground">Inspektor</p>
              <p className="mt-3 text-sm text-muted-foreground">Odaberite blok na canvasu za uredjivanje njegovih svojstava.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
