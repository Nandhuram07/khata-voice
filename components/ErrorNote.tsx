import { ApiError } from "@/lib/api";

export default function ErrorNote({ error }: { error: ApiError | null }) {
  if (!error) return null;
  return (
    <div role="alert" className="mt-4 border-l-4 border-[var(--stamp)] bg-white px-3 py-2 text-sm">
      <p className="font-medium text-[var(--stamp)]">{error.message}</p>
      {error.requestId && (
        <p className="mt-0.5 text-xs text-[var(--ink-soft)]">Reference: {error.requestId.slice(0, 8)}</p>
      )}
    </div>
  );
}