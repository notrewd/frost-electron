import { useCallback, useEffect, useState } from "react";
import { emit, listen } from "@/lib/electron/events";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import SettingsField from "@/components/ui/settings-field";
import { Switch } from "@/components/ui/switch";
import { Download, Loader2 } from "lucide-react";
import { NumberInput } from "@/components/ui/number-input";
import { invoke } from "@/lib/electron/invoke";
import { HexColorPicker } from "react-colorful";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useSettingsStore } from "@/stores/settings-store";
import { useShallow } from "zustand/react/shallow";

const ExportRoute = () => {
  const { theme } = useSettingsStore(
    useShallow((state) => ({ theme: state.theme })),
  );
  const isDark =
    theme === "system"
      ? document.documentElement.classList.contains("dark")
      : theme === "dark";

  const [transparentBackground, setTransparentBackground] = useState(true);
  const [padding, setPadding] = useState(10);
  const [backgroundColor, setBackgroundColor] = useState(
    isDark ? "#121212" : "#ffffff",
  );
  const [debouncedBackgroundColor, setDebouncedBackgroundColor] =
    useState(backgroundColor);

  const handleChangePadding = useCallback((value: string) => {
    const num = Number(value);

    if (!isNaN(num)) {
      setPadding(num);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedBackgroundColor(backgroundColor),
      200,
    );
    return () => clearTimeout(timer);
  }, [backgroundColor]);

  const [imageData, setImageData] = useState<string | null>(null);

  useEffect(() => {
    setImageData(null);
    const unlisten = listen<string>("export-image-ready", (event) => {
      setImageData(event.payload);
    });

    emit("request-export-image", {
      transparentBackground,
      padding,
      backgroundColor: debouncedBackgroundColor,
    });

    return () => {
      unlisten.then((f) => f());
    };
  }, [transparentBackground, padding, debouncedBackgroundColor]);

  const downloadImage = useCallback(() => {
    if (!imageData) return;
    invoke("save_image_as", { data: imageData });
  }, [imageData]);

  return (
    <div className="absolute inset-0 flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 grid grid-rows-1 gap-6 grid-cols-[minmax(0,1fr)_minmax(0,2fr)] min-h-0">
        <div className="flex flex-col justify-center items-start border rounded-md p-6 self-center">
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold">Export Flow</h2>
            <p className="text-sm text-muted-foreground">
              Configure your export settings and download your flow as a PNG
              image.
            </p>
            <div className="flex flex-col gap-3 mt-4">
              <SettingsField label="Transparent Background">
                <Switch
                  checked={transparentBackground}
                  onCheckedChange={(checked) => {
                    setTransparentBackground(checked);
                  }}
                />
              </SettingsField>
              {!transparentBackground && (
                <SettingsField label="Background Color">
                  <Popover>
                    <PopoverTrigger asChild>
                      <div
                        className="w-16! h-6! rounded-md border shadow-sm cursor-pointer"
                        style={{ backgroundColor }}
                      />
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-3 flex flex-col gap-2"
                      align="start"
                    >
                      <HexColorPicker
                        color={backgroundColor}
                        onChange={setBackgroundColor}
                      />
                      <Input
                        variant="small"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                      />
                    </PopoverContent>
                  </Popover>
                </SettingsField>
              )}
              <SettingsField label="Padding">
                <NumberInput
                  value={padding}
                  onChange={handleChangePadding}
                  variant="small"
                />
              </SettingsField>
            </div>
          </div>
          <Separator className="my-4 w-full" />
          <Button
            className="self-end"
            variant="outline"
            onClick={downloadImage}
          >
            <Download className="size-4" />
            Export as PNG
          </Button>
        </div>
        <div className="min-h-0 min-w-0 flex items-center justify-center">
          {imageData ? (
            <img
              className="rounded-md max-h-full max-w-full object-contain"
              src={imageData || undefined}
              alt="Exported flow"
            />
          ) : (
            <Loader2 className="animate-spin text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportRoute;
