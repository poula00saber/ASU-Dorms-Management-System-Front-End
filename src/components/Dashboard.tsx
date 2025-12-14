// src/components/Dashboard.tsx
import { useState, useEffect } from "react";
import {
  Utensils,
  Users,
  Clock,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Coffee,
  Sun,
  Building,
  UserCheck,
  Calendar,
  CheckCircle,
  XCircle,
  Home,
  BookOpen,
  GraduationCap,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE } from "../lib/api";
import { Bold } from "lucide-react";

interface DashboardProps {
  userRole: "registration" | "restaurant";
}

// Registration Dashboard Interfaces
interface DashboardBuildingStats {
  buildingNumber: string;
  totalStudents: number;
  activeStudents: number;
  onLeaveStudents: number;
  expectedMeals: number;
  receivedMeals: number;
  remainingMeals: number;
  attendancePercentage: number;
}

interface DashboardMealStats {
  breakfastDinner: number;
  lunch: number;
  total: number;
}

interface RegistrationDashboardData {
  date: string;
  dormLocationId: number;
  totalStudents: number;
  activeStudents: number;
  onLeaveStudents: number;
  expectedMeals: DashboardMealStats;
  receivedMeals: DashboardMealStats;
  remainingMeals: DashboardMealStats;
  attendancePercentage: number;
  buildingStats: DashboardBuildingStats[];
  recentRegistrations: Array<{
    studentId: string;
    name: string;
    faculty: string;
    buildingNumber: string;
    time: string;
  }>;
  recentLeaveRequests: Array<{
    studentId: string;
    name: string;
    buildingNumber: string;
    leaveDate: string;
    returnDate: string;
  }>;
}

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

export default function Dashboard({ userRole }: DashboardProps) {
  if (userRole === "restaurant") {
    return <RestaurantDashboard />;
  }
  return <RegistrationDashboard />;
}

function RegistrationDashboard() {
  const [stats, setStats] = useState<RegistrationDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const dormLocationMap: Record<number, string> = {
    1: "مدينة طلبة العباسية",
    2: "مدينة طالبات مصر الجديدة",
    3: "مدينة نصر 1",
    4: "مدينة نصر 2",
    5: "زراعة أ",
    6: "زراعة ب",
    7: "الزيتون",
  };

  useEffect(() => {
    fetchRegistrationData();
    const interval = setInterval(fetchRegistrationData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchRegistrationData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("لم يتم العثور على رمز المصادقة");
      }

      const response = await fetch(
        `${API_BASE}/api/Reports/registration/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) throw new Error("غير مصرح بالوصول");
        if (response.status === 404)
          throw new Error("لم يتم العثور على بيانات موقع السكن");
        throw new Error(`خطأ HTTP: ${response.status}`);
      }

      const data = await response.json();
      setStats(data);
      setLastUpdated(new Date().toLocaleTimeString("ar-EG"));
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message);
      toast.error("فشل تحميل بيانات لوحة التحكم");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <span className="text-gray-600">جاري تحميل بيانات لوحة التحكم...</span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-64" dir="rtl">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <div className="text-red-600 text-lg mb-2">خطأ في تحميل البيانات</div>
        <div className="text-gray-600 text-sm mb-4 text-center">{error}</div>
        <button
          onClick={fetchRegistrationData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            لوحة التحكم - التسجيل
          </h1>
          <p className="text-gray-600 mt-1">
            موقع السكن: {dormLocationMap[stats.dormLocationId] || "غير معروف"}|
            التاريخ: {new Date(stats.date).toLocaleDateString("ar-EG")}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            <Clock className="w-4 h-4 inline-block mr-1" />
            آخر تحديث: {lastUpdated}
          </div>
          <button
            onClick={fetchRegistrationData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students Card */}
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-500">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <TrendingUp className="w-6 h-6 text-blue-500" />
          </div>
          <p className="text-gray-600 mb-2">إجمالي الطلاب</p>
          <p className="text-4xl font-bold text-blue-600 mb-2">
            {stats.totalStudents}
          </p>
          <p className="text-sm text-gray-500">في موقع السكن</p>
        </div>

        {/* Active Students Card */}
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-500">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <p className="text-gray-600 mb-2">الطلاب النشطين</p>
          <p className="text-4xl font-bold text-green-600 mb-2">
            {stats.activeStudents}
          </p>
          <p className="text-sm text-gray-500">طالب متواجد حالياً</p>
        </div>

        {/* Students on Leave Card */}
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-amber-500">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-amber-100 rounded-lg">
              <Calendar className="w-8 h-8 text-amber-600" />
            </div>
            <AlertCircle className="w-6 h-6 text-amber-500" />
          </div>
          <p className="text-gray-600 mb-2">الطلاب في إجازة</p>
          <p className="text-4xl font-bold text-amber-600 mb-2">
            {stats.onLeaveStudents}
          </p>
          <p className="text-sm text-gray-500">غير متواجدين اليوم</p>
        </div>

        {/* Attendance Percentage Card */}
        <div className="bg-white rounded-lg shadow p-6 border-t-4 border-purple-500">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <p className="text-gray-600 mb-2">معدل الحضور</p>
          <p className="text-4xl font-bold text-purple-600 mb-2">
            {stats.attendancePercentage.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-500">لليوم</p>
        </div>
      </div>

      {/* Meals Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">
          نظرة عامة على الوجبات
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Expected Meals */}
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Utensils className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900">الوجبات المتوقعة</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">الإفطار والعشاء</span>
                <span className="text-xl font-bold text-blue-600">
                  {stats.expectedMeals.breakfastDinner}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">الغداء</span>
                <span className="text-xl font-bold text-blue-600">
                  {stats.expectedMeals.lunch}
                </span>
              </div>
              <div className="pt-3 border-t border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-semibold">المجموع</span>
                  <span className="text-2xl font-bold text-blue-700">
                    {stats.expectedMeals.total}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Received Meals */}
          <div className="bg-green-50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900">الوجبات المستلمة</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">الإفطار والعشاء</span>
                <span className="text-xl font-bold text-green-600">
                  {stats.receivedMeals.breakfastDinner}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">الغداء</span>
                <span className="text-xl font-bold text-green-600">
                  {stats.receivedMeals.lunch}
                </span>
              </div>
              <div className="pt-3 border-t border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-semibold">المجموع</span>
                  <span className="text-2xl font-bold text-green-700">
                    {stats.receivedMeals.total}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Remaining Meals */}
          <div className="bg-red-50 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-bold text-gray-900">الوجبات المتبقية</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">الإفطار والعشاء</span>
                <span className="text-xl font-bold text-red-600">
                  {stats.remainingMeals.breakfastDinner}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">الغداء</span>
                <span className="text-xl font-bold text-red-600">
                  {stats.remainingMeals.lunch}
                </span>
              </div>
              <div className="pt-3 border-t border-red-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-semibold">المجموع</span>
                  <span className="text-2xl font-bold text-red-700">
                    {stats.remainingMeals.total}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Buildings Stats */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">
              إحصائيات المباني
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.buildingStats.map((building, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Building className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-gray-900">
                      {building.buildingNumber}
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">الطلاب</span>
                      <span className="font-semibold text-gray-900">
                        {building.totalStudents}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">النشطين</span>
                      <span className="font-semibold text-green-600">
                        {building.activeStudents}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">في إجازة</span>
                      <span className="font-semibold text-amber-600">
                        {building.onLeaveStudents}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">الحضور</span>
                        <span className="font-semibold text-purple-600">
                          {building.attendancePercentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{
                            width: `${Math.min(
                              building.attendancePercentage,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">النشاط الأخير</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {/* Recent Registrations */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  تسجيلات جديدة
                </h3>
                {stats.recentRegistrations.length > 0 ? (
                  stats.recentRegistrations.slice(0, 3).map((reg, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg mb-2"
                    >
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {reg.studentId.slice(-3)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {reg.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {reg.faculty} • {reg.buildingNumber}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">{reg.time}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2">
                    لا توجد تسجيلات جديدة
                  </p>
                )}
              </div>

              {/* Recent Leave Requests */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  طلبات إجازة
                </h3>
                {stats.recentLeaveRequests.length > 0 ? (
                  stats.recentLeaveRequests.slice(0, 3).map((leave, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg mb-2"
                    >
                      <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {leave.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {leave.leaveDate} → {leave.returnDate}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2">
                    لا توجد طلبات إجازة
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900 mb-2">
              ملخص موقع السكن {stats.dormLocationId}
            </h3>
            <p className="text-gray-600">
              يتم إدارة {stats.totalStudents} طالب موزعين على{" "}
              {stats.buildingStats.length} مبنى
            </p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-sm text-gray-600">معدل الحضور العام</p>
            <p className="text-3xl font-bold text-purple-600">
              {stats.attendancePercentage.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RestaurantDashboard() {
  const [report, setReport] = useState<RestaurantDailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    fetchRestaurantData();
    const interval = setInterval(fetchRestaurantData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("لم يتم العثور على رمز المصادقة");
      }

      const response = await fetch(`${API_BASE}/api/Reports/restaurant/today`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error("غير مصرح بالوصول");
        throw new Error(`خطأ HTTP: ${response.status}`);
      }

      const data = await response.json();
      setReport(data);
      setLastUpdated(new Date().toLocaleTimeString("ar-EG"));
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message);
      toast.error("فشل تحميل بيانات المطعم");
    } finally {
      setLoading(false);
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
          onClick={fetchRestaurantData}
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
    <div className="space-y-6" dir="rtl">
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
            onClick={fetchRestaurantData}
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
              <Users className="w-8 h-8 text-green-600" />
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
              <AlertCircle className="w-8 h-8 text-red-600" />
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
            <p className="text-sm text-gray-600 mb-1">الحالة</p>
            <div className="text-2xl font-bold">
              <span
                className={getStatusColor(summary.overallAttendancePercentage)}
              >
                {getStatusText(summary.overallAttendancePercentage)}
              </span>
            </div>
            <p className="text-xs text-gray-500">حالة المطعم</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getStatusColor(percentage: number): string {
  if (percentage >= 90) return "text-green-600";
  if (percentage >= 70) return "text-yellow-600";
  return "text-red-600";
}

function getStatusText(percentage: number): string {
  if (percentage >= 90) return "ممتاز";
  if (percentage >= 70) return "جيد";
  return "بحاجة لتحسين";
}
