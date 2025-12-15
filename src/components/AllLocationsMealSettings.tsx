import { useState, useEffect } from "react";
import { Settings, Save, Power, PowerOff, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { API_BASE } from "../lib/api";

interface DormLocationSetting {
  id: number;
  name: string;
  allowCombinedMealScan: boolean;
  isActive: boolean;
}

export default function AllLocationsMealSettings() {
  const [locations, setLocations] = useState<DormLocationSetting[]>([]);
  
const dormLocationMap: Record<number, string> = {
  1: "مدينة طلبة العباسية",
  2: "مدينة طالبات مصر الجديدة",
  3: "مدينة نصر 1",
  4: "مدينة نصر 2",
  5: "زراعة أ",
  6: "زراعة ب",
  7: "الزيتون",
};

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkAction, setBulkAction] = useState<"enable" | "disable" | null>(
    null
  );

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/Meals/all-locations-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("فشل في تحميل الإعدادات");
      const data = await res.json();
      setLocations(data.dormLocations || []);
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء تحميل الإعدادات");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLocation = async (
    locationId: number,
    newValue: boolean
  ) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/Meals/location-setting`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dormLocationId: locationId,
          allowCombinedMealScan: newValue,
        }),
      });

      if (!res.ok) throw new Error("فشل في تحديث الإعدادات");

      setLocations((prev) =>
        prev.map((loc) =>
          loc.id === locationId
            ? { ...loc, allowCombinedMealScan: newValue }
            : loc
        )
      );

      toast.success("تم تحديث إعدادات الموقع بنجاح");
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء تحديث الإعدادات");
    }
  };

  const handleBulkUpdate = async (enable: boolean) => {
    setBulkAction(enable ? "enable" : "disable");
    setShowBulkConfirm(true);
  };

  const confirmBulkUpdate = async () => {
    if (!bulkAction) return;

    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/Meals/bulk-update-all`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          allowCombinedMealScan: bulkAction === "enable",
        }),
      });

      if (!res.ok) throw new Error("فشل في تحديث الإعدادات");

      setLocations((prev) =>
        prev.map((loc) =>
          loc.isActive
            ? { ...loc, allowCombinedMealScan: bulkAction === "enable" }
            : loc
        )
      );

      toast.success("تم تحديث جميع المواقع بنجاح");
      setShowBulkConfirm(false);
      setBulkAction(null);
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء تحديث الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">جاري التحميل...</div>
      </div>
    );
  }

  const activeLocations = locations.filter((l) => l.isActive);
  const enabledCount = activeLocations.filter(
    (l) => l.allowCombinedMealScan
  ).length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          إعدادات الوجبات لجميع المواقع
        </h1>
        <p className="text-gray-600 mt-1">
          تحكم في نظام المسح الضوئي لجميع مواقع السكن الجامعي
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-gray-600">إجمالي المواقع</p>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {activeLocations.length}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-600/15 rounded-lg">
              <Power className="w-6 h-6 text-green-600" />
            </div>

            <p className="text-gray-600">المسح المجمع مفعّل</p>
          </div>
          <p className="text-3xl font-bold text-green-600">{enabledCount}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gray-100 rounded-lg">
              <PowerOff className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-gray-600">المسح المجمع معطّل</p>
          </div>
          <p className="text-3xl font-bold text-gray-600">
            {activeLocations.length - enabledCount}
          </p>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">إجراءات جماعية</h2>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => handleBulkUpdate(true)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            <Power className="w-5 h-5" />
            تفعيل المسح المجمع لجميع المواقع
          </button>
          <button
            onClick={() => handleBulkUpdate(false)}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
          >
            <PowerOff className="w-5 h-5" />
            تعطيل المسح المجمع لجميع المواقع
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-bold text-blue-900 mb-2">
              كيف يعمل النظام؟
            </h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>
                • <strong>المسح المجمع مفعّل:</strong> موظف المطعم يرى خيار واحد
                "مسح الوجبة" (يسجل الإفطار/العشاء + الغداء معاً)
              </li>
              <li>
                • <strong>المسح المجمع معطّل:</strong> موظف المطعم يرى خيارين
                منفصلين (الإفطار/العشاء + الغداء)
              </li>
              <li>• التغييرات تؤثر فوراً على واجهة موظفي المطعم</li>
              <li>• المسح المجمع يعمل فقط خلال وقت الغداء (1:00 م - 9:00 م)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((location) => (
          <div
            key={location.id}
            className={`bg-white rounded-lg shadow-lg border-2 transition-all ${
              location.allowCombinedMealScan
                ? "border-green-300"
                : "border-gray-200"
            } ${!location.isActive ? "opacity-50" : ""}`}
          >
            <div
              className={`p-4 rounded-t-lg ${
                location.allowCombinedMealScan
                  ? "bg-gradient-to-r from-green-500 to-emerald-500"
                  : "bg-gradient-to-r from-gray-500 to-gray-600"
              }`}
            >
              <h3 className="text-lg font-bold text-white">
                {dormLocationMap[location.id] || location.name}
              </h3>{" "}
              <p className="text-white/80 text-sm">موقع رقم {location.id}</p>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    حالة المسح المجمع
                  </p>
                  <p
                    className={`text-lg font-bold ${
                      location.allowCombinedMealScan
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}
                  >
                    {location.allowCombinedMealScan ? "مفعّل" : "معطّل"}
                  </p>
                </div>

                {location.isActive && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleLocation(location.id, false)}
                      disabled={!location.allowCombinedMealScan}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        !location.allowCombinedMealScan
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800"
                      }`}
                    >
                      تعطيل
                    </button>
                    <button
                      onClick={() => handleToggleLocation(location.id, true)}
                      disabled={location.allowCombinedMealScan}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        location.allowCombinedMealScan
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800"
                      }`}
                    >
                      تفعيل
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-900 font-semibold mb-1">
                    الحالة الحالية:
                  </p>
                  <p className="text-xs text-blue-800">
                    {location.allowCombinedMealScan
                      ? "موظف المطعم يرى: خيار واحد (مسح الوجبة)"
                      : "موظف المطعم يرى: خيارين (إفطار/عشاء + غداء)"}
                  </p>
                </div>

                {!location.isActive && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs text-red-800 font-semibold">
                      هذا الموقع غير نشط
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bulk Confirmation Modal */}
      {showBulkConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full" dir="rtl">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    bulkAction === "enable" ? "bg-green-100" : "bg-red-100"
                  }`}
                >
                  <AlertTriangle
                    className={`w-6 h-6 ${
                      bulkAction === "enable"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  تأكيد العملية
                </h2>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4">
                {bulkAction === "enable"
                  ? "هل أنت متأكد من تفعيل المسح المجمع لجميع المواقع النشطة؟"
                  : "هل أنت متأكد من تعطيل المسح المجمع لجميع المواقع النشطة؟"}
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>تنبيه:</strong> سيؤثر هذا التغيير على جميع موظفي
                  المطعم في {activeLocations.length} موقع نشط.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowBulkConfirm(false);
                    setBulkAction(null);
                  }}
                  disabled={saving}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmBulkUpdate}
                  disabled={saving}
                  className={`flex-1 px-4 py-3 text-white rounded-lg transition-colors font-semibold ${
                    bulkAction === "enable"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {saving ? "جاري التحديث..." : "تأكيد"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
