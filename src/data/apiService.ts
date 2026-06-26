import { Transaction, Goal, Settings } from "./initialData";

const API_BASE = "/api";

export const apiService = {
  // Auth endpoints
  async login(identifier: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    return data;
  },

  async register(payload: any) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");
    return data;
  },

  async logout() {
    const res = await fetch(`${API_BASE}/auth/logout`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Logout failed");
    return data;
  },

  async me() {
    const res = await fetch(`${API_BASE}/auth/me`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Not authenticated");
    return data;
  },

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    const res = await fetch(`${API_BASE}/transactions`);
    if (!res.ok) {
      console.error(`[API] getTransactions failed with status ${res.status}`);
      throw new Error("Failed to load transactions");
    }
    const data = await res.json();
    return data.map((item: any) => ({
      id: item._id, // Map MongoDB _id to frontend id
      title: item.title,
      amount: item.amount,
      category: item.category,
      type: item.type,
      date: item.date
    }));
  },

  async createTransaction(tx: Omit<Transaction, "id">): Promise<Transaction> {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tx)
    });
    if (!res.ok) throw new Error("Failed to create transaction");
    const item = await res.json();
    return {
      id: item._id,
      title: item.title,
      amount: item.amount,
      category: item.category,
      type: item.type,
      date: item.date
    };
  },

  async updateTransaction(tx: Transaction): Promise<void> {
    const res = await fetch(`${API_BASE}/transactions/${tx.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: tx.title,
        amount: tx.amount,
        category: tx.category,
        type: tx.type,
        date: tx.date
      })
    });
    if (!res.ok) throw new Error("Failed to update transaction");
  },

  async deleteTransaction(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to delete transaction");
  },

  // Goals
  async getGoals(): Promise<Goal[]> {
    const res = await fetch(`${API_BASE}/goals`);
    if (!res.ok) {
      console.error(`[API] getGoals failed with status ${res.status}`);
      throw new Error("Failed to load goals");
    }
    const data = await res.json();
    return data.map((item: any) => ({
      id: item._id,
      name: item.name,
      targetAmount: item.targetAmount,
      currentAmount: item.currentAmount
    }));
  },

  async createGoal(goal: Omit<Goal, "id">): Promise<Goal> {
    const res = await fetch(`${API_BASE}/goals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(goal)
    });
    if (!res.ok) throw new Error("Failed to create goal");
    const item = await res.json();
    return {
      id: item._id,
      name: item.name,
      targetAmount: item.targetAmount,
      currentAmount: item.currentAmount
    };
  },

  async updateGoal(goal: Goal): Promise<void> {
    const res = await fetch(`${API_BASE}/goals/${goal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount
      })
    });
    if (!res.ok) throw new Error("Failed to update goal");
  },

  async deleteGoal(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/goals/${id}`, {
      method: "DELETE"
    });
    if (!res.ok) throw new Error("Failed to delete goal");
  },

  // Settings
  async getSettings(): Promise<Settings> {
    const res = await fetch(`${API_BASE}/settings`);
    if (!res.ok) throw new Error("Failed to load settings");
    const data = await res.json();
    return {
      fullName: data.fullName || "User",
      username: data.username || "user",
      email: data.email || "",
      profileImage: data.profileImage || "",
      currency: data.currency || "USD",
      monthlySalary: data.monthlySalary || 0,
      monthlyBudget: data.monthlyBudget || 0,
      monthlySavingGoal: data.monthlySavingGoal || 0
    };
  },

  async updateSettings(update: Partial<Settings>): Promise<void> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update)
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Failed to update settings: ${res.status} ${errText}`);
    }
  },

  // Global Reset
  async resetAllData(): Promise<void> {
    const res = await fetch(`${API_BASE}/reset`, {
      method: "POST"
    });
    if (!res.ok) throw new Error("Failed to reset database data");
  }
};
