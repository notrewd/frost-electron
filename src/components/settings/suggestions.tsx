import SettingsField from "../ui/settings-field";
import { useShallow } from "zustand/react/shallow";
import { useSettingsStore } from "@/stores/settings-store";
import { Switch } from "../ui/switch";
import { Separator } from "../ui/separator";
import { FC } from "react";

interface SuggestionsSettingsProps {
  onChange?: () => void;
  searchQuery?: string;
}

const SuggestionsSettings: FC<SuggestionsSettingsProps> = ({
  onChange,
  searchQuery = "",
}) => {
  const {
    suggestionsEnabled,
    setSuggestionsEnabled,
    encapsulationViolation,
    setEncapsulationViolation,
    namingConventionClass,
    setNamingConventionClass,
    namingConventionMembers,
    setNamingConventionMembers,
    godClass,
    setGodClass,
    emptyClass,
    setEmptyClass,
    missingReturnType,
    setMissingReturnType,
    mutableGetterExposure,
    setMutableGetterExposure,
    missingConstructor,
    setMissingConstructor,
    unusedAbstract,
    setUnusedAbstract,
    tooManyParameters,
    setTooManyParameters,
  } = useSettingsStore(
    useShallow((state) => ({
      suggestionsEnabled: state.suggestions_enabled,
      setSuggestionsEnabled: state.setSuggestionsEnabled,
      encapsulationViolation: state.suggestion_encapsulation_violation,
      setEncapsulationViolation: state.setSuggestionEncapsulationViolation,
      namingConventionClass: state.suggestion_naming_convention_class,
      setNamingConventionClass: state.setSuggestionNamingConventionClass,
      namingConventionMembers: state.suggestion_naming_convention_members,
      setNamingConventionMembers: state.setSuggestionNamingConventionMembers,
      godClass: state.suggestion_god_class,
      setGodClass: state.setSuggestionGodClass,
      emptyClass: state.suggestion_empty_class,
      setEmptyClass: state.setSuggestionEmptyClass,
      missingReturnType: state.suggestion_missing_return_type,
      setMissingReturnType: state.setSuggestionMissingReturnType,
      mutableGetterExposure: state.suggestion_mutable_getter_exposure,
      setMutableGetterExposure: state.setSuggestionMutableGetterExposure,
      missingConstructor: state.suggestion_missing_constructor,
      setMissingConstructor: state.setSuggestionMissingConstructor,
      unusedAbstract: state.suggestion_unused_abstract,
      setUnusedAbstract: state.setSuggestionUnusedAbstract,
      tooManyParameters: state.suggestion_too_many_parameters,
      setTooManyParameters: state.setSuggestionTooManyParameters,
    })),
  );

  const isMatch = (text: string) =>
    text.toLowerCase().includes(searchQuery.toLowerCase());

  const fields = [
    {
      label: "Encapsulation Violation",
      description:
        "Warn when public attributes or getters expose mutable internal state",
      checked: encapsulationViolation,
      setter: setEncapsulationViolation,
    },
    {
      label: "Class Naming Convention",
      description: "Suggest singular PascalCase for class names",
      checked: namingConventionClass,
      setter: setNamingConventionClass,
    },
    {
      label: "Member Naming Convention",
      description: "Suggest camelCase for attribute and method names",
      checked: namingConventionMembers,
      setter: setNamingConventionMembers,
    },
    {
      label: "God Class",
      description: "Warn when a class has too many attributes or methods",
      checked: godClass,
      setter: setGodClass,
    },
    {
      label: "Empty Class",
      description: "Flag classes with no attributes and no methods",
      checked: emptyClass,
      setter: setEmptyClass,
    },
    {
      label: "Missing Return Type",
      description: "Flag methods that have no return type specified",
      checked: missingReturnType,
      setter: setMissingReturnType,
    },
    {
      label: "Mutable Getter Exposure",
      description: "Warn when getters return mutable collection types",
      checked: mutableGetterExposure,
      setter: setMutableGetterExposure,
    },
    {
      label: "Missing Constructor",
      description: "Flag classes with instance attributes but no constructor",
      checked: missingConstructor,
      setter: setMissingConstructor,
    },
    {
      label: "Unused Abstract",
      description: "Flag abstract classes that have no abstract methods",
      checked: unusedAbstract,
      setter: setUnusedAbstract,
    },
    {
      label: "Too Many Parameters",
      description: "Warn when methods have more than 4 parameters",
      checked: tooManyParameters,
      setter: setTooManyParameters,
    },
  ];

  return (
    <>
      {(isMatch("Enable Suggestions") ||
        isMatch("Show intelligent suggestions and warnings on nodes")) && (
        <SettingsField
          label="Enable Suggestions"
          description="Show intelligent suggestions and warnings on nodes"
        >
          <Switch
            checked={suggestionsEnabled}
            onCheckedChange={(checked) => {
              setSuggestionsEnabled(checked);
              onChange?.();
            }}
          />
        </SettingsField>
      )}
      {suggestionsEnabled && (
        <>
          <Separator className="my-2" />
          {fields.map(
            (field) =>
              (isMatch(field.label) || isMatch(field.description)) && (
                <SettingsField
                  key={field.label}
                  label={field.label}
                  description={field.description}
                  subsetting
                >
                  <Switch
                    checked={field.checked}
                    onCheckedChange={(checked) => {
                      field.setter(checked);
                      onChange?.();
                    }}
                  />
                </SettingsField>
              ),
          )}
        </>
      )}
    </>
  );
};

export default SuggestionsSettings;
