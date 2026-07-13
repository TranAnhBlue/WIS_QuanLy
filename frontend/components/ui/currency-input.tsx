import { formatVNDNumber } from "@/lib/currency";

type CurrencyInputProps = {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
};

export function CurrencyInput({ value, onChange, className = "", placeholder = "0 ₫" }: CurrencyInputProps) {
  return (
    <div className="relative">
      <input
        className={`${className} pr-9`}
        inputMode="numeric"
        placeholder={placeholder}
        value={value ? formatVNDNumber(value) : ""}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "");
          onChange(digits ? Number(digits) : 0);
        }}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₫</span>
    </div>
  );
}
