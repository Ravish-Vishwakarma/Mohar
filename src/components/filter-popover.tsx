import { Filter, Calendar as CalendarIcon, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

interface FilterPopoverProps {
  filterType: "all" | "income" | "expense";
  setFilterType: (v: "all" | "income" | "expense") => void;
  filterDateStart: Date | undefined;
  setFilterDateStart: (d: Date | undefined) => void;
  filterDateEnd: Date | undefined;
  setFilterDateEnd: (d: Date | undefined) => void;
  filterCategories: string[];
  setFilterCategories: (cats: string[]) => void;
  categories: string[];
  isAnyFilterActive: boolean;
  onClear: () => void;
}

export function FilterPopover({
  filterType,
  setFilterType,
  filterDateStart,
  setFilterDateStart,
  filterDateEnd,
  setFilterDateEnd,
  filterCategories,
  setFilterCategories,
  categories,
  isAnyFilterActive,
  onClear,
}: FilterPopoverProps) {
  return (
    <div className="flex items-center gap-2">
      {isAnyFilterActive && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground gap-1"
          onClick={onClear}
        >
          <RotateCcw className="h-3 w-3" /> Clear
        </Button>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={isAnyFilterActive ? "default" : "outline"}
            size="sm"
            className="h-7 px-2 text-xs gap-1"
          >
            <Filter className="h-3 w-3" /> Filter
            {isAnyFilterActive && (
              <span className="ml-1 rounded-full bg-background text-foreground px-1.5 py-0.5 text-[10px] font-bold">
                !
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Type</h4>
              <Tabs
                value={filterType}
                onValueChange={(v) => setFilterType(v as any)}
              >
                <TabsList className="grid w-full grid-cols-3 h-8">
                  <TabsTrigger value="all" className="text-xs">
                    All
                  </TabsTrigger>
                  <TabsTrigger value="income" className="text-xs">
                    Income
                  </TabsTrigger>
                  <TabsTrigger value="expense" className="text-xs">
                    Expense
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Date Range</h4>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "justify-start text-left font-normal text-xs",
                        !filterDateStart && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {filterDateStart
                        ? format(filterDateStart, "MMM d, yyyy")
                        : "Start"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filterDateStart}
                      onSelect={setFilterDateStart}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "justify-start text-left font-normal text-xs",
                        !filterDateEnd && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {filterDateEnd
                        ? format(filterDateEnd, "MMM d, yyyy")
                        : "End"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filterDateEnd}
                      onSelect={setFilterDateEnd}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Categories</h4>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2">
                {categories.map((cat) => (
                  <div key={cat} className="flex items-center space-x-2">
                    <Checkbox
                      id={`filter-${cat}`}
                      checked={filterCategories.includes(cat)}
                      onCheckedChange={(checked) => {
                        if (checked) setFilterCategories([...filterCategories, cat]);
                        else
                          setFilterCategories(
                            filterCategories.filter((c) => c !== cat)
                          );
                      }}
                    />
                    <label
                      htmlFor={`filter-${cat}`}
                      className="text-xs font-medium leading-none cursor-pointer"
                    >
                      {cat}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
