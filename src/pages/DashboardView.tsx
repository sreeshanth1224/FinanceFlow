import { motion } from "motion/react";
import StatCard from "../components/StatCard";
import { Transaction, Goal } from "../data/initialData";
import { TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface DashboardViewProps {
  transactions: Transaction[];
  goals: Goal[];
  budget: number;
  currencySymbol: string;
  onNavigate?: (page: string) => void;
}

export default function DashboardView({
  transactions,
  goals,
  budget,
  currencySymbol,
  onNavigate,
}: DashboardViewProps) {
  // Calculations
  const incomeTransactions = transactions.filter((t) => t.type === "income");
  const expenseTransactions = transactions.filter((t) => t.type === "expense");

  const totalIncome = incomeTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = expenseTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const currentBalance = totalIncome - totalExpense;
  const totalSavings = totalIncome - totalExpense;

  // Monthly Calculations (current month of transactions/system date)
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-indexed

  const monthlyIncomeTransactions = incomeTransactions.filter((t) => {
    const parts = t.date.split("-");
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    return y === currentYear && m === currentMonth;
  });

  const monthlyExpenseTransactions = expenseTransactions.filter((t) => {
    const parts = t.date.split("-");
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    return y === currentYear && m === currentMonth;
  });

  const monthlyIncome = monthlyIncomeTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const monthlyExpense = monthlyExpenseTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const monthlySavings = monthlyIncome - monthlyExpense;

  // Bonus Statistics
  const highestExpense = expenseTransactions.length > 0
    ? Math.max(...expenseTransactions.map((t) => t.amount))
    : 0;

  const highestIncome = incomeTransactions.length > 0
    ? Math.max(...incomeTransactions.map((t) => t.amount))
    : 0;

  const budgetRemaining = budget - monthlyExpense;
  const isBudgetExceeded = monthlyExpense > budget;

  const avgMonthlySpending = expenseTransactions.length > 0
    ? totalExpense / expenseTransactions.length
    : 0;

  const transactionCount = transactions.length;

  const categorySums: { [key: string]: number } = {};
  expenseTransactions.forEach((tx) => {
    categorySums[tx.category] = (categorySums[tx.category] || 0) + tx.amount;
  });
  const topSpendingCategory = Object.entries(categorySums).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

  // Recent Transactions (latest 4)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);

  if (transactions.length === 0 && goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center" style={{ minHeight: "60vh", background: "#FFFFFF", border: "4px solid #000", borderRadius: "12px", boxShadow: "8px 8px 0px 0px #000" }}>
        <h2 className="text-4xl font-black uppercase mb-4 tracking-tighter" style={{ color: "#000" }}>Welcome to FinanceFlow</h2>
        <p className="text-lg font-bold mb-8 max-w-md" style={{ color: "#444" }}>
          Your clean slate awaits. Let's build your financial foundation by logging your first income or expense, or setting up a savings goal.
        </p>
        <div className="flex gap-4">
          <button 
            onClick={() => onNavigate && onNavigate("transactions")}
            style={{ background: "#B4F8C8", border: "3px solid #000", padding: "12px 24px", borderRadius: "8px", fontWeight: "900", textTransform: "uppercase", boxShadow: "4px 4px 0px 0px #000", cursor: "pointer" }}
            className="hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] transition-all"
          >
            Add your first transaction
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-grid">
      {/* Stat Cards Container */}
      <div className="stats-row">
        <StatCard
          label="Current Balance"
          value={`${currencySymbol}${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          type="default"
        />
        <StatCard
          label="Monthly Income"
          value={`${currencySymbol}${monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          type="income"
        />
        <StatCard
          label="Monthly Expenses"
          value={`${currencySymbol}${monthlyExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          type="expense"
        />
        <StatCard
          label="Monthly Savings"
          value={`${currencySymbol}${monthlySavings.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          type="savings"
        />
      </div>

      {/* Budget Warning Box */}
      {isBudgetExceeded ? (
        <motion.div 
          className="budget-warning-banner"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <AlertTriangle className="warning-icon" size={24} />
          <div>
            <h4 className="warning-title">Monthly Budget Exceeded!</h4>
            <p className="warning-text">
              You spent {currencySymbol}{monthlyExpense.toLocaleString()} against your budget of {currencySymbol}{budget.toLocaleString()} this month.
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="budget-ok-banner">
          <TrendingUp className="ok-icon" size={24} />
          <div>
            <h4 className="ok-title">Budget Remaining</h4>
            <p className="ok-text">
              You have <strong>{currencySymbol}{budgetRemaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> left from your monthly limit of {currencySymbol}{budget.toLocaleString()}.
            </p>
          </div>
        </div>
      )}

      {currentBalance < 200 && transactions.length > 0 && (
        <div className="budget-warning-banner" style={{ backgroundColor: "#FEF3C7", borderColor: "#000000", marginTop: "12px", boxShadow: "4px 4px 0px 0px #000000" }}>
          <AlertTriangle className="warning-icon" size={24} style={{ color: "#D97706" }} />
          <div>
            <h4 className="warning-title" style={{ color: "#92400E" }}>Low Balance Alert!</h4>
            <p className="warning-text" style={{ color: "#B45309" }}>
              Your current balance is <strong>{currencySymbol}{currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>, which is below the safe threshold of {currencySymbol}200.00. Keep an eye on your upcoming expenses!
            </p>
          </div>
        </div>
      )}

      {/* Bottom Layout - List and Progress */}
      <div className="dashboard-bottom">
        {/* Recent Transactions list */}
        <div className="recent-transactions-panel">
          <h4 className="panel-title">Recent Activity Feed</h4>
          {recentTransactions.length > 0 ? (
            <div className="recent-transactions-list">
              {recentTransactions.map((item, index) => (
                <motion.div
                  key={item.id}
                  className="recent-transaction-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="tx-details">
                    <span className={`tx-icon-badge ${item.type}`}>
                      {item.type === "income" ? (
                        <ArrowUpRight size={18} />
                      ) : (
                        <ArrowDownRight size={18} />
                      )}
                    </span>
                    <div>
                      <p className="tx-title">{item.title}</p>
                      <div className="tx-meta-info">
                        <span className="tx-category">{item.category}</span>
                        <span className="tx-dot">•</span>
                        <span className="tx-date">{item.date}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`tx-amount ${item.type}`}>
                    {item.type === "income" ? "+" : "-"}
                    {currencySymbol}
                    {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="transaction-list-placeholder">
              <p className="placeholder-text">No transactions yet. Start by logging your first income or expense!</p>
            </div>
          )}

          {/* Quick extra stats box */}
          <div className="quick-stats-box" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginTop: "18px" }}>
            <div className="quick-stat">
              <span className="quick-stat-label">Highest Income</span>
              <span className="quick-stat-val text-green">
                {highestIncome > 0 ? `${currencySymbol}${highestIncome.toLocaleString()}` : "—"}
              </span>
            </div>
            <div className="quick-stat">
              <span className="quick-stat-label">Highest Expense</span>
              <span className="quick-stat-val text-red">
                {highestExpense > 0 ? `${currencySymbol}${highestExpense.toLocaleString()}` : "—"}
              </span>
            </div>
            <div className="quick-stat">
              <span className="quick-stat-label">Top Category</span>
              <span className="quick-stat-val text-blue">
                {topSpendingCategory}
              </span>
            </div>
            <div className="quick-stat">
              <span className="quick-stat-label">Avg Expense</span>
              <span className="quick-stat-val" style={{ color: "#F59E0B" }}>
                {avgMonthlySpending > 0 ? `${currencySymbol}${avgMonthlySpending.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}
              </span>
            </div>
            <div className="quick-stat" style={{ gridColumn: "span 2" }}>
              <span className="quick-stat-label">Total Volume</span>
              <span className="quick-stat-val" style={{ fontSize: "14px" }}>
                {transactionCount} transactions logged
              </span>
            </div>
          </div>
        </div>

        {/* Goals progress */}
        <div className="goals-progress-panel">
          <h4 className="panel-title">Savings Goals Progress</h4>
          {goals.length > 0 ? (
            <div className="goals-progress-list">
              {goals.map((goal) => {
                const percentage = Math.min(
                  Math.round((goal.currentAmount / goal.targetAmount) * 100),
                  100
                );
                return (
                  <div key={goal.id} className="goal-progress-item">
                    <div className="goal-progress-header">
                      <span className="goal-progress-name">{goal.name}</span>
                      <span className="goal-progress-values">
                        {currencySymbol}
                        {goal.currentAmount.toLocaleString()} / {currencySymbol}
                        {goal.targetAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="goal-progress-bar-container">
                      <motion.div
                        className="goal-progress-bar-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                      <span className="goal-percentage-label">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="goal-bar-placeholder">
              <p className="placeholder-text">No goals yet. Define a savings target to track your progress!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
