import React, { useEffect, useState } from "react";
import {
  Plus,
  Calendar,
  Trash2,
  Search,
  X,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { fetchAPI } from "../lib/api"; // ✅ Import fetchAPI

interface Student {
  studentId: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  buildingNumber: string;
  roomNumber: string;
}

interface Holiday {
  id: number;
  studentId: string;
  startDate: string;
  endDate: string;
  modifiedBy: string; // Add this
  lastModifiedDate: string; // Add this
}

export default function HolidayManagerArabic() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentHolidays, setStudentHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [currentHolidayPage, setCurrentHolidayPage] = useState(1);
  const holidaysPerPage = 5;
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
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

  // Holiday Pagination
  const totalHolidayPages = Math.ceil(studentHolidays.length / holidaysPerPage);
  const holidayStartIndex = (currentHolidayPage - 1) * holidaysPerPage;
  const paginatedHolidays = studentHolidays.slice(
    holidayStartIndex,
    holidayStartIndex + holidaysPerPage,
  );

  const fetchStudents = async () => {
    try {
      setLoading(true);
      // ✅ Use fetchAPI instead of direct fetch
      const data = await fetchAPI("/api/Students");
      setStudents(data || []);
      setFilteredStudents(data || []);
    } catch (err: any) {
      alert(err.message || "حدث خطأ أثناء تحميل الطلاب");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentHolidays = async (studentId: string) => {
    try {
      // ✅ Use fetchAPI instead of direct fetch
      const data = await fetchAPI(`/api/Holidays/student/${studentId}`);
      setStudentHolidays(data || []);
    } catch (err: any) {
      alert(err.message || "حدث خطأ أثناء تحميل الإجازات");
    }
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setCurrentHolidayPage(1);
    fetchStudentHolidays(student.studentId);
  };

  const handleAddHoliday = () => {
    if (!selectedStudent) return;
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      const payload = {
        studentNationalId: selectedStudent.nationalId,
        startDate: formData.startDate,
        endDate: formData.endDate,
      };

      // ✅ Use fetchAPI for POST request too
      await fetchAPI("/api/Holidays", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      alert("تمت إضافة الإجازة بنجاح");
      setShowModal(false);
      setFormData({ startDate: "", endDate: "" });
      fetchStudentHolidays(selectedStudent.studentId);
    } catch (err: any) {
      alert(err.message || "حدث خطأ أثناء إضافة الإجازة");
    }
  };

  const handleDeleteHoliday = async (holidayId: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه الإجازة؟")) return;

    try {
      // ✅ Use fetchAPI for DELETE request
      await fetchAPI(`/api/Holidays/${holidayId}`, {
        method: "DELETE",
      });

      alert("تم حذف الإجازة بنجاح");
      if (selectedStudent) {
        fetchStudentHolidays(selectedStudent.studentId);
      }
    } catch (err: any) {
      alert(err.message || "حدث خطأ أثناء حذف الإجازة");
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);

      // Check if the date is in UTC (ends with Z or has T and ends with time)
      const isUTC =
        dateString.includes("T") &&
        (dateString.endsWith("Z") ||
          (dateString.includes(":") && dateString.includes(".")));

      let displayDate = date;

      // If it's UTC, convert to Egypt time (UTC+2)
      if (isUTC) {
        // Add 2 hours for Egypt time
        displayDate = new Date(date.getTime() + 2 * 60 * 60 * 1000);
      }

      // Format with Egypt locale
      return displayDate.toLocaleString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return "تاريخ غير صحيح";
    }
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            إدارة الإجازات
          </h1>
          <p className="text-gray-600">إدارة إجازات الطلاب في السكن الجامعي</p>
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
                          <p className="font-semibold text-gray-900">
                            {student.firstName} {student.lastName}
                          </p>
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

          {/* Student Holidays Panel */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6 border-b border-gray-200">
              {selectedStudent ? (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    إجازات الطالب
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {selectedStudent.firstName} {selectedStudent.lastName} -{" "}
                    {selectedStudent.studentId}
                  </p>
                  <button
                    onClick={handleAddHoliday}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    إضافة إجازة جديدة
                  </button>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  اختر طالباً لعرض إجازاته
                </div>
              )}
            </div>

            {/* Holidays List */}
            {selectedStudent && (
              <div className="overflow-y-auto" style={{ maxHeight: "520px" }}>
                {studentHolidays.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    لا توجد إجازات مسجلة لهذا الطالب
                  </div>
                ) : (
                  <>
                    {/* Results Count */}
                    <div className="px-6 py-2 text-sm text-gray-500 border-b border-gray-100">
                      عرض{" "}
                      {studentHolidays.length > 0 ? holidayStartIndex + 1 : 0}{" "}
                      إلى{" "}
                      {Math.min(
                        holidayStartIndex + holidaysPerPage,
                        studentHolidays.length,
                      )}{" "}
                      من {studentHolidays.length} إجازة
                    </div>
                    <div className="divide-y divide-gray-200">
                      {paginatedHolidays.map((holiday) => (
                        <div key={holiday.id} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-gray-700 mb-2">
                                <Calendar className="w-5 h-5 text-blue-600" />
                                <span className="font-semibold">من:</span>
                                <span>{formatDate(holiday.startDate)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-700">
                                <Calendar className="w-5 h-5 text-red-600" />
                                <span className="font-semibold">إلى:</span>
                                <span>{formatDate(holiday.endDate)}</span>
                              </div>
                              <div className="mt-2 text-sm text-gray-600">
                                المدة:{" "}
                                {Math.ceil(
                                  (new Date(holiday.endDate).getTime() -
                                    new Date(holiday.startDate).getTime()) /
                                    (1000 * 60 * 60 * 24),
                                ) + 1}{" "}
                                يوم
                              </div>

                              {/* Add user info display here */}
                              {(holiday.modifiedBy ||
                                holiday.lastModifiedDate) && (
                                <div className="mt-3 pt-3 border-t border-gray-200 border-dashed">
                                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                                    {holiday.modifiedBy && (
                                      <div className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        <span>
                                          أضيف بواسطة: {holiday.modifiedBy}
                                        </span>
                                      </div>
                                    )}
                                    {holiday.lastModifiedDate && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>
                                          التاريخ:{" "}
                                          {formatDateTime(
                                            holiday.lastModifiedDate,
                                          )}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            {/* Only show delete button if holiday end date hasn't passed */}
                            {new Date(holiday.endDate) >=
                              new Date(new Date().toDateString()) && (
                              <button
                                onClick={() => handleDeleteHoliday(holiday.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="إلغاء التصريح"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Holiday Pagination */}
                    {totalHolidayPages > 1 && (
                      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                        <button
                          onClick={() =>
                            setCurrentHolidayPage(
                              Math.min(
                                totalHolidayPages,
                                currentHolidayPage + 1,
                              ),
                            )
                          }
                          disabled={currentHolidayPage === totalHolidayPages}
                          className="px-3 py-1.5 border rounded-lg disabled:opacity-50 flex items-center gap-1 text-sm"
                        >
                          التالي <ChevronRight className="w-4 h-4" />
                        </button>

                        <div className="flex gap-1">
                          {Array.from({
                            length: Math.min(totalHolidayPages, 5),
                          }).map((_, i) => {
                            let pageNum: number;
                            if (totalHolidayPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentHolidayPage <= 3) {
                              pageNum = i + 1;
                            } else if (
                              currentHolidayPage >=
                              totalHolidayPages - 2
                            ) {
                              pageNum = totalHolidayPages - 4 + i;
                            } else {
                              pageNum = currentHolidayPage - 2 + i;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentHolidayPage(pageNum)}
                                className={`w-8 h-8 rounded-lg text-sm ${
                                  currentHolidayPage === pageNum
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
                            setCurrentHolidayPage(
                              Math.max(1, currentHolidayPage - 1),
                            )
                          }
                          disabled={currentHolidayPage === 1}
                          className="px-3 py-1.5 border rounded-lg disabled:opacity-50 flex items-center gap-1 text-sm"
                        >
                          <ChevronLeft className="w-4 h-4" /> السابق
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Holiday Modal */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full" dir="rtl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                إضافة إجازة جديدة
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
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
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  تاريخ النهاية *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  min={formData.startDate}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {formData.startDate && formData.endDate && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-gray-700">
                    <span className="font-semibold">مدة الإجازة:</span>{" "}
                    {Math.ceil(
                      (new Date(formData.endDate).getTime() -
                        new Date(formData.startDate).getTime()) /
                        (1000 * 60 * 60 * 24),
                    ) + 1}{" "}
                    يوم
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  إضافة الإجازة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
