import React, { useState, useEffect, useCallback } from "react";
import {
  getAllEmployees,
  deleteEmployee,
} from "../../../services/employeeService";
import { toast } from "react-toastify";

const IconTrash = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M3 7h18"
    />
  </svg>
);
const IconEdit = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);
const IconUserPlus = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
    />
  </svg>
);
const IconRefresh = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.8}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const VALID_PERMISSIONS = new Set([
  "product:read", "product:create", "product:update", "product:delete",
  "category:read", "category:create", "category:update", "category:delete",
  "order:read", "order:update", "order:cancel", "order:delete",
  "employee:read", "employee:create", "employee:update", "employee:delete",
  "admin:dashboard",
]);

const PERM_COLORS = {
  product: "bg-indigo-100 text-indigo-700",
  category: "bg-rose-100 text-rose-700",
  order: "bg-emerald-100 text-emerald-700",
  employee: "bg-amber-100 text-amber-800",
  admin: "bg-slate-200 text-slate-700",
};

const permColor = (perm) => {
  const ns = perm.split(":")[0];
  return PERM_COLORS[ns] || "bg-gray-100 text-gray-600";
};

const Avatar = ({ name }) => {
  const initials = (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
      {initials}
    </div>
  );
};

function ConfirmModal({ employee, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          Delete Employee
        </h3>
        <p className="text-sm text-gray-500 mb-5">
          Are you sure you want to remove{" "}
          <span className="font-semibold text-gray-800">{employee.name || employee.email}</span>?
          This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeList({ onAddNew, onEdit }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllEmployees();
      setEmployees(Array.isArray(data) ? data : data?.data || []);
    } catch {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteEmployee(toDelete.id);
      toast.success(`${toDelete.name || toDelete.email} removed`);
      setEmployees((prev) => prev.filter((e) => e.id !== toDelete.id));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete employee");
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {employees.length} employee{employees.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            <IconRefresh className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={onAddNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
          >
            <IconUserPlus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && employees.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <IconUserPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No employees yet</p>
          <p className="text-gray-400 text-sm mb-5">
            Add your first employee to get started
          </p>
          <button
            onClick={onAddNew}
            className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition"
          >
            Add Employee
          </button>
        </div>
      )}

      {/* Employee cards */}
      {!loading && employees.length > 0 && (
        <div className="grid gap-4">
          {employees.map((emp) => {
            const isExpanded = expandedId === emp.id;
            const perms = Array.from(emp.permissions || [])
              .filter((p) => VALID_PERMISSIONS.has(p))
              .sort();

            return (
              <div
                key={emp.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Card header */}
                <div className="flex items-center gap-4 p-5">
                  <Avatar name={emp.name || emp.email} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">
                        {emp.name || emp.email}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                        {emp.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {emp.email}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {perms.length} permission{perms.length !== 1 ? "s" : ""}
                      {emp.createdAt && (
                        <>
                          {" "}
                          · Joined{" "}
                          {new Date(emp.createdAt).toLocaleDateString()}
                        </>
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : emp.id)}
                      className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    >
                      {isExpanded ? "Hide" : "Permissions"}
                    </button>
                    <button
                      onClick={() => onEdit(emp)}
                      title="Edit permissions"
                      className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                    >
                      <IconEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setToDelete(emp)}
                      title="Delete employee"
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                    >
                      <IconTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded permissions */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Assigned Permissions
                    </p>
                    {perms.length === 0 ? (
                      <p className="text-sm text-gray-400">
                        No permissions assigned
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {perms.map((p) => (
                          <span
                            key={p}
                            className={`text-xs font-medium px-2.5 py-1 rounded-lg ${permColor(p)}`}
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirm */}
      {toDelete && (
        <ConfirmModal
          employee={toDelete}
          onConfirm={handleDelete}
          onCancel={() => !deleting && setToDelete(null)}
        />
      )}
    </div>
  );
}
