import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Goal } from "../data/initialData";
import { Plus, Trash2, Edit2, X, PiggyBank, DollarSign } from "lucide-react";

interface GoalsViewProps {
  goals: Goal[];
  onAddGoal: (goal: Omit<Goal, "id">) => void;
  onUpdateGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
  currencySymbol: string;
}

export default function GoalsView({
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  currencySymbol,
}: GoalsViewProps) {
  // Goal Modals State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Goal Form Fields
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalCurrent, setGoalCurrent] = useState("");
  const [goalError, setGoalError] = useState("");

  // Manage Money Overlay Modal State (Add/Withdraw cash to goal)
  const [isMoneyModalOpen, setIsMoneyModalOpen] = useState(false);
  const [moneyGoal, setMoneyGoal] = useState<Goal | null>(null);
  const [moneyAction, setMoneyAction] = useState<"add" | "withdraw">("add");
  const [moneyAmount, setMoneyAmount] = useState("");
  const [moneyError, setMoneyError] = useState("");

  const openAddGoalModal = () => {
    setEditingGoal(null);
    setGoalName("");
    setGoalTarget("");
    setGoalCurrent("0");
    setGoalError("");
    setIsGoalModalOpen(true);
  };

  const openEditGoalModal = (g: Goal) => {
    setEditingGoal(g);
    setGoalName(g.name);
    setGoalTarget(g.targetAmount.toString());
    setGoalCurrent(g.currentAmount.toString());
    setGoalError("");
    setIsGoalModalOpen(true);
  };

  const openMoneyModal = (g: Goal, action: "add" | "withdraw") => {
    setMoneyGoal(g);
    setMoneyAction(action);
    setMoneyAmount("");
    setMoneyError("");
    setIsMoneyModalOpen(true);
  };

  // Submit Add/Edit Goal Form
  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim()) {
      setGoalError("Goal name is required!");
      return;
    }
    const targetNum = parseFloat(goalTarget);
    const currentNum = parseFloat(goalCurrent);

    if (isNaN(targetNum) || targetNum <= 0) {
      setGoalError("Target amount must be a positive number!");
      return;
    }
    if (isNaN(currentNum) || currentNum < 0) {
      setGoalError("Current amount must be 0 or more!");
      return;
    }

    const goalData = {
      name: goalName.trim(),
      targetAmount: targetNum,
      currentAmount: currentNum,
    };

    if (editingGoal) {
      onUpdateGoal({ ...goalData, id: editingGoal.id });
    } else {
      onAddGoal(goalData);
    }
    setIsGoalModalOpen(false);
  };

  // Submit Add / Withdraw Money
  const handleMoneySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moneyGoal) return;

    const amt = parseFloat(moneyAmount);
    if (isNaN(amt) || amt <= 0) {
      setMoneyError("Please enter a valid positive amount!");
      return;
    }

    let newCurrent = moneyGoal.currentAmount;
    if (moneyAction === "add") {
      newCurrent += amt;
    } else {
      if (amt > moneyGoal.currentAmount) {
        setMoneyError("Cannot withdraw more than current progress!");
        return;
      }
      newCurrent -= amt;
    }

    onUpdateGoal({
      ...moneyGoal,
      currentAmount: Number(newCurrent.toFixed(2)),
    });
    setIsMoneyModalOpen(false);
  };

  return (
    <div className="goals-container">
      {/* Top Banner & Action */}
      <div className="toolbar">
        <h3 className="section-title">Active Savings Targets</h3>
        <button className="btn-primary ml-auto" onClick={openAddGoalModal}>
          <Plus size={16} /> Create Goal
        </button>
      </div>

      {/* Goal Cards Grid */}
      {goals.length > 0 ? (
        <div className="goals-grid">
          {goals.map((g) => {
            const percentage = Math.min(
              Math.round((g.currentAmount / g.targetAmount) * 100),
              100
            );
            const remaining = Math.max(0, g.targetAmount - g.currentAmount);

            return (
              <motion.div
                key={g.id}
                className="goal-card"
                whileHover={{ y: -3, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="goal-card-header">
                  <div className="goal-icon-box">
                    <PiggyBank size={20} />
                  </div>
                  <div className="goal-card-actions">
                    <button className="goal-edit-btn" onClick={() => openEditGoalModal(g)}>
                      <Edit2 size={12} />
                    </button>
                    <button className="goal-delete-btn" onClick={() => onDeleteGoal(g.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div className="goal-card-body">
                  <h4 className="goal-title">{g.name}</h4>
                  
                  <div className="goal-amounts">
                    <span className="goal-current">
                      {currencySymbol}
                      {g.currentAmount.toLocaleString()}
                    </span>
                    <span className="goal-target">
                      of {currencySymbol}
                      {g.targetAmount.toLocaleString()}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="goal-progress-bar-container large">
                    <motion.div
                      className="goal-progress-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                    <span className="goal-percentage-label">{percentage}%</span>
                  </div>

                  <p className="goal-remaining-text">
                    {remaining > 0 ? (
                      <>
                        <strong>{currencySymbol}{remaining.toLocaleString()}</strong> remaining
                      </>
                    ) : (
                      <span className="goal-completed-badge">Goal Reached! 🎉</span>
                    )}
                  </p>
                </div>

                {/* Quick Add / Deduct controllers */}
                <div className="goal-money-actions">
                  <button className="btn-money-action add" onClick={() => openMoneyModal(g, "add")}>
                    Add Money
                  </button>
                  <button
                    className="btn-money-action withdraw"
                    disabled={g.currentAmount <= 0}
                    onClick={() => openMoneyModal(g, "withdraw")}
                  >
                    Withdraw
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="table-card">
          <div className="placeholder-container py-12 flex flex-col items-center text-center">
            <p className="placeholder-text mb-6">No goals yet.</p>
            <button className="btn-primary" onClick={openAddGoalModal}>
              <Plus size={16} /> Create your first goal
            </button>
          </div>
        </div>
      )}

      {/* Goal Add/Edit Modal */}
      <AnimatePresence>
        {isGoalModalOpen && (
          <div className="modal-overlay">
            <motion.div
              className="brutal-modal"
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
            >
              <div className="modal-header">
                <h3>{editingGoal ? "Edit Goal" : "New Savings Goal"}</h3>
                <button className="close-btn" onClick={() => setIsGoalModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleGoalSubmit} className="brutal-form">
                {goalError && <div className="form-error-msg">{goalError}</div>}

                <div className="form-group">
                  <label>Goal Name</label>
                  <input
                    type="text"
                    className="brutal-input"
                    placeholder="e.g. New Laptop, Vacation fund"
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                  />
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>Target Amount ({currencySymbol})</label>
                    <input
                      type="number"
                      step="0.01"
                      className="brutal-input"
                      placeholder="0.00"
                      value={goalTarget}
                      onChange={(e) => setGoalTarget(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Starting Progress ({currencySymbol})</label>
                    <input
                      type="number"
                      step="0.01"
                      className="brutal-input"
                      placeholder="0.00"
                      value={goalCurrent}
                      onChange={(e) => setGoalCurrent(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary w-full justify-center text-center mt-4">
                  {editingGoal ? "Save Goal" : "Create Goal"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manage Money (Add/Withdraw) Modal */}
      <AnimatePresence>
        {isMoneyModalOpen && (
          <div className="modal-overlay">
            <motion.div
              className="brutal-modal mini"
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
            >
              <div className="modal-header">
                <h3>
                  {moneyAction === "add" ? "Deposit to" : "Withdraw from"} {moneyGoal?.name}
                </h3>
                <button className="close-btn" onClick={() => setIsMoneyModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleMoneySubmit} className="brutal-form">
                {moneyError && <div className="form-error-msg">{moneyError}</div>}

                <div className="form-group">
                  <label>Enter Amount ({currencySymbol})</label>
                  <div className="input-with-icon">
                    <DollarSign size={16} className="input-prefix-icon" />
                    <input
                      type="number"
                      step="0.01"
                      className="brutal-input icon-padded"
                      placeholder="0.00"
                      value={moneyAmount}
                      onChange={(e) => setMoneyAmount(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`btn-primary w-full justify-center text-center mt-4 ${
                    moneyAction === "withdraw" ? "btn-danger" : ""
                  }`}
                >
                  {moneyAction === "add" ? "Confirm Deposit" : "Confirm Withdrawal"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
