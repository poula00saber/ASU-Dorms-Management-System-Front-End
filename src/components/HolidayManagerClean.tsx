// Legacy alias. Redirects to the final implementation.
// Legacy alias: re-export to final implementation.
export { default } from "./HolidayManagerFinal";
/*
// HolidayManagerClean removed — canonical HolidayManager is in `HolidayManagerFinal.tsx`.
// @ts-nocheck
export { default } from "./HolidayManagerFinal";
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/Holidays`);
        if (!res.ok) throw new Error(await res.text());
        const data: Holiday[] = await res.json();
        setHolidays(data || []);
      } catch (err: any) {
        setError(err?.message || "Failed to load holidays");
        toast.error(err?.message || "Failed to load holidays");
      } finally {
        setLoading(false);
      }
    })();
  // Cleanup: no runtime logic in this file, re-export routes to final implementation.
  // (Old implementation moved to `HolidayManagerFinal.tsx`.)


  const getStatusBadge = (status: Holiday["status"]) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      approved: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
    };
    return styles[status] ?? "";
  };

  const prettyStatus = (s: Holiday["status"]) =>
    s.charAt(0).toUpperCase() + s.slice(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, status: "pending" };
      const res = await fetch(`${API_BASE}/api/Holidays`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      const created: Holiday = await res.json();
      setHolidays((prev) => [created, ...prev]);
      toast.success("Holiday request added");
      setShowModal(false);
      setFormData({
        studentId: "",
        studentName: "",
        startDate: "",
        endDate: "",
        reason: "",
      });
    } catch (err: any) {
      setError(err?.message || "Failed to create holiday");
      toast.error(err?.message || "Failed to create holiday");
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!confirm("Delete this request?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/Holidays/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      setHolidays((prev) => prev.filter((h) => h.id !== id));
      toast.success("Deleted");
    } catch (err: any) {
      setError(err?.message || "Failed to delete");
      toast.error(err?.message || "Failed to delete");
    }
  };

  const handleSetStatus = async (
    id: number | string,
    status: Holiday["status"]
  ) => {
    setHolidays((prev) =>
      prev.map((h) => (h.id === id ? { ...h, status } : h))
    );
    try {
      const res = await fetch(`${API_BASE}/api/Holidays/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(`Status: ${prettyStatus(status)}`);
    } catch (err: any) {
      setHolidays((prev) =>
        prev.map((h) => (h.id === id ? { ...h, status: "pending" } : h))
      );
      setError(err?.message || "Failed to update status");
      toast.error(err?.message || "Failed to update status");
    }
  };

  const studentsOnHoliday = holidays.filter((h) => {
    if (h.status !== "approved") return false;
    const today = new Date();
    const start = new Date(h.startDate);
    const end = new Date(h.endDate);
    return start <= today && end >= today;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-gray-900">Holiday Management</h1>
          <p className="text-gray-600 mt-1">Manage student holiday requests</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          <Plus className="w-5 h-5" /> Add Holiday Request
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 mb-2">Pending Requests</p>
          <p className="text-gray-900">
            {holidays.filter((h) => h.status === "pending").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 mb-2">Approved Requests</p>
          <p className="text-gray-900">
            {holidays.filter((h) => h.status === "approved").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 mb-2">Students on Holiday</p>
          <p className="text-gray-900">{studentsOnHoliday}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-gray-900">Holiday Requests</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading…</div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">{error}</div>
          ) : holidays.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No holiday requests found
            </div>
          ) : (
            holidays.map((holiday) => (
              <div key={holiday.id} className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                        {holiday.studentName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="text-gray-900">{holiday.studentName}</p>
                        <p className="text-gray-600 text-sm">
                          {holiday.studentId}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Calendar className="w-4 h-4" />{" "}
                        <span>From: {holiday.startDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <Calendar className="w-4 h-4" />{" "}
                        <span>To: {holiday.endDate}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 mt-2">
                      <span className="text-gray-600">Reason:</span>{" "}
                      {holiday.reason}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded text-sm ${getStatusBadge(
                        holiday.status
                      )}`}
                    >
                      {prettyStatus(holiday.status)}
                    </span>
                    {holiday.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <button
                          title="Approve"
                          onClick={() =>
                            handleSetStatus(holiday.id, "approved")
                          }
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          title="Reject"
                          onClick={() =>
                            handleSetStatus(holiday.id, "rejected")
                          }
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                    <button
                      title="Delete"
                      onClick={() => handleDelete(holiday.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-gray-900">Add Holiday Request</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="studentId" className="block text-gray-700 mb-2">
                  Student ID *
                </label>
                <input
                  id="studentId"
                  type="text"
                  value={formData.studentId}
                  onChange={(e) =>
                    setFormData({ ...formData, studentId: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="STU001234"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="studentName"
                  className="block text-gray-700 mb-2"
                >
                  Student Name *
                </label>
                <input
                  id="studentName"
                  type="text"
                  value={formData.studentName}
                  onChange={(e) =>
                    setFormData({ ...formData, studentName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ahmed Hassan"
                  required
                />
              </div>
              <div>
                <label htmlFor="startDate" className="block text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="reason" className="block text-gray-700 mb-2">
                  Reason *
                </label>
                <input
                  id="reason"
                  type="text"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Family visit, Medical, etc."
                  required
                />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
*/
