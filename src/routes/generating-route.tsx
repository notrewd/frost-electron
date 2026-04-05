import { useEffect, useState } from "react";
import { listen } from "@/lib/electron/events";

interface GenerationProgress {
  current: number;
  total: number;
  message: string;
}

export default function GeneratingRoute() {
  const [progress, setProgress] = useState<GenerationProgress>({
    current: 0,
    total: 1,
    message: "Starting generation...",
  });

  useEffect(() => {
    const unlisten = listen<GenerationProgress>(
      "generation-progress",
      (event) => {
        setProgress(event.payload);
      },
    );

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const percentage =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-lg font-bold tracking-tight">
          Generating Diagram
        </h2>
        <p className="text-sm text-muted-foreground text-center">
          {progress.message}
        </p>
      </div>

      <div className="w-full flex flex-col gap-2">
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground rounded-full transition-all duration-200"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {percentage}%
        </p>
      </div>
    </div>
  );
}
