import { useEffect, useState, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { 
  Trash2, 
  Plus, 
  Pencil, 
  Wallet, 
  Calendar as CalendarIcon, 
  Check, 
  ChevronsUpDown, 
  X, 
  TrendingUp,
  Filter,
  RotateCcw
} from "lucide-react";
import { format, subDays, startOfDay, isAfter, isBefore, parseISO, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";

import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import { Label } from "./components/ui/label";
import { Badge } from "./components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./components/ui/popover";
import { Calendar } from "./components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar, type Page } from "@/components/app-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface Transaction {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  type: "income" | "expense";
}

function App() {
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Form State
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [type, setType] = useState<"income" | "expense">("expense");
  
  // UI State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [searchCategory, setSearchCategory] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  // Filter State
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [filterDateStart, setFilterDateStart] = useState<Date | undefined>(undefined);
  const [filterDateEnd, setFilterDateEnd] = useState<Date | undefined>(undefined);
  const [filterCategories, setFilterCategories] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [tResult, cResult]: [Transaction[], string[]] = await Promise.all([
        invoke("list"),
        invoke("get_categories")
      ]);
      setTransactions(tResult);
      setCategories(cResult);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return;

    try {
      const dateString = format(date, "yyyy-MM-dd");
      const payload = {
        title,
        amount: numAmount,
        category,
        date: dateString,
        transactionType: type,
      };

      if (editingId !== null) {
        await invoke("update", { id: editingId, ...payload });
      } else {
        await invoke("add", payload);
      }
      
      resetForm();
      fetchData();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to save transaction:", error);
    }
  }

  async function deleteTransaction(id: number) {
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

  function handleEdit(t: Transaction) {
    setEditingId(t.id);
    setTitle(t.title);
    setAmount(t.amount.toString());
    setCategory(t.category);
    setDate(new Date(t.date));
    setType(t.type);
    setIsDialogOpen(true);
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setAmount("");
    setCategory("");
    setDate(new Date());
    setType("expense");
  }

  // --- Filtering Logic ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Type filter
      if (filterType !== "all" && t.type !== filterType) return false;
      
      // Category filter
      if (filterCategories.length > 0 && !filterCategories.includes(t.category)) return false;
      
      // Date filter
      const tDate = parseISO(t.date);
      if (filterDateStart && isBefore(tDate, startOfDay(filterDateStart))) return false;
      if (filterDateEnd && isAfter(tDate, endOfDay(filterDateEnd))) return false;
      
      return true;
    });
  }, [transactions, filterType, filterCategories, filterDateStart, filterDateEnd]);

  const totals = filteredTransactions.reduce(
    (acc, t) => {
      if (t.type === "income") acc.income += t.amount;
      else acc.expenses += t.amount;
      return acc;
    },
    { income: 0, expenses: 0 }
  );

  const balance = totals.income - totals.expenses;

  // --- Chart Data Processing ---
  
  const last30DaysData = useMemo(() => {
    const today = startOfDay(new Date());
    const dailyMap: Record<string, { date: string; income: number; expense: number }> = {};
    for (let i = 0; i < 30; i++) {
      const d = format(subDays(today, 29 - i), "MMM d");
      const fullDate = format(subDays(today, 29 - i), "yyyy-MM-dd");
      dailyMap[fullDate] = { date: d, income: 0, expense: 0 };
    }

    filteredTransactions.forEach(t => {
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
      .filter(t => t.type === "expense")
      .forEach(t => {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      });

    return Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const chartConfig = {
    income: { label: "Income", color: "hsl(var(--primary))" },
    expense: { label: "Expense", color: "hsl(var(--destructive))" },
  } satisfies ChartConfig

  const COLORS = ['hsl(var(--primary))', 'oklch(0.627 0.265 303.9)', 'oklch(0.648 0.2 160.1)', 'oklch(0.852 0.199 91.936)', 'oklch(0.488 0.243 264.376)'];

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
              <h1 className="text-sm font-semibold capitalize text-muted-foreground">{activePage}</h1>
              
              {(activePage === "dashboard" || activePage === "graph") && (
                <div className="flex items-center gap-2">
                  {isAnyFilterActive && (
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground gap-1" onClick={clearFilters}>
                      <RotateCcw className="h-3 w-3" /> Clear
                    </Button>
                  )}
                  <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <PopoverTrigger asChild>
                      <Button variant={isAnyFilterActive ? "default" : "outline"} size="sm" className="h-7 px-2 text-xs gap-1">
                        <Filter className="h-3 w-3" /> Filter
                        {isAnyFilterActive && <span className="ml-1 rounded-full bg-background text-foreground px-1.5 py-0.5 text-[10px] font-bold">!</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Type</h4>
                          <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                            <TabsList className="grid w-full grid-cols-3 h-8">
                              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                              <TabsTrigger value="income" className="text-xs">Income</TabsTrigger>
                              <TabsTrigger value="expense" className="text-xs">Expense</TabsTrigger>
                            </TabsList>
                          </Tabs>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Date Range</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal text-xs", !filterDateStart && "text-muted-foreground")}>
                                  <CalendarIcon className="mr-2 h-3 w-3" />
                                  {filterDateStart ? format(filterDateStart, "MMM d, yyyy") : "Start"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={filterDateStart} onSelect={setFilterDateStart} initialFocus />
                              </PopoverContent>
                            </Popover>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal text-xs", !filterDateEnd && "text-muted-foreground")}>
                                  <CalendarIcon className="mr-2 h-3 w-3" />
                                  {filterDateEnd ? format(filterDateEnd, "MMM d, yyyy") : "End"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={filterDateEnd} onSelect={setFilterDateEnd} initialFocus />
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
                                    else setFilterCategories(filterCategories.filter(c => c !== cat));
                                  }}
                                />
                                <label htmlFor={`filter-${cat}`} className="text-xs font-medium leading-none cursor-pointer">
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
              )}
            </header>

            {activePage === "dashboard" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <Card>
                    <CardHeader className="py-4">
                      <CardDescription>Total Income</CardDescription>
                      <CardTitle className="text-2xl text-green-600">${totals.income.toFixed(2)}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="py-4">
                      <CardDescription>Total Expenses</CardDescription>
                      <CardTitle className="text-2xl text-red-600">${totals.expenses.toFixed(2)}</CardTitle>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader className="py-4">
                      <CardDescription>Net Balance</CardDescription>
                      <CardTitle className={cn("text-2xl", balance >= 0 ? "text-blue-600" : "text-orange-600")}>
                        ${balance.toFixed(2)}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">Transactions</h2>
                    {isAnyFilterActive && <Badge variant="outline" className="text-[10px] h-5">Filtered</Badge>}
                  </div>
                  <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) resetForm();
                  }}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" /> Add Transaction
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <form onSubmit={handleSubmit}>
                        <DialogHeader>
                          <DialogTitle>{editingId ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
                          <DialogDescription>Record your income or expenses here.</DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4">
                          <Tabs value={type} onValueChange={(v) => setType(v as any)} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="expense">Expense</TabsTrigger>
                              <TabsTrigger value="income">Income</TabsTrigger>
                            </TabsList>
                          </Tabs>

                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right text-xs">Title</Label>
                            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" required />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right text-xs">Amount</Label>
                            <Input id="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="col-span-3" required />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-xs">Category</Label>
                            <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                              <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" aria-expanded={categoryOpen} className="col-span-3 justify-between font-normal">
                                  {category ? category : "Select category..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[280px] p-0" align="start">
                                <Command>
                                  <CommandInput placeholder="Search category..." value={searchCategory} onValueChange={setSearchCategory} />
                                  <CommandList>
                                    <CommandEmpty>
                                      <Button variant="ghost" className="w-full justify-start gap-2 text-primary" onClick={() => { handleCreateCategory(searchCategory); setCategory(searchCategory); setSearchCategory(""); setCategoryOpen(false); }}>
                                        <Plus className="h-4 w-4" /> Create "{searchCategory}"
                                      </Button>
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {categories.map((cat) => (
                                        <CommandItem key={cat} value={cat} onSelect={(currentValue) => { setCategory(currentValue === category ? "" : currentValue); setCategoryOpen(false); }}>
                                          <Check className={cn("mr-2 h-4 w-4", category === cat ? "opacity-100" : "opacity-0")} />
                                          {cat}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-xs">Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("col-span-3 justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" className="w-full">{editingId ? "Update" : "Add"} {type === "income" ? "Income" : "Expense"}</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              {isAnyFilterActive ? "No transactions match your filters." : "No transactions found."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTransactions.map((t) => (
                            <TableRow key={t.id}>
                              <TableCell className="font-medium text-nowrap">{format(new Date(t.date), "MMM d, yyyy")}</TableCell>
                              <TableCell>{t.title}</TableCell>
                              <TableCell><Badge variant="secondary">{t.category}</Badge></TableCell>
                              <TableCell className={cn("text-right font-bold", t.type === "income" ? "text-green-600" : "text-red-600")}>
                                {t.type === "income" ? "+" : "-"}${t.amount.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => handleEdit(t)}><Pencil className="w-4 h-4" /></Button>
                                  <Button variant="ghost" size="icon" onClick={() => deleteTransaction(t.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}

            {activePage === "graph" && (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Income vs Expenses</CardTitle>
                    <CardDescription>Daily overview of the last 30 days.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[300px] w-full">
                    <ChartContainer config={chartConfig} className="h-full w-full">
                      <AreaChart data={last30DaysData} margin={{ left: 12, right: 12 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area type="monotone" dataKey="income" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                        <Area type="monotone" dataKey="expense" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.4} />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                  <CardFooter className="flex-col items-start gap-2 text-sm">
                    <div className="flex gap-2 font-medium leading-none">
                      Your net balance is {balance >= 0 ? "positive" : "negative"} <TrendingUp className="h-4 w-4" />
                    </div>
                    <div className="leading-none text-muted-foreground">Showing filtered results for the last 30 days</div>
                  </CardFooter>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="flex flex-col">
                    <CardHeader className="items-center pb-0">
                      <CardTitle>Category Spending</CardTitle>
                      <CardDescription>Expense distribution by category</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-0">
                      <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={categorySpending} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} paddingAngle={5}>
                              {categorySpending.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Top Expenses</CardTitle>
                      <CardDescription>Highest spending categories</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {categorySpending.slice(0, 5).map((cat, i) => (
                          <div key={cat.name} className="flex items-center gap-4">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium leading-none">{cat.name}</p>
                              <div className="h-2 w-full rounded-full bg-secondary">
                                <div className="h-full rounded-full bg-primary" style={{ width: `${(cat.value / Math.max(...categorySpending.map(v => v.value))) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                              </div>
                            </div>
                            <div className="text-sm font-medium">${cat.value.toFixed(2)}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activePage === "settings" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Manage Categories</CardTitle>
                    <CardDescription>Add or remove categories for your transactions.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 mb-6">
                      <Input placeholder="Category name..." value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { handleCreateCategory(newCategoryName); setNewCategoryName(""); } }} />
                      <Button onClick={() => { handleCreateCategory(newCategoryName); setNewCategoryName(""); }}>
                        <Plus className="w-4 h-4 mr-2" /> Add
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <Badge key={cat} variant="secondary" className="px-3 py-1 flex items-center gap-2 text-sm h-7">
                          {cat}
                          <span className="cursor-pointer hover:text-destructive transition-colors p-0.5" onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat); }}>
                            <X className="w-3 h-3" />
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activePage === "user" && (
              <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
                <p>This page is coming soon!</p>
              </div>
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

export default App;
