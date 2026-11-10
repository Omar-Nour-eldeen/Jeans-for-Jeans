import React, { useState } from "react";
import { addEmployee, updateEmployeePermissions } from "../../../services/employeeService";
import { toast } from "react-toastify";

// ── All real permission groups (matching actual system capabilities) ────────
const PERM_GROUPS = [
  {
    group: "Products",
    color: "indigo",
    perms: ["product:read", "product:create", "product:update", "product:delete"],
  },
  {
    group: "Categories",
    color: "rose",
    perms: ["category:read", "category:create", "category:update", "category:delete"],
  },
  {
    group: "Orders",
    color: "emerald",
    perms: ["order:read", "order:update", "order:cancel", "order:delete"],
  },
  {
    group: "Employees",
    color: "amber",
    perms: ["employee:read", "employee:create", "employee:update", "employee:delete"],
  },
  {
    group: "Dashboard",
    color: "slate",
    perms: ["admin:dashboard"],
  },
];

const PERM_LABELS = {
  "product:read": "View products catalog and stock",
  "product:create": "Create new products & variants",
  "product:update": "Edit products, prices & images",
  "product:delete": "Delete products",
  "category:read": "View category list",
  "category:create": "Create new categories",
  "category:update": "Edit category details",
  "category:delete": "Delete categories",
  "order:read": "View incoming & past orders",
  "order:update": "Update order status & shipping",
  "order:cancel": "Cancel orders",
  "order:delete": "Delete orders",
  "employee:read": "View employee list",
  "employee:create": "Add new employees",
  "employee:update": "Edit employee permissions",
  "employee:delete": "Delete employees",
  "admin:dashboard": "View overview analytics & stats",
};

const COLOR_CLASSES = {
  indigo: { ring: "ring-indigo-500", badge: "bg-indigo-100 text-indigo-700", check: "accent-indigo-600", header: "bg-indigo-50 text-indigo-700 border-indigo-100" },
  rose: { ring: "ring-rose-500", badge: "bg-rose-100 text-rose-700", check: "accent-rose-600", header: "bg-rose-50 text-rose-700 border-rose-100" },
  emerald: { ring: "ring-emerald-500", badge: "bg-emerald-100 text-emerald-700", check: "accent-emerald-600", header: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  amber: { ring: "ring-amber-500", badge: "bg-amber-100 text-amber-800", check: "accent-amber-600", header: "bg-amber-50 text-amber-800 border-amber-100" },
  slate: { ring: "ring-slate-500", badge: "bg-slate-200 text-slate-700", check: "accent-slate-600", header: "bg-slate-100 text-slate-700 border-slate-200" },
};

// ── Input field ────────────────────────────────────────────────────────────
function Field({ label, type = "text", value, onChange, placeholder, error, required, disabled }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition
          ${disabled ? "bg-gray-100 text-gray-600 border-gray-200 cursor-not-allowed select-none" : "bg-white"}
          ${error
            ? "border-red-400 ring-1 ring-red-400 bg-red-50"
            : disabled
            ? "border-gray-200"
            : "border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

// ── Permission group checkbox panel ───────────────────────────────────────
function PermGroup({ group, color, perms, selected, onToggle, onToggleAll }) {
  const c = COLOR_CLASSES[color] || COLOR_CLASSES.slate;
  const allChecked = perms.every((p) => selected.has(p));
  const someChecked = perms.some((p) => selected.has(p));

  return (
    <div className={`rounded-xl border overflow-hidden`}>
      {/* Group header */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-b ${c.header}`}>
        <span className="text-xs font-bold uppercase tracking-wider">{group}</span>
        <button
          type="button"
          onClick={() => onToggleAll(perms, !allChecked)}
          className="text-xs font-semibold underline underline-offset-2 opacity-70 hover:opacity-100 transition"
        >
          {allChecked ? "Deselect all" : someChecked ? "Select all" : "Select all"}
        </button>
      </div>
      {/* Permissions */}
      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-white">
        {perms.map((p) => (
          <label
            key={p}
            className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition
              ${selected.has(p)
                ? `${c.badge} ring-1 ${c.ring} border-transparent shadow-xs`
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/60"
              }`}
          >
            <input
              type="checkbox"
              checked={selected.has(p)}
              onChange={() => onToggle(p)}
              className={`rounded mt-0.5 ${c.check}`}
            />
            <div className="min-w-0 flex-1">
              <span className="text-xs font-semibold block">{p}</span>
              <span className="text-[11px] text-gray-500 block leading-tight mt-0.5">
                {PERM_LABELS[p] || ""}
              </span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

// ── Main Form ──────────────────────────────────────────────────────────────
export default function EmployeeForm({ employee, onDone, onCancel }) {
  const isEdit = !!employee;
  const validPermsSet = new Set(PERM_GROUPS.flatMap((g) => g.perms));

  const [name,     setName]     = useState(
    employee?.name || (employee?.email ? employee.email.split("@")[0] : "")
  );
  const [email,    setEmail]    = useState(employee?.email    || "");
  const [password, setPassword] = useState("");
  const [selected, setSelected] = useState(() => {
    const raw = employee?.permissions || [];
    return new Set(Array.from(raw).filter((p) => validPermsSet.has(p)));
  });
  const [errors,   setErrors]   = useState({});
  const [saving,   setSaving]   = useState(false);

  // validate
  const validate = () => {
    const e = {};
    if (!isEdit) {
      if (!name.trim()) e.name = "Name is required";
      if (!email.trim()) e.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
      if (password.length < 8) e.password = "Password must be at least 8 characters";
    }
    if (selected.size === 0) e.permissions = "Select at least one permission";
    return e;
  };

  const togglePerm = (perm) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(perm) ? next.delete(perm) : next.add(perm);
      return next;
    });

  const toggleAll = (perms, add) =>
    setSelected((prev) => {
      const next = new Set(prev);
      perms.forEach((p) => (add ? next.add(p) : next.delete(p)));
      return next;
    });

  const selectAll  = () => setSelected(new Set(PERM_GROUPS.flatMap((g) => g.perms)));
  const clearAll   = () => setSelected(new Set());

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setSaving(true);

    try {
      if (isEdit) {
        await updateEmployeePermissions(employee.id, Array.from(selected));
        localStorage.setItem("app:permissions_updated", Date.now().toString());
        toast.success("Permissions updated");
      } else {
        await addEmployee({
          name,
          email,
          password,
          role: "EMPLOYEE",
          permissions: Array.from(selected),
        });
        toast.success("Employee added successfully");
      }
      onDone();
    } catch (err) {
      const msg = err?.response?.data?.message || (isEdit ? "Failed to update" : "Failed to add employee");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onCancel}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? "Edit Employee Permissions" : "Add New Employee"}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {isEdit ? `Updating permissions for ${employee.name || employee.email}` : "Create a new employee account with specific permissions"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: form fields */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Account Details</h2>

            <Field
              label="Full Name"
              value={name}
              onChange={setName}
              placeholder="John Doe"
              error={errors.name}
              required={!isEdit}
              disabled={isEdit}
            />
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="john@company.com"
              error={errors.email}
              required={!isEdit}
              disabled={isEdit}
            />
            {!isEdit && (
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Min. 8 characters"
                error={errors.password}
                required
              />
            )}

            {isEdit && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-start gap-2">
                <span>🔒</span>
                <span>Name and email are fixed and cannot be changed here. Only permissions can be updated.</span>
              </div>
            )}
          </div>

          {/* Selected count summary */}
          <div className="bg-indigo-600 rounded-2xl p-5 text-white shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-300 mb-1">Selected</p>
            <p className="text-4xl font-black">{selected.size}</p>
            <p className="text-indigo-300 text-sm">permission{selected.size !== 1 ? "s" : ""} assigned</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={selectAll}
                className="flex-1 text-xs py-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition font-medium">
                Select All
              </button>
              <button type="button" onClick={clearAll}
                className="flex-1 text-xs py-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition font-medium">
                Clear All
              </button>
            </div>
          </div>

          {errors.permissions && (
            <p className="text-xs text-red-500">{errors.permissions}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition shadow-sm"
            >
              {saving ? "Saving…" : isEdit ? "Update Permissions" : "Add Employee"}
            </button>
          </div>
        </div>

        {/* Right: permission groups */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Permissions</h2>
            <span className="text-xs text-gray-400">{selected.size} / {PERM_GROUPS.flatMap(g=>g.perms).length} selected</span>
          </div>
          {PERM_GROUPS.map(({ group, color, perms }) => (
            <PermGroup
              key={group}
              group={group}
              color={color}
              perms={perms}
              selected={selected}
              onToggle={togglePerm}
              onToggleAll={toggleAll}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
