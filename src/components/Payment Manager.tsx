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
  User,
  Clock,
  Lock,
  Package,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Shield,
  ShieldOff,
  Utensils,
} from "lucide-react";
import { fetchAPI } from "../lib/api";

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
  paymentType: "MonthlyFee" | "MissedMealPenalty" | "LostReplacement" | "Other";
  paymentTypeDisplay: string;
  paymentDate: string;
  receiptNumber: string;
  month: number | null;
  year: number | null;
  missedMealsCount: number | null;
  modifiedBy: string;
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
  modifiedBy: string;
  approvedBy: string;
  approvedDate: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentSummary {
  studentNationalId: string;
  studentId: string;
  studentName: string;
  totalPaid: number;
  outstandingAmount: number;
  lastPaymentDate: string | null;
  recentTransactions: PaymentTransaction[];
  outstandingTiles?: OutstandingPaymentItem[];
}

// NEW: Outstanding Payment Tile types

type OutstandingReason = "MonthlyFees" | "MissedMeals" | "LostReplacement" | "Other";

interface OutstandingPaymentItem {
  id: number;
  studentNationalId: string;
  reason: OutstandingReason;
  reasonDisplay: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  isPaid: boolean;
  missedMealsCount: number | null;
  periodReference: string | null;
  description: string | null;
  createdAt: string;
}

interface StudentOutstandingTiles {
  studentNationalId: string;
  studentId: string;
  studentName: string;
  totalOutstanding: number;
  tiles: OutstandingPaymentItem[];
}

interface GlobalExemptionStatus {
  hasGlobalExemption: boolean;
  globalExemptionStartDate: string | null;
  globalExemptionEndDate: string | null;
}

interface BulkMissedMealsResult {
  totalStudentsProcessed: number;
  totalAmountAdded: number;
  tilesCreated: number;
}

// Get logged-in user info
const getCurrentUser = () => {
  try {
    const userInfoStr = localStorage.getItem("userInfo");
    if (userInfoStr) {
      const userInfo = JSON.parse(userInfoStr);
      return {
        username: userInfo.username || "المسؤول",
        role: userInfo.role || "مسؤول",
      };
    }
  } catch (error) {
    console.error("Error getting user info:", error);
  }
  return { username: "المسؤول", role: "مسؤول" };
};

// Get current date in Egypt time zone for default form values
// Get current date in Egypt time zone for default form values - IMPROVED
// Get current date in Egypt time zone for default form values - FIXED VERSION
const getEgyptDate = () => {
  try {
    // Create date in Egypt timezone
    const now = new Date();

    // Convert to Egypt timezone string
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Create date parts
    const parts = formatter.formatToParts(now);
    const getPart = (type: string) => parts.find((p) => p.type === type)?.value;

    const year = getPart("year") || "2026";
    const month = getPart("month") || "01";
    const day = getPart("day") || "21";

    // Return date-only for date inputs
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Error getting Egypt date:", error);
    // Fallback - but ensure it's date-only
    return new Date().toISOString().split("T")[0];
  }
};

// Reason display helpers
const reasonLabels: Record<OutstandingReason, string> = {
  MonthlyFees: "الإيجار الشهري",
  MissedMeals: "غرامة الوجبات الفائتة",
  LostReplacement: "بدل فاقد",
  Other: "أخرى",
};

const reasonColors: Record<OutstandingReason, string> = {
  MonthlyFees: "blue",
  MissedMeals: "red",
  LostReplacement: "orange",
  Other: "gray",
};

export default function PaymentManagerArabic() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(
    null,
  );
  const [paymentExemptions, setPaymentExemptions] = useState<
    PaymentExemption[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExemptionModal, setShowExemptionModal] = useState(false);
  const [showBulkFeesModal, setShowBulkFeesModal] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [exemptionSubmitting, setExemptionSubmitting] = useState(false);
  const [bulkFeesSubmitting, setBulkFeesSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState({ username: "", role: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [currentTransactionPage, setCurrentTransactionPage] = useState(1);
  const transactionsPerPage = 5;

  // Bulk Fees States
  const [bulkFeesMonth, setBulkFeesMonth] = useState("");
  const [bulkFeesDormTypes, setBulkFeesDormTypes] = useState<any[]>([]);
  const [bulkFeesAmounts, setBulkFeesAmounts] = useState<{
    [key: number]: string;
  }>({});
  const [bulkFeesDescription, setBulkFeesDescription] = useState("");

  // NEW: Outstanding tiles state
  const [outstandingTiles, setOutstandingTiles] = useState<OutstandingPaymentItem[]>([]);
  const [tilesLoading, setTilesLoading] = useState(false);

  // NEW: Pay tile modal state
  const [showPayTileModal, setShowPayTileModal] = useState(false);
  const [selectedTile, setSelectedTile] = useState<OutstandingPaymentItem | null>(null);
  const [payTileReceiptNumber, setPayTileReceiptNumber] = useState("");
  const [payTileSubmitting, setPayTileSubmitting] = useState(false);

  // NEW: Bulk missed meals modal state
  const [showBulkMissedMealsModal, setShowBulkMissedMealsModal] = useState(false);
  const [bulkMissedMealsFromDate, setBulkMissedMealsFromDate] = useState(getEgyptDate());
  const [bulkMissedMealsToDate, setBulkMissedMealsToDate] = useState(getEgyptDate());
  const [bulkMissedMealsApplyGlobalExemption, setBulkMissedMealsApplyGlobalExemption] = useState(false);
  const [bulkMissedMealsSubmitting, setBulkMissedMealsSubmitting] = useState(false);

  // NEW: Global exemption state
  const [globalExemption, setGlobalExemption] = useState<GlobalExemptionStatus | null>(null);
  const [globalExemptionLoading, setGlobalExemptionLoading] = useState(false);

  const [paymentFormData, setPaymentFormData] = useState({
    amount: "",
    paymentType: "MonthlyFee" as
      | "MonthlyFee"
      | "MissedMealPenalty"
      | "LostReplacement"
      | "Other",
    paymentDate: getEgyptDate(),
    receiptNumber: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    missedMealsCount: "",
  });

  const [exemptionFormData, setExemptionFormData] = useState({
    startDate: getEgyptDate(),
    endDate: getEgyptDate(),
    notes: "",
  });

  // Get current user on component mount
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  // Fetch all students on component mount
  useEffect(() => {
    fetchStudents();
    fetchGlobalExemptionStatus();
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
        s.nationalId.toLowerCase().includes(term),
    );
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Transaction Pagination
  const recentTransactions = paymentSummary?.recentTransactions || [];
  const totalTransactionPages = Math.ceil(
    recentTransactions.length / transactionsPerPage,
  );
  const transactionStartIndex =
    (currentTransactionPage - 1) * transactionsPerPage;
  const paginatedTransactions = recentTransactions.slice(
    transactionStartIndex,
    transactionStartIndex + transactionsPerPage,
  );

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI("/api/Students");
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
      setLoading(true);

      // Fetch payment summary
      try {
        const summaryData = await fetchAPI(
          `/api/PaymentTransactions/summary/${studentNationalId}`,
        );
        setPaymentSummary(summaryData);
      } catch (summaryError) {
        console.error("Error fetching payment summary:", summaryError);
        setPaymentSummary(null);
      }

      // Fetch payment exemptions
      try {
        const exemptionsData = await fetchAPI(
          `/api/PaymentExemptions/student/${studentNationalId}`,
        );
        setPaymentExemptions(exemptionsData || []);
      } catch (exemptionsError) {
        console.error("Error fetching exemptions:", exemptionsError);
        setPaymentExemptions([]);
      }
    } catch (err: any) {
      console.error("Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Fetch outstanding tiles for a student
  const fetchOutstandingTiles = async (studentNationalId: string) => {
    try {
      setTilesLoading(true);
      const data: StudentOutstandingTiles = await fetchAPI(
        `/api/PaymentTransactions/outstanding-tiles/${studentNationalId}`,
      );
      setOutstandingTiles(data?.tiles || []);
    } catch (err: any) {
      console.error("Error fetching outstanding tiles:", err);
      setOutstandingTiles([]);
    } finally {
      setTilesLoading(false);
    }
  };

  // NEW: Fetch global exemption status
  const fetchGlobalExemptionStatus = async () => {
    try {
      setGlobalExemptionLoading(true);
      const data: GlobalExemptionStatus = await fetchAPI("/api/PaymentTransactions/global-exemption");
      setGlobalExemption(data);
    } catch (err: any) {
      console.error("Error fetching global exemption:", err);
      setGlobalExemption(null);
    } finally {
      setGlobalExemptionLoading(false);
    }
  };

  // NEW: Toggle global exemption
  const handleToggleGlobalExemption = async () => {
    const currentlyEnabled = globalExemption?.hasGlobalExemption ?? false;
    const action = currentlyEnabled ? "إلغاء الإعفاء العام" : "تفعيل الإعفاء العام";
    if (!confirm(`هل أنت متأكد من ${action}؟`)) return;
    try {
      setGlobalExemptionLoading(true);
      await fetchAPI(`/api/PaymentTransactions/global-exemption?enable=${!currentlyEnabled}`, {
        method: "POST",
      });
      alert(`تم ${action} بنجاح`);
      await fetchGlobalExemptionStatus();
    } catch (err: any) {
      alert(err.message || `حدث خطأ أثناء ${action}`);
    } finally {
      setGlobalExemptionLoading(false);
    }
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setCurrentTransactionPage(1);
    fetchStudentPayments(student.nationalId);
    fetchOutstandingTiles(student.nationalId);
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
      setPaymentSubmitting(true);

      // Validate amount
      const amount = parseFloat(paymentFormData.amount);

      if (isNaN(amount) || amount <= 0) {
        alert("يرجى إدخال مبلغ صحيح أكبر من الصفر");
        setPaymentSubmitting(false);
        return;
      }

      // Validate receipt number
      if (!paymentFormData.receiptNumber.trim()) {
        alert("يرجى إدخال رقم الإيصال");
        setPaymentSubmitting(false);
        return;
      }

      // Map payment types to integers (based on backend enum)
      const paymentTypeMap = {
        MonthlyFee: 1, // Was 0, now 1
        MissedMealPenalty: 2, // Was 1, now 2
        LostReplacement: 3, // New
        Other: 4, // Was 2, now 4
      };

      // Prepare payment data matching backend DTO
      const paymentData = {
        studentNationalId: selectedStudent.nationalId,
        amount: amount,
        paymentType: paymentTypeMap[paymentFormData.paymentType],
        paymentDate: paymentFormData.paymentDate,
        receiptNumber: paymentFormData.receiptNumber.trim(),
        month:
          paymentFormData.paymentType === "MonthlyFee"
            ? paymentFormData.month
            : null,
        year:
          paymentFormData.paymentType === "MonthlyFee"
            ? paymentFormData.year
            : null,
        missedMealsCount:
          paymentFormData.paymentType === "MissedMealPenalty"
            ? parseInt(paymentFormData.missedMealsCount) || 1
            : null,
      };

      console.log("Sending payment data:", paymentData);

      // Use fetchAPI for POST request
      const result = await fetchAPI("/api/PaymentTransactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      alert("تمت إضافة الدفع بنجاح");
      setShowPaymentModal(false);

      // Reset form with Egypt date
      setPaymentFormData({
        amount: "",
        paymentType: "MonthlyFee",
        paymentDate: getEgyptDate(),
        receiptNumber: "",
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        missedMealsCount: "",
      });

      // Refresh data
      fetchStudentPayments(selectedStudent.nationalId);
      fetchOutstandingTiles(selectedStudent.nationalId);
    } catch (err: any) {
      console.error("Full error details:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "حدث خطأ أثناء إضافة الدفع";
      alert(errorMsg);
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleExemptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      setExemptionSubmitting(true);

      // Validate dates
      const startDate = new Date(exemptionFormData.startDate);
      const endDate = new Date(exemptionFormData.endDate);

      if (startDate > endDate) {
        alert("تاريخ البداية يجب أن يكون قبل تاريخ النهاية");
        setExemptionSubmitting(false);
        return;
      }

      const payload = {
        studentNationalId: selectedStudent.nationalId,
        startDate: exemptionFormData.startDate,
        endDate: exemptionFormData.endDate,
        notes: exemptionFormData.notes || "",
      };

      console.log("Sending exemption data:", payload);

      await fetchAPI("/api/PaymentExemptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      alert("تمت إضافة التصريح بنجاح");
      setShowExemptionModal(false);

      // Reset form with Egypt date
      setExemptionFormData({
        startDate: getEgyptDate(),
        endDate: getEgyptDate(),
        notes: "",
      });

      // Refresh data
      fetchStudentPayments(selectedStudent.nationalId);
    } catch (err: any) {
      console.error("Error adding exemption:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "حدث خطأ أثناء إضافة التصريح";
      alert(errorMsg);
    } finally {
      setExemptionSubmitting(false);
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه العملية الدفعية؟")) return;

    try {
      await fetchAPI(`/api/PaymentTransactions/${paymentId}`, {
        method: "DELETE",
      });

      alert("تم حذف العملية الدفعية بنجاح");
      if (selectedStudent) {
        fetchStudentPayments(selectedStudent.nationalId);
        fetchOutstandingTiles(selectedStudent.nationalId);
      }
    } catch (err: any) {
      alert(err.message || "حدث خطأ أثناء حذف العملية الدفعية");
    }
  };

  const handleToggleExemptionStatus = async (
    exemptionId: number,
    isActive: boolean,
  ) => {
    const action = isActive ? "إلغاء تفعيل" : "تفعيل";
    if (!confirm(`هل أنت متأكد من ${action} هذا التصريح؟`)) return;

    try {
      console.log(
        `Toggling exemption ${exemptionId} from ${isActive} to ${!isActive}`,
      );

      const response = await fetchAPI(
        `/api/PaymentExemptions/${exemptionId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(!isActive), // Send the NEW status (opposite of current)
        },
      );

      console.log(`Toggle response:`, response);

      alert(`تم ${action} التصريح بنجاح`);

      // Force refresh - add a small delay to ensure backend has processed
      if (selectedStudent) {
        setTimeout(() => {
          fetchStudentPayments(selectedStudent.nationalId);
        }, 500);
      }
    } catch (err: any) {
      console.error(`Error ${action} exemption:`, err);
      alert(err.message || `حدث خطأ أثناء ${action} التصريح`);
    }
  };

  // Bulk Monthly Fees Functions
  const fetchAvailableDormTypes = async () => {
    try {
      const data = await fetchAPI(
        "/api/PaymentTransactions/bulk/available-dorm-types",
      );
      setBulkFeesDormTypes(data || []);
      // Initialize amounts from stored monthly fees
      const amounts: { [key: number]: string } = {};
      (data || []).forEach((dorm: any) => {
        amounts[dorm.dormTypeId] = dorm.storedMonthlyFee ? dorm.storedMonthlyFee.toString() : "";
      });
      setBulkFeesAmounts(amounts);
    } catch (err: any) {
      console.error("Error fetching dorm types:", err);
      alert(err.message || "حدث خطأ أثناء تحميل أنواع المباني");
    }
  };

  const handleBulkFeesOpen = async () => {
    setShowBulkFeesModal(true);
    // Get today's date in YYYY-MM format
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    setBulkFeesMonth(`${year}-${month}`);
    await fetchAvailableDormTypes();
  };

  const handleBulkFeesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bulkFeesMonth) {
      alert("يرجى اختيار الشهر");
      return;
    }

    // Build dormTypeAmounts only for fields that have values (backend uses stored values for omitted ones)
    const dormTypeAmounts: { [key: number]: number } = {};
    let hasAnyAmount = false;
    Object.entries(bulkFeesAmounts).forEach(([dormId, amount]) => {
      if (amount.trim() !== "") {
        dormTypeAmounts[parseInt(dormId)] = parseFloat(amount);
        hasAnyAmount = true;
      }
    });

    if (!hasAnyAmount) {
      alert("يرجى ملء مبلغ واحد على الأقل أو التأكد من وجود رسوم مخزنة");
      return;
    }

    try {
      setBulkFeesSubmitting(true);

      const payload = {
        dormTypeAmounts,
        month: bulkFeesMonth,
        description:
          bulkFeesDescription || `رسوم شهرية بتاريخ ${bulkFeesMonth}`,
      };

      const result = await fetchAPI(
        "/api/PaymentTransactions/bulk/add-monthly-fees",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      alert(
        `تم إضافة الرسوم بنجاح!\n\n` +
          `عدد الطلاب المعالجين: ${result.totalStudentsProcessed}\n` +
          `الإجمالي المضاف: ${formatCurrency(result.totalAmountAdded)}`,
      );

      // Reset and close modal
      setShowBulkFeesModal(false);
      setBulkFeesMonth("");
      setBulkFeesAmounts({});
      setBulkFeesDescription("");

      // Refresh current student if selected
      if (selectedStudent) {
        fetchStudentPayments(selectedStudent.nationalId);
        fetchOutstandingTiles(selectedStudent.nationalId);
      }
    } catch (err: any) {
      console.error("Error submitting bulk fees:", err);
      alert(err.message || "حدث خطأ أثناء إضافة الرسوم");
    } finally {
      setBulkFeesSubmitting(false);
    }
  };

  // NEW: Pay Tile handlers
  const handleOpenPayTileModal = (tile: OutstandingPaymentItem) => {
    setSelectedTile(tile);
    setPayTileReceiptNumber("");
    setShowPayTileModal(true);
  };

  const handlePayTileSubmit = async () => {
    if (!selectedTile || !selectedStudent) return;
    if (!payTileReceiptNumber.trim()) {
      alert("يرجى إدخال رقم الإيصال");
      return;
    }
    try {
      setPayTileSubmitting(true);
      await fetchAPI(`/api/PaymentTransactions/outstanding-tiles/${selectedTile.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptNumber: payTileReceiptNumber.trim() }),
      });
      alert("تم الدفع بنجاح");
      setShowPayTileModal(false);
      setSelectedTile(null);
      setPayTileReceiptNumber("");
      fetchOutstandingTiles(selectedStudent.nationalId);
      fetchStudentPayments(selectedStudent.nationalId);
      fetchStudents();
    } catch (err: any) {
      console.error("Error paying tile:", err);
      alert(err.response?.data?.message || err.message || "حدث خطأ أثناء عملية الدفع");
    } finally {
      setPayTileSubmitting(false);
    }
  };

  // NEW: Bulk Missed Meals handlers
  const handleBulkMissedMealsOpen = () => {
    setBulkMissedMealsFromDate(getEgyptDate());
    setBulkMissedMealsToDate(getEgyptDate());
    setBulkMissedMealsApplyGlobalExemption(false);
    setShowBulkMissedMealsModal(true);
  };

  const handleBulkMissedMealsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkMissedMealsFromDate || !bulkMissedMealsToDate) {
      alert("يرجى اختيار تاريخ البداية والنهاية");
      return;
    }
    if (new Date(bulkMissedMealsFromDate) > new Date(bulkMissedMealsToDate)) {
      alert("تاريخ البداية يجب أن يكون قبل تاريخ النهاية");
      return;
    }
    try {
      setBulkMissedMealsSubmitting(true);
      const payload = {
        fromDate: bulkMissedMealsFromDate,
        toDate: bulkMissedMealsToDate,
        applyGlobalExemption: bulkMissedMealsApplyGlobalExemption,
      };
      const result: BulkMissedMealsResult = await fetchAPI(
        "/api/PaymentTransactions/bulk/add-missed-meals",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      alert(
        `تم إضافة غرامات الوجبات الفائتة بنجاح!\n\n` +
          `عدد الطلاب المعالجين: ${result.totalStudentsProcessed}\n` +
          `الإجمالي المضاف: ${formatCurrency(result.totalAmountAdded)}\n` +
          `عدد البطاقات المنشأة: ${result.tilesCreated}`,
      );
      setShowBulkMissedMealsModal(false);
      fetchGlobalExemptionStatus();
      if (selectedStudent) {
        fetchStudentPayments(selectedStudent.nationalId);
        fetchOutstandingTiles(selectedStudent.nationalId);
      }
      fetchStudents();
    } catch (err: any) {
      console.error("Error submitting bulk missed meals:", err);
      alert(err.message || "حدث خطأ أثناء إضافة غرامات الوجبات الفائتة");
    } finally {
      setBulkMissedMealsSubmitting(false);
    }
  };

  // Format date and time for display using Egypt time zone
  // Format date and time for display using Egypt time zone - IMPROVED VERSION
  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);

      // Format with Egypt locale WITHOUT adding extra hours
      return date.toLocaleString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Africa/Cairo", // Specify Egypt timezone
      });
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return "تاريخ غير صحيح";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Africa/Cairo",
      });
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return "تاريخ غير صحيح";
    }
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
      case "LostReplacement":
        return "text-orange-600";
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
      case "LostReplacement":
        return <Package className="w-5 h-5" />;
      case "Other":
        return <FileText className="w-5 h-5" />;
      default:
        return <DollarSign className="w-5 h-5" />;
    }
  };

  // Function to display user and timestamp info
  // Function to display user and timestamp info - FIXED VERSION
  const UserInfoDisplay = ({
    modifiedBy,
    createdAt,
    updatedAt,
    type = "payment",
  }: {
    modifiedBy?: string;
    createdAt?: string;
    updatedAt?: string;
    type?: "payment" | "exemption";
  }) => {
    // For payments: always show createdAt
    // For exemptions: show updatedAt if it exists and is different from createdAt, otherwise show createdAt
    let displayDate = createdAt;
    let label = "التاريخ";

    if (type === "exemption" && updatedAt && createdAt !== updatedAt) {
      displayDate = updatedAt;
      label = "آخر تحديث";
    }

    if (!displayDate && !modifiedBy) return null;

    return (
      <div className="mt-2 pt-2 border-t border-gray-200 border-dashed">
        <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
          {modifiedBy && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>أضيف بواسطة: {modifiedBy}</span>
            </div>
          )}
          {displayDate && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>
                {label}: {formatDateTime(displayDate)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header with current user info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                إدارة المدفوعات والتصاريح
              </h1>
              <p className="text-gray-600">
                إدارة مدفوعات وتصاريح الطلاب في السكن الجامعي
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Bulk Buttons - Only for Registration Users */}
              {currentUser.role === "Registration" && (
                <>
                  <button
                    onClick={handleBulkFeesOpen}
                    className="px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2 whitespace-nowrap"
                  >
                    <Plus className="w-5 h-5" />
                    إضافة رسوم شهرية
                  </button>
                  <button
                    onClick={handleBulkMissedMealsOpen}
                    className="px-5 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center gap-2 whitespace-nowrap"
                  >
                    <Utensils className="w-5 h-5" />
                    إضافة غرامات وجبات فائتة
                  </button>
                </>
              )}
              {currentUser.username && (
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                  <p className="text-blue-700 font-semibold">
                    <User className="w-4 h-4 inline-block ml-1" />
                    {currentUser.username}
                  </p>
                  <p className="text-blue-600 text-sm">{currentUser.role}</p>
                </div>
              )}
            </div>
          </div>

          {/* Global Exemption Widget */}
          {currentUser.role === "Registration" && (
            <div className="mt-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  {globalExemption?.hasGlobalExemption ? (
                    <Shield className="w-6 h-6 text-green-600" />
                  ) : (
                    <ShieldOff className="w-6 h-6 text-gray-400" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">
                      الإعفاء العام من استلام الوجبات
                    </p>
                    {globalExemption?.hasGlobalExemption ? (
                      <p className="text-sm text-green-700">
                        مفعّل — من{" "}
                        {globalExemption.globalExemptionStartDate
                          ? formatDate(globalExemption.globalExemptionStartDate)
                          : "—"}{" "}
                        إلى{" "}
                        {globalExemption.globalExemptionEndDate
                          ? formatDate(globalExemption.globalExemptionEndDate)
                          : "—"}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">غير مفعّل</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleToggleGlobalExemption}
                  disabled={globalExemptionLoading}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    globalExemption?.hasGlobalExemption
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  } disabled:opacity-50`}
                >
                  {globalExemptionLoading
                    ? "جاري..."
                    : globalExemption?.hasGlobalExemption
                      ? "إلغاء الإعفاء"
                      : "تفعيل الإعفاء"}
                </button>
              </div>
            </div>
          )}
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

            {/* Results Count */}
            <div className="px-6 py-2 text-sm text-gray-500 border-b border-gray-100">
              عرض {filteredStudents.length > 0 ? startIndex + 1 : 0} إلى{" "}
              {Math.min(startIndex + itemsPerPage, filteredStudents.length)} من{" "}
              {filteredStudents.length} طالب
            </div>

            {/* Students List */}
            <div className="overflow-y-auto" style={{ maxHeight: "480px" }}>
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
                  {paginatedStudents.map((student) => (
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-50 flex items-center gap-1 text-sm"
                >
                  التالي <ChevronRight className="w-4 h-4" />
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }).map(
                    (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-sm ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    },
                  )}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-50 flex items-center gap-1 text-sm"
                >
                  <ChevronLeft className="w-4 h-4" /> السابق
                </button>
              </div>
            )}
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

                {/* Outstanding Payment Tiles (NEW) */}
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    المبالغ المستحقة
                  </h3>
                  {tilesLoading ? (
                    <p className="text-gray-500 text-center py-4">جاري التحميل...</p>
                  ) : outstandingTiles.length === 0 ? (
                    <div className="text-center py-6">
                      <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                      <p className="text-gray-500">لا توجد مبالغ مستحقة</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {outstandingTiles.map((tile) => {
                        const color = reasonColors[tile.reason] || "gray";
                        const bgClass = tile.isPaid
                          ? "border-green-200 bg-green-50 opacity-70"
                          : color === "blue"
                            ? "border-blue-200 bg-blue-50"
                            : color === "red"
                              ? "border-red-200 bg-red-50"
                              : color === "orange"
                                ? "border-orange-200 bg-orange-50"
                                : "border-gray-200 bg-gray-50";
                        const textClass =
                          color === "blue"
                            ? "text-blue-700"
                            : color === "red"
                              ? "text-red-700"
                              : color === "orange"
                                ? "text-orange-700"
                                : "text-gray-700";
                        const iconClass =
                          color === "blue"
                            ? "text-blue-600"
                            : color === "red"
                              ? "text-red-600"
                              : color === "orange"
                                ? "text-orange-600"
                                : "text-gray-600";
                        return (
                          <div
                            key={tile.id}
                            className={`p-4 rounded-lg border-2 ${bgClass}`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={iconClass}>
                                    {tile.reason === "MonthlyFees" && <CreditCard className="w-5 h-5" />}
                                    {tile.reason === "MissedMeals" && <Utensils className="w-5 h-5" />}
                                    {tile.reason === "LostReplacement" && <Package className="w-5 h-5" />}
                                    {tile.reason === "Other" && <FileText className="w-5 h-5" />}
                                  </span>
                                  <span className={`font-bold ${textClass}`}>
                                    {tile.reasonDisplay || reasonLabels[tile.reason] || tile.reason}
                                  </span>
                                  {tile.isPaid && (
                                    <span className="px-2 py-0.5 bg-green-200 text-green-800 text-xs rounded-full font-semibold">
                                      مدفوع
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm mb-1">
                                  <div>
                                    <span className="text-gray-500">الإجمالي:</span>{" "}
                                    <span className="font-semibold">{formatCurrency(tile.amount)}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">المدفوع:</span>{" "}
                                    <span className="font-semibold text-green-700">
                                      {formatCurrency(tile.paidAmount)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">المتبقي:</span>{" "}
                                    <span className="font-semibold text-red-700">
                                      {formatCurrency(tile.remainingAmount)}
                                    </span>
                                  </div>
                                </div>
                                {tile.missedMealsCount != null && tile.missedMealsCount > 0 && (
                                  <p className="text-xs text-gray-500">
                                    عدد الوجبات الفائتة: {tile.missedMealsCount}
                                  </p>
                                )}
                                {tile.periodReference && (
                                  <p className="text-xs text-gray-500">الفترة: {tile.periodReference}</p>
                                )}
                                {tile.description && (
                                  <p className="text-xs text-gray-500">{tile.description}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                  أنشئ في: {formatDateTime(tile.createdAt)}
                                </p>
                              </div>
                              {/* Pay button */}
                              {!tile.isPaid && (
                                <button
                                  onClick={() => handleOpenPayTileModal(tile)}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm flex items-center gap-1 mr-3"
                                >
                                  <DollarSign className="w-4 h-4" />
                                  دفع
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Payments */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-3">
                    آخر المدفوعات
                  </h3>
                  {recentTransactions.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      لا توجد مدفوعات مسجلة
                    </p>
                  ) : (
                    <>
                      {/* Results Count */}
                      <div className="text-sm text-gray-500 border-b border-gray-100 pb-2 mb-3">
                        عرض{" "}
                        {recentTransactions.length > 0
                          ? transactionStartIndex + 1
                          : 0}{" "}
                        إلى{" "}
                        {Math.min(
                          transactionStartIndex + transactionsPerPage,
                          recentTransactions.length,
                        )}{" "}
                        من {recentTransactions.length} دفعة
                      </div>
                      <div className="space-y-3">
                        {paginatedTransactions.map((payment) => (
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
                                      payment.paymentType,
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
                                    <p>
                                      عدد الوجبات: {payment.missedMealsCount}
                                    </p>
                                  )}
                                </div>
                                {/* Display modifiedBy and timestamp */}
                                <UserInfoDisplay
                                  modifiedBy={payment.modifiedBy}
                                  createdAt={payment.createdAt}
                                  type="payment"
                                />
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

                      {/* Transaction Pagination */}
                      {totalTransactionPages > 1 && (
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                          <button
                            onClick={() =>
                              setCurrentTransactionPage(
                                Math.min(
                                  totalTransactionPages,
                                  currentTransactionPage + 1,
                                ),
                              )
                            }
                            disabled={
                              currentTransactionPage === totalTransactionPages
                            }
                            className="px-3 py-1 border rounded-lg disabled:opacity-50 flex items-center gap-1 text-sm"
                          >
                            التالي <ChevronRight className="w-4 h-4" />
                          </button>

                          <div className="flex gap-1">
                            {Array.from({
                              length: Math.min(totalTransactionPages, 5),
                            }).map((_, i) => {
                              let pageNum: number;
                              if (totalTransactionPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentTransactionPage <= 3) {
                                pageNum = i + 1;
                              } else if (
                                currentTransactionPage >=
                                totalTransactionPages - 2
                              ) {
                                pageNum = totalTransactionPages - 4 + i;
                              } else {
                                pageNum = currentTransactionPage - 2 + i;
                              }
                              return (
                                <button
                                  key={pageNum}
                                  onClick={() =>
                                    setCurrentTransactionPage(pageNum)
                                  }
                                  className={`w-8 h-8 rounded-lg text-sm ${
                                    currentTransactionPage === pageNum
                                      ? "bg-blue-600 text-white"
                                      : "hover:bg-gray-100"
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>

                          <button
                            onClick={() =>
                              setCurrentTransactionPage(
                                Math.max(1, currentTransactionPage - 1),
                              )
                            }
                            disabled={currentTransactionPage === 1}
                            className="px-3 py-1 border rounded-lg disabled:opacity-50 flex items-center gap-1 text-sm"
                          >
                            <ChevronLeft className="w-4 h-4" /> السابق
                          </button>
                        </div>
                      )}
                    </>
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
                                  {exemption.approvedBy && (
                                    <p className="text-green-700">
                                      <span className="font-semibold">
                                        المعتمد بواسطة:
                                      </span>{" "}
                                      {exemption.approvedBy}
                                    </p>
                                  )}
                                  {exemption.notes && (
                                    <p className="text-gray-500">
                                      {exemption.notes}
                                    </p>
                                  )}
                                </div>
                                {/* Display modifiedBy and timestamps */}
                                <UserInfoDisplay
                                  modifiedBy={exemption.modifiedBy}
                                  createdAt={exemption.createdAt}
                                  updatedAt={exemption.updatedAt}
                                  type="exemption"
                                />
                              </div>
                              <button
                                onClick={() =>
                                  handleToggleExemptionStatus(
                                    exemption.id,
                                    exemption.isActive,
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

      {/* Add Payment Modal - with read-only student info */}
      {showPaymentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto z-50">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full" dir="rtl">
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

              <div className="max-h-[60vh] overflow-y-auto p-6">
                <form onSubmit={handlePaymentSubmit} className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <div className="flex items-start gap-2 mb-2">
                      <Lock className="w-4 h-4 text-blue-600 mt-1" />
                      <div>
                        <p className="text-gray-700 font-semibold">
                          معلومات الطالب (غير قابلة للتعديل)
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-gray-700">
                        <span className="font-semibold">الاسم:</span>{" "}
                        {selectedStudent.firstName} {selectedStudent.lastName}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold">الرقم الجامعي:</span>{" "}
                        {selectedStudent.studentId}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold">الرقم القومي:</span>{" "}
                        {selectedStudent.nationalId}
                      </p>
                    </div>
                    {selectedStudent.hasOutstandingPayment && (
                      <p className="text-red-700 font-semibold mt-2">
                        المبلغ المتبقي:{" "}
                        {formatCurrency(selectedStudent.outstandingAmount)}
                      </p>
                    )}
                    {currentUser.username && (
                      <p className="text-blue-700 text-sm mt-2">
                        <User className="w-4 h-4 inline-block ml-1" />
                        سيتم تسجيل هذه العملية باسم:{" "}
                        <span className="font-semibold">
                          {currentUser.username}
                        </span>
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
                      <option value="LostReplacement">بدل فائد</option>
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
                            ),
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
                        عدد الوجبات الفائتة *
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
                          receiptNumber: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      placeholder="أدخل رقم الإيصال"
                    />
                  </div>
                </form>
              </div>

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
                    type="button"
                    onClick={handlePaymentSubmit}
                    disabled={paymentSubmitting}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {paymentSubmitting ? "جاري الإضافة..." : "إضافة مدفوعات"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Exemption Modal - with read-only student info and auto-approvedBy */}
      {showExemptionModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto z-50">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full" dir="rtl">
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

              <div className="max-h-[60vh] overflow-y-auto p-6">
                <form onSubmit={handleExemptionSubmit} className="space-y-6">
                  <div className="bg-green-50 p-4 rounded-lg mb-4">
                    <div className="flex items-start gap-2 mb-2">
                      <Lock className="w-4 h-4 text-green-600 mt-1" />
                      <div>
                        <p className="text-gray-700 font-semibold">
                          معلومات الطالب (غير قابلة للتعديل)
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-gray-700">
                        <span className="font-semibold">الاسم:</span>{" "}
                        {selectedStudent.firstName} {selectedStudent.lastName}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold">الرقم الجامعي:</span>{" "}
                        {selectedStudent.studentId}
                      </p>
                      <p className="text-gray-700">
                        <span className="font-semibold">الرقم القومي:</span>{" "}
                        {selectedStudent.nationalId}
                      </p>
                    </div>
                    {currentUser.username && (
                      <p className="text-green-700 text-sm mt-2">
                        <User className="w-4 h-4 inline-block ml-1" />
                        سيتم تسجيل هذا التصريح باسم:{" "}
                        <span className="font-semibold">
                          {currentUser.username}
                        </span>
                      </p>
                    )}
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
                      placeholder="أدخل أي ملاحظات إضافية عن التصريح..."
                    ></textarea>
                  </div>

                  {exemptionFormData.startDate && exemptionFormData.endDate && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-gray-700">
                        <span className="font-semibold">مدة التصريح:</span>{" "}
                        {Math.ceil(
                          (new Date(exemptionFormData.endDate).getTime() -
                            new Date(exemptionFormData.startDate).getTime()) /
                            (1000 * 60 * 60 * 24),
                        ) + 1}{" "}
                        يوم
                      </p>
                    </div>
                  )}
                </form>
              </div>

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
                    type="button"
                    onClick={handleExemptionSubmit}
                    disabled={exemptionSubmitting}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exemptionSubmitting ? "جاري الإضافة..." : "إضافة التصريح"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Monthly Fees Modal */}
      {showBulkFeesModal && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto z-50">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full" dir="rtl">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
                <h2 className="text-xl font-bold text-gray-900">
                  إضافة رسوم شهرية للطلاب
                </h2>
                <button
                  onClick={() => setShowBulkFeesModal(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <form
                onSubmit={handleBulkFeesSubmit}
                className="p-6 space-y-6 max-h-96 overflow-y-auto"
              >
                {/* Month Selector */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    اختر الشهر *
                  </label>
                  <input
                    type="month"
                    value={bulkFeesMonth}
                    onChange={(e) => setBulkFeesMonth(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Dorm Types */}
                {bulkFeesDormTypes.length > 0 ? (
                  <div>
                    <label className="block text-gray-700 font-semibold mb-4">
                      إدخل المبلغ لكل نوع مبنى (القيم المخزنة محملة تلقائياً)
                    </label>
                    <div className="space-y-3">
                      {bulkFeesDormTypes.map((dorm) => (
                        <div
                          key={dorm.dormTypeId}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <label className="font-semibold text-gray-700">
                              {dorm.dormTypeName}
                            </label>
                            <span className="text-sm text-gray-500">
                              {dorm.studentCount} طالب
                              {dorm.storedMonthlyFee ? ` • محفوظ: ${dorm.storedMonthlyFee} جنيه` : ""}
                            </span>
                          </div>
                          <input
                            type="number"
                            readOnly
                            placeholder={dorm.storedMonthlyFee ? `القيمة المخزنة: ${dorm.storedMonthlyFee}` : "أدخل المبلغ"}
                            value={bulkFeesAmounts[dorm.dormTypeId] || ""}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-yellow-700">
                      جاري تحميل أنواع المباني...
                    </p>
                  </div>
                )}

                {/* Description (Optional) */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    وصف (اختياري)
                  </label>
                  <textarea
                    value={bulkFeesDescription}
                    onChange={(e) => setBulkFeesDescription(e.target.value)}
                    placeholder="أضف وصف للعملية"
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Summary */}
                {Object.values(bulkFeesAmounts).some(
                  (val) => val.trim() !== "",
                ) && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-green-700 font-semibold mb-2">
                      ملخص الرسوم:
                    </p>
                    <div className="space-y-1">
                      {bulkFeesDormTypes.map((dorm) => {
                        const amount = bulkFeesAmounts[dorm.dormTypeId];
                        if (!amount || amount === "") return null;
                        const eligibleCount = dorm.nonExemptCount || 0;
                        const exemptCount = Math.max(0, dorm.studentCount - eligibleCount);
                        const totalForDorm = parseFloat(amount) * eligibleCount;
                        return (
                          <div key={dorm.dormTypeId} className="text-sm space-y-1">
                            <div className="text-green-600">
                              {dorm.dormTypeName}: {formatCurrency(parseFloat(amount))} × {eligibleCount} = {formatCurrency(totalForDorm)}
                            </div>
                            {exemptCount > 0 && (
                              <div className="text-xs text-gray-600">
                                المعفيون: {exemptCount} طالب (لم تُحتسب في الإجمالي)
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div className="border-t border-green-200 pt-2 mt-2 font-semibold text-green-700">
                        الإجمالي:{" "}
                        {formatCurrency(
                          bulkFeesDormTypes.reduce((total, dorm) => {
                            const amount = bulkFeesAmounts[dorm.dormTypeId];
                            if (!amount || amount === "") return total;
                            const eligibleCount = dorm.nonExemptCount || 0;
                            return total + parseFloat(amount) * eligibleCount;
                          }, 0),
                        )}
                      </div>

                      {/* Summary Stats */}
                      <div className="border-t border-green-200 pt-3 mt-3 space-y-2 text-sm">
                        <div className="flex justify-between text-green-700">
                          <span>عدد الطلاب المؤهلين:</span>
                          <span className="font-semibold">
                            {bulkFeesDormTypes.reduce((total, dorm) => {
                              const amount = bulkFeesAmounts[dorm.dormTypeId];
                              if (!amount || amount === "") return total;
                              return total + (dorm.nonExemptCount || 0);
                            }, 0)}{" "}
                            طالب
                          </span>
                        </div>
                        <div className="flex justify-between text-orange-600">
                          <span>عدد الطلاب المعفيين:</span>
                          <span className="font-semibold">
                            {bulkFeesDormTypes.reduce((total, dorm) => {
                              const amount = bulkFeesAmounts[dorm.dormTypeId];
                              if (!amount || amount === "") return total;
                              const exemptCount = Math.max(0, dorm.studentCount - (dorm.nonExemptCount || 0));
                              return total + exemptCount;
                            }, 0)}{" "}
                            طالب (تكلفة: {formatCurrency(0)})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowBulkFeesModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={
                      bulkFeesSubmitting ||
                      bulkFeesDormTypes.length === 0 ||
                      !Object.values(bulkFeesAmounts).some(
                        (val) => val.trim() !== "",
                      )
                    }
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bulkFeesSubmitting ? "جاري الإضافة..." : "إضافة الرسوم"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Pay Tile Modal (NEW) */}
      {showPayTileModal && selectedTile && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto z-50">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full" dir="rtl">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">دفع مبلغ مستحق</h2>
                <button
                  onClick={() => setShowPayTileModal(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Student info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <Lock className="w-4 h-4 text-blue-600 mt-1" />
                    <p className="text-gray-700 font-semibold">معلومات الطالب</p>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-semibold">الاسم:</span> {selectedStudent.firstName}{" "}
                      {selectedStudent.lastName}
                    </p>
                    <p>
                      <span className="font-semibold">الرقم الجامعي:</span> {selectedStudent.studentId}
                    </p>
                    <p>
                      <span className="font-semibold">الرقم القومي:</span> {selectedStudent.nationalId}
                    </p>
                  </div>
                </div>

                {/* Tile info */}
                <div className="p-4 rounded-lg border bg-amber-50 border-amber-200">
                  <p className="font-bold text-gray-800 mb-2">
                    {selectedTile.reasonDisplay || reasonLabels[selectedTile.reason]}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">الإجمالي:</span>{" "}
                      <span className="font-semibold">{formatCurrency(selectedTile.amount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">المتبقي:</span>{" "}
                      <span className="font-semibold text-red-700">
                        {formatCurrency(selectedTile.remainingAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Receipt number input */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">رقم الإيصال *</label>
                  <input
                    type="text"
                    value={payTileReceiptNumber}
                    onChange={(e) => setPayTileReceiptNumber(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="أدخل رقم الإيصال"
                    required
                  />
                </div>

                {currentUser.username && (
                  <p className="text-blue-700 text-sm">
                    <User className="w-4 h-4 inline-block ml-1" />
                    سيتم تسجيل هذه العملية باسم: <span className="font-semibold">{currentUser.username}</span>
                  </p>
                )}
              </div>

              <div className="p-6 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPayTileModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handlePayTileSubmit}
                    disabled={payTileSubmitting || !payTileReceiptNumber.trim()}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {payTileSubmitting ? "جاري الدفع..." : `دفع ${formatCurrency(selectedTile.remainingAmount)}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Missed Meals Modal (NEW) */}
      {showBulkMissedMealsModal && (
        <div className="fixed inset-0 bg-black/50 overflow-y-auto z-50">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-md w-full" dir="rtl">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0">
                <h2 className="text-xl font-bold text-gray-900">إضافة غرامات الوجبات الفائتة</h2>
                <button
                  onClick={() => setShowBulkMissedMealsModal(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleBulkMissedMealsSubmit} className="p-6 space-y-6">
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-800">تنبيه</p>
                      <p className="text-sm text-amber-700">
                        سيتم حساب غرامة الوجبات الفائتة لجميع الطلاب (بما فيهم المعفيين من الرسوم) للفترة المحددة.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">تاريخ البداية *</label>
                  <input
                    type="date"
                    value={bulkMissedMealsFromDate}
                    onChange={(e) => setBulkMissedMealsFromDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">تاريخ النهاية *</label>
                  <input
                    type="date"
                    value={bulkMissedMealsToDate}
                    onChange={(e) => setBulkMissedMealsToDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Global Exemption Checkbox */}
                <div className="p-4 rounded-lg border border-green-200 bg-green-50">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bulkMissedMealsApplyGlobalExemption}
                      onChange={(e) => setBulkMissedMealsApplyGlobalExemption(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <div>
                      <p className="font-semibold text-green-800">تطبيق الإعفاء العام لجميع الطلاب</p>
                      <p className="text-sm text-green-700 mt-1">
                        عند التفعيل، سيتم تفعيل الإعفاء العام من اليوم حتى نهاية الشهر الحالي. لن يتم حظر الطلاب
                        المدينين من استلام الوجبات خلال هذه الفترة.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowBulkMissedMealsModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={bulkMissedMealsSubmitting}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bulkMissedMealsSubmitting ? "جاري المعالجة..." : "إضافة الغرامات"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
