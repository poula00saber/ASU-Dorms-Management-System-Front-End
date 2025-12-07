import { useState } from "react";
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
} from "lucide-react";
import { UserRole } from "../App";

interface LayoutProps {
  children: ReactNode;
  userRole: UserRole;
  onLogout: () => void;
}

export default function Layout({ children, userRole, onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const registrationMenu = [
    { icon: LayoutDashboard, label: "لوحة التحكم", path: "/" },
    { icon: Users, label: "الطلاب", path: "/students" },
    { icon: CreditCard, label: "المدفوعات", path: "/payments" },
    { icon: Calendar, label: "الإجازات", path: "/holidays" },
    { icon: FileText, label: "التقارير", path: "/reports" },
  ];

  const restaurantMenu = [
    { icon: LayoutDashboard, label: "لوحة التحكم", path: "/" },
    {
      icon: Utensils,
      label: "الإفطار والعشاء",
      path: "/scanner/breakfast-dinner",
    },
    { icon: Scan, label: "ماسح الغداء", path: "/scanner/lunch" },
  ];

  const menuItems =
    userRole === "registration" ? registrationMenu : restaurantMenu;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-64 bg-white border-r border-gray-200">
        <div className="flex items-center gap-3 p-6 border-b border-gray-200">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-blue-900">ASU Dorms</h2>
            <p className="text-gray-500 text-xs">
              {userRole === "registration" ? "لوحة الإدارة" : "قسم المطعم"}
            </p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
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
          })}
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
                  <h2 className="text-blue-900">ASU Dorms</h2>
                  <p className="text-gray-500 text-xs">
                    {userRole === "registration" ? "المسؤول" : "قسم المطعم"}
                  </p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {menuItems.map((item) => {
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
              })}
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
          <div className="flex items-center justify-between px-4 md:px-8 py-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden">
              <Menu className="w-6 h-6 text-gray-600" />
            </button>

            <h1 className="text-gray-900">
              {menuItems.find((item) => item.path === location.pathname)
                ?.label || "لوحة التحكم"}
            </h1>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-gray-900">
                  {userRole === "registration"
                    ? "المستخدم المسؤول"
                    : "موظف المطعم"}
                </p>
                <p className="text-gray-500 text-sm">
                  {userRole === "registration"
                    ? "admin@asu.edu"
                    : "restaurant@asu.edu"}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                {userRole === "registration" ? "AU" : "RU"}
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
