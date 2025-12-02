// src/components/Dashboard.tsx - Fixed Restaurant Dashboard
import { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  Utensils,
  AlertCircle,
  TrendingUp,
  Building,
} from "lucide-react";
import { fetchAPI } from "../lib/api";
import { toast } from "sonner";

interface DashboardProps {
  userRole: "registration" | "restaurant";
}

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
  breakfastStats: MealTypeStats;
  lunchStats: MealTypeStats;
  dinnerStats: MealTypeStats;
  summary: DailySummary;
}

export default function Dashboard({ userRole }: DashboardProps) {
  if (userRole === "restaurant") {
    return <RestaurantDashboard />;
  }

  return <RegistrationDashboard />;
}

function RestaurantDashboard() {
  const [restaurantData, setRestaurantData] =
    useState<RestaurantDailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRestaurantData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchRestaurantData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchAPI("/api/Reports/restaurant/today");
      console.log("Restaurant Data:", data);
      setRestaurantData(data);
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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !restaurantData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <div className="text-red-600 mb-2">خطأ في تحميل البيانات</div>
          <div className="text-gray-600 text-sm mb-4">{error}</div>
          <button
            onClick={fetchRestaurantData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  const { breakfastStats, lunchStats, dinnerStats, summary } = restaurantData;

  const stats = [
    {
      icon: Utensils,
      label: "إجمالي الوجبات المتوقعة",
      value: summary.totalMealsExpected.toString(),
      change: "لجميع الوجبات اليوم",
      color: "bg-blue-500",
    },
    {
      icon: Users,
      label: "الوجبات المستلمة",
      value: summary.totalMealsReceived.toString(),
      change: "تم مسحها بنجاح",
      color: "bg-green-500",
    },
    {
      icon: AlertCircle,
      label: "الوجبات المتبقية",
      value: summary.totalMealsRemaining.toString(),
      change: "لم يتم استلامها بعد",
      color: "bg-orange-500",
    },
    {
      icon: TrendingUp,
      label: "معدل الحضور",
      value: `${summary.overallAttendancePercentage.toFixed(1)}%`,
      change: "نسبة الحضور الإجمالية",
      color: "bg-purple-500",
    },
  ];

  const mealSchedule = [
    {
      meal: "الإفطار والعشاء",
      time: "6:00 PM - 9:00 PM",
      status: getCurrentMealStatus(18, 21), // 6 PM to 9 PM
      stats: breakfastStats,
    },
    {
      meal: "الغداء",
      time: "1:00 PM - 9:00 PM",
      status: getCurrentMealStatus(13, 21), // 1 PM to 9 PM
      stats: lunchStats,
    },
    {
      meal: "العشاء",
      time: "6:00 PM - 9:00 PM",
      status: getCurrentMealStatus(18, 21), // Same as breakfast+dinner
      stats: dinnerStats,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          لوحة التحكم - المطعم
        </h1>
        <button
          onClick={fetchRestaurantData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          تحديث
        </button>
      </div>

      {/* Stats Grid - Real Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-gray-500">{stat.change}</p>
            </div>
          );
        })}
      </div>

      {/* Building Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Building className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-blue-900">
            عدد الطلاب في المبنى: {summary.totalStudentsInBuilding} طالب
          </span>
        </div>
      </div>

      {/* Meal Schedule with Real Data */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            تفاصيل الوجبات اليوم
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            التاريخ:{" "}
            {new Date(restaurantData.date).toLocaleDateString("ar-EG", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mealSchedule.map((item, index) => (
              <div
                key={index}
                className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    {item.meal}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.status === "active"
                        ? "bg-green-100 text-green-700"
                        : item.status === "completed"
                        ? "bg-gray-100 text-gray-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {item.status === "active"
                      ? "نشط الآن"
                      : item.status === "completed"
                      ? "مكتمل"
                      : "قريباً"}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {item.time}
                </p>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm text-gray-700">إجمالي الطلاب</span>
                    <span className="text-lg font-bold text-blue-600">
                      {item.stats.totalStudents}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm text-gray-700">
                      الوجبات المستلمة
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      {item.stats.receivedMeals}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm text-gray-700">المتبقية</span>
                    <span className="text-lg font-bold text-orange-600">
                      {item.stats.remainingMeals}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-600">نسبة الحضور</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {item.stats.attendancePercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.stats.attendancePercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">ملخص اليوم</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">المتوقع</p>
            <p className="text-2xl font-bold text-gray-900">
              {summary.totalMealsExpected}
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">المستلم</p>
            <p className="text-2xl font-bold text-green-600">
              {summary.totalMealsReceived}
            </p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">المتبقي</p>
            <p className="text-2xl font-bold text-orange-600">
              {summary.totalMealsRemaining}
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">الحضور</p>
            <p className="text-2xl font-bold text-purple-600">
              {summary.overallAttendancePercentage.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegistrationDashboard() {
  // Keep your existing registration dashboard code
  const stats = [
    {
      icon: Users,
      label: "إجمالي الطلاب",
      value: "1,247",
      change: "+12 هذا الشهر",
      color: "bg-blue-500",
    },
    {
      icon: Calendar,
      label: "الإجازات اليوم",
      value: "23",
      change: "طلاب في إجازة",
      color: "bg-green-500",
    },
    {
      icon: Utensils,
      label: "الوجبات المقدمة اليوم",
      value: "2,891",
      change: "عبر جميع الوجبات",
      color: "bg-orange-500",
    },
    {
      icon: AlertCircle,
      label: "الوجبات الفائتة",
      value: "156",
      change: "اليوم",
      color: "bg-red-500",
    },
  ];

  const recentActivity = [
    {
      student: "Ahmed Hassan",
      action: "تم التسجيل",
      time: "منذ ساعتين",
      building: "Building A",
    },
    {
      student: "Sarah Mohamed",
      action: "طلب إجازة",
      time: "منذ 3 ساعات",
      building: "Building C",
    },
    {
      student: "Omar Ali",
      action: "تم مسح الوجبة",
      time: "منذ 4 ساعات",
      building: "Building B",
    },
  ];

  const buildings = [
    { name: "Building A", students: 215, capacity: 250, occupancy: 86 },
    { name: "Building B", students: 189, capacity: 200, occupancy: 95 },
    { name: "Building C", students: 178, capacity: 200, occupancy: 89 },
    { name: "Building D", students: 201, capacity: 250, occupancy: 80 },
    { name: "Building E", students: 156, capacity: 180, occupancy: 87 },
    { name: "Building F", students: 193, capacity: 220, occupancy: 88 },
    { name: "Building G", students: 115, capacity: 150, occupancy: 77 },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </p>
              <p className="text-gray-500 text-sm">{stat.change}</p>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">النشاط الأخير</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                      {activity.student
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {activity.student}
                      </p>
                      <p className="text-sm text-gray-500">
                        {activity.action} • {activity.building}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">
              الإحصائيات السريعة
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">الإفطار المقدم</span>
              <span className="font-bold text-gray-900">1,189</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">الغداء المقدم</span>
              <span className="font-bold text-gray-900">1,098</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">العشاء المقدم</span>
              <span className="font-bold text-gray-900">604</span>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">معدل الحضور</span>
                <span className="font-bold text-green-600">87.5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buildings Overview */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">لمحة عن المباني</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {buildings.map((building, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Building className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-gray-900">{building.name}</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">الطلاب</span>
                    <span className="font-semibold text-gray-900">
                      {building.students}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">السعة</span>
                    <span className="font-semibold text-gray-900">
                      {building.capacity}
                    </span>
                  </div>
                  <div className="pt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">نسبة الإشغال</span>
                      <span className="font-semibold text-gray-900">
                        {building.occupancy}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${building.occupancy}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to determine meal status based on current time
function getCurrentMealStatus(
  startHour: number,
  endHour: number
): "active" | "completed" | "upcoming" {
  const now = new Date();
  const currentHour = now.getHours();

  if (currentHour >= startHour && currentHour < endHour) {
    return "active";
  } else if (currentHour >= endHour) {
    return "completed";
  } else {
    return "upcoming";
  }
}
