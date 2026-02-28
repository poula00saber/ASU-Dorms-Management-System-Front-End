import { useState, useEffect } from "react";
import {
  Settings,
  Save,
  Power,
  PowerOff,
  AlertTriangle,
  Clock,
  DollarSign,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { fetchAPI } from "../lib/api"; // ✅ Changed to fetchAPI

interface DormLocationSetting {
  id: number;
  name: string;
  allowCombinedMealScan: boolean;
  isActive: boolean;
  breakfastDinnerStartTime?: string;
  breakfastDinnerEndTime?: string;
  lunchStartTime?: string;
  lunchEndTime?: string;
  missedMealFeeAmount?: number;
}

// Visual Time Picker Component
interface TimePickerProps {
  value: string; // "HH:MM" format
  onChange: (value: string) => void;
  label: string;
}

function VisualTimePicker({ value, onChange, label }: TimePickerProps) {
  const [hour, setHour] = useState(0);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<"AM" | "PM">("AM");

  useEffect(() => {
    const parts = value.split(":");
    if (parts.length >= 2) {
      let h = parseInt(parts[0]);
      const m = parseInt(parts[1]);

      // Convert 24-hour to 12-hour
      const isPM = h >= 12;
      const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;

      setHour(displayHour);
      setMinute(m);
      setPeriod(isPM ? "PM" : "AM");
    }
  }, [value]);

  // Update parent when any part changes
  useEffect(() => {
    // Convert 12-hour back to 24-hour
    let h24 = period === "AM" ? hour : hour + 12;
    if (hour === 12) {
      h24 = period === "AM" ? 0 : 12;
    }

    const timeStr = `${h24.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
    onChange(timeStr);
  }, [hour, minute, period]);

  const incrementHour = () => {
    setHour((h) => (h === 12 ? 1 : h + 1));
  };

  const decrementHour = () => {
    setHour((h) => (h === 1 ? 12 : h - 1));
  };

  const incrementMinute = () => {
    setMinute((m) => (m === 59 ? 0 : m + 1));
  };

  const decrementMinute = () => {
    setMinute((m) => (m === 0 ? 59 : m - 1));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        {/* Time Display */}
        <div className="flex items-center justify-center gap-4 mb-4 bg-white rounded-lg p-4 border-2 border-blue-300">
          {/* Hour Picker */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={incrementHour}
              className="p-1 hover:bg-blue-100 rounded transition-colors"
              type="button"
            >
              <ChevronUp className="w-5 h-5 text-blue-600" />
            </button>
            <div className="text-3xl font-bold text-blue-600 w-16 text-center">
              {hour.toString().padStart(2, "0")}
            </div>
            <button
              onClick={decrementHour}
              className="p-1 hover:bg-blue-100 rounded transition-colors"
              type="button"
            >
              <ChevronDown className="w-5 h-5 text-blue-600" />
            </button>
            <span className="text-xs text-gray-600 mt-2">ساعة</span>
          </div>

          {/* Separator */}
          <div className="text-3xl font-bold text-blue-600">:</div>

          {/* Minute Picker */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={incrementMinute}
              className="p-1 hover:bg-blue-100 rounded transition-colors"
              type="button"
            >
              <ChevronUp className="w-5 h-5 text-blue-600" />
            </button>
            <div className="text-3xl font-bold text-blue-600 w-16 text-center">
              {minute.toString().padStart(2, "0")}
            </div>
            <button
              onClick={decrementMinute}
              className="p-1 hover:bg-blue-100 rounded transition-colors"
              type="button"
            >
              <ChevronDown className="w-5 h-5 text-blue-600" />
            </button>
            <span className="text-xs text-gray-600 mt-2">دقيقة</span>
          </div>
        </div>

        {/* AM/PM Toggle */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setPeriod("AM")}
            className={`flex-1 py-2 rounded-lg font-bold transition-all ${
              period === "AM"
                ? "bg-yellow-400 text-yellow-900 shadow-md"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
            type="button"
          >
            صباحاً (AM)
          </button>
          <button
            onClick={() => setPeriod("PM")}
            className={`flex-1 py-2 rounded-lg font-bold transition-all ${
              period === "PM"
                ? "bg-purple-500 text-white shadow-md"
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
            type="button"
          >
            مساءً (PM)
          </button>
        </div>

        {/* Display Result */}
        <div className="mt-3 text-center text-sm font-semibold text-gray-700 bg-white rounded p-2">
          {hour.toString().padStart(2, "0")}:{minute.toString().padStart(2, "0")} {period}
        </div>
      </div>
    </div>
  );
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
    null,
  );
  const [editingLocationId, setEditingLocationId] = useState<number | null>(
    null,
  );
  const [editForm, setEditForm] = useState({
    breakfastDinnerStartTime: "17:00",
    breakfastDinnerEndTime: "21:00",
    lunchStartTime: "13:00",
    lunchEndTime: "21:00",
    missedMealFeeAmount: 0,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // ✅ Use fetchAPI instead of direct fetch
      const data = await fetchAPI("/api/Meals/all-locations-settings");
      setLocations(data.dormLocations || []);
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء تحميل الإعدادات");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLocation = async (
    locationId: number,
    newValue: boolean,
  ) => {
    try {
      // ✅ Use fetchAPI for PUT request
      await fetchAPI("/api/Meals/location-setting", {
        method: "PUT",
        body: JSON.stringify({
          dormLocationId: locationId,
          allowCombinedMealScan: newValue,
        }),
      });

      setLocations((prev) =>
        prev.map((loc) =>
          loc.id === locationId
            ? { ...loc, allowCombinedMealScan: newValue }
            : loc,
        ),
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

  const handleEditLocation = (location: DormLocationSetting) => {
    setEditingLocationId(location.id);
    setEditForm({
      breakfastDinnerStartTime:
        formatTimeForInput(location.breakfastDinnerStartTime) || "17:00",
      breakfastDinnerEndTime:
        formatTimeForInput(location.breakfastDinnerEndTime) || "21:00",
      lunchStartTime: formatTimeForInput(location.lunchStartTime) || "13:00",
      lunchEndTime: formatTimeForInput(location.lunchEndTime) || "21:00",
      missedMealFeeAmount: location.missedMealFeeAmount || 0,
    });
  };

  const formatTimeForInput = (time?: string): string => {
    if (!time) return "";
    // Handle TimeSpan format "HH:MM:SS" -> "HH:MM"
    const parts = time.split(":");
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
    }
    return time;
  };

  const formatTimeForDisplay = (time?: string): string => {
    if (!time) return "—";
    const parts = time.split(":");
    if (parts.length >= 2) {
      const h = parseInt(parts[0]);
      const m = parts[1].padStart(2, "0");
      const period = h >= 12 ? "م" : "ص";
      const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
      return `${displayH}:${m} ${period}`;
    }
    return time;
  };

  const handleSaveLocationSettings = async (locationId: number) => {
    try {
      setSaving(true);
      await fetchAPI("/api/Meals/settings", {
        method: "PUT",
        headers: {
          "X-Selected-Dorm-Id": locationId.toString(),
        },
        body: JSON.stringify({
          allowCombinedMealScan:
            locations.find((l) => l.id === locationId)?.allowCombinedMealScan ||
            false,
          breakfastDinnerStartTime: editForm.breakfastDinnerStartTime,
          breakfastDinnerEndTime: editForm.breakfastDinnerEndTime,
          lunchStartTime: editForm.lunchStartTime,
          lunchEndTime: editForm.lunchEndTime,
          missedMealFeeAmount: editForm.missedMealFeeAmount,
        }),
      });

      // Update local state
      setLocations((prev) =>
        prev.map((loc) =>
          loc.id === locationId
            ? {
                ...loc,
                breakfastDinnerStartTime: editForm.breakfastDinnerStartTime,
                breakfastDinnerEndTime: editForm.breakfastDinnerEndTime,
                lunchStartTime: editForm.lunchStartTime,
                lunchEndTime: editForm.lunchEndTime,
                missedMealFeeAmount: editForm.missedMealFeeAmount,
              }
            : loc,
        ),
      );

      toast.success("تم حفظ إعدادات الموقع بنجاح");
      setEditingLocationId(null);
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  const confirmBulkUpdate = async () => {
    if (!bulkAction) return;

    try {
      setSaving(true);
      // ✅ Use fetchAPI for bulk update
      await fetchAPI("/api/Meals/bulk-update-all", {
        method: "PUT",
        body: JSON.stringify({
          allowCombinedMealScan: bulkAction === "enable",
        }),
      });

      setLocations((prev) =>
        prev.map((loc) =>
          loc.isActive
            ? { ...loc, allowCombinedMealScan: bulkAction === "enable" }
            : loc,
        ),
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
    (l) => l.allowCombinedMealScan,
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

              {/* Dynamic Settings Display */}
              <div className="space-y-3">
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-900 font-semibold mb-2">
                    أوقات الوجبات:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        إفطار/عشاء:{" "}
                        {formatTimeForDisplay(
                          location.breakfastDinnerStartTime,
                        )}{" "}
                        -{" "}
                        {formatTimeForDisplay(location.breakfastDinnerEndTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        غداء: {formatTimeForDisplay(location.lunchStartTime)} -{" "}
                        {formatTimeForDisplay(location.lunchEndTime)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="flex items-center gap-1 text-xs text-orange-800">
                    <DollarSign className="w-3 h-3" />
                    <span className="font-semibold">غرامة الوجبة الفائتة:</span>
                    <span>{location.missedMealFeeAmount || 0} جنيه</span>
                  </div>
                </div>

                {/* Edit Settings Button */}
                {location.isActive && (
                  <>
                    {editingLocationId === location.id ? (
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
                        <h4 className="font-bold text-gray-900 text-sm">
                          تعديل الإعدادات
                        </h4>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              بداية إفطار/عشاء
                            </label>
                            <input
                              type="time"
                              value={editForm.breakfastDinnerStartTime}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  breakfastDinnerStartTime: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1.5 border rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              نهاية إفطار/عشاء
                            </label>
                            <input
                              type="time"
                              value={editForm.breakfastDinnerEndTime}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  breakfastDinnerEndTime: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1.5 border rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              بداية غداء
                            </label>
                            <input
                              type="time"
                              value={editForm.lunchStartTime}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  lunchStartTime: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1.5 border rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              نهاية غداء
                            </label>
                            <input
                              type="time"
                              value={editForm.lunchEndTime}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  lunchEndTime: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1.5 border rounded text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            غرامة الوجبة الفائتة (جنيه)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={editForm.missedMealFeeAmount}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                missedMealFeeAmount:
                                  parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full px-2 py-1.5 border rounded text-sm"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingLocationId(null)}
                            className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
                          >
                            إلغاء
                          </button>
                          <button
                            onClick={() =>
                              handleSaveLocationSettings(location.id)
                            }
                            disabled={saving}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            <Save className="w-3 h-3" />
                            {saving ? "جاري الحفظ..." : "حفظ"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditLocation(location)}
                        className="w-full px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-colors font-semibold flex items-center justify-center gap-1"
                      >
                        <Settings className="w-4 h-4" />
                        تعديل الإعدادات
                      </button>
                    )}
                  </>
                )}

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
