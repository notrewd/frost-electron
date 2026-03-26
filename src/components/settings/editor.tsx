import { useSettingsStore } from "@/stores/settings-store";
import SettingsField from "../ui/settings-field";
import { Switch } from "../ui/switch";
import { NumberInput } from "../ui/number-input";
import { useShallow } from "zustand/react/shallow";
import { FC } from "react";

interface EditorSettingsProps {
  onChange?: () => void;
  searchQuery?: string;
}

const EditorSettings: FC<EditorSettingsProps> = ({
  onChange,
  searchQuery = "",
}) => {
  const {
    showMinimap,
    setShowMinimap,
    panOnScroll,
    setPanOnScroll,
    showControls,
    setShowControls,
    showGrid,
    setShowGrid,
    snapToGrid,
    setSnapToGrid,
    gridSize,
    setGridSize,
  } = useSettingsStore(
    useShallow((state) => ({
      showMinimap: state.show_minimap,
      panOnScroll: state.pan_on_scroll,
      showControls: state.show_controls,
      showGrid: state.show_grid,
      snapToGrid: state.snap_to_grid,
      gridSize: state.grid_size,
      setShowMinimap: state.setShowMinimap,
      setPanOnScroll: state.setPanOnScroll,
      setShowControls: state.setShowControls,
      setShowGrid: state.setShowGrid,
      setSnapToGrid: state.setSnapToGrid,
      setGridSize: state.setGridSize,
    })),
  );

  const isMatch = (text: string) =>
    text.toLowerCase().includes(searchQuery.toLowerCase());

  return (
    <>
      {(isMatch("Show Controls") ||
        isMatch(
          "Toggle the visibility of the editor controls (zoom, fit view, etc.)",
        )) && (
        <SettingsField
          label="Show Controls"
          description="Toggle the visibility of the editor controls (zoom, fit view, etc.)"
        >
          <Switch
            checked={showControls}
            onCheckedChange={(checked) => {
              setShowControls(checked);
              onChange?.();
            }}
          />
        </SettingsField>
      )}

      {(isMatch("Show Minimap") ||
        isMatch("Toggle the visibility of the minimap in the editor")) && (
        <SettingsField
          label="Show Minimap"
          description="Toggle the visibility of the minimap in the editor"
        >
          <Switch
            checked={showMinimap}
            onCheckedChange={(checked) => {
              setShowMinimap(checked);
              onChange?.();
            }}
          />
        </SettingsField>
      )}

      {(isMatch("Pan on Scroll") ||
        isMatch("Enable or disable panning the editor when scrolling")) && (
        <SettingsField
          label="Pan on Scroll"
          description="Enable or disable panning the editor when scrolling"
        >
          <Switch
            checked={panOnScroll}
            onCheckedChange={(checked) => {
              setPanOnScroll(checked);
              onChange?.();
            }}
          />
        </SettingsField>
      )}

      {(isMatch("Show Grid") ||
        isMatch("Toggle the visibility of the background grid")) && (
        <SettingsField
          label="Show Grid"
          description="Toggle the visibility of the background grid"
        >
          <Switch
            checked={showGrid}
            onCheckedChange={(checked) => {
              setShowGrid(checked);
              onChange?.();
            }}
          />
        </SettingsField>
      )}

      {(isMatch("Snap to Grid") ||
        isMatch("Snap nodes to the grid when moving them")) && (
        <SettingsField
          label="Snap to Grid"
          description="Snap nodes to the grid when moving them"
        >
          <Switch
            checked={snapToGrid}
            onCheckedChange={(checked) => {
              setSnapToGrid(checked);
              onChange?.();
            }}
          />
        </SettingsField>
      )}

      {snapToGrid &&
        (isMatch("Grid Size") || isMatch("Size of the grid snapping step")) && (
          <SettingsField
            label="Grid Size"
            description="Size of the grid snapping step"
            subsetting
          >
            <div className="w-48!">
              <NumberInput
                value={gridSize}
                min={5}
                max={100}
                onChange={(value) => {
                  setGridSize(Number(value) || 5);
                  onChange?.();
                }}
              />
            </div>
          </SettingsField>
        )}
    </>
  );
};

export default EditorSettings;
