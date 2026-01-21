import { useState } from "react";
import { Building2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { UserRole } from "../App";
import { fetchAPI, saveUserInfo } from "../lib/api"; // ✅ Changed to fetchAPI

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ Use fetchAPI for login request
      const data = await fetchAPI("/api/Auth/login", {
        method: "POST",
        body: JSON.stringify({ username: email, password }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Normalize backend roles to lowercase
      const roleFromApi = data?.role?.toLowerCase() as UserRole;

      if (
        !roleFromApi ||
        !["registration", "restaurant", "user"].includes(roleFromApi)
      ) {
        throw new Error("Invalid role received from server");
      }

      const token = data?.token;

      if (!token) {
        throw new Error("No token received from server");
      }

      // Store token and role (legacy support)
      localStorage.setItem("token", token);
      localStorage.setItem("role", roleFromApi);

      // Store complete user info using the helper function
      saveUserInfo(data);

      toast.success("تم تسجيل الدخول بنجاح!");
      onLogin(roleFromApi);
    } catch (err: any) {
      console.error("Login error:", err);
      toast.error(err.message || "خطأ في اسم المستخدم أو كلمة المرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-blue-900 mb-2">
            نظام إدارة سكن جامعة ASU
          </h1>
          <p className="text-gray-600">تسجيل الدخول إلى حسابك</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-gray-700 mb-2 font-medium"
              >
                اسم المستخدم
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أدخل اسم المستخدم"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-gray-700 mb-2 font-medium"
              >
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="أدخل كلمة المرور"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-gray-600 text-center mb-3 font-medium">
              بيانات العرض التجريبي:
            </p>

            <div className="space-y-2 text-sm">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="font-semibold text-blue-900 mb-1">
                  التسجيل - مدينة الطلبة (إدارة):
                </p>
                <p className="text-gray-700">reg_location1 / password</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                <p className="font-semibold text-purple-900 mb-1">
                  التسجيل - مدن الطالبات (إدارة شاملة):
                </p>
                <p className="text-gray-700">reg_location2 / password</p>
                <p className="text-xs text-purple-600 mt-1">
                  * يمكن الوصول إلى جميع مدن الطالبات (2-7)
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                <p className="font-semibold text-green-900 mb-1">المطعم:</p>
                <p className="text-gray-700">rest_location1 / password</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                <p className="font-semibold text-amber-900 mb-1">
                  مستخدم (إجازات فقط):
                </p>
                <p className="text-gray-700">user_location1 / password</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
