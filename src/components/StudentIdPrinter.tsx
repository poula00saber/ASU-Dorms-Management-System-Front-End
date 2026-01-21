import { useState, useEffect } from "react";
import { Printer, Users, CheckSquare, Loader2, Search } from "lucide-react";
import JsBarcode from "jsbarcode";
import { toast } from "sonner";
import { fetchAPI } from "../lib/api"; // Changed to fetchAPI
import { resolvePhotoUrl } from "../utils/resolvePhotoUrl";

interface Student {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  faculty: string;
  level: string;
  nationalId: string;
  dormLocationId: number;
  building: string;
  buildingNumber?: string;
  photoUrl?: string;
  dormLocationName?: string;
  dormType?: string;
  government?: string;
  district?: string;
}

const dormLocationMap: Record<number, string> = {
  1: "مدينة طلبة العباسية",
  2: "مدينة طالبات مصر الجديدة",
  3: "مدينة نصر 1",
  4: "مدينة نصر 2",
  5: "زراعة أ",
  6: "زراعة ب",
  7: "الزيتون",
};

// Arabic translations for dorm types (kept for potential future use)
const dormTypeTranslations: Record<string, string> = {
  "1": "عادي",
  "2": "مميز",
  "3": "فندقي",
  Normal: "عادي",
  Premium: "مميز",
  Hotel: "فندقي",
};

export default function StudentIdPrinter() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [currentDormLocation, setCurrentDormLocation] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFaculty, setFilterFaculty] = useState("all");
  const [filterBuilding, setFilterBuilding] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAll, setSelectedAll] = useState(false);

  // Fetch students from API - only for current user's dorm location
  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use fetchAPI instead of direct fetch
      const data = await fetchAPI("/api/Students/print-data");

      // Transform API data to match our interface
      const transformedStudents: Student[] = data.map((student: any) => {
        const fullName =
          student.fullName ||
          `${student.firstName || ""} ${student.lastName || ""}`.trim();

        return {
          id: student.id || parseInt(student.studentId) || 0,
          studentId: student.studentId || student.id?.toString() || "",
          firstName: student.firstName || "",
          lastName: student.lastName || "",
          fullName: fullName,
          faculty: student.faculty || "",
          level: student.level?.toString() || "",
          nationalId: student.nationalId || "",
          dormLocationId: student.dormLocationId || student.dormLocation || 0,
          building: student.building || student.buildingNumber || "",
          buildingNumber: student.buildingNumber || "",
          photoUrl: resolvePhotoUrl(student.photoUrl),
          dormLocationName:
            student.dormLocationName || dormLocationMap[student.dormLocationId],
          dormType: student.dormType,
          government: student.government,
          district: student.district,
        };
      });

      setStudents(transformedStudents);

      // Set current dorm location from first student (if available)
      if (transformedStudents.length > 0) {
        const dormId = transformedStudents[0].dormLocationId;
        setCurrentDormLocation(dormLocationMap[dormId] || `المدينة ${dormId}`);
      }

      toast.success(`تم تحميل ${transformedStudents.length} طالب`);
    } catch (error: any) {
      console.error("Error fetching students:", error);
      const errorMessage =
        error.message ||
        "فشل في تحميل بيانات الطلاب. الرجاء المحاولة مرة أخرى.";
      setError(errorMessage);

      // Handle specific error cases
      if (
        error.message?.includes("401") ||
        error.message?.includes("غير مصرح")
      ) {
        toast.error("غير مصرح لك بالوصول. يرجى تسجيل الدخول مرة أخرى.");
      } else if (error.message?.includes("403")) {
        toast.error("ليس لديك صلاحية للوصول إلى هذه الصفحة.");
      } else if (error.message?.includes("404")) {
        toast.error(
          "لم يتم العثور على نهاية الرابط. يرجى التحقق من الإعدادات."
        );
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate default avatar based on student ID
  const generateDefaultAvatar = (id: number | string): string => {
    const seed =
      typeof id === "number"
        ? id
        : parseInt(id as string) || Math.random() * 1000;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9&radius=20`;
  };

  // Fetch students on component mount
  useEffect(() => {
    fetchStudents();
  }, []);

  // Generate barcode image data URL
  const generateBarcode = (nationalId: string): string => {
    try {
      if (!nationalId || nationalId.trim() === "") {
        nationalId = "0000000000000"; // Default if national ID is missing
      }

      const canvas = document.createElement("canvas");
      JsBarcode(canvas, nationalId, {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: false,
        background: "transparent",
        lineColor: "#000000",
        margin: 5,
      });
      return canvas.toDataURL("image/png");
    } catch (error) {
      console.error("Error generating barcode:", error);
      return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='50'%3E%3Crect width='200' height='50' fill='white'/%3E%3Ctext x='100' y='25' font-family='Arial' font-size='12' text-anchor='middle'%3ENo Barcode%3C/text%3E%3C/svg%3E";
    }
  };

  // Toggle student selection
  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Select all students
  const selectAllStudents = () => {
    const allStudentIds = filteredStudents.map((s) => s.id);
    setSelectedStudents(allStudentIds);
    setSelectedAll(true);
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedStudents([]);
    setSelectedAll(false);
  };

  const generatePrintContent = (studentsToPrint: Student[]) => {
    // Group students into pages of 10
    const pages: Student[][] = [];
    for (let i = 0; i < studentsToPrint.length; i += 10) {
      pages.push(studentsToPrint.slice(i, i + 10));
    }

    const currentYear = "2025-2026";

    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>طباعة البطاقات الجامعية - ${
        studentsToPrint.length
      } طالب - ${currentDormLocation}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @page {
          size: A4;
          margin: 5mm;
        }
        
        body {
          font-family: 'Arial', 'Helvetica', sans-serif;
          direction: rtl;
          background: white;
          width: 210mm;
          margin: 0 auto;
          padding: 0;
        }
        
        .page {
          width: 100%;
          min-height: 287mm;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 4mm 6mm;
          align-content: start;
          padding: 0;
        }
        
        .page:last-child {
          page-break-after: auto;
        }
        
        .id-card {
          width: 76mm; /* Changed from 95mm to 76mm (80% of original) */
          height: 50mm; /* Height remains the same */
          border: 1.8px solid #000;
          border-radius: 8px; /* Added rounded corners */
          overflow: hidden;
          background: white;
          position: relative;
          font-family: Arial, sans-serif;
          page-break-inside: avoid;
        }
        
        /* ===== HEADER ===== */
        .card-header {
          height: 8mm;
          background: #c62828;
          color: white;
          font-size: 8.5pt;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 3mm;
          position: relative;
          z-index: 10;
          border-top-left-radius: 6px; /* Rounded top corners */
          border-top-right-radius: 6px; /* Rounded top corners */
        }
        
        .header-year {
          font-size: 8pt;
        }
        
        .header-dorm {
          font-size: 8.5pt;
          text-align: center;
          flex: 1;
          margin: 0 2mm;
        }
        
        /* ===== BODY ===== */
        .card-body {
          display: flex;
          height: calc(100% - 8mm);
        }
        
        /* ===== UNIVERSITY LOGO ===== */
        .university-logo {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 32mm; /* Reduced from 40mm to match new width */
          height: auto;
          opacity: 0.4; /* Reduced opacity */
          pointer-events: none;
          z-index: 1;
        }
        
        /* ===== PHOTO ===== */
        .photo-section {
          width: 26mm;
          padding: 1mm;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          border-left: 1px solid #eee;
          position: relative;
          z-index: 5;
        }
        
        .photo {
          width: 22mm; /* Reduced from 25mm (80% of original) */
          height: 26mm; /* Reduced from 30mm (80% of original) */
          object-fit: cover;
          border: 1px solid #000;
          border-radius: 3px; /* Added slight rounding to photo */
          margin-top: 1mm;
          background-color: white; /* Ensure photo has background */
          position: relative;
          z-index: 6;
        }
        
        /* ===== INFO SECTION ===== */
        .info-section {
  flex: 1;
  padding: 1mm 2mm;
  display: grid;
  grid-template-rows: auto auto auto auto 1fr auto;
}

        
        /* Student Name - Centered and Larger */
        .student-name {
          font-weight: bold;
          font-size: 10pt; /* Reduced from 11pt */
          text-align: center;
          color: #c62828;
          margin: 0.5mm 0 2mm 0;
          padding: 0.5mm;
          border-bottom: 1px solid #eee;
          width: 100%;
          position: relative;
          z-index: 5;
          /* REMOVED background-color to allow logo to show through */
        }
        
        /* Info container for all details */
        .info-container {
  display: flex;
  flex-direction: column;
  gap: 1.2mm;
  padding: 0 1mm;
}

        
        /* Inline label-value pairs */
        .info-row {
          display: flex;
          align-items: center;
          font-size: 8.5pt; /* Reduced from 9pt */
          position: relative;
          z-index: 5;
          /* REMOVED background-color to allow logo to show through */
        }
        
        .info-label {
          font-weight: bold;
          min-width: 14mm; /* Reduced from 18mm */
          text-align: left;
        }
        
        .info-value {
          text-align: right;
          flex: 1;
          padding-right: 2mm;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        /* Special styling for student ID */
        .student-id-value {
          font-family: monospace;
          font-weight: bold;
          font-size: 9pt; /* Reduced from 9.5pt */
        }
        
        /* ===== BARCODE ===== */
       .barcode-section {
  border-top: 1px solid #eee;
  margin-top: 3mm;
  padding-top: 0.5mm;
}

.barcode-section img {
  display: block;      /* removes inline image baseline gap */
  margin: 0 auto;
  width: 45mm;
  height: 9mm;
}
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            width: 100%;
          }
          
          .page {
            padding: 0;
            margin: 0;
            width: 100%;
            height: 100%;
            gap: 5mm 8mm; /* Increased horizontal gap for better spacing */
          }
          
          .id-card {
            box-shadow: none;
            border: 1.5px solid #000;
            border-radius: 8px;
          }
          
          .card-header {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            border-top-left-radius: 6px;
            border-top-right-radius: 6px;
          }
          
          .university-logo {
            opacity: 0.15; /* Slightly more visible for print */
            width: 32mm;
          }
          
          .photo {
            border-radius: 3px;
          }
        }
      </style>
    </head>
    <body>
      ${pages
        .map(
          (pageStudents) => `
        <div class="page">
          ${pageStudents
            .map((student) => {
              const studentName =
                student.fullName || `${student.firstName} ${student.lastName}`;
              const dormName =
                student.dormLocationName ||
                dormLocationMap[student.dormLocationId] ||
                currentDormLocation;
              const barcodeData =
                student.nationalId ||
                student.studentId ||
                student.id.toString();

              // Remove "كلية" from faculty name
              const facultyName = student.faculty
                ? student.faculty.replace(/^كلية\s*/i, "").trim()
                : "-";

              // Remove "المبنى" from building name
              const buildingName =
                student.building || student.buildingNumber || "-";
              const cleanBuildingName = buildingName
                ? buildingName.replace(/^المبنى\s*/i, "").trim()
                : "-";

              return `
                <div class="id-card">
                  <!-- Transparent University Logo -->
                  <img src="src/Ain Shams University.png" class="university-logo" alt="Logo" />
                  
                  <div class="card-header">
                    <span class="header-year">2025 - 2026</span>
                    <span class="header-dorm">${dormName}</span>
                    <span>المدينة الجامعية</span>
                  </div>

                  <div class="card-body">
                    <!-- Right side: All student info -->
                    <div class="info-section">
                      <!-- Centered Student Name -->
                      <div class="student-name">${studentName}</div>
                      
                      <div class="info-container">
                        <!-- Only essential info with cleaned text -->
                        <div class="info-row">
                          <span class="info-label">الكلية:</span>
                          <span class="info-value">${facultyName}</span>
                        </div>
                        
                        <div class="info-row">
                          <span class="info-label">الفرقة:</span>
                          <span class="info-value">${
                            student.level || "-"
                          }</span>
                        </div>
                        
                        <div class="info-row">
                          <span class="info-label">رقم الملف:</span>
                          <span class="info-value student-id-value">${
                            student.studentId || "-"
                          }</span>
                        </div>
                        
                        <div class="info-row">
                          <span class="info-label">المبنى:</span>
                          <span class="info-value">${cleanBuildingName}</span>
                        </div>
                      </div>
                      
                      <!-- Barcode at bottom -->
                      <div class="barcode-section">
                        <img src="${generateBarcode(barcodeData)}" />
                      </div>
                    </div>
                    
                    <!-- Left side: Photo -->
                    <div class="photo-section">
                      <img src="${
                        student.photoUrl || generateDefaultAvatar(student.id)
                      }" class="photo" />
                    </div>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      `
        )
        .join("")}
    </body>
    </html>
  `;
  };

  // Handle print all
  const handlePrintAll = () => {
    const studentsToPrint = filteredStudents;
    if (studentsToPrint.length === 0) {
      toast.error("لا يوجد طلاب للطباعة");
      return;
    }
    printStudents(studentsToPrint);
  };

  // Handle print selected
  const handlePrintSelected = () => {
    const studentsToPrint = students.filter((s) =>
      selectedStudents.includes(s.id)
    );
    if (studentsToPrint.length === 0) {
      toast.error("الرجاء اختيار طالب واحد على الأقل");
      return;
    }
    printStudents(studentsToPrint);
  };

  // Print students function
  const printStudents = (studentsToPrint: Student[]) => {
    setIsPrinting(true);

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("الرجاء السماح بالنافذة المنبثقة للطباعة");
      setIsPrinting(false);
      return;
    }

    const htmlContent = generatePrintContent(studentsToPrint);

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for images to load
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        setIsPrinting(false);
      }, 500);
    };
  };

  // Get unique values for filters
  const uniqueFaculties = [
    ...new Set(students.map((s) => s.faculty).filter(Boolean)),
  ];

  const uniqueBuildings = [
    ...new Set(
      students
        .map((s) => s.building || s.buildingNumber)
        .filter(Boolean)
        .sort()
    ),
  ];

  const uniqueLevels = [
    ...new Set(
      students
        .map((s) => s.level?.toString())
        .filter(Boolean)
        .sort()
    ),
  ];

  // Filter students based on search and all filters
  const filteredStudents = students.filter((student) => {
    const studentName =
      student.fullName || `${student.firstName} ${student.lastName}`;

    const matchesSearch =
      searchQuery === "" ||
      studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.nationalId?.includes(searchQuery) ||
      student.building?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFaculty =
      filterFaculty === "all" || student.faculty === filterFaculty;

    const matchesBuilding =
      filterBuilding === "all" || student.building === filterBuilding;

    const matchesLevel =
      filterLevel === "all" || student.level?.toString() === filterLevel;

    return matchesSearch && matchesFaculty && matchesBuilding && matchesLevel;
  });

  if (loading && students.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل بيانات الطلاب...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Printer className="w-6 h-6" />
            طباعة البطاقات الجامعية
          </h1>
          <p className="text-gray-600 mt-1">
            {currentDormLocation
              ? `المدينة: ${currentDormLocation}`
              : "تحميل..."}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchStudents}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            disabled={loading}
          >
            {loading ? "جاري التحميل..." : "تحديث البيانات"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="mr-3">
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث بالاسم أو رقم الطالب أو الرقم القومي..."
              className="w-full pr-4 pl-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
              dir="rtl"
              disabled={loading}
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            <span>فلتر</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Faculty filter */}
              <div>
                <label className="block text-gray-700 mb-2 text-right text-sm">
                  الكلية
                </label>
                <select
                  value={filterFaculty}
                  onChange={(e) => setFilterFaculty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right text-sm"
                  dir="rtl"
                  disabled={loading}
                >
                  <option value="all">جميع الكليات</option>
                  {uniqueFaculties.map((faculty) => (
                    <option key={faculty} value={faculty}>
                      {faculty}
                    </option>
                  ))}
                </select>
              </div>

              {/* Building filter */}
              <div>
                <label className="block text-gray-700 mb-2 text-right text-sm">
                  المبنى
                </label>
                <select
                  value={filterBuilding}
                  onChange={(e) => setFilterBuilding(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right text-sm"
                  dir="rtl"
                  disabled={loading}
                >
                  <option value="all">جميع المباني</option>
                  {uniqueBuildings.map((building) => (
                    <option key={building} value={building}>
                      {building || "غير محدد"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level filter */}
              <div>
                <label className="block text-gray-700 mb-2 text-right text-sm">
                  المستوى
                </label>
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right text-sm"
                  dir="rtl"
                  disabled={loading}
                >
                  <option value="all">جميع المستويات</option>
                  {uniqueLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reset filters button */}
            {(filterFaculty !== "all" ||
              filterBuilding !== "all" ||
              filterLevel !== "all") && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setFilterFaculty("all");
                    setFilterBuilding("all");
                    setFilterLevel("all");
                  }}
                  className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                >
                  إعادة تعيين الفلتر
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-3">
          {filteredStudents.length > 0 && (
            <>
              <button
                onClick={selectAllStudents}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                disabled={loading || selectedAll}
              >
                <CheckSquare className="w-4 h-4" />
                تحديد الكل ({filteredStudents.length})
              </button>

              {selectedStudents.length > 0 && (
                <button
                  onClick={clearAllSelections}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={loading}
                >
                  إلغاء التحديد
                </button>
              )}

              <div className="flex-1"></div>

              <button
                onClick={handlePrintAll}
                disabled={
                  loading || isPrinting || filteredStudents.length === 0
                }
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isPrinting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Printer className="w-5 h-5" />
                )}
                طباعة الكل ({filteredStudents.length})
              </button>

              <button
                onClick={handlePrintSelected}
                disabled={
                  loading || isPrinting || selectedStudents.length === 0
                }
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isPrinting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Printer className="w-5 h-5" />
                )}
                طباعة المحدد ({selectedStudents.length})
              </button>
            </>
          )}
        </div>

        {/* Selection Info */}
        {selectedStudents.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>معلومات الطباعة:</strong> تم تحديد{" "}
              {selectedStudents.length} طالب. سيتم طباعة{" "}
              {Math.ceil(selectedStudents.length / 10)} صفحة A4 (10 بطاقات لكل
              صفحة).
            </p>
          </div>
        )}
      </div>

      {/* Students List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Users className="w-5 h-5" />
            <span>قائمة الطلاب ({filteredStudents.length})</span>
          </div>
          {selectedStudents.length > 0 && (
            <div className="text-sm text-blue-600 font-medium">
              {selectedStudents.length} طالب محدد
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {loading ? "جاري التحميل..." : "لا يوجد طلاب للعرض"}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={
                        selectedStudents.length === filteredStudents.length &&
                        filteredStudents.length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          selectAllStudents();
                        } else {
                          clearAllSelections();
                        }
                      }}
                      disabled={loading}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    رقم الملف
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الاسم
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الكلية
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المستوى
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    المبنى
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    الرقم القومي
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student) => {
                  const studentName =
                    student.fullName ||
                    `${student.firstName} ${student.lastName}`;
                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        selectedStudents.includes(student.id)
                          ? "bg-blue-50"
                          : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => toggleStudentSelection(student.id)}
                          disabled={loading}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                        {student.studentId}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {studentName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {student.faculty}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {student.level}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {student.building || student.buildingNumber || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                        {student.nationalId || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
