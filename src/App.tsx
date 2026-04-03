import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Trash2, Plus, Pencil, Wallet, Calendar as CalendarIcon, Check, ChevronsUpDown, X } from "lucide-react";
import { format } from "date-fns";
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

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar, type Page } from "@/components/app-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

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
  
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [type, setType] = useState<"income" | "expense">("expense");
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [searchCategory, setSearchCategory] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

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
      fetchData(); // Refresh categories
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

  const totals = transactions.reduce(
    (acc, t) => {
      if (t.type === "income") acc.income += t.amount;
      else acc.expenses += t.amount;
      return acc;
    },
    { income: 0, expenses: 0 }
  );

  const balance = totals.income - totals.expenses;

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={false}>
        <AppSidebar activePage={activePage} onPageChange={setActivePage} />
        <SidebarInset>
          <div className="container mx-auto p-4 max-w-4xl min-h-screen">
            <header className="flex h-10 shrink-0 items-center gap-2 mb-6 border-b sticky top-0 bg-background/95 backdrop-blur z-10 px-4">
              <h1 className="text-sm font-semibold capitalize text-muted-foreground">{activePage}</h1>
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
                  <h2 className="text-xl font-semibold">Recent Transactions</h2>
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
                          <DialogDescription>
                            Record your income or expenses here.
                          </DialogDescription>
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
                            <Input
                              id="title"
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              className="col-span-3"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right text-xs">Amount</Label>
                            <Input
                              id="amount"
                              type="number"
                              step="0.01"
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              className="col-span-3"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-xs">Category</Label>
                            <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={categoryOpen}
                                  className="col-span-3 justify-between font-normal"
                                >
                                  {category ? category : "Select category..."}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[280px] p-0" align="start">
                                <Command>
                                  <CommandInput 
                                    placeholder="Search category..." 
                                    value={searchCategory}
                                    onValueChange={setSearchCategory}
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      <Button 
                                        variant="ghost" 
                                        className="w-full justify-start gap-2 text-primary"
                                        onClick={() => {
                                          handleCreateCategory(searchCategory);
                                          setCategory(searchCategory);
                                          setSearchCategory("");
                                          setCategoryOpen(false);
                                        }}
                                      >
                                        <Plus className="h-4 w-4" />
                                        Create "{searchCategory}"
                                      </Button>
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {categories.map((cat) => (
                                        <CommandItem
                                          key={cat}
                                          value={cat}
                                          onSelect={(currentValue) => {
                                            setCategory(currentValue === category ? "" : currentValue)
                                            setCategoryOpen(false)
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              category === cat ? "opacity-100" : "opacity-0"
                                            )}
                                          />
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
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "col-span-3 justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={date}
                                  onSelect={(d) => d && setDate(d)}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit" className="w-full">
                            {editingId ? "Update" : "Add"} {type === "income" ? "Income" : "Expense"}
                          </Button>
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
                        {transactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No transactions found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          transactions.map((t) => (
                            <TableRow key={t.id}>
                              <TableCell className="font-medium text-nowrap">
                                {format(new Date(t.date), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell>{t.title}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{t.category}</Badge>
                              </TableCell>
                              <TableCell className={cn("text-right font-bold", t.type === "income" ? "text-green-600" : "text-red-600")}>
                                {t.type === "income" ? "+" : "-"}${t.amount.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(t)}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteTransaction(t.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
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

            {activePage === "settings" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Manage Categories</CardTitle>
                    <CardDescription>Add or remove categories for your transactions.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2 mb-6">
                      <Input 
                        placeholder="Category name..." 
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleCreateCategory(newCategoryName);
                            setNewCategoryName("");
                          }
                        }}
                      />
                      <Button onClick={() => {
                        handleCreateCategory(newCategoryName);
                        setNewCategoryName("");
                      }}>
                        <Plus className="w-4 h-4 mr-2" /> Add
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <Badge key={cat} variant="secondary" className="px-3 py-1 flex items-center gap-2 text-sm h-7">
                          {cat}
                          <span 
                            className="cursor-pointer hover:text-destructive transition-colors p-0.5" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(cat);
                            }}
                          >
                            <X className="w-3 h-3" />
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {(activePage === "user" || activePage === "graph") && (
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
