import { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { format, subDays, startOfDay, isAfter, isBefore, parseISO, endOfDay } from "date-fns";

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

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [tResult, cResult]: [Transaction[], string[]] = await Promise.all([
        invoke("list"),
        invoke("get_categories"),
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

  // --- Chart Data Processing ---
  const last30DaysData = useMemo(() => {
    const today = startOfDay(new Date());
    const dailyMap: Record<string, { date: string; income: number; expense: number }> = {};
    for (let i = 0; i < 30; i++) {
      const d = format(subDays(today, 29 - i), "MMM d");
      const fullDate = format(subDays(today, 29 - i), "yyyy-MM-dd");
      dailyMap[fullDate] = { date: d, income: 0, expense: 0 };
    }
    filteredTransactions.forEach((t) => {
      if (dailyMap[t.date]) {
        if (t.type === "income") dailyMap[t.date].income += t.amount;
        else dailyMap[t.date].expense += t.amount;
      }
    });
    return Object.values(dailyMap);
  }, [filteredTransactions]);

  const categorySpending = useMemo(() => {
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

  const chartConfig = {
    income: { label: "Income", color: "hsl(var(--primary))" },
    expense: { label: "Expense", color: "hsl(var(--destructive))" },
  };

  const COLORS = ["hsl(var(--primary))", "oklch(0.627 0.265 303.9)", "oklch(0.648 0.2 160.1)", "oklch(0.852 0.199 91.936)", "oklch(0.488 0.243 264.376)"];

  const isAnyFilterActive = filterType !== "all" || filterDateStart !== undefined || filterDateEnd !== undefined || filterCategories.length > 0;

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
          <div className="container mx-auto p-4 max-w-4xl min-h-screen">
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
                categorySpending={categorySpending}
                balance={balance}
                chartConfig={chartConfig}
                colors={COLORS}
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
