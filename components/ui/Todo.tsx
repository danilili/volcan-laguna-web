/** Visible development note. Remove before launch. */
export function Todo({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SHOW_TODOS !== "1") return null;
  return (
    <p className="rounded-lg border border-dashed border-arena-600/60 bg-arena-100 px-3 py-2 text-sm text-arena-700">
      <span className="font-medium">TODO:</span> {children}
    </p>
  );
}
