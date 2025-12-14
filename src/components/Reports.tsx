import { useState, useEffect } from "react";
import { Download, Calendar, Users, AlertCircle, FileDown } from "lucide-react";
import { toast } from "sonner";
import { API_BASE } from "../lib/api";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

type ReportType = "daily" | "monthly";

export default function Reports() {
  const [activeReport, setActiveReport] = useState<ReportType>("daily");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [dateFrom, setDateFrom] = useState(new Date(new Date().setDate(1)).toISOString().split("T")[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [selectedBuilding, setSelectedBuilding] = useState("all");

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="">
        <h1 className="text-3xl font-bold text-gray-900">التقارير</h1>
        <p className="text-gray-600 mt-1">تقارير الغياب اليومية والشهرية للطلاب</p>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white rounded-lg shadow p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveReport("daily")}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeReport === "daily"
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            التقرير اليومي
          </button>

          <button
            onClick={() => setActiveReport("monthly")}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${
              activeReport === "monthly"
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            التقرير الشهري
          </button>
        </div>
      </div>

      {activeReport === "daily" && (
        <DailyReport
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedBuilding={selectedBuilding}
          setSelectedBuilding={setSelectedBuilding}
        />
      )}
      {activeReport === "monthly" && (
        <MonthlyReport
          dateFrom={dateFrom}
          dateTo={dateTo}
          setDateFrom={setDateFrom}
          setDateTo={setDateTo}
          selectedBuilding={selectedBuilding}
          setSelectedBuilding={setSelectedBuilding}
        />
      )}
    </div>
  );
}

/* ----------------------------------------------------------
    EXPORT HELPERS (PDF + Excel)
----------------------------------------------------------- */

const exportTableToPDF = (tableId: string, title: string) => {
  const doc = new jsPDF("p", "pt", "a4");

  const table = document.getElementById(tableId);
  if (!table) return toast.error("لم يتم العثور على الجدول");

  doc.setFontSize(18);
  doc.text(title, 40, 40);

  doc.html(table, {
    margin: { top: 60, left: 30 },
    callback: () => doc.save(`${title}.pdf`),
    html2canvas: { scale: 0.6 }
  });
};

const exportToExcel = (data: any[], fileName: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

/* ----------------------------------------------------------
    DAILY REPORT
----------------------------------------------------------- */

function DailyReport({
  selectedDate,
  setSelectedDate,
  selectedBuilding,
  setSelectedBuilding,
}: any) {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDailyReport();
  }, [selectedDate]);

  const fetchDailyReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${API_BASE}/api/Reports/daily-absence?date=${selectedDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error("فشل في تحميل التقرير");

      const data = await res.json();
      setReportData(data);
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء تحميل التقرير");
    } finally {
      setLoading(false);
    }
  };

  const filteredBuildings =
    selectedBuilding === "all"
      ? reportData?.buildingGroups || []
      : (reportData?.buildingGroups || []).filter(
          (b: any) => b.buildingNumber === selectedBuilding
        );

  /* ------------------ EXPORT HANDLERS ------------------ */

  const handleExportPDF = () =>
    exportTableToPDF("daily-table", `تقرير يوم ${selectedDate}`);

  const handleExportExcel = () => {
    const rows: any[] = [];
    filteredBuildings.forEach((b: any) => {
      b.students.forEach((s: any) => {
        rows.push({
          الاسم: s.name,
          "الرقم الجامعي": s.studentId,
          الغرفة: s.roomNumber,
          الكلية: s.faculty,
          "إفطار/عشاء": s.missedBreakfastDinner ? "غائب" : "حاضر",
          الغداء: s.missedLunch ? "غائب" : "حاضر",
          "إجمالي الوجبات": s.totalMissedMealsToday,
        });
      });
    });
    exportToExcel(rows, `Daily_Report_${selectedDate}`);
  };

  return (
    <>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">الفلاتر</h2>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-1"
            >
              <FileDown className="w-4 h-4" />
              PDF
            </button>

            <button
              onClick={handleExportExcel}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              التاريخ
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              المبنى
            </label>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="all">جميع المباني</option>
              {(reportData?.buildingGroups || []).map((b: any) => (
                <option key={b.buildingNumber} value={b.buildingNumber}>
                  مبنى {b.buildingNumber}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-32 text-gray-600">
          جاري التحميل...
        </div>
      ) : reportData ? (
        <div id="daily-table">
          {filteredBuildings.map((building: any) => (
            <div
              key={building.buildingNumber}
              className="bg-white rounded-lg shadow mt-6"
            >
              <div className="p-6 border-b flex justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  مبنى {building.buildingNumber}
                </h2>
                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                  {building.studentsWhoDidntEat} طالب لم يأكل
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <Th>الاسم</Th>
                      <Th>الرقم الجامعي</Th>
                      <Th>الغرفة</Th>
                      <Th>الكلية</Th>
                      <Th center>إفطار/عشاء</Th>
                      <Th center>الغداء</Th>
                      <Th center>إجمالي الوجبات الفائتة</Th>
                    </tr>
                  </thead>

                  <tbody className="">
                    {building.students.map((s: any, i: number) => (
                      <tr
                        key={s.nationalId}
                        className={`transition hover:bg-gray-100 ${
                          i % 2 === 0 ? "bg-gray-50" : ""
                        }`}
                      >
                        <Td>{s.name}</Td>
                        <Td>{s.studentId}</Td>
                        <Td>{s.roomNumber}</Td>
                        <Td>{s.faculty}</Td>

                        <Td center>
                          <StatusBadge value={!s.missedBreakfastDinner} />
                        </Td>

                        <Td center>
                          <StatusBadge value={!s.missedLunch} />
                        </Td>

                        <Td center>
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-semibold">
                            {s.totalMissedMealsToday}
                          </span>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}

/* ----------------------------------------------------------
    MONTHLY REPORT (same UI improvements)
----------------------------------------------------------- */

function MonthlyReport({
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  selectedBuilding,
  setSelectedBuilding,
}: any) {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMonthlyReport();
  }, [dateFrom, dateTo]);

  const fetchMonthlyReport = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const params = new URLSearchParams({
        fromDate: dateFrom,
        toDate: dateTo,
      });

      const res = await fetch(
        `${API_BASE}/api/Reports/monthly-absence?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error("فشل في تحميل التقرير");

      const data = await res.json();
      setReportData(data);
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء تحميل التقرير");
    } finally {
      setLoading(false);
    }
  };

  const filteredBuildings =
    selectedBuilding === "all"
      ? reportData?.buildingGroups || []
      : (reportData?.buildingGroups || []).filter(
          (b: any) => b.buildingNumber === selectedBuilding
        );

  /* ------------------ EXPORT ------------------ */

  const handleExportPDF = () =>
    exportTableToPDF("monthly-table", "التقرير الشهري");

  const handleExportExcel = () => {
    const rows: any[] = [];
    filteredBuildings.forEach((b: any) => {
      b.students.forEach((s: any) => {
        rows.push({
          الاسم: s.name,
          "الرقم الجامعي": s.studentId,
          الغرفة: s.roomNumber,
          "إفطار/عشاء": s.missedBreakfastDinnerCount,
          الغداء: s.missedLunchCount,
          "إجمالي الوجبات": s.totalMissedMeals,
          "أيام الإجازة": s.daysOnHoliday,
          الغرامة: s.totalPenalty,
        });
      });
    });
    exportToExcel(rows, "Monthly_Report");
  };

  return (
    <>
      {/* Filters + Export */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">الفلاتر</h2>

          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-1"
            >
              <FileDown className="w-4 h-4" />
              PDF
            </button>

            <button
              onClick={handleExportExcel}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-1"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              من تاريخ
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              إلى تاريخ
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              المبنى
            </label>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="all">جميع المباني</option>
              {(reportData?.buildingGroups || []).map((b: any) => (
                <option key={b.buildingNumber} value={b.buildingNumber}>
                  مبنى {b.buildingNumber}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Monthly Tables */}
      {loading ? (
        <div className="flex justify-center py-32 text-gray-600">
          جاري التحميل...
        </div>
      ) : reportData ? (
        <div id="monthly-table">
          {filteredBuildings.map((building: any) => (
            <div
              key={building.buildingNumber}
              className="bg-white rounded-lg shadow mt-6"
            >
              <div className="p-6 border-b flex justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  مبنى {building.buildingNumber} – {building.students.length} طالب
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <Th>الاسم</Th>
                      <Th>الرقم الجامعي</Th>
                      <Th>الغرفة</Th>
                      <Th center>إفطار/عشاء فائت</Th>
                      <Th center>غداء فائت</Th>
                      <Th center>إجمالي الوجبات</Th>
                      <Th center>أيام الإجازة</Th>
                      <Th center>الغرامة المتوقعة</Th>
                    </tr>
                  </thead>

                  <tbody>
                    {building.students.map((s: any, i: number) => (
                      <tr
                        key={s.nationalId}
                        className={`transition hover:bg-gray-100 ${
                          i % 2 === 0 ? "bg-gray-50" : ""
                        }`}
                      >
                        <Td>{s.name}</Td>
                        <Td>{s.studentId}</Td>
                        <Td>{s.roomNumber}</Td>

                        <Td center>{s.missedBreakfastDinnerCount}</Td>
                        <Td center>{s.missedLunchCount}</Td>

                        <Td center>
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full font-semibold">
                            {s.totalMissedMeals}
                          </span>
                        </Td>

                        <Td center>{s.daysOnHoliday}</Td>
                        <Td center>{s.totalPenalty.toFixed(2)} جنيه</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}

/* ----------------------------------------------------------
    SMALL UI COMPONENTS
----------------------------------------------------------- */

function Th({ children, center = false }: any) {
  return (
    <th
      className={`px-6 py-3 text-gray-700 font-semibold ${
        center ? "text-center" : "text-right"
      }`}
    >
      {children}
    </th>
  );
}

function Td({ children, center = false }: any) {
  return (
    <td
      className={`px-6 py-3 ${
        center ? "text-center" : "text-right"
      } text-gray-900`}
    >
      {children}
    </td>
  );
}

function StatusBadge({ value }: any) {
  return value ? (
    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-semibold">
      حاضر
    </span>
  ) : (
    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm font-semibold">
      غائب
    </span>
  );
}
