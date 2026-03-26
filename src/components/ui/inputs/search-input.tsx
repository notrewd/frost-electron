import { ChangeEvent, ComponentProps, FC, useCallback } from "react";
import { Input } from "../input";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { Button } from "../button";

interface SearchInputProps extends ComponentProps<typeof Input> {
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

const SearchInput: FC<SearchInputProps> = ({
  value,
  onChange,
  className,
  ...props
}) => {
  const handleClear = useCallback(() => {
    if (onChange) {
      onChange({ target: { value: "" } } as ChangeEvent<HTMLInputElement>);
    }
  }, [onChange]);

  return (
    <div className={cn("relative w-full", className)}>
      <Input
        variant="small"
        value={value}
        onChange={onChange}
        className="px-9"
        {...props}
      />
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 size-6"
          onClick={handleClear}
        >
          <X className="size-3" />
        </Button>
      )}
    </div>
  );
};

export default SearchInput;
