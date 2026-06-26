import React, { useRef, useState } from "react";
import { Download, Upload, RotateCcw, ShieldAlert, Check } from "lucide-react";
import { CURRENCIES } from "../data/initialData";

interface SettingsViewProps {
  settings: {
    fullName: string;
    username: string;
    email: string;
    profileImage: string;
    currency: string;
    monthlySalary: number;
    monthlyBudget: number;
    monthlySavingGoal: number;
  };
  onUpdateSettings: (updates: Partial<SettingsViewProps["settings"]>) => void;
  onResetData: () => void;
  onExportData: () => void;
  onImportData: (importedData: any) => Promise<boolean> | boolean;
}

export default function SettingsView({
  settings,
  onUpdateSettings,
  onResetData,
  onExportData,
  onImportData,
}: SettingsViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState(settings);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  const [profileSaved, setProfileSaved] = useState(false);

  // Sync internal form state when settings prop changes (e.g. after sync)
  React.useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Profile update submit
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...formData,
      monthlySalary: Number(formData.monthlySalary),
      monthlyBudget: Number(formData.monthlyBudget),
      monthlySavingGoal: Number(formData.monthlySavingGoal)
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  // Trigger JSON file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Handle file upload import
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        
        const success = await onImportData(parsed);
        if (success) {
          setImportStatus("success");
          setTimeout(() => setImportStatus("idle"), 3000);
        } else {
          setImportStatus("error");
          setTimeout(() => setImportStatus("idle"), 3000);
        }
      } catch (err) {
        setImportStatus("error");
        setTimeout(() => setImportStatus("idle"), 3000);
      }
    };
    reader.readAsText(file);
    // clear input value to allow re-upload
    e.target.value = "";
  };

  const currencySymbol = CURRENCIES.find((c) => c.code === formData.currency)?.symbol || "$";

  return (
    <div className="settings-container">
      {/* Profile Section */}
      <div className="settings-card">
        <h4 className="settings-section-title">Account Profile</h4>
        <p className="setting-desc-block">Manage your identity and financial baseline.</p>

        <form onSubmit={handleProfileSave} className="flex flex-col gap-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="text-xs uppercase font-black mb-1 block">Full Name</label>
              <input
                type="text"
                name="fullName"
                className="brutal-input w-full"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="text-xs uppercase font-black mb-1 block">Username</label>
              <input
                type="text"
                name="username"
                className="brutal-input w-full"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="text-xs uppercase font-black mb-1 block">Email</label>
              <input
                type="email"
                name="email"
                className="brutal-input w-full"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="text-xs uppercase font-black mb-1 block">Profile Image URL</label>
              <input
                type="text"
                name="profileImage"
                className="brutal-input w-full"
                value={formData.profileImage}
                onChange={handleChange}
                placeholder="https://..."
              />
            </div>
          </div>

          <h5 className="font-bold uppercase mt-4 mb-2 border-b-2 border-black pb-1">Financial Setup</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="text-xs uppercase font-black mb-1 block">Default Currency</label>
              <select
                name="currency"
                className="brutal-input w-full bg-white"
                value={formData.currency}
                onChange={handleChange}
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} ({curr.symbol})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="text-xs uppercase font-black mb-1 block">Monthly Salary ({currencySymbol})</label>
              <input
                type="number"
                name="monthlySalary"
                className="brutal-input w-full"
                value={formData.monthlySalary}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="text-xs uppercase font-black mb-1 block">Monthly Budget ({currencySymbol})</label>
              <input
                type="number"
                name="monthlyBudget"
                className="brutal-input w-full"
                value={formData.monthlyBudget}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="text-xs uppercase font-black mb-1 block">Monthly Saving Goal ({currencySymbol})</label>
              <input
                type="number"
                name="monthlySavingGoal"
                className="brutal-input w-full"
                value={formData.monthlySavingGoal}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>

          <button type="submit" className="btn-secondary w-full mt-4 justify-center py-4">
            {profileSaved ? <><Check size={16} /> Saved Successfully</> : "Save Profile & Financials"}
          </button>
        </form>
      </div>

      {/* Backup and Portability */}
      <div className="settings-card">
        <h4 className="settings-section-title">Data Backup & Recovery</h4>
        <p className="setting-desc-block">
          Export all transaction records, budget configurations, and savings targets as a JSON backup file to keep safe.
        </p>
        
        {importStatus === "success" && (
          <div className="import-success-box">Data imported successfully! Dashboard reloaded.</div>
        )}
        {importStatus === "error" && (
          <div className="import-error-box">Invalid backup file format. Import failed!</div>
        )}

        <div className="setting-row-actions">
          <button className="btn-secondary" onClick={onExportData}>
            <Download size={16} /> Export JSON Data
          </button>
          
          <button className="btn-secondary" onClick={triggerFileInput}>
            <Upload size={16} /> Import JSON Data
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFileChange}
            accept=".json"
            style={{ display: "none" }}
          />
        </div>
      </div>

      {/* Extreme Danger Zone */}
      <div className="settings-card danger-zone">
        <h4 className="settings-section-title">Extreme Danger Zone</h4>
        <div className="danger-zone-details">
          <ShieldAlert size={28} className="danger-icon" />
          <p className="danger-desc">
            Resetting your data will permanently erase your local cache containing all transactions, savings targets, and preferences. This action is irreversible.
          </p>
        </div>
        <div className="setting-row-actions">
          <button className="btn-danger" onClick={onResetData}>
            <RotateCcw size={16} /> Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
}
