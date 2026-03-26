import { useSettingsStore } from "@/stores/settings-store";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import { NumberInput } from "../ui/number-input";
import { useShallow } from "zustand/react/shallow";
import SettingsField from "../ui/settings-field";
import { FC } from "react";

interface GeneralSettingsProps {
  onChange?: () => void;
  searchQuery?: string;
}

const GeneralSettings: FC<GeneralSettingsProps> = ({
  onChange,
  searchQuery = "",
}) => {
  const {
    theme,
    setTheme,
    auto_save,
    setAutoSave,
    auto_save_interval,
    setAutoSaveInterval,
  } = useSettingsStore(
    useShallow((state) => ({
      theme: state.theme,
      setTheme: state.setTheme,
      auto_save: state.auto_save,
      setAutoSave: state.setAutoSave,
      auto_save_interval: state.auto_save_interval,
      setAutoSaveInterval: state.setAutoSaveInterval,
    })),
  );

  const isMatch = (text: string) =>
    text.toLowerCase().includes(searchQuery.toLowerCase());

  return (
    <>
      {(isMatch("Theme") ||
        isMatch("Select the theme for the application") ||
        isMatch("dark") ||
        isMatch("light") ||
        isMatch("system")) && (
        <SettingsField
          label="Theme"
          description="Select the theme for the application"
        >
          <Select
            value={theme}
            onValueChange={(value) => {
              setTheme(value as "light" | "dark" | "system");
              onChange?.();
            }}
          >
            <SelectTrigger className="w-48!">
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsField>
      )}

      {(isMatch("Auto Save") ||
        isMatch("Automatically save the project periodically")) && (
        <SettingsField
          label="Auto Save"
          description="Automatically save the project periodically"
        >
          <Switch
            checked={auto_save}
            onCheckedChange={(checked) => {
              setAutoSave(checked);
              onChange?.();
            }}
          />
        </SettingsField>
      )}

      {auto_save &&
        (isMatch("Auto Save Interval") ||
          isMatch("Time in minutes between auto saves")) && (
          <SettingsField
            label="Auto Save Interval"
            description="Time in minutes between auto saves"
            subsetting
          >
            <div className="w-48!">
              <NumberInput
                value={auto_save_interval}
                min={1}
                max={60}
                onChange={(value) => {
                  setAutoSaveInterval(Number(value) || 5);
                  onChange?.();
                }}
              />
            </div>
          </SettingsField>
        )}
    </>
  );
};

export default GeneralSettings;
