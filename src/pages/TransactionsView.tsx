import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Transaction, CATEGORIES } from "../data/initialData";
import { Plus, Search, Trash2, Edit2, X, ArrowUpRight, ArrowDownRight, ArrowUpDown } from "lucide-react";

interface TransactionsViewProps {
  transactions: Transaction[];
  onAddTransaction: (tx: Omit<Transaction, "id">) => void;
  onUpdateTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  currencySymbol: string;
}

export default function TransactionsView({
  transactions,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  currencySymbol,
}: TransactionsViewProps) {
  // Filters & State
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [sortBy, setSortBy] = useState<string>("date-desc");

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  // Form Fields
  const [formTitle, setFormTitle] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("Other");
  const [formType, setFormType] = useState<"income" | "expense">("expense");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formError, setFormError] = useState("");

  // Get unique months from transactions for filter dropdown
  const months = Array.from(
    new Set(transactions.map((tx) => tx.date.substring(0, 7)))
  ).sort().reverse();

  // Reset & Open Form
  const openAddModal = () => {
    setEditingTx(null);
    setFormTitle("");
    setFormAmount("");
    setFormCategory(CATEGORIES.expense[0]);
    setFormType("expense");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setFormTitle(tx.title);
    setFormAmount(tx.amount.toString());
    setFormCategory(tx.category);
    setFormType(tx.type);
    setFormDate(tx.date);
    setFormError("");
    setIsModalOpen(true);
  };

  // Submit Form Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError("Title cannot be empty!");
      return;
    }
    const amountNum = parseFloat(formAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError("Amount must be a positive number!");
      return;
    }
    if (!formDate) {
      setFormError("Please select a date!");
      return;
    }

    const txData = {
      title: formTitle.trim(),
      amount: amountNum,
      category: formCategory,
      type: formType,
      date: formDate,
    };

    if (editingTx) {
      onUpdateTransaction({ ...txData, id: editingTx.id });
    } else {
      onAddTransaction(txData);
    }
    setIsModalOpen(false);
  };

  // Filter and Sort Transactions
  const filteredTransactions = transactions
    .filter((tx) => {
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        tx.title.toLowerCase().includes(searchLower) ||
        tx.category.toLowerCase().includes(searchLower) ||
        tx.type.toLowerCase().includes(searchLower) ||
        tx.amount.toString().includes(searchLower);
      const matchesCategory = categoryFilter === "all" || tx.category === categoryFilter;
      const matchesMonth = monthFilter === "all" || tx.date.startsWith(monthFilter);
      return matchesSearch && matchesCategory && matchesMonth;
    })
    .sort((a, b) => {
      if (sortBy === "date-desc") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === "date-asc") return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === "amount-desc") return b.amount - a.amount;
      if (sortBy === "amount-asc") return a.amount - b.amount;
      if (sortBy === "category-asc") return a.category.localeCompare(b.category);
      if (sortBy === "category-desc") return b.category.localeCompare(a.category);
      if (sortBy === "type-income") {
        if (a.type === b.type) return 0;
        return a.type === "income" ? -1 : 1;
      }
      if (sortBy === "type-expense") {
        if (a.type === b.type) return 0;
        return a.type === "expense" ? -1 : 1;
      }
      return 0;
    });

  const categoriesList = Array.from(new Set([...CATEGORIES.income, ...CATEGORIES.expense]));

  return (
    <div className="transactions-container">
      {/* Search and Filters Toolbar */}
      <div className="toolbar">
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filters">
          <select
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          >
            <option value="all">All Months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {new Date(m + "-02").toLocaleString("default", { month: "long", year: "numeric" })}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date-desc">Newest Date</option>
            <option value="date-asc">Oldest Date</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
            <option value="category-asc">Category (A-Z)</option>
            <option value="category-desc">Category (Z-A)</option>
            <option value="type-income">Income First</option>
            <option value="type-expense">Expense First</option>
          </select>
        </div>

        <button className="btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      {/* Transactions Table Card */}
      <div className="table-card">
        {filteredTransactions.length > 0 ? (
          <div className="table-responsive">
            <table className="brutal-table">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th className="text-right">Amount</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <div className="tx-cell-title">
                        <span className={`tx-icon-inline ${tx.type}`}>
                          {tx.type === "income" ? "⇅" : "⇅"}
                        </span>
                        <strong>{tx.title}</strong>
                      </div>
                    </td>
                    <td>
                      <span className={`cat-badge ${tx.type}`}>{tx.category}</span>
                    </td>
                    <td className="tx-date-cell">{tx.date}</td>
                    <td className={`text-right font-black ${tx.type === 'income' ? 'text-green' : 'text-red'}`}>
                      {tx.type === "income" ? "+" : "-"}
                      {currencySymbol}
                      {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button className="action-btn edit" onClick={() => openEditModal(tx)}>
                          <Edit2 size={14} />
                        </button>
                        <button className="action-btn delete" onClick={() => onDeleteTransaction(tx.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="placeholder-container py-12">
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center">
                <p className="placeholder-text mb-6">No transactions yet.</p>
                <button className="btn-primary" onClick={openAddModal}>
                  <Plus size={16} /> Add your first transaction
                </button>
              </div>
            ) : (
              <p className="placeholder-text">No transactions matching your active filters.</p>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Transaction Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="modal-overlay">
            <motion.div
              className="brutal-modal"
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
            >
              <div className="modal-header">
                <h3>{editingTx ? "Edit Transaction" : "New Transaction"}</h3>
                <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="brutal-form">
                {formError && <div className="form-error-msg">{formError}</div>}

                <div className="form-group-row">
                  <div className="form-group">
                    <label>Transaction Type</label>
                    <div className="type-toggle-group">
                      <button
                        type="button"
                        className={`type-toggle-btn income ${formType === "income" ? "active" : ""}`}
                        onClick={() => {
                          setFormType("income");
                          setFormCategory(CATEGORIES.income[0]);
                        }}
                      >
                        Income
                      </button>
                      <button
                        type="button"
                        className={`type-toggle-btn expense ${formType === "expense" ? "active" : ""}`}
                        onClick={() => {
                          setFormType("expense");
                          setFormCategory(CATEGORIES.expense[0]);
                        }}
                      >
                        Expense
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Title / Merchant</label>
                  <input
                    type="text"
                    className="brutal-input"
                    placeholder="e.g. Apple Store, Whole Foods"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                  />
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>Amount ({currencySymbol})</label>
                    <input
                      type="number"
                      step="0.01"
                      className="brutal-input"
                      placeholder="0.00"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <select
                      className="brutal-input select"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                    >
                      {CATEGORIES[formType].map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    className="brutal-input"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn-primary w-full justify-center text-center mt-4">
                  {editingTx ? "Save Changes" : "Create Transaction"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
