import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { connectToDatabase } from "./src/db/mongodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_change_me_in_production";

app.use(express.json());
app.use(cookieParser());

// Auth Middleware
export interface AuthRequest extends Request {
  userId?: string;
}

const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Helper to handle consistent String IDs across the application
const generateId = (): string => "id_" + Math.random().toString(36).substring(2, 11);

const getQueryId = (id: string): string => {
  return id;
};

async function start() {
  const { users, transactions, goals, settings } = await connectToDatabase();

  // Auth Endpoints
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { fullName, username, email, password } = req.body;
      if (!fullName || !username || !email || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check existing user
      const existingUser = await users.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        return res.status(400).json({ error: "Username or email already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const userId = generateId();
      const newUser = {
        _id: userId,
        fullName,
        username,
        email,
        passwordHash,
        currency: "USD",
        monthlySalary: 0,
        monthlyBudget: 0,
        monthlySavingGoal: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await users.insertOne(newUser);
      const token = jwt.sign({ userId: userId }, JWT_SECRET, { expiresIn: "7d" });
      
      res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.status(201).json({ _id: userId, fullName, username, email });
    } catch (err) {
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !password) {
        return res.status(400).json({ error: "Missing credentials" });
      }

      const user = await users.findOne({ $or: [{ email: identifier }, { username: identifier }] });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: "7d" });
      res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.json({ _id: user._id, fullName: user.fullName, username: user.username, email: user.email });
    } catch (err) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
  });

  app.get("/api/auth/me", requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await users.findOne({ _id: getQueryId(req.userId!) });
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({ _id: user._id, fullName: user.fullName, username: user.username, email: user.email });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch user profile" });
    }
  });

  // Transactions CRUD Endpoints
  app.get("/api/transactions", requireAuth, async (req: AuthRequest, res) => {
    try {
      const cursor = await transactions.find({ userId: req.userId });
      const list = cursor && typeof cursor.toArray === "function" ? await cursor.toArray() : cursor;
      res.json(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("[API Error] GET /api/transactions failed:", err);
      res.status(500).json({ error: "Failed to fetch transactions", details: String(err) });
    }
  });

  app.post("/api/transactions", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { title, amount, type, category, date } = req.body;
      if (!title || amount === undefined || !type || !category || !date) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const txId = generateId();
      const newTx = {
        _id: txId,
        userId: req.userId,
        title,
        amount: Number(amount),
        type,
        category,
        date,
        createdAt: new Date().toISOString()
      };
      await transactions.insertOne(newTx);
      res.status(201).json(newTx);
    } catch (err) {
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  app.put("/api/transactions/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { title, amount, type, category, date } = req.body;
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (amount !== undefined) updateData.amount = Number(amount);
      if (type !== undefined) updateData.type = type;
      if (category !== undefined) updateData.category = category;
      if (date !== undefined) updateData.date = date;

      const result = await transactions.updateOne({ _id: getQueryId(id), userId: req.userId }, { $set: updateData });
      if (result.modifiedCount === 0) return res.status(404).json({ error: "Not found or not your transaction" });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update transaction" });
    }
  });

  app.delete("/api/transactions/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const result = await transactions.deleteOne({ _id: getQueryId(id), userId: req.userId });
      if (result.deletedCount === 0) return res.status(404).json({ error: "Not found or not your transaction" });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete transaction" });
    }
  });

  // Goals CRUD Endpoints
  app.get("/api/goals", requireAuth, async (req: AuthRequest, res) => {
    try {
      const cursor = await goals.find({ userId: req.userId });
      const list = cursor && typeof cursor.toArray === "function" ? await cursor.toArray() : cursor;
      res.json(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("[API Error] GET /api/goals failed:", err);
      res.status(500).json({ error: "Failed to fetch goals", details: String(err) });
    }
  });

  app.post("/api/goals", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { name, targetAmount, currentAmount } = req.body;
      if (!name || targetAmount === undefined) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const goalId = generateId();
      const newGoal = {
        _id: goalId,
        userId: req.userId,
        name,
        targetAmount: Number(targetAmount),
        currentAmount: Number(currentAmount || 0)
      };
      await goals.insertOne(newGoal);
      res.status(201).json(newGoal);
    } catch (err) {
      res.status(500).json({ error: "Failed to create goal" });
    }
  });

  app.put("/api/goals/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { name, targetAmount, currentAmount } = req.body;
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (targetAmount !== undefined) updateData.targetAmount = Number(targetAmount);
      if (currentAmount !== undefined) updateData.currentAmount = Number(currentAmount);

      const result = await goals.updateOne({ _id: getQueryId(id), userId: req.userId }, { $set: updateData });
      if (result.modifiedCount === 0) return res.status(404).json({ error: "Not found or not your goal" });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update goal" });
    }
  });

  app.delete("/api/goals/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const result = await goals.deleteOne({ _id: getQueryId(id), userId: req.userId });
      if (result.deletedCount === 0) return res.status(404).json({ error: "Not found or not your goal" });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete goal" });
    }
  });

  // Settings Endpoints
  app.get("/api/settings", requireAuth, async (req: AuthRequest, res) => {
    try {
      let data = await users.findOne({ _id: getQueryId(req.userId!) });
      if (!data) {
        console.warn(`[API Warning] Settings requested for non-existent user: ${req.userId}`);
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        fullName: data.fullName || "",
        username: data.username || "",
        email: data.email || "",
        profileImage: data.profileImage || "",
        monthlySalary: data.monthlySalary || 0,
        monthlyBudget: data.monthlyBudget || 0,
        monthlySavingGoal: data.monthlySavingGoal || 0,
        currency: data.currency || "USD",
        theme: "Brutalist Light"
      });
    } catch (err) {
      console.error("[API Error] GET /api/settings failed:", err);
      res.status(500).json({ error: "Failed to fetch settings", details: String(err) });
    }
  });

  app.put("/api/settings", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { fullName, username, email, profileImage, monthlySalary, monthlyBudget, monthlySavingGoal, currency } = req.body;
      const updateData: any = { updatedAt: new Date().toISOString() };
      
      if (fullName !== undefined) updateData.fullName = fullName;
      if (username !== undefined) updateData.username = username;
      if (email !== undefined) updateData.email = email;
      if (profileImage !== undefined) updateData.profileImage = profileImage;
      
      // Ensure numeric values are stored as numbers in MongoDB
      if (monthlySalary !== undefined) updateData.monthlySalary = Number(monthlySalary) || 0;
      if (monthlyBudget !== undefined) updateData.monthlyBudget = Number(monthlyBudget) || 0;
      if (monthlySavingGoal !== undefined) updateData.monthlySavingGoal = Number(monthlySavingGoal) || 0;
      if (currency !== undefined) updateData.currency = currency;

      const result = await users.updateOne({ _id: getQueryId(req.userId!) }, { $set: updateData });
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ success: true, modifiedCount: result.modifiedCount });
    } catch (err: any) {
      console.error("[API Error] PUT /api/settings failed:", err);
      res.status(500).json({ 
        error: "Internal Server Error during settings update", 
        details: err?.message || String(err) 
      });
    }
  });

  // Reset Endpoint
  app.post("/api/reset", requireAuth, async (req: AuthRequest, res) => {
    try {
      await transactions.deleteMany({ userId: req.userId });
      await goals.deleteMany({ userId: req.userId });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to reset data" });
    }
  });

  // Vite Integration for Asset Serving & Development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Critical error starting backend server:", err);
});
