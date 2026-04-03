import { useState } from "react";
import { Plus, X, Download } from "lucide-react";
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

  const handleAdd = () => {
    if (newCategoryName.trim()) {
      onAddCategory(newCategoryName.trim());
      setNewCategoryName("");
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert("No transactions to export");
      return;
    }

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
  };

  return (
    <div className="space-y-6">
      {/* Export Data Card */}
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>
            Download your transactions as CSV file for backup or analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExportCSV} className="gap-2">
            <Download className="w-4 h-4" />
            Export to CSV
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
    </div>
  );
}
