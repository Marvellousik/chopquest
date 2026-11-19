"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadUser, type User } from "@/lib/user";
import { resizeToJpeg } from "@/lib/image";
import type { DraftItem, Food, ScanResponse } from "@/lib/foods";

type Row = {
  key: string;
  raw_label: string | null; // what Gemini said (null for foods the user added)
  portion: string;
  estimated_grams: number;
  confidence: number | null;
  matched_food_id: number | null;
  food_id: number | null;
  added: boolean;
};

type Stage =
  | { name: "pick" }
  | { name: "analyzing"; preview: string }
  | { name: "confirm"; preview: string; dish: string; cached: boolean }
  | { name: "saving"; preview: string; dish: string }
  | { name: "saved"; scanId: number; total: number; dish: string };

const TYPE_LABEL: Record<Food["type"], string> = {
  Animal: "Animal protein",
  Plant: "Plant protein",
  Alternative: "Alternative protein",
  Staple: "Staples",
};
const TYPE_ORDER: Food["type"][] = ["Plant", "Alternative", "Animal", "Staple"];

const foodLabel = (f: Food) =>
  f.local_name && f.local_name.toLowerCase() !== f.food.toLowerCase() ? `${f.local_name} · ${f.food}` : f.food;

let nextKey = 0;
const toRow = (d: DraftItem): Row => ({
  key: `r${nextKey++}`,
  raw_label: d.food,
  portion: d.portion,
  estimated_grams: d.estimated_grams,
  confidence: d.confidence,
  matched_food_id: d.matched_food_id,
  food_id: d.matched_food_id,
  added: false,
});

export default function ScanFlow() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stage, setStage] = useState<Stage>({ name: "pick" });
  const [rows, setRows] = useState<Row[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const u = loadUser();
    if (!u) {
      router.replace("/");
      return;
    }
    setUser(u); // eslint-disable-line react-hooks/set-state-in-effect -- localStorage is browser-only
    fetch("/api/foods")
      .then((r) => r.json())
      .then((d) => setFoods(d.foods ?? []))
      .catch(() => {});
  }, [router]);

  const foodsById = new Map(foods.map((f) => [f.id, f]));

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same photo again
    if (!file) return;
    setError(null);
    let dataUrl: string;
    try {
      dataUrl = await resizeToJpeg(file);
    } catch {
      setError("Couldn't open that photo. Try another one.");
      return;
    }
    setStage({ name: "analyzing", preview: dataUrl });
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl.split(",")[1] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "The scanner had a problem. Try again.");
        setStage({ name: "pick" });
        return;
      }
      const scan = data as ScanResponse;
      setRows(scan.items.map(toRow));
      setStage({ name: "confirm", preview: dataUrl, dish: scan.dish_name, cached: scan.cached });
    } catch {
      setError("No connection. Check your network and try again.");
      setStage({ name: "pick" });
    }
  }

  function setFood(key: string, value: string) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, food_id: value ? Number(value) : null } : r)));
  }

  function removeRow(key: string) {
    setRows((rs) => rs.filter((r) => r.key !== key));
  }

  function addRow(value: string) {
    if (!value) return;
    setRows((rs) => [
      ...rs,
      {
        key: `r${nextKey++}`,
        raw_label: null,
        portion: "1 serving",
        estimated_grams: 100,
        confidence: null,
        matched_food_id: null,
        food_id: Number(value),
        added: true,
      },
    ]);
  }

  async function save() {
    if (stage.name !== "confirm" || !user) return;
    if (!rows.length) {
      setError("Add at least one food.");
      return;
    }
    setError(null);
    setStage({ name: "saving", preview: stage.preview, dish: stage.dish });
    try {
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          dish_name: stage.dish,
          items: rows.map((r) => ({
            raw_label: r.raw_label,
            food_id: r.food_id,
            estimated_grams: r.estimated_grams,
            corrected: r.added || r.food_id !== r.matched_food_id,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Couldn't save your meal. Try again.");
        setStage({ name: "confirm", preview: stage.preview, dish: stage.dish, cached: false });
        return;
      }
      setStage({ name: "saved", scanId: data.scan_id, total: data.total_protein_g, dish: stage.dish });
    } catch {
      setError("No connection. Your list is still here — try again.");
      setStage({ name: "confirm", preview: stage.preview, dish: stage.dish, cached: false });
    }
  }

  function reset() {
    setRows([]);
    setError(null);
    setStage({ name: "pick" });
  }

  const foodOptions = (
    <>
      {TYPE_ORDER.map((t) => (
        <optgroup key={t} label={TYPE_LABEL[t]}>
          {foods
            .filter((f) => f.type === t)
            .map((f) => (
              <option key={f.id} value={f.id}>
                {foodLabel(f)}
              </option>
            ))}
        </optgroup>
      ))}
    </>
  );

  if (!user) return null;

  return (
    <section className="flex flex-1 flex-col gap-5">
      <header className="flex items-center justify-between">
        <Link href="/" className="-ml-2 px-2 py-2 text-lg font-bold text-stone-600" aria-label="Back home">
          ← Home
        </Link>
        <span className="text-sm font-semibold text-stone-500">{user.nickname}</span>
      </header>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} data-testid="camera-input" />
      <input ref={galleryRef} type="file" accept="image/*" hidden onChange={onFile} data-testid="gallery-input" />

      {error && (
        <p role="alert" className="rounded-xl bg-red-100 px-4 py-3 font-semibold text-red-700">
          {error}
        </p>
      )}

      {stage.name === "pick" && (
        <div className="flex flex-1 flex-col justify-center gap-4 text-center">
          <div className="text-7xl" aria-hidden>📸</div>
          <h1 className="text-3xl font-extrabold">What are you eating?</h1>
          <p className="text-stone-600">Snap your plate from above, in good light.</p>
          <button
            onClick={() => cameraRef.current?.click()}
            className="mt-2 rounded-2xl bg-leaf px-6 py-5 text-xl font-extrabold text-white shadow-lg transition active:scale-95"
          >
            📷 Take a photo
          </button>
          <button
            onClick={() => galleryRef.current?.click()}
            className="rounded-2xl border-2 border-leaf bg-white px-6 py-4 text-lg font-bold text-leaf-dark transition active:scale-95"
          >
            🖼️ Choose from gallery
          </button>
          <p className="text-xs text-stone-500">Your photo is only used to spot the food. We don&apos;t keep it.</p>
        </div>
      )}

      {stage.name === "analyzing" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */}
          <img src={stage.preview} alt="Your meal" className="max-h-72 w-full rounded-3xl object-cover shadow" />
          <div className="text-5xl animate-spin" aria-hidden>🍽️</div>
          <p className="text-xl font-bold">Looking at your plate…</p>
        </div>
      )}

      {(stage.name === "confirm" || stage.name === "saving") && (
        <div className="flex flex-col gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */}
          <img src={stage.preview} alt="Your meal" className="max-h-48 w-full rounded-3xl object-cover shadow" />
          <div>
            <h1 className="text-2xl font-extrabold">{stage.dish}</h1>
            <p className="text-stone-600">Is this right? Tap a food to fix it.</p>
          </div>

          <ul className="flex flex-col gap-3">
            {rows.map((r) => {
              const unsure = r.confidence !== null && r.confidence < 0.6;
              const changed = r.added || r.food_id !== r.matched_food_id;
              return (
                <li
                  key={r.key}
                  className={`rounded-2xl border-2 bg-white p-3 ${
                    r.food_id === null || unsure ? "border-palm" : "border-stone-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{r.raw_label ?? foodsById.get(r.food_id ?? -1)?.food ?? "Added food"}</p>
                      <p className="text-sm text-stone-500">
                        {r.portion} · ~{r.estimated_grams} g
                        {unsure && <span className="ml-2 font-semibold text-amber-700">not sure — check</span>}
                        {changed && !r.added && <span className="ml-2 font-semibold text-leaf-dark">✓ fixed</span>}
                        {r.added && <span className="ml-2 font-semibold text-leaf-dark">✓ added</span>}
                      </p>
                    </div>
                    <button
                      onClick={() => removeRow(r.key)}
                      aria-label={`Remove ${r.raw_label ?? "food"}`}
                      className="-mr-1 -mt-1 h-11 w-11 shrink-0 rounded-full text-2xl text-stone-400 active:bg-stone-100"
                    >
                      ×
                    </button>
                  </div>
                  <select
                    value={r.food_id ?? ""}
                    onChange={(e) => setFood(r.key, e.target.value)}
                    aria-label={`Food for ${r.raw_label ?? "added item"}`}
                    className="mt-2 w-full rounded-xl border-2 border-stone-300 bg-stone-50 px-3 py-3 text-base font-semibold"
                  >
                    <option value="">❓ Not sure — pick a food</option>
                    {foodOptions}
                  </select>
                </li>
              );
            })}
          </ul>

          <select
            value=""
            onChange={(e) => addRow(e.target.value)}
            aria-label="Add a food we missed"
            className="w-full rounded-2xl border-2 border-dashed border-stone-300 bg-transparent px-4 py-4 text-base font-bold text-stone-600"
          >
            <option value="">＋ Add a food we missed</option>
            {foodOptions}
          </select>

          <p className="text-xs text-stone-500">Portions and protein are estimates, not medical advice.</p>

          <div className="sticky bottom-0 -mx-4 flex gap-3 bg-cream/95 px-4 pb-4 pt-2 backdrop-blur">
            <button
              onClick={reset}
              disabled={stage.name === "saving"}
              className="rounded-2xl border-2 border-stone-300 bg-white px-5 py-4 font-bold text-stone-600 disabled:opacity-60"
            >
              Retake
            </button>
            <button
              onClick={save}
              disabled={stage.name === "saving" || rows.length === 0}
              className="flex-1 rounded-2xl bg-leaf px-6 py-4 text-lg font-extrabold text-white shadow-lg transition active:scale-95 disabled:opacity-60"
            >
              {stage.name === "saving" ? "Saving…" : "Looks good ✓"}
            </button>
          </div>
        </div>
      )}

      {stage.name === "saved" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
          <div className="text-7xl" aria-hidden>✅</div>
          <h1 className="text-2xl font-extrabold">{stage.dish} saved!</h1>
          <p className="text-lg">
            About <span className="font-extrabold text-leaf-dark">{stage.total} g</span> of protein
            <span className="block text-sm text-stone-500">(estimate)</span>
          </p>
          <p className="text-stone-600">Your Protein Map is coming in the next update.</p>
          <button
            onClick={reset}
            className="w-full rounded-2xl bg-leaf px-6 py-4 text-xl font-extrabold text-white shadow-lg active:scale-95"
          >
            📸 Scan another meal
          </button>
          <Link href="/" className="py-3 font-bold text-stone-600 underline">
            Back home
          </Link>
        </div>
      )}
    </section>
  );
}
