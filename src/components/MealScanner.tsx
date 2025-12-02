import { useState, useEffect } from "react";
import {
  Scan,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Building,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE } from "../lib/api";

interface MealScannerProps {
  mealType: "breakfast-dinner" | "lunch";
}

interface ScanRecord {
  id: number;
  studentId: string;
  studentName: string;
  time: string;
  status: "success" | "error";
  message: string;
}

export default function MealScanner({ mealType }: MealScannerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [barcodeInput, setBarcodeInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([
    {
      id: 1,
      studentId: "STU001234",
      studentName: "Ahmed Hassan",
      time: "18:45",
      status: "success",
      message: "تم مسح الوجبة بنجاح",
    },
    {
      id: 2,
      studentId: "STU001235",
      studentName: "Sarah Mohamed",
      time: "18:42",
      status: "success",
      message: "Meal scanned successfully",
    },
    {
      id: 3,
      studentId: "STU001236",
      studentName: "Omar Ali",
      time: "18:38",
      status: "error",
      message: "تم تناوله بالفعل اليوم",
    },
  ]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getMealInfo = () => {
    if (mealType === "breakfast-dinner") {
      const hour = currentTime.getHours();
      if (hour >= 7 && hour < 10) {
        return { name: "إفطار", time: "7:00 AM - 10:00 AM", active: true };
      } else if (hour >= 18 && hour < 21) {
        return { name: "عشاء", time: "6:00 PM - 9:00 PM", active: true };
      }
      return {
        name: "إفطار / عشاء",
        time: "خارج ساعات الوجبات",
        active: false,
      };
    } else {
      const hour = currentTime.getHours();
      if (hour >= 13 && hour < 21) {
        return { name: "غداء", time: "1:00 PM - 9:00 PM", active: true };
      }
      return { name: "غداء", time: "خارج ساعات الوجبات", active: false };
    }
  };

  const mockStudentData: any = {
    STU001234: {
      name: "Ahmed Hassan",
      building: "Building A",
      room: "A-205",
      faculty: "Engineering",
      status: "success",
      message: "تم مسح الوجبة بنجاح",
    },
    STU001235: {
      name: "Sarah Mohamed",
      building: "Building C",
      room: "C-104",
      faculty: "Medicine",
      status: "success",
      message: "تم مسح الوجبة بنجاح",
    },
    STU001236: {
      name: "Omar Ali",
      building: "Building B",
      room: "B-301",
      faculty: "Business",
      status: "error",
      message: "تم تناوله بالفعل اليوم",
    },
    STU001237: {
      name: "Fatima Khalil",
      building: "Building D",
      room: "D-210",
      faculty: "Engineering",
      status: "error",
      message: "الطالب في إجازة",
    },
    STU001238: {
      name: "Youssef Ibrahim",
      building: "Building E",
      room: "E-102",
      faculty: "Arts",
      status: "error",
      message: "المبنى خاطئ",
    },
  };

  const handleScan = async (studentId: string) => {
    // Try calling backend scan endpoint first
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`${API_BASE}/api/Meals/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ studentId, mealType: mealType }),
      });

      if (res.ok) {
        const data = await res.json();
        // Expecting { status, message, name, building, room, faculty }
        const status = data?.status || (data?.ok ? "success" : "error");
        const message =
          data?.message ||
          (status === "success" ? "تم مسح الوجبة بنجاح" : "خطأ في المسح");

        const modal = {
          status: status === "success" ? "success" : "error",
          message,
          name: data?.name,
          studentId,
          building: data?.building,
          room: data?.room,
          faculty: data?.faculty,
        };
        setModalData(modal);
        setShowModal(true);

        const newRecord: ScanRecord = {
          id: Date.now(),
          studentId,
          studentName: data?.name || studentId,
          time: currentTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: status === "success" ? "success" : "error",
          message,
        };
        setScanHistory([newRecord, ...scanHistory.slice(0, 9)]);

        if (status === "success") toast.success(message);
        else toast.error(message);
        return;
      }
    } catch (err: any) {
      // fall back to mock behavior below
    }

    // Fallback: local mock
    const student = mockStudentData[studentId];

    if (!student) {
      setModalData({
        status: "error",
        message: "لم يتم العثور على الطالب",
        studentId: studentId,
      });
      setShowModal(true);
      toast.error("لم يتم العثور على الطالب");
      return;
    }

    setModalData({
      ...student,
      studentId: studentId,
    });
    setShowModal(true);

    // Add to history
    const newRecord: ScanRecord = {
      id: Date.now(),
      studentId: studentId,
      studentName: student.name,
      time: currentTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: student.status,
      message: student.message,
    };
    setScanHistory([newRecord, ...scanHistory.slice(0, 9)]);

    if (student.status === "success") {
      toast.success("تم مسح الوجبة بنجاح!");
    } else {
      toast.error(student.message);
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      handleScan(barcodeInput.trim());
      setBarcodeInput("");
    }
  };

  const mealInfo = getMealInfo();

  return (
    <div className="space-y-6">
      {/* Header with Clock */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-white mb-2">ماسح {mealInfo.name}</h1>
            <p className="text-blue-100">{mealInfo.time}</p>
            <div
              className={`inline-block mt-3 px-4 py-2 rounded-lg ${
                mealInfo.active ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {mealInfo.active ? "نشط" : "غير نشط"}
            </div>
          </div>
          <div className="text-center md:text-right">
            <div className="flex items-center justify-center md:justify-end gap-2 mb-2">
              <Clock className="w-6 h-6" />
              <p className="text-blue-100">الوقت الحالي</p>
            </div>
            <p className="text-white">
              {currentTime.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </p>
            <p className="text-blue-100 text-sm mt-1">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scanner Interface */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full mb-6">
                <Scan className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="text-gray-900 mb-2">مسح باركود الطالب</h2>
              <p className="text-gray-600">ضع الباركود أمام الماسح</p>
            </div>

            <form onSubmit={handleBarcodeSubmit} className="max-w-md mx-auto">
              <div className="mb-6">
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setBarcodeInput(e.target.value)
                  }
                  placeholder="أدخل أو امسح رقم الطالب..."
                  className="w-full px-6 py-4 text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                معالجة المسح
              </button>
            </form>
          </div>
        </div>

        {/* Scan History */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-gray-900">السجلات الأخيرة</h2>
          </div>
          <div className="p-4 max-h-[600px] overflow-y-auto">
            <div className="space-y-3">
              {scanHistory.map((record) => (
                <div
                  key={record.id}
                  className={`p-4 rounded-lg border-2 ${
                    record.status === "success"
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {record.status === "success" ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <p className="text-gray-900">{record.studentName}</p>
                    </div>
                    <span className="text-gray-600 text-sm">{record.time}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{record.studentId}</p>
                  <p
                    className={`text-sm mt-1 ${
                      record.status === "success"
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {record.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scan Result Modal */}
      {showModal && modalData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div
              className={`p-6 rounded-t-lg ${
                modalData.status === "success" ? "bg-green-500" : "bg-red-500"
              }`}
            >
              <div className="flex items-center justify-center">
                {modalData.status === "success" ? (
                  <CheckCircle className="w-16 h-16 text-white" />
                ) : modalData.message === "الطالب في إجازة" ? (
                  <Calendar className="w-16 h-16 text-white" />
                ) : (
                  <XCircle className="w-16 h-16 text-white" />
                )}
              </div>
            </div>

            <div className="p-6">
              <div className="text-center mb-6">
                <h2
                  className={`text-gray-900 mb-2 ${
                    modalData.status === "success"
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {modalData.message}
                </h2>
                {modalData.status === "error" && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2 justify-center text-red-700">
                      <AlertTriangle className="w-5 h-5" />
                      <span>يتطلب إجراء</span>
                    </div>
                  </div>
                )}
              </div>

              {modalData.name && (
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-gray-600 text-sm">اسم الطالب</p>
                      <p className="text-gray-900">{modalData.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-gray-600 text-sm">رقم الطالب</p>
                      <p className="text-gray-900">{modalData.studentId}</p>
                    </div>
                  </div>

                  {modalData.building && (
                    <>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Building className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-gray-600 text-sm">
                            المبنى والغرفة
                          </p>
                          <p className="text-gray-900">
                            {modalData.building} - {modalData.room}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <User className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-gray-600 text-sm">الكلية</p>
                          <p className="text-gray-900">{modalData.faculty}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
