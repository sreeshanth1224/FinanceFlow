import { motion } from "motion/react";

interface StatCardProps {
  label: string;
  value: string | number;
  type?: "default" | "income" | "expense" | "savings";
}

export default function StatCard({ label, value, type = "default" }: StatCardProps) {
  return (
    <motion.div
      className={`stat-card ${type}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, rotate: -0.5, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      <p className="stat-label">{label}</p>
      <h3 className="stat-value">{value}</h3>
    </motion.div>
  );
}
