export function DucaHeader() {
  return (
    <header className="bg-surface flex justify-between items-center w-full px-gutter max-w-7xl mx-auto h-14 border-b border-outline-variant z-50 shrink-0">
      <div className="flex items-center gap-4">
        <span className="text-label-bold font-label-bold text-primary">
          DUCA-T Tránsito Internacional
        </span>
      </div>
      <nav className="hidden md:flex gap-6 items-center" />
    </header>
  );
}
