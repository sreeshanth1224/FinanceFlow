export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  type: "income" | "expense";
  date: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
}

export interface Settings {
  fullName: string;
  username: string;
  email: string;
  profileImage: string;
  currency: string;
  monthlySalary: number;
  monthlyBudget: number;
  monthlySavingGoal: number;
}

export const DEFAULT_SETTINGS: Settings = {
  fullName: "",
  username: "",
  email: "",
  profileImage: "",
  currency: "USD",
  monthlySalary: 0,
  monthlyBudget: 0,
  monthlySavingGoal: 0,
};

export const CATEGORIES = {
  income: ["Salary", "Freelance", "Investment", "Gift", "Other"],
  expense: [
    "Food",
    "Rent",
    "Transport",
    "Entertainment",
    "Shopping",
    "Health",
    "Utilities",
    "Other",
  ],
};

export const CURRENCIES = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "JPY", symbol: "¥" },
  { code: "INR", symbol: "₹" }
];
