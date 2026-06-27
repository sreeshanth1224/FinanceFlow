import { MongoClient, Db } from "mongodb";
import fs from "fs";
import path from "path";

// Document schemas
export interface UserDoc {
  _id: string;
  fullName: string;
  username: string;
  email: string;
  passwordHash: string;
  profileImage?: string;
  currency: string;
  monthlySalary: number;
  monthlyBudget: number;
  monthlySavingGoal: number;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionDoc {
  _id: string;
  userId: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  createdAt: string;
}

export interface GoalDoc {
  _id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progress: number;
}

export interface SettingsDoc {
  _id: string;
  userId: string;
  currency: string;
  theme: string;
  monthlyBudget: number;
}

// Connection variables
let client: MongoClient | null = null;
let dbInstance: Db | null = null;

// Determine DB fallback path for server-side persistence when MongoDB Atlas is offline/unconfigured
const FALLBACK_FILE_PATH = path.join(process.cwd(), "db_fallback.json");

// Default fallback data matching default app data structure
const DEFAULT_FALLBACK_DATA = {
  users: [],
  transactions: [],
  goals: [],
  settings: []
};

// Initialize file db if absent
if (!fs.existsSync(FALLBACK_FILE_PATH)) {
  fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(DEFAULT_FALLBACK_DATA, null, 2));
}

// Local File MongoDB Simulation (Active when process.env.MONGODB_URI is undefined)
class LocalMongoCollection<T extends { _id: string }> {
  private collectionName: "users" | "transactions" | "goals" | "settings";

  constructor(collectionName: "users" | "transactions" | "goals" | "settings") {
    this.collectionName = collectionName;
  }

  private read(): T[] {
    try {
      if (!fs.existsSync(FALLBACK_FILE_PATH)) {
        return [];
      }
      const content = fs.readFileSync(FALLBACK_FILE_PATH, "utf-8");
      const data = JSON.parse(content);
      const items = data[this.collectionName] || [];
      return items;
    } catch (err) {
      console.error(`[Local DB] Read error for ${this.collectionName}:`, err);
      return [];
    }
  }

  private write(items: T[]) {
    try {
      const content = fs.readFileSync(FALLBACK_FILE_PATH, "utf-8");
      const data = JSON.parse(content);
      data[this.collectionName] = items;
      fs.writeFileSync(FALLBACK_FILE_PATH, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("Local DB write error:", e);
    }
  }

  async find(filter: any = {}): Promise<any> {
    let items = this.read();

    if (filter) {
      items = items.filter((item: any) => {
        // Handle $or operator
        if (filter.$or && Array.isArray(filter.$or)) {
          const orMatch = filter.$or.some((condition: any) => {
            // Each condition in $or is a set of fields that must all match (AND logic for that block)
            return Object.keys(condition).every(key => {
              const itemVal = item[key];
              const condVal = condition[key];
              return String(itemVal) === String(condVal);
            });
          });
          
          if (!orMatch) return false;
          
          // If $or matches, check other top-level filters (if any), excluding $or
          const otherFilters = Object.keys(filter).filter(k => k !== "$or");
          return otherFilters.every(key => {
            if (filter[key] === undefined) return true;
            return String(item[key]) === String(filter[key]);
          });
        }

        // Handle standard key-value filters
        return Object.keys(filter).every(key => {
          if (filter[key] === undefined) return true;
          return String(item[key]) === String(filter[key]);
        });
      });
    }

    // Return a mock cursor that supports toArray()
    return {
      toArray: async () => items,
      sort: () => ({ toArray: async () => items }) // Mock sort
    };
  }

  async findOne(filter: any): Promise<T | null> {
    const cursor = await this.find(filter);
    const items = await cursor.toArray();
    return items.length > 0 ? items[0] : null;
  }

  async insertOne(doc: Omit<T, "_id"> & { _id?: string }): Promise<{ insertedId: string }> {
    const items = this.read();
    const newId = doc._id || "id_" + Math.random().toString(36).substring(2, 11);
    const newDoc = { ...doc, _id: newId } as T;
    
    // Auto-calculate progress for goal insertion
    if (this.collectionName === "goals") {
      const goal = newDoc as any;
      goal.progress = goal.targetAmount > 0 
        ? Math.round((goal.currentAmount / goal.targetAmount) * 100) 
        : 0;
    }

    items.push(newDoc);
    this.write(items);
    return { insertedId: newId };
  }

  async updateOne(filter: any, update: any): Promise<{ modifiedCount: number; matchedCount: number }> {
    const items = this.read();
    const index = items.findIndex((item: any) => {
      return Object.keys(filter).every(key => {
        if (filter[key] === undefined) return true;
        return String(item[key]) === String(filter[key]);
      });
    });
    if (index === -1) return { modifiedCount: 0, matchedCount: 0 };

    const currentDoc = items[index];
    const setFields = update.$set || {};

    // Apply updates
    const updatedDoc = { ...currentDoc, ...setFields };

    // Auto-recalculate progress if it is a goal
    if (this.collectionName === "goals") {
      const goal = updatedDoc as any;
      goal.progress = goal.targetAmount > 0 
        ? Math.round((goal.currentAmount / goal.targetAmount) * 100) 
        : 0;
    }

    items[index] = updatedDoc;
    this.write(items);
    return { modifiedCount: 1, matchedCount: 1 };
  }

  async deleteOne(filter: any): Promise<{ deletedCount: number }> {
    const items = this.read();
    const index = items.findIndex((item: any) => {
      return Object.keys(filter).every(key => {
        if (filter[key] === undefined) return true;
        return String(item[key]) === String(filter[key]);
      });
    });
    
    if (index === -1) return { deletedCount: 0 };

    items.splice(index, 1);
    this.write(items);
    return { deletedCount: 1 };
  }

  async deleteMany(filter: any = {}): Promise<{ deletedCount: number }> {
    const items = this.read();
    const beforeLength = items.length;
    const remaining = items.filter((item: any) => {
      // AND logic: all filter keys must match for item to be deleted
      const isMatch = Object.keys(filter).every(key => {
        if (filter[key] === undefined) return true;
        return String(item[key]) === String(filter[key]);
      });
      return !isMatch; // Keep if NOT matching
    });
    this.write(remaining);
    return { deletedCount: beforeLength - remaining.length };
  }

  // Aggregation Framework simulation for student projects
  async aggregate(pipeline: any[]): Promise<any[]> {
    const items = this.read();
    
    // In our portfolio dashboard, we use simple metrics which we can aggregate manually
    if (this.collectionName === "transactions") {
      const result: any = {
        totalIncome: 0,
        totalExpense: 0,
        highestIncome: 0,
        highestExpense: 0,
        categories: {} as { [key: string]: number }
      };

      items.forEach((item: any) => {
        if (item.type === "income") {
          result.totalIncome += item.amount;
          if (item.amount > result.highestIncome) result.highestIncome = item.amount;
        } else if (item.type === "expense") {
          result.totalExpense += item.amount;
          if (item.amount > result.highestExpense) result.highestExpense = item.amount;
          
          // category distribution
          result.categories[item.category] = (result.categories[item.category] || 0) + item.amount;
        }
      });

      return [result];
    }
    
    return items;
  }
}

// Check for MongoDB Atlas Connection String
const MONGODB_URI = process.env.MONGODB_URI;

export async function connectToDatabase(): Promise<{
  db: Db | null;
  isFallback: boolean;
  users: any;
  transactions: any;
  goals: any;
  settings: any;
}> {
  if (MONGODB_URI) {
    try {
      if (!client) {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
      }
      dbInstance = client.db("financeflow");

      // Remove the old global settings seed as it's now per-user

      return {
        db: dbInstance,
        isFallback: false,
        users: dbInstance.collection("users"),
        transactions: dbInstance.collection("transactions"),
        goals: dbInstance.collection("goals"),
        settings: dbInstance.collection("settings")
      };
    } catch (err) {
      // Failed to connect to MongoDB Atlas cluster
    }
  } else {
    // No MONGODB_URI found
  }

  // Fallback driver mimicking standard Mongo collection functions
  return {
    db: null,
    isFallback: true,
    users: new LocalMongoCollection<UserDoc>("users"),
    transactions: new LocalMongoCollection<TransactionDoc>("transactions"),
    goals: new LocalMongoCollection<GoalDoc>("goals"),
    settings: new LocalMongoCollection<SettingsDoc>("settings")
  };
}
