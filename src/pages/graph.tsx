import { TrendingUp, Scale } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Label,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { RangeSelector, type RangeType } from "@/components/range-selector";

interface GraphProps {
  last30DaysData: any[];
  incomeCategorySpending: any[];
  expenseCategorySpending: any[];
  monthlyExpenseByCategory: any[];
  balance: number;
  chartConfig: any;
  colors: string[];
  chartRange: RangeType;
  onRangeChange: (range: RangeType) => void;
  isAnyFilterActive: boolean;
}

export function Graph({
  last30DaysData,
  incomeCategorySpending,
  expenseCategorySpending,
  monthlyExpenseByCategory,
  balance,
  chartConfig,
  colors,
  chartRange,
  onRangeChange,
  isAnyFilterActive,
}: GraphProps) {
  const totalIncome = incomeCategorySpending.reduce(
    (acc, curr) => acc + curr.value,
    0
  );
  const totalExpenses = expenseCategorySpending.reduce(
    (acc, curr) => acc + curr.value,
    0
  );

  // Get all unique categories for stacked bar chart
  const allExpenseCategories = Array.from(
    new Set(monthlyExpenseByCategory.flatMap(month => Object.keys(month).filter(key => key !== 'month')))
  );

  // Custom tooltip for Balance Trend Chart
  const BalanceTrendTooltip = (props: any) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border border-border bg-background p-2 shadow-md">
          <p className="text-xs font-medium text-foreground">{data.date}</p>
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            ${data.balance.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-6">
      {/* Range Selector */}
      <div className="flex justify-start">
        <RangeSelector 
          selectedRange={chartRange} 
          onRangeChange={onRangeChange}
          disabled={isAnyFilterActive}
        />
      </div>
      {/* 1. Dedicated Balance Trend Chart - Simplified */}
      <Card className="pt-4">
        <CardContent className="h-[150px] w-full pt-0">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <LineChart data={last30DaysData} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="date"
                hide
              />
              <YAxis
                hide
                domain={['auto', 'auto']}
              />
              <ChartTooltip
                cursor={true}
                content={<BalanceTrendTooltip />}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* 2. Income vs Expenses Area Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Income vs Expenses</CardTitle>
          <CardDescription>Daily financial flow comparison</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] w-full">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <AreaChart
              data={last30DaysData}
              margin={{ top: 10, left: 0, right: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                opacity={0.5}
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                fontSize={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
                tickFormatter={(value) => `$${value}`}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#fillIncome)"
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#fillExpense)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm border-t pt-4">
          <div className="flex gap-2 font-medium leading-none">
            Your current net balance is ${balance.toFixed(2)} <TrendingUp
              className={
                balance >= 0 ? "text-green-500 h-4 w-4" : "text-red-500 h-4 w-4"
              }
            />
          </div>
          <div className="leading-none text-muted-foreground flex gap-4">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#10b981]"/> Income</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#ef4444]"/> Expense</span>
          </div>
        </CardFooter>
      </Card>

      {/* Stacked Bar Chart - Monthly Expenses by Category */}
      {monthlyExpenseByCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Expenses by Category</CardTitle>
            <CardDescription>Category breakdown for each month</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] w-full">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart
                data={monthlyExpenseByCategory}
                margin={{ top: 10, left: 0, right: 10, bottom: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                  tickFormatter={(value) => `$${value}`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                {allExpenseCategories.map((category, index) => (
                  <Bar
                    key={category}
                    dataKey={category}
                    stackId="expenses"
                    fill={colors[index % colors.length]}
                    name={category}
                  />
                ))}
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-wrap gap-2 justify-center pb-6">
            {allExpenseCategories.map((category, index) => (
              <div key={category} className="flex items-center gap-1 text-xs">
                <div 
                  className="h-2 w-2 rounded-full" 
                  style={{ backgroundColor: colors[index % colors.length] }} 
                />
                <span className="text-muted-foreground">{category}</span>
              </div>
            ))}
          </CardFooter>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Expense Category Donut */}
        <Card className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle>Expense by Category</CardTitle>
            <CardDescription>Distribution of your spending</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <div className="h-[250px] w-full">
              <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={expenseCategorySpending}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={80}
                    strokeWidth={5}
                  >
                    {expenseCategorySpending.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={colors[index % colors.length]}
                      />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-3xl font-bold"
                              >
                                ${totalExpenses.toLocaleString()}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className="fill-muted-foreground"
                              >
                                Expenses
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>
          </CardContent>
          <CardFooter className="flex-wrap gap-2 justify-center pb-6">
            {expenseCategorySpending.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1 text-xs">
                <div 
                  className="h-2 w-2 rounded-full" 
                  style={{ backgroundColor: colors[index % colors.length] }} 
                />
                <span className="text-muted-foreground">{entry.name}</span>
              </div>
            ))}
          </CardFooter>
        </Card>

        {/* Income Category Donut */}
        <Card className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle>Income by Category</CardTitle>
            <CardDescription>Source of your earnings</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <div className="h-[250px] w-full">
              <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={incomeCategorySpending}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={80}
                    strokeWidth={5}
                  >
                    {incomeCategorySpending.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={colors[(index + 2) % colors.length]}
                      />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-3xl font-bold"
                              >
                                ${totalIncome.toLocaleString()}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className="fill-muted-foreground"
                              >
                                Income
                              </tspan>
                            </text>
                          );
                        }
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>
          </CardContent>
          <CardFooter className="flex-wrap gap-2 justify-center pb-6">
            {incomeCategorySpending.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1 text-xs">
                <div 
                  className="h-2 w-2 rounded-full" 
                  style={{ backgroundColor: colors[(index + 2) % colors.length] }} 
                />
                <span className="text-muted-foreground">{entry.name}</span>
              </div>
            ))}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
