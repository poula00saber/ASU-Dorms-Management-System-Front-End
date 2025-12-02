import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { API_BASE } from "../lib/api";

interface Student {
  id: string;
  studentId: string;
  name: string;
  faculty: string;
  level: string;
  building: string;
  dormType: string;
  email?: string;
  phoneNumber?: string;
  government?: string;
  nationalId?: string;
  district?: string;
  roomNumber?: string;
}

// Arabic translations for dorm types
const dormTypeTranslations: Record<string, string> = {
  "1": "عادي",
  "2": "مميز",
  "3": "فندقي",
  Normal: "عادي",
  Premium: "مميز",
  Hotel: "فندقي",
};

// Arabic building names (you can customize these)
const buildings = [
  "المبنى أ",
  "المبنى ب",
  "المبنى ج",
  "المبنى د",
  "المبنى هـ",
  "المبنى و",
  "المبنى ز",
];

// Arabic faculty names
const faculties = ["الهندسة", "الطب", "إدارة الأعمال", "الآداب", "العلوم"];

export default function StudentsList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBuilding, setFilterBuilding] = useState("all");
  const [filterFaculty, setFilterFaculty] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Load students
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/Students`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          throw new Error(await res.text());
        }

        const json = await res.json();

        if (!Array.isArray(json)) {
          throw new Error("Invalid data from server");
        }

        // Map backend DTO to frontend interface
        const mappedStudents = json.map((studentDto: any) => ({
          id: studentDto.studentId,
          studentId: studentDto.studentId,
          name:
            studentDto.fullName ||
            `${studentDto.firstName} ${studentDto.lastName}`,
          faculty: studentDto.faculty || "",
          level: studentDto.level?.toString() || "",
          building: studentDto.buildingNumber || "",
          dormType: studentDto.dormType || "",
          email: studentDto.email,
          phoneNumber: studentDto.phoneNumber,
          government: studentDto.government,
          nationalId: studentDto.nationalId,
          district: studentDto.district,
          roomNumber: studentDto.roomNumber,
        }));

        setStudents(mappedStudents);
      } catch (err) {
        console.error(err);
        toast.error("فشل تحميل بيانات الطلاب");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  // Delete student
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الطالب ${name}؟`)) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/api/Students/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error(await res.text());

      setStudents((prev) => prev.filter((s) => s.id !== id));
      toast.success("تم حذف الطالب بنجاح");
    } catch (err: any) {
      toast.error(err?.message || "فشل حذف الطالب");
    }
  };

  // Translate dorm type
  const translateDormType = (dormType: string): string => {
    return dormTypeTranslations[dormType] || dormType;
  };

  // Filter
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesBuilding =
      filterBuilding === "all" || student.building === filterBuilding;

    const matchesFaculty =
      filterFaculty === "all" || student.faculty === filterFaculty;

    return matchesSearch && matchesBuilding && matchesFaculty;
  });

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Reset page when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterBuilding, filterFaculty]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-600 text-lg">
        جاري تحميل بيانات الطلاب...
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة الطلاب</h1>
          <p className="text-gray-600 mt-1">إدارة سجلات ومعلومات جميع الطلاب</p>
        </div>

        <Link
          to="/students/add"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          إضافة طالب
        </Link>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث بالاسم أو رقم الطالب..."
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
              dir="rtl"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-5 h-5" />
            فلتر
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-gray-700 mb-2 text-right">
                المبنى
              </label>
              <select
                value={filterBuilding}
                onChange={(e) => setFilterBuilding(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right"
                dir="rtl"
              >
                <option value="all">جميع المباني</option>
                {buildings.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2 text-right">
                الكلية
              </label>
              <select
                value={filterFaculty}
                onChange={(e) => setFilterFaculty(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right"
                dir="rtl"
              >
                <option value="all">جميع الكليات</option>
                {faculties.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600 text-right">
          عرض {startIndex + 1} إلى{" "}
          {Math.min(startIndex + itemsPerPage, filteredStudents.length)} من{" "}
          {filteredStudents.length} طالب
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-right">رقم الطالب</th>
                <th className="px-6 py-3 text-right">الاسم</th>
                <th className="px-6 py-3 text-right">الكلية</th>
                <th className="px-6 py-3 text-right">المستوى</th>
                <th className="px-6 py-3 text-right">المبنى</th>
                <th className="px-6 py-3 text-right">نوع السكن</th>
                <th className="px-6 py-3 text-right">الإجراءات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-right">{s.studentId}</td>
                    <td className="px-6 py-4 text-right">{s.name}</td>
                    <td className="px-6 py-4 text-right">{s.faculty}</td>
                    <td className="px-6 py-4 text-right">{s.level}</td>
                    <td className="px-6 py-4 text-right">{s.building}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                        {translateDormType(s.dormType)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          to={`/students/${s.id}`}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        <Link
                          to={`/students/edit/${s.id}`}
                          className="p-1 text-green-600 hover:bg-green-50 rounded"
                          title="تعديل"
                        >
                          <Edit className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="حذف"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    لا توجد بيانات للطلاب
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 flex items-center gap-1"
            >
              التالي <ChevronRight className="w-5 h-5 inline-block" />
            </button>

            <div className="flex gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded-lg ${
                    currentPage === i + 1
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 flex items-center gap-1"
            >
              <ChevronLeft className="w-5 h-5 inline-block" /> السابق
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
