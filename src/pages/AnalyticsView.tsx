import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Transaction } from "../data/initialData";

interface AnalyticsViewProps {
  transactions: Transaction[];
  currencySymbol: string;
}

export default function AnalyticsView({ transactions, currencySymbol }: AnalyticsViewProps) {
  // 1. Group data by Month for Bar & Line Charts
  const monthlyData = useMemo(() => {
    const groups: { [key: string]: { month: string; income: number; expense: number } } = {};

    transactions.forEach((tx) => {
      // Parse YYYY-MM
      const monthKey = tx.date.substring(0, 7);
      if (!groups[monthKey]) {
        groups[monthKey] = {
          month: monthKey,
          income: 0,
          expense: 0,
        };
      }
      if (tx.type === "income") {
        groups[monthKey].income += tx.amount;
      } else {
        groups[monthKey].expense += tx.amount;
      }
    });

    // Sort months chronologically
    return Object.values(groups)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((item) => {
        const dateObj = new Date(item.month + "-02");
        const formattedMonth = dateObj.toLocaleString("default", {
          month: "short",
          year: "2-digit",
        });
        return {
          ...item,
          monthLabel: formattedMonth,
          savings: item.income - item.expense,
        };
      });
  }, [transactions]);

  // 2. Expense Category Distribution (Pie Chart & List)
  const categoryData = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === "expense");
    const categorySums: { [key: string]: number } = {};

    expenses.forEach((tx) => {
      categorySums[tx.category] = (categorySums[tx.category] || 0) + tx.amount;
    });

    const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    return Object.entries(categorySums)
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalExpense > 0 ? Math.round((value / totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // Colors matching our Neo-Brutal theme
  const BRUTAL_COLORS = ["#3B82F6", "#FACC15", "#EF4444", "#22C55E", "#A855F7", "#F97316", "#06B6D4", "#EC4899"];

  // Custom Neo-Brutalist tooltip styles for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="brutal-tooltip">
          <p className="tooltip-title">{label || "Details"}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="tooltip-item" style={{ color: entry.color }}>
              <strong>{entry.name}:</strong> {currencySymbol}
              {entry.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Safe division ratio helper
  const savedRatio = useMemo(() => {
    const totalIncome = transactions.filter((t) => t.type === "income").reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = transactions.filter((t) => t.type === "expense").reduce((acc, curr) => acc + curr.amount, 0);
    if (totalIncome === 0) return 0;
    return Math.round(((totalIncome - totalExpense) / totalIncome) * 100);
  }, [transactions]);

  return (
    <div className="analytics-container">
      {/* Overview stats panel */}
      <div className="analytics-summary-box">
        <div className="analytics-stat">
          <span className="stat-card-label">Monthly Savings Ratio</span>
          <h4 className="stat-card-val text-blue">{savedRatio}% of income saved</h4>
        </div>
        <div className="analytics-stat">
          <span className="stat-card-label">Top Category Spent</span>
          <h4 className="stat-card-val text-red">
            {categoryData[0] ? `${categoryData[0].name} (${currencySymbol}${categoryData[0].value.toLocaleString()})` : "None"}
          </h4>
        </div>
      </div>

      <div className="analytics-grid">
        {/* Chart 1: Income vs Expense comparison */}
        <div className="chart-card">
          <h4 className="chart-title">Income vs Expense Comparison</h4>
          <div className="chart-wrapper">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="monthLabel" tickLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                  <YAxis tickLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.05)" }} />
                  <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                  <Bar dataKey="income" name="Income" fill="#22C55E" stroke="#000000" strokeWidth={2} />
                  <Bar dataKey="expense" name="Expense" fill="#EF4444" stroke="#000000" strokeWidth={2} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-placeholder">No transaction data available</div>
            )}
          </div>
        </div>

        {/* Chart 2: Savings Trend Line Chart */}
        <div className="chart-card">
          <h4 className="chart-title">Savings Trend Line Chart</h4>
          <div className="chart-wrapper">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="monthLabel" tickLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                  <YAxis tickLine={false} tick={{ fontSize: 11, fontWeight: 700 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                  <Line
                    type="monotone"
                    dataKey="savings"
                    name="Savings"
                    stroke="#3B82F6"
                    strokeWidth={4}
                    dot={{ stroke: "#000000", strokeWidth: 2, r: 6, fill: "#FACC15" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-placeholder">No transaction data available</div>
            )}
          </div>
        </div>

        {/* Chart 3: Expense Pie Chart */}
        <div className="chart-card">
          <h4 className="chart-title">Expense Pie Chart</h4>
          <div className="chart-wrapper flex-row">
            {categoryData.length > 0 ? (
              <>
                <div className="pie-container">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        stroke="#000000"
                        strokeWidth={2}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={BRUTAL_COLORS[index % BRUTAL_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="category-legend-list">
                  {categoryData.slice(0, 4).map((cat, idx) => (
                    <div key={cat.name} className="legend-item">
                      <span
                        className="color-dot"
                        style={{ backgroundColor: BRUTAL_COLORS[idx % BRUTAL_COLORS.length] }}
                      />
                      <span className="legend-label">
                        {cat.name} ({cat.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="chart-placeholder">No expense data available</div>
            )}
          </div>
        </div>

        {/* Category breakdown table */}
        <div className="chart-card">
          <h4 className="chart-title">Category Statistics</h4>
          <div className="category-stat-breakdown">
            {categoryData.length > 0 ? (
              <div className="stat-table-scroller">
                <table className="mini-brutal-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th className="text-right">Total Spent</th>
                      <th className="text-right">Ratio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryData.map((cat, index) => (
                      <tr key={cat.name}>
                        <td className="font-bold">{cat.name}</td>
                        <td className="text-right font-black">
                          {currencySymbol}
                          {cat.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="text-right">
                          <span className="ratio-badge">{cat.percentage}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="chart-placeholder">No categories logged yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
