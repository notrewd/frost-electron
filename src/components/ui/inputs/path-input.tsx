import {
  ChangeEvent,
  ComponentProps,
  FC,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";
import { Folder } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";

interface FileInputProps extends ComponentProps<typeof Input> {
  value?: string;
  onChange?: (value: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

const PathInput: FC<FileInputProps> = ({
  value: initialValue,
  onChange,
  className,
  ...props
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleFileSelect = useCallback(async () => {
    const file = await open({
      multiple: false,
      directory: true,
    });

    if (file) {
      setValue(file);
      if (onChange) {
        const syntheticEvent = {
          target: { value: file },
        } as ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    }
  }, []);

  return (
    <div className="flex gap-2 items-stretch">
      <Input
        className={cn("flex-1", className)}
        value={value}
        onChange={onChange}
        {...props}
      />
      <Button
        type="button"
        variant="outline"
        className="size-8"
        onClick={handleFileSelect}
      >
        <Folder />
      </Button>
    </div>
  );
};

export default PathInput;
