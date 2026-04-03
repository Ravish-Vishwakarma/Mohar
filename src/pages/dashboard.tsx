import { Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Transaction } from "@/types";
import { useCurrency } from "@/components/currency-provider";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface DashboardProps {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: number) => void;
  onAddClick: () => void;
  isAnyFilterActive: boolean;
}

export function Dashboard({
  transactions,
  onEdit,
  onDelete,
  onAddClick,
  isAnyFilterActive,
}: DashboardProps) {
  const { symbol } = useCurrency();

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
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="py-4">
            <CardDescription>Total Income</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {symbol}{totals.income.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {symbol}{totals.expenses.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardDescription>Net Balance</CardDescription>
            <CardTitle
              className={cn(
                "text-2xl",
                balance >= 0 ? "text-blue-600" : "text-orange-600"
              )}
            >
              {symbol}{balance.toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Transactions</h2>
          {isAnyFilterActive && (
            <Badge variant="outline" className="text-[10px] h-5">
              Filtered
            </Badge>
          )}
        </div>
        <Button className="gap-2" onClick={onAddClick}>
          <Plus className="w-4 h-4" /> Add Transaction
        </Button>
      </div>


      <Table className="[&_table]:border-0">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Sr. No.</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center py-8 text-muted-foreground"
              >
                {isAnyFilterActive
                  ? "No transactions match your filters."
                  : "No transactions found."}
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((t, index) => (
              <TableRow key={t.id}>
                <TableCell className="text-muted-foreground text-sm py-3">
                  {index + 1}
                </TableCell>
                <TableCell className="font-medium py-3">{t.title}</TableCell>
                <TableCell className="py-3">
                  <Badge variant="secondary">{t.category}</Badge>
                </TableCell>
                <TableCell className="text-nowrap py-3">
                  {format(new Date(t.date), "MMM d, yyyy")}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-bold py-3",
                    t.type === "income" ? "text-green-600" : "text-red-600"
                  )}
                >
                  {t.type === "income" ? "+" : "-"}{symbol}{t.amount.toFixed(2)}
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(t)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(t.id)}
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
    </>
  );
}
