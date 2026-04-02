"use client";

interface EventLogProps {
  entries: string[];
}

export function EventLog({ entries }: EventLogProps) {
  if (entries.length === 0) return null;

  return (
    <div className="flex h-60 flex-col-reverse overflow-y-auto rounded-lg border border-border bg-card p-4">
      <pre className="text-card-foreground text-xs leading-relaxed">
        {entries.join("\n")}
      </pre>
    </div>
  );
}
