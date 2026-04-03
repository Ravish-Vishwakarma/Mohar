import { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { format, subDays, startOfDay, isAfter, isBefore, parseISO, endOfDay, subYears } from "date-fns";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TransactionDialog } from "@/components/transaction-dialog";
import { FilterPopover } from "@/components/filter-popover";

import { Dashboard } from "@/pages/dashboard";
import { Graph } from "@/pages/graph";
import { Settings } from "@/pages/settings";
import { User } from "@/pages/user";

import { Transaction, Page } from "@/types";
import type { RangeType } from "@/components/range-selector";

function App() {
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // UI State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Filter State
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterDateStart, setFilterDateStart] = useState<Date | undefined>(undefined);
  const [filterDateEnd, setFilterDateEnd] = useState<Date | undefined>(undefined);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);

  // Range State (for graph view)
  const [chartRange, setChartRange] = useState<RangeType>("month");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [tResult, cResult] = await Promise.all([
        invoke<Transaction[]>("list"),
        invoke<string[]>("get_categories"),
      ]);
      setTransactions(tResult);
      setCategories(cResult);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }

  async function handleSaveTransaction(payload: any) {
    try {
      if (editingTransaction) {
        await invoke("update", { id: editingTransaction.id, ...payload });
      } else {
        await invoke("add", payload);
      }
      setIsDialogOpen(false);
      setEditingTransaction(null);
      fetchData();
    } catch (error) {
      console.error("Failed to save transaction:", error);
    }
  }

  async function handleDeleteTransaction(id: number) {
    try {
      await invoke("delete", { id });
      fetchData();
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
  }

  async function handleCreateCategory(name: string) {
    if (!name) return;
    try {
      await invoke("add_category", { name });
      fetchData();
    } catch (error) {
      console.error("Failed to create category:", error);
    }
  }

  async function handleDeleteCategory(name: string) {
    try {
      await invoke("delete_category", { name });
      fetchData();
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  }

  // --- Filtering Logic ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType !== "all" && t.type !== filterType) return false;
      if (filterCategories.length > 0 && !filterCategories.includes(t.category)) return false;
      const tDate = parseISO(t.date);
      if (filterDateStart && isBefore(tDate, startOfDay(filterDateStart))) return false;
      if (filterDateEnd && isAfter(tDate, endOfDay(filterDateEnd))) return false;
      return true;
    });
  }, [transactions, filterType, filterCategories, filterDateStart, filterDateEnd]);

  const balance = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      return acc + (t.type === "income" ? t.amount : -t.amount);
    }, 0);
  }, [filteredTransactions]);

  // Check if any filter is active
  const isAnyFilterActive = filterType !== "all" || filterDateStart !== undefined || filterDateEnd !== undefined || filterCategories.length > 0;

  // --- Helper function to get date range based on selected range ---
  const getDateRangeForChart = (range: RangeType): { startDate: Date; endDate: Date; dayCount: number } => {
    const today = startOfDay(new Date());
    let startDate: Date;
    let dayCount: number;

    switch (range) {
      case "day":
        startDate = today;
        dayCount = 1;
        break;
      case "week":
        startDate = subDays(today, 6);
        dayCount = 7;
        break;
      case "month":
        startDate = subDays(today, 29);
        dayCount = 30;
        break;
      case "year":
        startDate = subDays(today, 364);
        dayCount = 365;
        break;
      case "all-time":
        // Find the earliest transaction date
        const allDates = transactions
          .map((t) => parseISO(t.date))
          .sort((a, b) => a.getTime() - b.getTime());
        startDate = allDates.length > 0 ? startOfDay(allDates[0]) : subYears(today, 5);
        dayCount = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        break;
    }

    return { startDate, endDate: today, dayCount };
  };

  // --- Chart Data Processing (with range support) ---
  const last30DaysData = useMemo(() => {
    // When filters are active, use filter dates; otherwise use preset range
    let startDate: Date;
    let endDate: Date;
    let dayCount: number;

    if (isAnyFilterActive) {
      // Use filter dates if available
      endDate = filterDateEnd ? startOfDay(filterDateEnd) : startOfDay(new Date());
      startDate = filterDateStart ? startOfDay(filterDateStart) : subDays(endDate, 29);
      dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    } else {
      // Use preset range
      const range = getDateRangeForChart(chartRange);
      startDate = range.startDate;
      endDate = range.endDate;
      dayCount = range.dayCount;
    }

    // 1. Calculate Initial Balance (everything before the range start)
    let runningBalance = transactions
      .filter(t => isBefore(parseISO(t.date), startDate))
      .reduce((acc, t) => acc + (t.type === "income" ? t.amount : -t.amount), 0);

    const dailyMap: Record<string, { date: string; income: number; expense: number; balance: number }> = {};

    // 2. Initialize the days in the selected range
    for (let i = 0; i < dayCount; i++) {
      const dateObj = subDays(endDate, dayCount - 1 - i);
      const d = format(dateObj, "MMM d");
      const fullDate = format(dateObj, "yyyy-MM-dd");
      dailyMap[fullDate] = { date: d, income: 0, expense: 0, balance: 0 };
    }

    // 3. Fill daily net changes
    filteredTransactions.forEach((t) => {
      if (dailyMap[t.date]) {
        if (t.type === "income") dailyMap[t.date].income += t.amount;
        else dailyMap[t.date].expense += t.amount;
      }
    });

    // 4. Calculate Cumulative Balance day by day
    const sortedDates = Object.keys(dailyMap).sort();
    const result = sortedDates.map(date => {
      const dayData = dailyMap[date];
      runningBalance += (dayData.income - dayData.expense);
      return {
        ...dayData,
        balance: runningBalance
      };
    });

    return result;
  }, [transactions, filteredTransactions, chartRange, isAnyFilterActive, filterDateStart, filterDateEnd]);

  const expenseCategorySpending = useMemo(() => {
    const catMap: Record<string, number> = {};
    filteredTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      });
    return Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const incomeCategorySpending = useMemo(() => {
    const catMap: Record<string, number> = {};
    filteredTransactions
      .filter((t) => t.type === "income")
      .forEach((t) => {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      });
    return Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const monthlyExpenseByCategory = useMemo(() => {
    const monthlyMap: Record<string, Record<string, number>> = {};
    
    filteredTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const date = parseISO(t.date);
        const monthKey = format(date, "MMM yyyy");
        
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = {};
        }
        monthlyMap[monthKey][t.category] = (monthlyMap[monthKey][t.category] || 0) + t.amount;
      });

    // Get all unique categories
    const allCategories = new Set<string>();
    Object.values(monthlyMap).forEach(month => {
      Object.keys(month).forEach(cat => allCategories.add(cat));
    });

    // Sort months chronologically and build result
    const sortedMonths = Object.keys(monthlyMap).sort((a, b) => {
      const dateA = parseISO(a + " 1");
      const dateB = parseISO(b + " 1");
      return dateA.getTime() - dateB.getTime();
    });

    return sortedMonths.map(month => ({
      month,
      ...monthlyMap[month],
    }));
  }, [filteredTransactions]);

  const chartConfig = {
    income: { label: "Income", color: "#10b981" }, // Emerald 500
    expense: { label: "Expense", color: "#ef4444" }, // Red 500
  };

  const COLORS = ["hsl(var(--primary))", "oklch(0.627 0.265 303.9)", "oklch(0.648 0.2 160.1)", "oklch(0.852 0.199 91.936)", "oklch(0.488 0.243 264.376)"];

  const clearFilters = () => {
    setFilterType("all");
    setFilterDateStart(undefined);
    setFilterDateEnd(undefined);
    setFilterCategories([]);
  };

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={false}>
        <AppSidebar activePage={activePage} onPageChange={setActivePage} />
        <SidebarInset>
          <div className="w-full p-6 min-h-screen">
            <header className="flex h-10 shrink-0 items-center justify-between mb-6 border-b sticky top-0 bg-background/95 backdrop-blur z-10 px-4">
              <h1 className="text-sm font-semibold capitalize text-muted-foreground">
                {activePage}
              </h1>

              {(activePage === "dashboard" || activePage === "graph") && (
                <FilterPopover
                  filterType={filterType}
                  setFilterType={setFilterType}
                  filterDateStart={filterDateStart}
                  setFilterDateStart={setFilterDateStart}
                  filterDateEnd={filterDateEnd}
                  setFilterDateEnd={setFilterDateEnd}
                  filterCategories={filterCategories}
                  setFilterCategories={setFilterCategories}
                  categories={categories}
                  isAnyFilterActive={isAnyFilterActive}
                  onClear={clearFilters}
                />
              )}
            </header>

            {activePage === "dashboard" && (
              <Dashboard
                transactions={filteredTransactions}
                onEdit={(t) => {
                  setEditingTransaction(t);
                  setIsDialogOpen(true);
                }}
                onDelete={handleDeleteTransaction}
                onAddClick={() => {
                  setEditingTransaction(null);
                  setIsDialogOpen(true);
                }}
                isAnyFilterActive={isAnyFilterActive}
              />
            )}

            {activePage === "graph" && (
              <Graph
                last30DaysData={last30DaysData}
                incomeCategorySpending={incomeCategorySpending}
                expenseCategorySpending={expenseCategorySpending}
                monthlyExpenseByCategory={monthlyExpenseByCategory}
                balance={balance}
                chartConfig={chartConfig}
                colors={COLORS}
                chartRange={chartRange}
                onRangeChange={setChartRange}
                isAnyFilterActive={isAnyFilterActive}
              />
            )}

            {activePage === "settings" && (
              <Settings
                categories={categories}
                onAddCategory={handleCreateCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            )}

            {activePage === "user" && <User />}
          </div>

          <TransactionDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            editingTransaction={editingTransaction}
            categories={categories}
            onSave={handleSaveTransaction}
            onCreateCategory={handleCreateCategory}
          />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

export default App;
