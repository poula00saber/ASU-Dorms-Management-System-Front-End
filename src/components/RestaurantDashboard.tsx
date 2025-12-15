// src/components/RestaurantDashboardCombined.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Utensils,
  Users,
  Clock,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Coffee,
  Sun,
  Scan,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE } from "../lib/api";

// Restaurant Dashboard Interfaces
interface MealTypeStats {
  mealType: string;
  totalStudents: number;
  receivedMeals: number;
  remainingMeals: number;
  attendancePercentage: number;
}

interface DailySummary {
  totalStudentsInBuilding: number;
  totalMealsExpected: number;
  totalMealsReceived: number;
  totalMealsRemaining: number;
  overallAttendancePercentage: number;
}

interface RestaurantDailyReport {
  date: string;
  buildingNumber: string | null;
  breakfastDinnerStats: MealTypeStats;
  lunchStats: MealTypeStats;
  summary: DailySummary;
}

interface MealSettings {
  allowCombinedMealScan: boolean;
}

export default function RestaurantDashboardCombined() {
  const navigate = useNavigate();
  const [report, setReport] = useState<RestaurantDailyReport | null>(null);
  const [settings, setSettings] = useState<MealSettings>({
    allowCombinedMealScan: false,
  });
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("لم يتم العثور على رمز المصادقة");
      }

      // Fetch both report and settings in parallel
      const [reportRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE}/api/Reports/restaurant/today`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`${API_BASE}/api/Meals/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!reportRes.ok) {
        if (reportRes.status === 401) throw new Error("غير مصرح بالوصول");
        throw new Error(`خطأ HTTP في التقرير: ${reportRes.status}`);
      }

      const reportData = await reportRes.json();
      setReport(reportData);

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }

      setLastUpdated(new Date().toLocaleTimeString("ar-EG"));
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message);
      toast.error("فشل تحميل بيانات المطعم");
    } finally {
      setLoading(false);
      setSettingsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <span className="text-gray-600">جاري تحميل بيانات المطعم...</span>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center h-64" dir="rtl">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <div className="text-red-600 text-lg mb-2">خطأ في تحميل البيانات</div>
        <div className="text-gray-600 text-sm mb-4 text-center">{error}</div>
        <button
          onClick={fetchAllData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const { breakfastDinnerStats, lunchStats, summary } = report;

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            لوحة التحكم - المطعم
          </h1>
          <p className="text-gray-600 mt-1">
            {report.buildingNumber
              ? `المبنى: ${report.buildingNumber}`
              : "جميع المباني"}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            <Clock className="w-4 h-4 inline-block mr-1" />
            آخر تحديث: {lastUpdated}
          </div>
          <button
            onClick={fetchAllData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Meals Card */}
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-500">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Utensils className="w-8 h-8 text-blue-600" />
            </div>
            <TrendingUp className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-gray-600 mb-2">إجمالي الوجبات اليوم</p>
          <p className="text-4xl font-bold text-blue-600 mb-2">
            {summary.totalMealsExpected}
          </p>
          <p className="text-sm text-gray-500">لجميع الوجبات</p>
        </div>

        {/* Received Meals Card */}
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-500">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <TrendingUp className="w-6 h-6 text-green-500" />
          </div>
          <p className="text-gray-600 mb-2">الوجبات المستلمة</p>
          <p className="text-4xl font-bold text-green-600 mb-2">
            {summary.totalMealsReceived}
          </p>
          <p className="text-sm text-gray-500">تم مسحها بنجاح</p>
        </div>

        {/* Remaining Meals Card */}
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-red-500">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-red-100 rounded-lg">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <p className="text-gray-600 mb-2">الوجبات المتبقية</p>
          <p className="text-4xl font-bold text-red-600 mb-2">
            {summary.totalMealsRemaining}
          </p>
          <p className="text-sm text-gray-500">لم يتم استلامها بعد</p>
        </div>
      </div>

      {/* Attendance Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div>
            <p className="text-gray-600 mb-1">عدد الطلاب في المبنى</p>
            <p className="text-3xl font-bold text-gray-900">
              {summary.totalStudentsInBuilding} طالب
            </p>
          </div>
          <div className="text-center mt-4 md:mt-0">
            <p className="text-gray-600 mb-1">معدل الحضور الإجمالي</p>
            <p className="text-4xl font-bold text-purple-600">
              {summary.overallAttendancePercentage.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Meal Types Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakfast & Dinner Card */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Coffee className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  الإفطار والعشاء
                </h3>
                <p className="text-white/80 text-sm">6:00 م - 9:00 م</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">إجمالي الوجبات</p>
                <p className="text-2xl font-bold text-blue-600">
                  {breakfastDinnerStats.totalStudents}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">المستلمة</p>
                <p className="text-2xl font-bold text-green-600">
                  {breakfastDinnerStats.receivedMeals}
                </p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">المتبقية</p>
                <p className="text-2xl font-bold text-red-600">
                  {breakfastDinnerStats.remainingMeals}
                </p>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">نسبة الحضور</span>
                <span className="text-lg font-bold text-gray-900">
                  {breakfastDinnerStats.attendancePercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${breakfastDinnerStats.attendancePercentage}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Lunch Card */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Sun className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">الغداء</h3>
                <p className="text-white/80 text-sm">1:00 م - 9:00 م</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">إجمالي الوجبات</p>
                <p className="text-2xl font-bold text-blue-600">
                  {lunchStats.totalStudents}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">المستلمة</p>
                <p className="text-2xl font-bold text-green-600">
                  {lunchStats.receivedMeals}
                </p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">المتبقية</p>
                <p className="text-2xl font-bold text-red-600">
                  {lunchStats.remainingMeals}
                </p>
              </div>
            </div>
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">نسبة الحضور</span>
                <span className="text-lg font-bold text-gray-900">
                  {lunchStats.attendancePercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-emerald-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${lunchStats.attendancePercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scanner Options Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">مسح الوجبات</h2>

        {settingsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {settings.allowCombinedMealScan ? (
              // Combined Scan Mode - Single Option
              <div
                onClick={() => navigate("/scanner/combined")}
                className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-center mb-6">
                  <div className="p-4 bg-white/20 rounded-full">
                    <Scan className="w-16 h-16 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white text-center mb-2">
                  مسح الوجبة
                </h2>
                <p className="text-purple-100 text-center mb-4">
                  مسح جميع الوجبات معاً
                </p>
                <div className="bg-white/20 rounded-lg p-3 text-center">
                  <p className="text-white text-sm font-semibold">
                    متاح من 1:00 م - 9:00 م
                  </p>
                  <p className="text-purple-100 text-xs mt-1">
                    يتم تسجيل الإفطار/العشاء + الغداء
                  </p>
                </div>
              </div>
            ) : (
              // Separate Scan Mode - Two Options
              <>
                <div
                  onClick={() => navigate("/scanner/breakfast-dinner")}
                  className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow transform hover:-translate-y-1"
                >
                  <div className="flex items-center justify-center mb-6">
                    <div className="p-4 bg-white/20 rounded-full">
                      <Utensils className="w-16 h-16 text-white" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white text-center mb-2">
                    الإفطار والعشاء
                  </h2>
                  <p className="text-blue-100 text-center mb-4">
                    مسح وجبة الإفطار أو العشاء
                  </p>
                  <div className="bg-white/20 rounded-lg p-3 text-center">
                    <p className="text-white text-sm font-semibold">
                      متاح من 6:00 م - 9:00 م
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => navigate("/scanner/lunch")}
                  className="bg-gradient-to-br from-green-500 to-green-700 rounded-lg shadow-lg p-8 cursor-pointer hover:shadow-xl transition-shadow transform hover:-translate-y-1"
                >
                  <div className="flex items-center justify-center mb-6">
                    <div className="p-4 bg-white/20 rounded-full">
                      <Scan className="w-16 h-16 text-white" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-white text-center mb-2">
                    الغداء
                  </h2>
                  <p className="text-green-100 text-center mb-4">
                    مسح وجبة الغداء
                  </p>
                  <div className="bg-white/20 rounded-lg p-3 text-center">
                    <p className="text-white text-sm font-semibold">
                      متاح من 1:00 م - 9:00 م
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Summary Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">ملخص اليوم</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">الإفطار والعشاء</p>
            <p className="text-2xl font-bold text-blue-600">
              {breakfastDinnerStats.receivedMeals} /{" "}
              {breakfastDinnerStats.totalStudents}
            </p>
            <p className="text-xs text-gray-500">
              {breakfastDinnerStats.attendancePercentage.toFixed(1)}% حضور
            </p>
          </div>
          <div className="text-center p-4 border border-emerald-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">الغداء</p>
            <p className="text-2xl font-bold text-emerald-600">
              {lunchStats.receivedMeals} / {lunchStats.totalStudents}
            </p>
            <p className="text-xs text-gray-500">
              {lunchStats.attendancePercentage.toFixed(1)}% حضور
            </p>
          </div>
          <div className="text-center p-4 border border-purple-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">المجموع</p>
            <p className="text-2xl font-bold text-purple-600">
              {summary.totalMealsReceived} / {summary.totalMealsExpected}
            </p>
            <p className="text-xs text-gray-500">
              {summary.overallAttendancePercentage.toFixed(1)}% حضور
            </p>
          </div>
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">حالة المسح</p>
            <div className="text-2xl font-bold">
              <span
                className={
                  settings.allowCombinedMealScan
                    ? "text-purple-600"
                    : "text-blue-600"
                }
              >
                {settings.allowCombinedMealScan ? "مدمج" : "منفصل"}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {settings.allowCombinedMealScan ? "مسح مجمع" : "مسح منفصل"}
            </p>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-900 mb-3">معلومات هامة</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• تأكد من استخدام الماسح الضوئي فقط</li>
          <li>• لا يسمح بالإدخال اليدوي للرقم القومي</li>
          <li>• سيظهر تنبيه في حالة وجود مشكلة</li>
          <li>
            • الوضع الحالي:{" "}
            {settings.allowCombinedMealScan
              ? "مسح مجمع (جميع الوجبات معاً)"
              : "مسح منفصل (كل وجبة على حدة)"}
          </li>
        </ul>
      </div>
    </div>
  );
}
