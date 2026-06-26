import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Target,
  Settings as SettingsIcon,
  RefreshCw,
  AlertTriangle
} from "lucide-react";

import {
  Transaction,
  Goal,
  Settings,
  DEFAULT_SETTINGS,
  CURRENCIES
} from "./data/initialData";

import { apiService } from "./data/apiService";

import DashboardView from "./pages/DashboardView";
import TransactionsView from "./pages/TransactionsView";
import AnalyticsView from "./pages/AnalyticsView";
import GoalsView from "./pages/GoalsView";
import SettingsView from "./pages/SettingsView";
import AuthView from "./pages/AuthView";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState("dashboard");

  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [deleteTxConfirmOpen, setDeleteTxConfirmOpen] = useState<string | null>(null);
  const [deleteGoalConfirmOpen, setDeleteGoalConfirmOpen] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load all data from backend
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let currentUser = user;
      if (!currentUser) {
        try {
          currentUser = await apiService.me();
          setUser(currentUser);
        } catch (err) {
          // Not logged in
          setLoading(false);
          return;
        }
      }

      const [txList, goalList, userSettings] = await Promise.all([
        apiService.getTransactions(),
        apiService.getGoals(),
        apiService.getSettings()
      ]);

      setTransactions(txList);
      setGoals(goalList);
      setSettings(userSettings);
    } catch (err: any) {
      console.error("Error loading application data:", err);
      setError(err.message || "Failed to establish live database connection. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // CRUD handlers - Transactions
  const handleAddTransaction = async (tx: Omit<Transaction, "id">) => {
    try {
      // Optimistic update
      const tempId = "temp-" + Date.now();
      const tempTx: Transaction = { ...tx, id: tempId };
      setTransactions((prev) => [tempTx, ...prev]);

      const created = await apiService.createTransaction(tx);
      
      // Replace temp with real item
      setTransactions((prev) =>
        prev.map((t) => (t.id === tempId ? created : t))
      );
    } catch (err) {
      showToast("Failed to save transaction to database. Reverting state...", "error");
      loadData(); // Revert to database state
    }
  };

  const handleUpdateTransaction = async (updatedTx: Transaction) => {
    const original = [...transactions];
    try {
      // Optimistic update
      setTransactions((prev) =>
        prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))
      );
      await apiService.updateTransaction(updatedTx);
    } catch (err) {
      showToast("Failed to update transaction in database. Reverting...", "error");
      setTransactions(original);
    }
  };

  const confirmDeleteTransaction = async (id: string) => {
    setDeleteTxConfirmOpen(null);
    const original = [...transactions];
    try {
      // Optimistic update
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      await apiService.deleteTransaction(id);
    } catch (err) {
      showToast("Failed to delete transaction. Reverting...", "error");
      setTransactions(original);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    setDeleteTxConfirmOpen(id);
  };

  // CRUD handlers - Goals
  const handleAddGoal = async (g: Omit<Goal, "id">) => {
    try {
      // Optimistic update
      const tempId = "temp-" + Date.now();
      const tempGoal: Goal = { ...g, id: tempId };
      setGoals((prev) => [...prev, tempGoal]);

      const created = await apiService.createGoal(g);
      
      // Replace temp with real item
      setGoals((prev) =>
        prev.map((item) => (item.id === tempId ? created : item))
      );
    } catch (err) {
      showToast("Failed to save savings goal to database. Reverting...", "error");
      loadData();
    }
  };

  const handleUpdateGoal = async (updatedGoal: Goal) => {
    const original = [...goals];
    try {
      // Optimistic update
      setGoals((prev) =>
        prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g))
      );
      await apiService.updateGoal(updatedGoal);
    } catch (err) {
      showToast("Failed to update goal. Reverting...", "error");
      setGoals(original);
    }
  };

  const confirmDeleteGoal = async (id: string) => {
    setDeleteGoalConfirmOpen(null);
    const original = [...goals];
    try {
      // Optimistic update
      setGoals((prev) => prev.filter((g) => g.id !== id));
      await apiService.deleteGoal(id);
    } catch (err) {
      showToast("Failed to delete savings goal. Reverting...", "error");
      setGoals(original);
    }
  };

  const handleDeleteGoal = (id: string) => {
    setDeleteGoalConfirmOpen(id);
  };

  // Settings Handlers
  const handleUpdateSettings = async (updates: Partial<Settings>) => {
    const original = { ...settings };
    try {
      setSettings((prev) => ({ ...prev, ...updates }));
      await apiService.updateSettings(updates);
    } catch (err: any) {
      showToast("Failed to update settings. Reverting...", "error");
      setSettings(original);
      throw err; // Re-throw to allow component-level error handling
    }
  };

  const confirmResetData = async () => {
    setResetConfirmOpen(false);
    try {
      setLoading(true);
      await apiService.resetAllData();
      localStorage.clear();
      setTransactions([]);
      setGoals([]);
      setSettings(DEFAULT_SETTINGS);
      showToast("Database and application states have been fully reset!", "success");
      setLoading(false);
      setCurrentPage("dashboard");
    } catch (err) {
      showToast("Failed to reset database and local data.", "error");
      setLoading(false);
    }
  };

  const handleResetData = () => {
    setResetConfirmOpen(true);
  };

  const handleExportData = () => {
    const backupData = {
      transactions,
      goals,
      settings,
      exportVersion: "1.0",
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `financeflow_backup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Data exported successfully!", "success");
  };

  const handleImportData = async (imported: any): Promise<boolean> => {
    if (imported && Array.isArray(imported.transactions) && Array.isArray(imported.goals) && imported.settings) {
      try {
        setLoading(true);
        // Step 1: Reset DB
        await apiService.resetAllData();

        // Step 2: Set Settings
        await apiService.updateSettings({
          currency: imported.settings.currency,
          monthlyBudget: imported.settings.monthlyBudget
        });

        // Step 3: Insert Goals
        for (const g of imported.goals) {
          await apiService.createGoal({
            name: g.name,
            targetAmount: g.targetAmount,
            currentAmount: g.currentAmount
          });
        }

        // Step 4: Insert Transactions
        for (const tx of imported.transactions) {
          await apiService.createTransaction({
            title: tx.title,
            amount: tx.amount,
            category: tx.category,
            type: tx.type,
            date: tx.date
          });
        }

        // Reload fresh data from database
        await loadData();
        return true;
      } catch (err) {
        console.error("Failed to import backup data:", err);
        showToast("Error importing file backup to database.", "error");
        loadData();
        return false;
      }
    }
    return false;
  };

  const handleLogin = (userData: any) => {
    setUser(userData);
    loadData();
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
      setUser(null);
      setTransactions([]);
      setGoals([]);
      setSettings(DEFAULT_SETTINGS);
      setCurrentPage("dashboard");
    } catch (err) {
      showToast("Failed to logout", "error");
    }
  };

  if (loading && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDF9F1] font-sans">
        <RefreshCw size={48} className="animate-spin mb-4" />
        <h2 className="text-2xl font-black uppercase">Loading...</h2>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-container">
      <main className="main-content flex items-center justify-center p-5">
        <AuthView onLogin={handleLogin} />
      </main>
      </div>
    );
  }

  // Utility to map code to symbols
  const currencySymbol = CURRENCIES.find((c) => c.code === settings.currency)?.symbol || "$";

  // Sidebar navigation configuration
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "transactions", label: "Transactions", icon: ArrowLeftRight },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "goals", label: "Goals", icon: Target },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-logo">⇅</span>
          <h1 className="brand-name">FinanceFlow</h1>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`nav-button ${isActive ? "active" : ""}`}
                whileTap={{ scale: 0.96 }}
              >
                <Icon size={20} />
                <span className="nav-label">{item.label}</span>
              </motion.button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <p className="footer-text">v1.0.0 • Brutal Edition</p>
        </div>
      </aside>

      {/* Global Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            style={{
              position: "fixed",
              bottom: "32px",
              left: "50%",
              zIndex: 9999,
              background: toast.type === "success" ? "#22C55E" : "#EF4444",
              color: "#ffffff",
              padding: "16px 24px",
              borderRadius: "8px",
              border: "4px solid #000000",
              boxShadow: "6px 6px 0px 0px #000000",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            {toast.type === "success" ? "✓" : "⚠"} {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="main-header">
          <div className="header-title-container">
            <h2 className="header-title">
              {currentPage === "dashboard" ? `Hello, ${settings.fullName || settings.username}` : currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
            </h2>
            <p className="header-subtitle">
              {currentPage === "dashboard" ? "Welcome back to your financial control center." : "Manage your wealth with zero compromise."}
            </p>
          </div>
          <div className="header-actions">
            <span className="user-name-label hidden md:block font-black text-sm uppercase">
              {settings.fullName || settings.username}
            </span>
            <span className="user-badge">
              {(settings.fullName || settings.username).split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
            </span>
            <button 
              onClick={handleLogout}
              className="text-sm font-bold underline hover:bg-black hover:text-[#B4F8C8] px-2 py-1 transition-colors border-2 border-transparent hover:border-black"
            >
              LOGOUT
            </button>
          </div>
        </header>

        <div className="content-body">
          {loading ? (
            <div className="loading-container">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="mb-5"
              >
                <RefreshCw size={48} strokeWidth={2.5} />
              </motion.div>
              <h3 className="loading-title">Establishing Secure Tunnel...</h3>
              <p className="loading-subtitle">Fetching records from financeflow MongoDB collections...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <div className="error-card">
                <div className="error-icon-container">
                  <AlertTriangle size={48} color="#FFFFFF" strokeWidth={2.5} />
                </div>
                <h3 className="error-title">Connection Interrupted</h3>
                <p className="error-message">{error}</p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={loadData}
                  className="retry-button"
                >
                  <RefreshCw size={18} strokeWidth={2.5} />
                  Retry Sync
                </motion.button>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {currentPage === "dashboard" && (
                  <DashboardView
                    transactions={transactions}
                    goals={goals}
                    budget={settings.monthlyBudget}
                    currencySymbol={currencySymbol}
                    onNavigate={setCurrentPage}
                  />
                )}
                {currentPage === "transactions" && (
                  <TransactionsView
                    transactions={transactions}
                    onAddTransaction={handleAddTransaction}
                    onUpdateTransaction={handleUpdateTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    currencySymbol={currencySymbol}
                  />
                )}
                {currentPage === "analytics" && (
                  <AnalyticsView transactions={transactions} currencySymbol={currencySymbol} />
                )}
                {currentPage === "goals" && (
                  <GoalsView
                    goals={goals}
                    onAddGoal={handleAddGoal}
                    onUpdateGoal={handleUpdateGoal}
                    onDeleteGoal={handleDeleteGoal}
                    currencySymbol={currencySymbol}
                  />
                )}
                {currentPage === "settings" && (
                  <SettingsView
                    settings={settings}
                    onUpdateSettings={handleUpdateSettings}
                    onResetData={handleResetData}
                    onExportData={handleExportData}
                    onImportData={handleImportData}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* Confirm Modals */}
      <AnimatePresence>
        {resetConfirmOpen && (
          <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="modal-content" style={{ background: '#fff', border: '4px solid #000', borderRadius: '12px', padding: '24px', maxWidth: '400px', boxShadow: '8px 8px 0px 0px #000' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '12px' }}>Are you sure?</h3>
              <p style={{ marginBottom: '24px' }}>This action cannot be undone. All transactions, goals, and preferences will be permanently erased.</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setResetConfirmOpen(false)} style={{ padding: '8px 16px', background: '#ccc', border: '2px solid #000', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                <button onClick={confirmResetData} style={{ padding: '8px 16px', background: '#EF4444', color: '#fff', border: '2px solid #000', fontWeight: 'bold', cursor: 'pointer' }}>Reset All</button>
              </div>
            </motion.div>
          </div>
        )}

        {deleteTxConfirmOpen !== null && (
          <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="modal-content" style={{ background: '#fff', border: '4px solid #000', borderRadius: '12px', padding: '24px', maxWidth: '400px', boxShadow: '8px 8px 0px 0px #000' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '12px' }}>Delete Transaction?</h3>
              <p style={{ marginBottom: '24px' }}>Are you sure you want to delete this transaction?</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setDeleteTxConfirmOpen(null)} style={{ padding: '8px 16px', background: '#ccc', border: '2px solid #000', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => confirmDeleteTransaction(deleteTxConfirmOpen)} style={{ padding: '8px 16px', background: '#EF4444', color: '#fff', border: '2px solid #000', fontWeight: 'bold', cursor: 'pointer' }}>Delete</button>
              </div>
            </motion.div>
          </div>
        )}

        {deleteGoalConfirmOpen !== null && (
          <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="modal-content" style={{ background: '#fff', border: '4px solid #000', borderRadius: '12px', padding: '24px', maxWidth: '400px', boxShadow: '8px 8px 0px 0px #000' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '12px' }}>Delete Savings Goal?</h3>
              <p style={{ marginBottom: '24px' }}>Are you sure you want to delete this savings goal?</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setDeleteGoalConfirmOpen(null)} style={{ padding: '8px 16px', background: '#ccc', border: '2px solid #000', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => confirmDeleteGoal(deleteGoalConfirmOpen)} style={{ padding: '8px 16px', background: '#EF4444', color: '#fff', border: '2px solid #000', fontWeight: 'bold', cursor: 'pointer' }}>Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
