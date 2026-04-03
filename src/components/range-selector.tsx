import { Button } from "@/components/ui/button";

export type RangeType = "day" | "week" | "month" | "year" | "all-time";

interface RangeSelectorProps {
  selectedRange: RangeType;
  onRangeChange: (range: RangeType) => void;
  disabled?: boolean;
}

export function RangeSelector({ selectedRange, onRangeChange, disabled = false }: RangeSelectorProps) {
  const ranges: { label: string; value: RangeType }[] = [
    { label: "Last Day", value: "day" },
    { label: "Last Week", value: "week" },
    { label: "Last Month", value: "month" },
    { label: "Last Year", value: "year" },
    { label: "All-time", value: "all-time" },
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      {ranges.map((range) => (
        <Button
          key={range.value}
          variant={selectedRange === range.value ? "default" : "outline"}
          size="sm"
          onClick={() => onRangeChange(range.value)}
          disabled={disabled}
          className="text-xs"
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
}
