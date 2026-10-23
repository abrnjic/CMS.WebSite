import { useRef, useState } from "react";
import { trpc } from "@/providers/trpc";

const fmtSize = (n: number) =>
  n > 1024 * 1024
    ? `${(n / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(n / 1024)} KB`;

const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = reject;
    r.readAsDataURL(file);
  });

export default function AdminMedia() {
  const {
    data: files,
    isLoading,
    error,
  } = trpc.media.list.useQuery(undefined, { staleTime: 10_000 });
  const utils = trpc.useUtils();
  const upload = trpc.media.upload.useMutation({
    onSuccess: () => utils.media.list.invalidate(),
  });
  const remove = trpc.media.remove.useMutation({
    onSuccess: () => utils.media.list.invalidate(),
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const onFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setBusy(true);
    setMsg("");
    let ok = 0;
    for (const file of Array.from(list)) {
      try {
        if (file.size > 3 * 1024 * 1024)
          throw new Error("Slika je veća od 3 MB.");
        await upload.mutateAsync({
          name: file.name,
          contentBase64: await toBase64(file),
          contentType: file.type || "image/jpeg",
        });
        ok++;
      } catch (e) {
        setMsg(`${file.name}: ${e instanceof Error ? e.message : "greška"}`);
      }
    }
    if (ok > 0)
      setMsg(
        (m) =>
          `${ok} ${ok === 1 ? "slika učitana" : "slika učitano"}.${m ? " " + m : ""}`,
      );
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="mx-auto max-w-[1000px] px-8 pb-20">
      <div className="border-b border-border pb-6">
        <h1 className="font-display text-3xl">Mediji</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Učitane fotografije dostupne su objektima, jedinicama i stranicama.
          Datoteke se čuvaju u Firebase pohrani i troše kvotu projekta — brišite
          što ne koristite.
        </p>
      </div>

      {/* UPLOAD */}
      <div
        className="mt-8 border border-dashed border-border p-8 text-center transition-colors hover:bg-secondary/30"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFiles(e.dataTransfer.files);
        }}
      >
        <p className="font-display text-xl">Dovucite slike ovdje</p>
        <p className="mt-1 text-sm text-muted-foreground">ili</p>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="mt-3 bg-primary px-6 py-2.5 font-mono-label text-xs uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-30"
        >
          {busy ? "Učitavam…" : "Odaberi slike"}
        </button>
        <p className="mt-2 font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
          jpg · png · webp · gif · avif — do 3 MB po slici
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
        {msg && <p className="mt-3 text-xs text-muted-foreground">{msg}</p>}
      </div>

      {/* GALERIJA */}
      {isLoading ? (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 animate-pulse bg-muted" />
          ))}
        </div>
      ) : error ? (
        <p className="mt-8 text-sm text-destructive">
          Greška pri učitavanju medija.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(files ?? []).map((f) => (
            <figure
              key={f.key}
              className="group relative border border-border bg-card"
            >
              <img
                src={`/api/media/${f.key}`}
                alt={f.name}
                className="h-40 w-full object-cover"
                loading="lazy"
              />
              <figcaption className="flex items-center justify-between gap-2 px-2 py-1.5">
                <span
                  className="truncate font-mono-label text-[10px] text-muted-foreground"
                  title={f.name}
                >
                  {f.name} · {fmtSize(f.size)}
                </span>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `Obrisati "${f.name}"? Objekti koji je koriste ostat će bez te slike.`,
                      )
                    ) {
                      remove.mutate({ key: f.key });
                    }
                  }}
                  className="shrink-0 font-mono-label text-[10px] uppercase tracking-wider text-destructive hover:underline"
                >
                  Obriši
                </button>
              </figcaption>
            </figure>
          ))}
          {(files ?? []).length === 0 && (
            <p className="col-span-full border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
              Još nema učitanih slika.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
