import { ConfigProvider, DatePicker, theme } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

export function parseDateValue(value?: string) {
  if (!value || value === "—") return null;
  const parsed = dayjs(value, ["YYYY-MM-DD", "DD/MM/YYYY"], true);
  return parsed.isValid() ? parsed : null;
}

export function isValidDateValue(value?: string) {
  return Boolean(parseDateValue(value));
}

export function isDateBefore(value: string, comparison: string) {
  const date = parseDateValue(value);
  const comparisonDate = parseDateValue(comparison);
  return Boolean(date && comparisonDate && date.isBefore(comparisonDate, "day"));
}

type AppDatePickerProps = {
  value?: string;
  onChange: (value: string) => void;
  outputFormat?: "YYYY-MM-DD" | "DD/MM/YYYY";
  placeholder?: string;
  disabledDate?: (date: Dayjs) => boolean;
};

export function AppDatePicker({
  value,
  onChange,
  outputFormat = "DD/MM/YYYY",
  placeholder = "Chọn ngày",
  disabledDate,
}: AppDatePickerProps) {
  const parsed = parseDateValue(value);

  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
      <DatePicker
        allowClear
        className="wis-date-picker w-full"
        disabledDate={disabledDate}
        format="DD/MM/YYYY"
        inputReadOnly={false}
        placeholder={placeholder}
        value={parsed?.isValid() ? parsed : null}
        onChange={(date) => onChange(date ? date.format(outputFormat) : "")}
      />
    </ConfigProvider>
  );
}
