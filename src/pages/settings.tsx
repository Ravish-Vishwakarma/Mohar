import { useState } from "react";
import { Plus, X, Download, Loader2, Coffee, Info } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrency, type Currency } from "@/components/currency-provider";

interface SettingsProps {
  categories: string[];
  transactions: any[];
  onAddCategory: (name: string) => void;
  onDeleteCategory: (name: string) => void;
}

export function Settings({
  categories,
  transactions,
  onAddCategory,
  onDeleteCategory,
}: SettingsProps) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const { toast } = useToast();

  const handleAdd = () => {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim());
      setNewCategoryName("");
    }
  };

  const handleExportCSV = async () => {
    if (transactions.length === 0) {
      toast({
        title: "No transactions",
        description: "There are no transactions to export.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // CSV headers
    const headers = ["ID", "Title", "Amount", "Category", "Date", "Type"];

    // CSV rows
    const rows = transactions.map(t => [
      t.id,
      `"${t.title}"`, // Wrap in quotes to handle commas
      t.amount,
      `"${t.category}"`,
      t.date,
      t.type
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    const fileName = `mohar_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExporting(false);

    const downloadsPath = `Downloads/${fileName}`;
    toast({
      title: "Export successful!",
      description: `File saved to: ${downloadsPath}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Currency Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Currency Settings</CardTitle>
          <CardDescription>
            Choose the currency for displaying amounts throughout your app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <label htmlFor="currency" className="text-sm font-medium">
              Select Currency:
            </label>
            <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
              <SelectTrigger id="currency" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                <SelectItem value="GBP">GBP - British Pound (£)</SelectItem>
                <SelectItem value="INR">INR - Indian Rupee (₹)</SelectItem>
                <SelectItem value="AUD">AUD - Australian Dollar (A$)</SelectItem>
                <SelectItem value="CAD">CAD - Canadian Dollar (C$)</SelectItem>
                <SelectItem value="JPY">JPY - Japanese Yen (¥)</SelectItem>
                <SelectItem value="CHF">CHF - Swiss Franc</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Export Data Card */}
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>
            Download your transactions as CSV file for backup or analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleExportCSV}
            className="gap-2"
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export to CSV
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Categories</CardTitle>
          <CardDescription>
            Add or remove categories for your transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-6">
            <Input
              placeholder="Category name..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAdd();
                }
              }}
            />
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" /> Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant="secondary"
                className="px-3 py-1 flex items-center gap-2 text-sm h-7"
              >
                {cat}
                <span
                  className="cursor-pointer hover:text-destructive transition-colors p-0.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteCategory(cat);
                  }}
                >
                  <X className="w-3 h-3" />
                </span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="flex flex-col items-center gap-4 pt-8 pb-4 border-t">
        <p className="text-sm text-muted-foreground text-center">
          Made with <span className="text-red-600 dark:text-red-400">❤️</span> by Ravish Vishwakarma
        </p>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => window.open("https://ravishvish.gumroad.com/coffee", "_blank")}
          >
            <Coffee className="w-4 h-4" />
            Buy Me Coffee
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => window.open("https://ravish-vishwakarma.github.io/Ravish-Vishwakarma/", "_blank")}
          >
            <Info className="w-4 h-4" />
            More Info
          </Button>
        </div>
      </div>
    </div>
  );
}
