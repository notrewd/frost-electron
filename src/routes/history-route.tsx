import { useEffect, useState, useRef } from "react";
import { emit, listen } from "@/lib/electron/events";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UndoDot, CircleDot, RefreshCw } from "lucide-react";
import SearchInput from "@/components/ui/inputs/search-input";

interface HistoryItem {
  index: number;
  label: string;
  isActive: boolean;
  details?: string;
}

const HistoryRoute = () => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unlisten = listen<HistoryItem[]>("history-data", (event) => {
      setHistoryItems([...event.payload].reverse());
    });

    emit("request-history");

    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  const handleJump = (index: number) => {
    emit("history-jump", { index });
  };

  const handleRefresh = () => {
    emit("request-history");
  };
  const filteredItems = historyItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 sticky top-0 z-10 bg-background">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            History
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            title="Sync History"
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          View and jump to previous editor states.
        </p>
        <SearchInput
          placeholder="Search history..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Separator className="my-4" />
      </div>

      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="flex flex-col gap-2">
          {filteredItems.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No history found.
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.index}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  item.isActive
                    ? "bg-primary/20 border-primary"
                    : "bg-card border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.isActive ? (
                    <CircleDot className="size-4 shrink-0 text-primary" />
                  ) : (
                    <div className="size-4 shrink-0 rounded-full border-2 border-muted-foreground" />
                  )}
                  <div className="flex flex-col">
                    <span
                      className={`text-sm ${
                        item.isActive
                          ? "font-semibold text-primary"
                          : "text-foreground"
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.details && (
                      <span className="text-xs text-muted-foreground">
                        {item.details}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  variant={item.isActive ? "default" : "secondary"}
                  size="sm"
                  disabled={item.isActive}
                  onClick={() => handleJump(item.index)}
                >
                  {item.isActive ? (
                    "Current"
                  ) : (
                    <>
                      <UndoDot className="size-4" />
                      Restore
                    </>
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default HistoryRoute;
