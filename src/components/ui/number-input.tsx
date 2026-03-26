import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cva } from "class-variance-authority";

const numberInputVariants = cva(
  "flex items-center dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive overflow-hidden",
  {
    variants: {
      variant: {
        default: "h-9",
        small: "h-8",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface NumberInputProps extends Omit<
  React.ComponentProps<"input">,
  "type" | "onChange"
> {
  variant?: "default" | "small";
  value?: string | number;
  onChange?: (value: string) => void;
  step?: number;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      className,
      variant = "default",
      value,
      onChange,
      step = 1,
      disabled,
      ...props
    },
    ref,
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleIncrement = () => {
      if (disabled) return;

      const currentVal = inputRef.current?.value || "0";
      const current = parseFloat(currentVal);
      // If it's a mixed state or empty, start at 0 before incrementing
      const next = (isNaN(current) ? 0 : current) + step;
      // Round to avoid float precision issues with steps
      const rounded = Math.round(next * 100) / 100;

      if (inputRef.current) {
        inputRef.current.value = rounded.toString();
        // Fire custom onChange with new value
        onChange?.(rounded.toString());

        // Also trigger native event for any parent listeners
        const event = new Event("input", { bubbles: true });
        inputRef.current.dispatchEvent(event);
      }
    };

    const handleDecrement = () => {
      if (disabled) return;

      const currentVal = inputRef.current?.value || "0";
      const current = parseFloat(currentVal);
      const next = (isNaN(current) ? 0 : current) - step;
      const rounded = Math.round(next * 100) / 100;

      if (inputRef.current) {
        inputRef.current.value = rounded.toString();
        onChange?.(rounded.toString());

        const event = new Event("input", { bubbles: true });
        inputRef.current.dispatchEvent(event);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        handleIncrement();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        handleDecrement();
      }
      // Pass through original onKeyDown if it exists
      if (props.onKeyDown) {
        props.onKeyDown(e);
      }
    };

    return (
      <div
        className={cn(
          numberInputVariants({ variant, className }),
          disabled && "opacity-50 pointer-events-none",
        )}
      >
        <input
          {...props}
          ref={(node) => {
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
            inputRef.current = node;
          }}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            "flex-1 bg-transparent px-3 py-1 outline-none min-w-0 file:text-foreground placeholder:text-muted-foreground w-full",
            variant === "small" ? "text-sm px-2" : "text-base md:text-sm",
          )}
        />
        <div className="flex flex-col border-l border-input w-5 h-full shrink-0">
          <button
            type="button"
            tabIndex={-1}
            onClick={handleIncrement}
            disabled={disabled}
            className="flex-1 flex items-center justify-center hover:bg-muted/50 transition-colors border-b border-input"
          >
            <ChevronUp className="w-3 h-3 text-muted-foreground" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            onClick={handleDecrement}
            disabled={disabled}
            className="flex-1 flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  },
);
NumberInput.displayName = "NumberInput";

export { NumberInput };
