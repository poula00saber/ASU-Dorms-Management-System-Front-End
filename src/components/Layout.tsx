// src/components/Layout.tsx
import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Scan,
  Building2,
  LogOut,
  Menu,
  X,
  Utensils,
  CreditCard,
  ChevronDown,
} from "lucide-react";
import {
  fetchAPI, // ✅ Add fetchAPI import
  getUserInfo,
  getActiveDormLocationId,
  setActiveDormLocationId,
} from "../lib/api";

export type UserRole = "registration" | "restaurant" | "user";

interface LayoutProps {
  children: ReactNode;
  userRole: UserRole;
  onLogout: () => void;
}

export default function Layout({ children, userRole, onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [allowCombinedScan, setAllowCombinedScan] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [selectedDormId, setSelectedDormId] = useState<number>(0);
  const [accessibleDorms, setAccessibleDorms] = useState<
    Record<number, string>
  >({});
  const [currentUserId, setCurrentUserId] = useState<number>(0);
  const location = useLocation();

  // Dorm location names mapping
  const dormLocationMap: Record<number, string> = {
    1: "مدينة طلبة العباسية",
    2: "مدينة طالبات مصر الجديدة",
    3: "مدينة نصر 1",
    4: "مدينة نصر 2",
    5: "زراعة أ",
    6: "زراعة ب",
    7: "الزيتون",
  };

  // Load user info and dorm settings
  useEffect(() => {
    const userInfo = getUserInfo();
    if (userInfo) {
      setCurrentUserId(userInfo.userId);
      setAccessibleDorms(userInfo.accessibleDormLocations);
      setSelectedDormId(getActiveDormLocationId());
    }

    if (userRole === "restaurant") {
      fetchRestaurantSettings();
    } else {
      setLoadingSettings(false);
    }
  }, [userRole]);

  const fetchRestaurantSettings = async () => {
    try {
      // ✅ Use fetchAPI instead of direct fetch
      const data = await fetchAPI("/api/Meals/settings");
      setAllowCombinedScan(data.allowCombinedMealScan);
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleDormChange = (dormId: number) => {
    setSelectedDormId(dormId);
    setActiveDormLocationId(dormId);
    // Reload the page to fetch new dorm data
    window.location.reload();
  };

  const registrationMenu = [
    { icon: LayoutDashboard, label: "لوحة التحكم", path: "/" },
    { icon: Users, label: "الطلاب", path: "/students" },
    { icon: CreditCard, label: "المدفوعات", path: "/payments" },
    { icon: Calendar, label: "الإجازات", path: "/holidays" },
    { icon: FileText, label: "التقارير", path: "/reports" },
    { icon: Utensils, label: "إعدادات الوجبات", path: "/meal-settings" },
    { icon: Utensils, label: "طباعة الكارنيهات", path: "/print-ids" },
  ];

  const restaurantMenu = allowCombinedScan
    ? [
        { icon: LayoutDashboard, label: "لوحة التحكم", path: "/" },
        { icon: Scan, label: "مسح الوجبة", path: "/scanner/combined" },
      ]
    : [
        { icon: LayoutDashboard, label: "لوحة التحكم", path: "/" },
        {
          icon: Utensils,
          label: "الإفطار والعشاء",
          path: "/scanner/breakfast-dinner",
        },
        { icon: Scan, label: "ماسح الغداء", path: "/scanner/lunch" },
      ];

  const userMenu = [
    { icon: Calendar, label: "الإجازات", path: "/holidays" },
    { icon: CreditCard, label: "المدفوعات", path: "/payments" },
  ];

  const menuItems =
    userRole === "registration"
      ? registrationMenu
      : userRole === "restaurant"
      ? restaurantMenu
      : userMenu;

  // Check if user can access multiple dorms (more than 1 location)
  const canAccessMultipleDorms =
    userRole === "registration" && Object.keys(accessibleDorms).length > 1;

  const getRoleDisplayName = () => {
    switch (userRole) {
      case "registration":
        return "لوحة الإدارة";
      case "restaurant":
        return "قسم المطعم";
      case "user":
        return "المستخدم";
      default:
        return "المستخدم";
    }
  };

  const getUserRoleLabel = () => {
    switch (userRole) {
      case "registration":
        return "المستخدم المسؤول";
      case "restaurant":
        return "موظف المطعم";
      case "user":
        return "مستخدم";
      default:
        return "مستخدم";
    }
  };

  const getUserEmail = () => {
    switch (userRole) {
      case "registration":
        return "admin@asu.edu";
      case "restaurant":
        return "restaurant@asu.edu";
      case "user":
        return "user@asu.edu";
      default:
        return "user@asu.edu";
    }
  };

  const getUserInitials = () => {
    switch (userRole) {
      case "registration":
        return "AU";
      case "restaurant":
        return "RU";
      case "user":
        return "U";
      default:
        return "U";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-64 bg-white border-r border-gray-200">
        <div className="flex items-center gap-3 p-6 border-b border-gray-200">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-blue-900">ASU Dorms</h2>
            <p className="text-gray-500 text-xs">{getRoleDisplayName()}</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {loadingSettings && userRole === "restaurant" ? (
            <div className="text-center text-gray-500 py-4">
              جاري التحميل...
            </div>
          ) : (
            menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })
          )}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-white">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-blue-900">ASU Dorms</h2>
                  <p className="text-gray-500 text-xs">
                    {getRoleDisplayName()}
                  </p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {loadingSettings && userRole === "restaurant" ? (
                <div className="text-center text-gray-500 py-4">
                  جاري التحميل...
                </div>
              ) : (
                menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })
              )}
            </nav>

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={onLogout}
                className="flex items-center gap-3 w-full px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="md:pl-64 h-screen overflow-y-auto">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          {/* Dorm Selector Navigation - Only for Multi-Dorm Users */}
          {canAccessMultipleDorms && userRole === "registration" && (
            <div
              className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200"
              dir="rtl"
            >
              <div className="px-4 md:px-8 py-3">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">
                    اختر موقع السكن:
                  </span>
                  <div className="flex-1 flex items-center gap-2 overflow-x-auto">
                    {Object.entries(accessibleDorms)
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([id, name]) => {
                        const dormId = parseInt(id);
                        const isActive = dormId === selectedDormId;
                        return (
                          <button
                            key={id}
                            onClick={() => handleDormChange(dormId)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                              isActive
                                ? "bg-blue-600 text-white shadow-md"
                                : "bg-white text-gray-700 hover:bg-blue-50 border border-gray-200"
                            }`}
                          >
                            {dormLocationMap[dormId] || name}
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Header */}
          <div className="flex items-center justify-between px-4 md:px-8 py-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden">
              <Menu className="w-6 h-6 text-gray-600" />
            </button>

            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">
                {menuItems.find((item) => item.path === location.pathname)
                  ?.label || "لوحة التحكم"}
              </h1>

              {/* Show current dorm badge for User 2 */}
              {canAccessMultipleDorms && userRole === "registration" && (
                <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  <Building2 className="w-3 h-3" />
                  {dormLocationMap[selectedDormId]}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-gray-900 font-medium">
                  {getUserRoleLabel()}
                </p>
                <p className="text-gray-500 text-sm">{getUserEmail()}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                {getUserInitials()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-8 mt-4">{children}</main>
      </div>
    </div>
  );
}
