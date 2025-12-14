import { useState } from "react";
import { Building2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { UserRole } from "../App";
import { API_BASE } from "../lib/api";

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
      const res = await fetch(`${API_BASE}/api/Auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }),
      });

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ message: "Login failed" }));
        throw new Error(errorData.message || "خطأ في تسجيل الدخول");
      }

      const data = await res.json();

      // Normalize backend roles to lowercase
      // Backend returns: "Registration", "Restaurant", or "User"
      // Frontend expects: "registration", "restaurant", or "user"
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

      // Store credentials
      localStorage.setItem("token", token);
      localStorage.setItem("role", roleFromApi);

      // Store additional user data if provided
      if (data.userId) localStorage.setItem("userId", data.userId);
      if (data.username) localStorage.setItem("username", data.username);
      if (data.dormLocationId)
        localStorage.setItem("dormLocationId", data.dormLocationId);

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
          <h1 className="text-blue-900 mb-2">نظام إدارة سكن جامعة ASU</h1>
          <p className="text-gray-600">تسجيل الدخول إلى حسابك</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-gray-700 mb-2">
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
              <label htmlFor="password" className="block text-gray-700 mb-2">
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
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-gray-600 text-center mb-3">
              بيانات العرض التجريبي:
            </p>

            <div className="space-y-2 text-sm">
              <div className="bg-blue-50 p-3 rounded">
                <p>
                  <strong>التسجيل (إدارة):</strong>
                </p>
                <p className="text-gray-700">reg_location1 / password</p>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <p>
                  <strong>المطعم:</strong>
                </p>
                <p className="text-gray-700">rest_location1 / password</p>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <p>
                  <strong>مستخدم (إجازات فقط):</strong>
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
