import { useState, useEffect, useRef } from "react";
import { API_BASE } from "../lib/api";
import {
  Scan,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Building,
} from "lucide-react";
import { toast } from "sonner";

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
  photoUrl?: string;
}

interface StudentData {
  studentId: string;
  firstName: string;
  lastName: string;
  buildingNumber: string;
  timeScanned: string;
  photoUrl?: string;
  previousScanTime?: string;
}

interface ScanResult {
  success: boolean;
  message: string;
  student?: StudentData;
}

export default function MealScanner({ mealType }: MealScannerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Track the last scan time to prevent rapid rescans
  const lastScanTimeRef = useRef<number>(0);
  const SCAN_COOLDOWN_MS = 1000; // 1 second cooldown between scans

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Auto-focus the input on component mount
    if (inputRef.current) {
      inputRef.current.focus();
    }

    return () => clearInterval(timer);
  }, []);

  // Effect to handle automatic scanning when barcode input changes
  useEffect(() => {
    const handleAutoScan = async () => {
      // Don't scan if input is empty
      if (!barcodeInput.trim()) return;

      // Check if enough time has passed since last scan
      const now = Date.now();
      if (now - lastScanTimeRef.current < SCAN_COOLDOWN_MS) return;

      // Check if input looks like a barcode (usually ends with Enter or Tab)
      // For barcode scanners, they often append special characters
      // Let's check for minimum length (e.g., at least 5 characters)
      if (barcodeInput.length >= 5) {
        await performScan(barcodeInput.trim());
        setBarcodeInput(""); // Clear input after scanning
      }
    };

    // Use a debounce to handle barcode scanner input
    const timer = setTimeout(() => {
      handleAutoScan();
    }, 150); // Reduced debounce time for faster scanning

    return () => clearTimeout(timer);
  }, [barcodeInput]);

  useEffect(() => {
    // Re-focus input after scan is complete and result is displayed
    if (!isScanning && scanResult && inputRef.current) {
      // Small delay to ensure UI has updated
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select(); // Select all text for quick clearing
      }, 100);
    }
  }, [isScanning, scanResult]);

  const getMealInfo = () => {
    const hour = currentTime.getHours();

    if (mealType === "breakfast-dinner") {
      if (hour >= 0 && hour < 2) {
        return { name: "عشاء", time: "6:00 PM - 9:00 PM", active: true };
      }
      return {
        name: "إفطار / عشاء",
        time: "خارج ساعات الوجبات",
        active: false,
      };
    } else {
      if (hour >= 13 && hour < 24) {
        return { name: "غداء", time: "1:00 PM - 9:00 PM", active: true };
      }
      return { name: "غداء", time: "خارج ساعات الوجبات", active: false };
    }
  };

  const getFullPhotoUrl = (relativePath?: string) => {
    if (!relativePath) return undefined;
    return `${API_BASE}${relativePath}`;
  };

  const formatTimeToEgyptian = (dateString?: string) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    return date.toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getCurrentTimeFormatted = () => {
    return currentTime.toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const performScan = async (nationalId: string) => {
    if (!nationalId.trim()) return;

    // Update last scan time
    lastScanTimeRef.current = Date.now();

    setIsScanning(true);

    try {
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");
      const mealTypeId = mealType === "breakfast-dinner" ? 1 : 2;

      const res = await fetch(`${API_BASE}/api/Meals/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          nationalId: nationalId.trim(),
          mealTypeId: mealTypeId,
        }),
      });

      const data: ScanResult = await res.json();

      if (data.student && data.student.photoUrl) {
        data.student.photoUrl = getFullPhotoUrl(data.student.photoUrl);
      }

      if (data.student) {
        if (data.student.timeScanned) {
          data.student.time = formatTimeToEgyptian(data.student.timeScanned);
        } else {
          data.student.time = getCurrentTimeFormatted();
        }
      }

      setScanResult(data);

      if (data.student) {
        const newRecord: ScanRecord = {
          id: Date.now(),
          studentId: data.student.studentId,
          studentName: `${data.student.firstName} ${data.student.lastName}`,
          time: data.student.time || getCurrentTimeFormatted(),
          status: data.success ? "success" : "error",
          message: data.message,
          photoUrl: data.student.photoUrl,
        };
        setScanHistory([newRecord, ...scanHistory.slice(0, 9)]);
      }

      if (data.success) {
        toast.success(data.message || "تم مسح الوجبة بنجاح");
      } else {
        toast.error(data.message || "حدث خطأ أثناء المسح");
      }
    } catch (err) {
      const errorMessage = "حدث خطأ في الاتصال بالنظام";
      setScanResult({
        success: false,
        message: errorMessage,
      });
      toast.error(errorMessage);
    } finally {
      setIsScanning(false);
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent | any) => {
    e?.preventDefault?.();
    if (barcodeInput.trim()) {
      performScan(barcodeInput.trim());
      setBarcodeInput("");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBarcodeInput(value);

    // If input is cleared, reset scan result background after a delay
    if (!value.trim()) {
      setTimeout(() => {
        setScanResult(null);
      }, 1000);
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select all text when input is focused
    e.target.select();
  };

  const handleContainerClick = () => {
    // Focus input when clicking anywhere in the scanner container
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  };

  const mealInfo = getMealInfo();

  const pageBgClass = scanResult
    ? scanResult.success
      ? "bg-green-100"
      : "bg-red-100"
    : "bg-white";

  return (
    <div
      className={`space-y-6 min-h-screen transition-colors duration-300 ${pageBgClass}`}
    >
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
            <p className="text-white">{getCurrentTimeFormatted()}</p>
            <p className="text-blue-100 text-sm mt-1">
              {currentTime.toLocaleDateString("ar-EG", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-0 lg:px-2">
        {/* Center - Student Info with Large Photo */}
        <div className="lg:col-span-2 order-1 lg:order-2 space-y-6">
          {scanResult && scanResult.student ? (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex flex-col lg:flex-row gap-8 items-center">
                {/* Large Photo Section */}
                <div className="flex-shrink-0 flex justify-center">
                  {scanResult.student.photoUrl ? (
                    <img
                      src={scanResult.student.photoUrl}
                      alt={`${scanResult.student.firstName} ${scanResult.student.lastName}`}
                      className="w-64 rounded-2xl object-cover border-4 border-gray-200 shadow-lg relative"
                      style={{ height: "253px", left: "-2px" }}
                    />
                  ) : (
                    <div
                      className="w-64 rounded-2xl flex items-center justify-center border-4 border-gray-200 shadow-lg relative bg-gray-200"
                      style={{ height: "253px", left: "-2px" }}
                    >
                      <User className="w-32 h-32 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Student Info Section */}
                <div className="flex-1 flex flex-col justify-center space-y-6 w-full">
                  {/* Status Message */}
                  <div
                    className={`p-4 rounded-lg ${
                      scanResult.success
                        ? "bg-green-50 border-2 border-green-200"
                        : "bg-red-50 border-2 border-red-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {scanResult.success ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-600" />
                        )}
                        <h3
                          className={`text-lg font-bold ${
                            scanResult.success
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {scanResult.message}
                        </h3>
                      </div>
                      <span className="text-gray-500 text-sm">
                        {getCurrentTimeFormatted()}
                      </span>
                    </div>
                  </div>

                  {/* Student Name */}
                  <div className="bg-gray-50 p-5 rounded-lg" dir="rtl">
                    <div className="flex flex-row-reverse items-center gap-3">
                      <div className="text-right" dir="rtl">
                        <h4 className="text-3xl font-bold text-gray-900">
                          {scanResult.student.firstName}{" "}
                          {scanResult.student.lastName}
                        </h4>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-5 rounded-lg" dir="rtl">
                      <div className="flex flex-row-reverse items-center gap-3">
                        <p className="text-xl text-gray-600 mt-2">
                          {scanResult.student.studentId}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Building Info */}
                  <div className="bg-gray-50 p-5 rounded-lg" dir="rtl">
                    <div className="flex flex-row-reverse items-center gap-3">
                      <Building className="w-6 h-6 text-gray-600" />
                      <div className="text-right">
                        <p className="text-sm text-gray-600 font-medium">
                          المبنى
                        </p>
                        <p className="text-xl text-gray-900 font-bold">
                          {scanResult.student.buildingNumber}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Time Scan Info */}
                  <div className="bg-gray-50 p-5 rounded-lg" dir="rtl">
                    <div className="flex flex-row-reverse items-center gap-3">
                      <Clock className="w-6 h-6 text-gray-600" />
                      <div className="text-right">
                        <p className="text-sm text-gray-600 font-medium">
                          {scanResult.success
                            ? "تم المسح الآن في الساعة"
                            : "تم المسح مسبقًا في الساعة"}
                        </p>
                        <p className="text-xl text-gray-900 font-bold">
                          {scanResult.student.time}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Final Status */}
                  <div
                    className={`p-4 rounded-lg text-center ${
                      scanResult.success
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    <p className="font-bold text-lg">
                      {scanResult.success
                        ? "✓ تم تسجيل الوجبة بنجاح"
                        : "✗ لم يتم تسجيل الوجبة"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Scan History */}
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-gray-900">السجلات الأخيرة</h2>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto">
              {scanHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  لا توجد عمليات مسح حتى الآن
                </div>
              ) : (
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
                          {record.photoUrl ? (
                            <img
                              src={record.photoUrl}
                              alt={record.studentName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-gray-600" />
                            </div>
                          )}
                          {record.status === "success" ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          <p className="text-gray-900 font-medium">
                            {record.studentName}
                          </p>
                        </div>
                        <span className="text-gray-600 text-sm">
                          {record.time}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mr-12">
                        {record.studentId}
                      </p>
                      <p
                        className={`text-sm mt-1 mr-12 ${
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
              )}
            </div>
          </div>
        </div>

        {/* Right - Scanner */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div
            className="bg-white rounded-lg shadow-lg p-8 sticky top-6"
            onClick={handleContainerClick}
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full mb-6">
                <Scan className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="text-gray-900 mb-2 text-xl font-bold">
                مسح باركود الطالب
              </h2>
              <p className="text-gray-600">قم بتوجيه الباركود سكانر هنا</p>
              <div className="mt-2 text-sm text-gray-500">
                {isScanning ? (
                  <span className="text-blue-600">جاري المسح...</span>
                ) : (
                  <span className="text-green-600 font-semibold">
                    جاهز للمسح
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={handleInputChange}
                  onFocus={handleInputFocus}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleBarcodeSubmit(e as any);
                    }
                  }}
                  placeholder="انقر هنا أو مرر الباركود"
                  className="w-full px-6 py-4 text-center text-lg border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-blue-50"
                  autoFocus
                  disabled={isScanning}
                  autoComplete="off"
                  spellCheck="false"
                />
                <div className="absolute top-1/2 right-3 transform -translate-y-1/2">
                  {isScanning ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Scan className="w-5 h-5 text-blue-500" />
                  )}
                </div>
              </div>
              <button
                onClick={handleBarcodeSubmit as any}
                disabled={isScanning || !barcodeInput.trim()}
                className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold text-lg"
              >
                {isScanning ? "جاري المسح..." : "معالجة المسح (Enter)"}
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900 font-semibold mb-2">
                تعليمات المسح:
              </p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• الحقل جاهز للمسح تلقائياً عند فتح الصفحة</li>
                <li>• انقر في أي مكان داخل هذا المربع لتفعيل الحقل</li>
                <li>• مرر الباركود وسيتم المسح تلقائياً</li>
                <li>• الحقل سيتم تفريغه تلقائياً بعد كل مسح</li>
                <li>• جاهز للمسح التالي فوراً</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
