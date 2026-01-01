import React, { useEffect, useState } from "react";
import {
  Plus,
  Calendar,
  Trash2,
  Search,
  X,
  CreditCard,
  FileText,
  DollarSign,
} from "lucide-react";
import { API_BASE } from "../lib/api";

interface Student {
  studentId: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  buildingNumber: string;
  roomNumber: string;
  hasOutstandingPayment: boolean;
  outstandingAmount: number;
  isExemptFromFees: boolean;
}

interface PaymentTransaction {
  id: number;
  studentNationalId: string;
  studentId: string;
  amount: number;
  paymentType: "MonthlyFee" | "MissedMealPenalty" | "Other";
  paymentTypeDisplay: string;
  paymentDate: string;
  receiptNumber: string;
  month: number | null;
  year: number | null;
  missedMealsCount: number | null;
  processedBy: string;
  createdAt: string;
}

interface PaymentExemption {
  id: number;
  studentNationalId: string;
  studentId: string;
  startDate: string;
  endDate: string;
  notes: string;
  isActive: boolean;
  approvedBy: string;
  approvedDate: string;
  createdAt: string;
}

interface PaymentSummary {
  studentNationalId: string;
  studentId: string;
  studentName: string;
  totalPaid: number;
  outstandingAmount: number;
  lastPaymentDate: string | null;
  recentTransactions: PaymentTransaction[];
}

export default function PaymentManagerArabic() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(
    null
  );
  const [paymentExemptions, setPaymentExemptions] = useState<
    PaymentExemption[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExemptionModal, setShowExemptionModal] = useState(false);

  const [paymentFormData, setPaymentFormData] = useState({
    studentNationalId: "",
    amount: "",
    paymentType: "MonthlyFee" as "MonthlyFee" | "MissedMealPenalty" | "Other",
    paymentDate: new Date().toISOString().split("T")[0],
    receiptNumber: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    missedMealsCount: "",
  });

  const [exemptionFormData, setExemptionFormData] = useState({
    studentNationalId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    notes: "",
    approvedBy: "",
  });

  // Fetch all students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  // Filter students based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredStudents(students);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = students.filter(
      (s) =>
        s.studentId.toLowerCase().includes(term) ||
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(term) ||
        s.nationalId.toLowerCase().includes(term)
    );
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/Students`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("فشل في تحميل الطلاب");
      const data = await res.json();
      setStudents(data || []);
      setFilteredStudents(data || []);
    } catch (err: any) {
      alert(err.message || "حدث خطأ أثناء تحميل الطلاب");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentPayments = async (studentNationalId: string) => {
    try {
      const token = localStorage.getItem("token");

      // Fetch payment summary
      const summaryRes = await fetch(
        `${API_BASE}/api/PaymentTransactions/summary/${studentNationalId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setPaymentSummary(summaryData);
      }

      // Fetch payment exemptions
      const exemptionsRes = await fetch(
        `${API_BASE}/api/PaymentExemptions/student/${studentNationalId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (exemptionsRes.ok) {
        const exemptionsData = await exemptionsRes.json();
        setPaymentExemptions(exemptionsData);
      }
    } catch (err: any) {
      console.error("Error fetching payments:", err);
    }
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    fetchStudentPayments(student.nationalId);
    setPaymentFormData((prev) => ({
      ...prev,
      studentNationalId: student.nationalId,
    }));
    setExemptionFormData((prev) => ({
      ...prev,
      studentNationalId: student.nationalId,
      approvedBy: "المسؤول", // Default value
    }));
  };

  const handleAddPayment = () => {
    if (!selectedStudent) return;
    setShowPaymentModal(true);
  };

  const handleAddExemption = () => {
    if (!selectedStudent) return;
    setShowExemptionModal(true);
  };
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      const token = localStorage.getItem("token");
      console.log("Token exists:", !!token);
      console.log("Selected student:", selectedStudent);
      console.log("Form data:", paymentFormData);

      // Validate amount
      const amount = parseFloat(paymentFormData.amount);
      console.log("Parsed amount:", amount);

      if (isNaN(amount) || amount <= 0) {
        alert("يرجى إدخال مبلغ صحيح أكبر من الصفر");
        return;
      }

      // Map payment types to integers
      const paymentTypeMap = {
        MonthlyFee: 0,
        MissedMealPenalty: 1,
        Other: 2,
      };

      // Prepare payment data - ensure no null/undefined values
      const paymentData = {
        studentNationalId: selectedStudent.nationalId || "",
        amount: amount,
        paymentType: paymentTypeMap[paymentFormData.paymentType] || 0,
        paymentDate:
          paymentFormData.paymentDate || new Date().toISOString().split("T")[0],
        receiptNumber: paymentFormData.receiptNumber?.trim() || "N/A",
        month:
          paymentFormData.paymentType === "MonthlyFee"
            ? parseInt(paymentFormData.month) || new Date().getMonth() + 1
            : null,
        year:
          paymentFormData.paymentType === "MonthlyFee"
            ? parseInt(paymentFormData.year) || new Date().getFullYear()
            : null,
        missedMealsCount:
          paymentFormData.paymentType === "MissedMealPenalty"
            ? parseInt(paymentFormData.missedMealsCount) || 1
            : null,
      };

      // Log the prepared data
      console.log("Payment data prepared:", paymentData);
      console.log("Is receiptNumber empty?", paymentData.receiptNumber === "");
      console.log(
        "Is studentNationalId empty?",
        paymentData.studentNationalId === ""
      );

      // Wrap in dto object
      const payload = {
        dto: paymentData,
      };

      console.log("Final payload to send:", JSON.stringify(payload, null, 2));

      const res = await fetch(`${API_BASE}/api/PaymentTransactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", res.status);
      console.log(
        "Response headers:",
        Object.fromEntries(res.headers.entries())
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error response:", errorText);

        // Try to parse as JSON for better error display
        try {
          const errorJson = JSON.parse(errorText);
          console.error("Parsed error JSON:", errorJson);

          // Show specific validation errors if available
          if (errorJson.errors) {
            let errorMessages = [];
            for (const [field, messages] of Object.entries(errorJson.errors)) {
              errorMessages.push(
                `${field}: ${
                  Array.isArray(messages) ? messages.join(", ") : messages
                }`
              );
            }
            throw new Error(`أخطاء في التحقق:\n${errorMessages.join("\n")}`);
          }

          throw new Error(
            errorJson.title || `فشل في إضافة الدفع: ${res.status}`
          );
        } catch {
          throw new Error(`فشل في إضافة الدفع: ${res.status} - ${errorText}`);
        }
      }

      const result = await res.json();
      console.log("Success response:", result);

      alert("تمت إضافة الدفع بنجاح");
      setShowPaymentModal(false);
      setPaymentFormData({
        studentNationalId: selectedStudent.nationalId,
        amount: "",
        paymentType: "MonthlyFee",
        paymentDate: new Date().toISOString().split("T")[0],
        receiptNumber: "",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        missedMealsCount: "",
      });
      fetchStudentPayments(selectedStudent.nationalId);
    } catch (err: any) {
      console.error("Full error details:", err);
      alert(err.message || "حدث خطأ أثناء إضافة الدفع");
    }
  };
  const handleExemptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      const token = localStorage.getItem("token");
      const payload = {
        studentNationalId: selectedStudent.nationalId,
        startDate: exemptionFormData.startDate,
        endDate: exemptionFormData.endDate,
        notes: exemptionFormData.notes,
        approvedBy: exemptionFormData.approvedBy,
      };

      const res = await fetch(`${API_BASE}/api/PaymentExemptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("فشل في إضافة التصريح");

      alert("تمت إضافة التصريح بنجاح");
      setShowExemptionModal(false);
      setExemptionFormData({
        studentNationalId: selectedStudent.nationalId,
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date().toISOString().split("T")[0],
        notes: "",
        approvedBy: "المسؤول",
      });
      fetchStudentPayments(selectedStudent.nationalId);
    } catch (err: any) {
      alert(err.message || "حدث خطأ أثناء إضافة التصريح");
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه العملية الدفعية؟")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/api/PaymentTransactions/${paymentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("فشل في حذف العملية الدفعية");

      alert("تم حذف العملية الدفعية بنجاح");
      if (selectedStudent) {
        fetchStudentPayments(selectedStudent.nationalId);
      }
    } catch (err: any) {
      alert(err.message || "حدث خطأ أثناء حذف العملية الدفعية");
    }
  };

  const handleToggleExemptionStatus = async (
    exemptionId: number,
    isActive: boolean
  ) => {
    const action = isActive ? "تفعيل" : "إلغاء تفعيل";
    if (!confirm(`هل أنت متأكد من ${action} هذا التصريح؟`)) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${API_BASE}/api/PaymentExemptions/${exemptionId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(!isActive),
        }
      );

      if (!res.ok) throw new Error(`فشل في ${action} التصريح`);

      alert(`تم ${action} التصريح بنجاح`);
      if (selectedStudent) {
        fetchStudentPayments(selectedStudent.nationalId);
      }
    } catch (err: any) {
      alert(err.message || `حدث خطأ أثناء ${action} التصريح`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-EG", {
      style: "currency",
      currency: "EGP",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getPaymentTypeColor = (paymentType: string) => {
    switch (paymentType) {
      case "MonthlyFee":
        return "text-blue-600";
      case "MissedMealPenalty":
        return "text-red-600";
      case "Other":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const getPaymentTypeIcon = (paymentType: string) => {
    switch (paymentType) {
      case "MonthlyFee":
        return <CreditCard className="w-5 h-5" />;
      case "MissedMealPenalty":
        return <Calendar className="w-5 h-5" />;
      case "Other":
        return <FileText className="w-5 h-5" />;
      default:
        return <DollarSign className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 ">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            إدارة المدفوعات والتصاريح
          </h1>
          <p className="text-gray-600">
            إدارة مدفوعات وتصاريح الطلاب في السكن الجامعي
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Students List Panel */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                قائمة الطلاب
              </h2>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="ابحث بالرقم الجامعي أو الاسم أو الرقم القومي..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Students List */}
            <div className="overflow-y-auto" style={{ maxHeight: "600px" }}>
              {loading ? (
                <div className="p-6 text-center text-gray-500">
                  جاري التحميل...
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  لم يتم العثور على طلاب
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.studentId}
                      onClick={() => handleSelectStudent(student)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-blue-50 ${
                        selectedStudent?.studentId === student.studentId
                          ? "bg-blue-100"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">
                              {student.firstName} {student.lastName}
                            </p>
                            {student.hasOutstandingPayment &&
                              !student.isExemptFromFees && (
                                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                  مدين
                                </span>
                              )}
                            {student.isExemptFromFees && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                معفي
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            الرقم الجامعي: {student.studentId}
                          </p>
                          <p className="text-sm text-gray-600">
                            الرقم القومي: {student.nationalId}
                          </p>
                          <p className="text-sm text-gray-500">
                            المبنى {student.buildingNumber} - غرفة{" "}
                            {student.roomNumber}
                          </p>
                          {student.hasOutstandingPayment && (
                            <p className="text-sm text-red-600 font-semibold mt-1">
                              المبلغ المتبقي:{" "}
                              {formatCurrency(student.outstandingAmount)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Student Payments Panel */}
          <div className="bg-white rounded-lg shadow-md max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              {selectedStudent ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">
                        المدفوعات والتصاريح
                      </h2>
                      <p className="text-gray-600">
                        {selectedStudent.firstName} {selectedStudent.lastName} -{" "}
                        {selectedStudent.studentId}
                      </p>
                    </div>
                    {paymentSummary && (
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(paymentSummary.totalPaid)}
                        </p>
                        <p className="text-sm text-gray-600">
                          إجمالي المدفوعات
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleAddPayment}
                      className="bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-5 h-5" />
                      إضافة مدفوعات
                    </button>
                    <button
                      onClick={handleAddExemption}
                      className="bg-blue-600 font-bold text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <FileText className="w-5 h-5" />
                      إضافة تصريح
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  اختر طالباً لعرض مدفوعاته وتصاريحه
                </div>
              )}
            </div>

            {selectedStudent && (
              <div className="overflow-y-auto" style={{ maxHeight: "520px" }}>
                {/* Payment Summary */}
                {paymentSummary && (
                  <div className="p-4 border-b border-gray-200">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-600 font-semibold">
                          إجمالي المدفوعات
                        </p>
                        <p className="text-xl font-bold text-blue-800">
                          {formatCurrency(paymentSummary.totalPaid)}
                        </p>
                      </div>
                      <div
                        className={`p-3 rounded-lg ${
                          paymentSummary.outstandingAmount > 0
                            ? "bg-red-50"
                            : "bg-green-50"
                        }`}
                      >
                        <p className="text-sm font-semibold">المبلغ المتبقي</p>
                        <p
                          className={`text-xl font-bold ${
                            paymentSummary.outstandingAmount > 0
                              ? "text-red-800"
                              : "text-green-800"
                          }`}
                        >
                          {formatCurrency(paymentSummary.outstandingAmount)}
                        </p>
                      </div>
                    </div>
                    {paymentSummary.lastPaymentDate && (
                      <p className="text-sm text-gray-600 mt-2">
                        آخر دفع: {formatDate(paymentSummary.lastPaymentDate)}
                      </p>
                    )}
                  </div>
                )}

                {/* Recent Payments */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-3">
                    آخر المدفوعات
                  </h3>
                  {paymentSummary?.recentTransactions?.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      لا توجد مدفوعات مسجلة
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {paymentSummary?.recentTransactions?.map((payment) => (
                        <div
                          key={payment.id}
                          className="p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getPaymentTypeIcon(payment.paymentType)}
                                <span
                                  className={`font-semibold ${getPaymentTypeColor(
                                    payment.paymentType
                                  )}`}
                                >
                                  {payment.paymentTypeDisplay}
                                </span>
                                <span className="text-gray-900 font-bold">
                                  {formatCurrency(payment.amount)}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p>
                                  التاريخ: {formatDate(payment.paymentDate)}
                                </p>
                                {payment.receiptNumber && (
                                  <p>رقم الإيصال: {payment.receiptNumber}</p>
                                )}
                                {payment.month && payment.year && (
                                  <p>
                                    الشهر: {payment.month}/{payment.year}
                                  </p>
                                )}
                                {payment.missedMealsCount && (
                                  <p>عدد الوجبات: {payment.missedMealsCount}</p>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeletePayment(payment.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="حذف الدفعة"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment Exemptions */}
                <div className="p-4 border-t border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-3">
                    التصاريح النشطة
                  </h3>
                  {paymentExemptions.filter((e) => e.isActive).length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      لا توجد تصاريح نشطة
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {paymentExemptions
                        .filter((e) => e.isActive)
                        .map((exemption) => (
                          <div
                            key={exemption.id}
                            className="p-3 bg-green-50 rounded-lg"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <FileText className="w-5 h-5 text-green-600" />
                                  <span className="font-semibold text-green-700">
                                    تصريح دفع
                                  </span>
                                  <span
                                    className={`px-2 py-1 ${
                                      exemption.isActive
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-800"
                                    } text-xs rounded-full`}
                                  >
                                    {exemption.isActive ? "نشط" : "غير نشط"}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    <span>
                                      من: {formatDate(exemption.startDate)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-red-600" />
                                    <span>
                                      إلى: {formatDate(exemption.endDate)}
                                    </span>
                                  </div>
                                  <p>المعتمد بواسطة: {exemption.approvedBy}</p>
                                  {exemption.notes && (
                                    <p className="text-gray-500">
                                      {exemption.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  handleToggleExemptionStatus(
                                    exemption.id,
                                    exemption.isActive
                                  )
                                }
                                className={`p-2 rounded-lg transition-colors ${
                                  exemption.isActive
                                    ? "text-red-600 hover:bg-red-50"
                                    : "text-green-600 hover:bg-green-50"
                                }`}
                                title={
                                  exemption.isActive ? "إلغاء التفعيل" : "تفعيل"
                                }
                              >
                                {exemption.isActive ? "إلغاء" : "تفعيل"}
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Payment Modal - Updated with scrollable form */}
      {showPaymentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto z-50">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full" 
            dir="rtl">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
                <h2 className="text-xl font-bold text-gray-900">
                  إضافة دفعة جديدة
                </h2>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <form
                onSubmit={handlePaymentSubmit}
                className="flex-1 overflow-y-auto p-6 space-y-6"
              >
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-gray-700">
                    <span className="font-semibold">الطالب:</span>{" "}
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">الرقم الجامعي:</span>{" "}
                    {selectedStudent.studentId}
                  </p>
                  {selectedStudent.hasOutstandingPayment && (
                    <p className="text-red-700 font-semibold">
                      المبلغ المتبقي:{" "}
                      {formatCurrency(selectedStudent.outstandingAmount)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    نوع الدفع *
                  </label>
                  <select
                    value={paymentFormData.paymentType}
                    onChange={(e) =>
                      setPaymentFormData({
                        ...paymentFormData,
                        paymentType: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="MonthlyFee">الإيجار الشهري</option>
                    <option value="MissedMealPenalty">
                      غرامة الوجبات الفائتة
                    </option>
                    <option value="Other">دفعة أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    المبلغ *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={paymentFormData.amount}
                    onChange={(e) =>
                      setPaymentFormData({
                        ...paymentFormData,
                        amount: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="أدخل المبلغ"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    تاريخ الدفع *
                  </label>
                  <input
                    type="date"
                    value={paymentFormData.paymentDate}
                    onChange={(e) =>
                      setPaymentFormData({
                        ...paymentFormData,
                        paymentDate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {paymentFormData.paymentType === "MonthlyFee" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        الشهر
                      </label>
                      <select
                        value={paymentFormData.month}
                        onChange={(e) =>
                          setPaymentFormData({
                            ...paymentFormData,
                            month: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(
                          (month) => (
                            <option key={month} value={month}>
                              {month}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        السنة
                      </label>
                      <input
                        type="number"
                        value={paymentFormData.year}
                        onChange={(e) =>
                          setPaymentFormData({
                            ...paymentFormData,
                            year: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                        min="2020"
                        max="2100"
                      />
                    </div>
                  </div>
                )}

                {paymentFormData.paymentType === "MissedMealPenalty" && (
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      عدد الوجبات الفائتة
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={paymentFormData.missedMealsCount}
                      onChange={(e) =>
                        setPaymentFormData({
                          ...paymentFormData,
                          missedMealsCount: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    رقم الإيصال *
                  </label>
                  <input
                    type="text"
                    value={paymentFormData.receiptNumber}
                    onChange={(e) =>
                      setPaymentFormData({
                        ...paymentFormData,
                        receiptNumber: e.target.value.trim(), // Trim whitespace
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    placeholder="أدخل رقم الإيصال"
                    minLength={1} // Ensure it's not empty
                  />
                </div>
              </form>

              <div className="p-6 border-t border-gray-200 shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    onClick={handlePaymentSubmit}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    إضافة مدفوعات
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exemption Modal - Updated with scrollable form */}
      {showExemptionModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div
            className="bg-white rounded-lg max-w-md w-full max-h-[90vh] flex flex-col"
            dir="rtl"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
              <h2 className="text-xl font-bold text-gray-900">
                إضافة تصريح جديد
              </h2>
              <button
                onClick={() => setShowExemptionModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <form
              onSubmit={handleExemptionSubmit}
              className="flex-1 overflow-y-auto p-6 space-y-6"
            >
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <p className="text-gray-700">
                  <span className="font-semibold">الطالب:</span>{" "}
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">الرقم الجامعي:</span>{" "}
                  {selectedStudent.studentId}
                </p>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  تاريخ البداية *
                </label>
                <input
                  type="date"
                  value={exemptionFormData.startDate}
                  onChange={(e) =>
                    setExemptionFormData({
                      ...exemptionFormData,
                      startDate: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  تاريخ النهاية *
                </label>
                <input
                  type="date"
                  value={exemptionFormData.endDate}
                  onChange={(e) =>
                    setExemptionFormData({
                      ...exemptionFormData,
                      endDate: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  ملاحظات (اختياري)
                </label>
                <textarea
                  value={exemptionFormData.notes}
                  onChange={(e) =>
                    setExemptionFormData({
                      ...exemptionFormData,
                      notes: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  rows={3}
                ></textarea>
              </div>

              {exemptionFormData.startDate && exemptionFormData.endDate && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    <span className="font-semibold">مدة التصريح:</span>{" "}
                    {Math.ceil(
                      (new Date(exemptionFormData.endDate).getTime() -
                        new Date(exemptionFormData.startDate).getTime()) /
                        (1000 * 60 * 60 * 24)
                    ) + 1}{" "}
                    يوم
                  </p>
                </div>
              )}
            </form>

            <div className="p-6 border-t border-gray-200 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowExemptionModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  onClick={handleExemptionSubmit}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  إضافة التصريح
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
