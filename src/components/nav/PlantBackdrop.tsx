// Soft leaves behind every page: the plant-based theme. Decorative only.
export default function PlantBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#e8f7dc_0%,transparent_60%),radial-gradient(ellipse_at_bottom_right,#fdf3dc_0%,transparent_55%)]" />
      <svg className="absolute -right-16 -top-10 w-72 text-green-200/60" viewBox="0 0 200 200" fill="currentColor">
        <path d="M20 180C20 90 80 25 190 10 180 115 115 180 20 180z" />
        <path d="M20 180 120 80" stroke="#bbf7d0" strokeWidth="4" fill="none" />
      </svg>
      <svg className="absolute -bottom-12 -left-10 w-64 text-green-200/50" viewBox="0 0 200 200" fill="currentColor">
        <path d="M180 190C180 100 120 30 10 20 20 120 85 190 180 190z" />
      </svg>
      <svg className="absolute right-[8%] top-[45%] w-16 rotate-12 text-amber-200/50" viewBox="0 0 40 30" fill="currentColor">
        <path d="M6 15C6 6 14 2 22 3c8 1 14 5 13 12-1 8-9 12-17 11C10 25 6 21 6 15z" />
      </svg>
    </div>
  );
}
