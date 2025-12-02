import { useState, useEffect } from "react";
import { Download, Calendar, Building, TrendingUp, Users } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { API_BASE } from "../lib/api";

type ReportType = "الغيابات" | "الإحصائيات" | "المباني";

export default function Reports() {
  const [activeReport, setActiveReport] = useState<ReportType>("الغيابات");
  const [dateFrom, setDateFrom] = useState("2025-11-01");
  const [dateTo, setDateTo] = useState("2025-11-30");
  const [selectedBuilding, setSelectedBuilding] = useState("all");

  const handleExport = (format: "pdf" | "excel") => {
    toast.success(`Exporting report as ${format.toUpperCase()}...`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-1">
          View detailed reports and statistics
        </p>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white rounded-lg shadow p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveReport("الغيابات")}
            className={`flex-1 px-4 py-3 rounded-lg transition-colors ${
              activeReport === "الغيابات"
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            Meal Absence Report
          </button>
          <button
            onClick={() => setActiveReport("الإحصائيات")}
            className={`flex-1 px-4 py-3 rounded-lg transition-colors ${
              activeReport === "الإحصائيات"
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            Meal Statistics
          </button>
          <button
            onClick={() => setActiveReport("المباني")}
            className={`flex-1 px-4 py-3 rounded-lg transition-colors ${
              activeReport === "المباني"
                ? "bg-blue-600 text-white"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            Buildings Overview
          </button>
        </div>
      </div>

      {activeReport === "الغيابات" && (
        <AbsenceReport
          dateFrom={dateFrom}
          dateTo={dateTo}
          setDateFrom={setDateFrom}
          setDateTo={setDateTo}
          selectedBuilding={selectedBuilding}
          setSelectedBuilding={setSelectedBuilding}
          onExport={handleExport}
        />
      )}
      {activeReport === "الإحصائيات" && <StatisticsReport />}
      {activeReport === "المباني" && <BuildingsReport />}
    </div>
  );
}

function AbsenceReport({
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  selectedBuilding,
  setSelectedBuilding,
  onExport,
}: any) {
  const [absenceData, setAbsenceData] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("authToken");
        const params = new URLSearchParams({ from: dateFrom, to: dateTo });
        if (selectedBuilding && selectedBuilding !== "all") {
          params.set("building", selectedBuilding);
        }
        const res = await fetch(
          `${API_BASE}/api/Reports/buildings-statistics?${params.toString()}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          }
        );
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setAbsenceData(data || []);
      } catch (err: any) {
        // fallback: keep UI, show toast
        toast.error(err?.message || "Failed to load absence report");
      }
    })();
  }, [dateFrom, dateTo, selectedBuilding]);

  return (
    <>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Building</label>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Buildings</option>
              <option value="A1">A1</option>
              <option value="A2">Building B</option>
              <option value="Building C">Building C</option>
              <option value="Building D">Building D</option>
              <option value="Building E">Building E</option>
              <option value="Building F">Building F</option>
              <option value="Building G">Building G</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 mb-2">Total Absences</p>
          <p className="text-gray-900">156</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 mb-2">Breakfast</p>
          <p className="text-gray-900">45</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 mb-2">Lunch</p>
          <p className="text-gray-900">52</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 mb-2">Dinner</p>
          <p className="text-gray-900">59</p>
        </div>
      </div>

      {/* Absence Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-gray-900">Absence Details</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onExport("excel")}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={() => onExport("pdf")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-gray-700">Student</th>
                <th className="px-6 py-3 text-left text-gray-700">
                  Student ID
                </th>
                <th className="px-6 py-3 text-left text-gray-700">Building</th>
                <th className="px-6 py-3 text-center text-gray-700">
                  Breakfast
                </th>
                <th className="px-6 py-3 text-center text-gray-700">Lunch</th>
                <th className="px-6 py-3 text-center text-gray-700">Dinner</th>
                <th className="px-6 py-3 text-center text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {absenceData.map((record, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900">{record.student}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {record.studentId}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{record.building}</td>
                  <td className="px-6 py-4 text-center text-gray-900">
                    {record.breakfast}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-900">
                    {record.lunch}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-900">
                    {record.dinner}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-900">
                    {record.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function StatisticsReport() {
  const weeklyData = [
    { day: "Mon", breakfast: 1189, lunch: 1098, dinner: 987 },
    { day: "Tue", breakfast: 1203, lunch: 1112, dinner: 1001 },
    { day: "Wed", breakfast: 1178, lunch: 1089, dinner: 976 },
    { day: "Thu", breakfast: 1195, lunch: 1105, dinner: 991 },
    { day: "Fri", breakfast: 1167, lunch: 1076, dinner: 965 },
    { day: "Sat", breakfast: 1145, lunch: 1054, dinner: 943 },
    { day: "Sun", breakfast: 1156, lunch: 1065, dinner: 954 },
  ];

  const mealDistribution = [
    { name: "Breakfast", value: 8267, color: "#3b82f6" },
    { name: "Lunch", value: 7599, color: "#10b981" },
    { name: "Dinner", value: 6817, color: "#f59e0b" },
  ];

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-gray-600">Total Meals</p>
          </div>
          <p className="text-gray-900">22,683</p>
          <p className="text-green-600 text-sm mt-1">+5.2% vs last week</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-gray-600">Attendance Rate</p>
          </div>
          <p className="text-gray-900">87.5%</p>
          <p className="text-green-600 text-sm mt-1">+2.1% vs last week</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-gray-600">Daily Average</p>
          </div>
          <p className="text-gray-900">3,240</p>
          <p className="text-gray-500 text-sm mt-1">Meals per day</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <Building className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-gray-600">Peak Building</p>
          </div>
          <p className="text-gray-900">Building B</p>
          <p className="text-gray-500 text-sm mt-1">95% occupancy</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-gray-900 mb-4">Weekly Meal Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="breakfast"
                stroke="#3b82f6"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="lunch"
                stroke="#10b981"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="dinner"
                stroke="#f59e0b"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Meal Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-gray-900 mb-4">Meal Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mealDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {mealDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Comparison */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-gray-900 mb-4">Daily Meal Comparison</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="breakfast" fill="#3b82f6" />
            <Bar dataKey="lunch" fill="#10b981" />
            <Bar dataKey="dinner" fill="#f59e0b" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

function BuildingsReport() {
  const [buildingsData, setBuildingsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("2025-11-01");
  const [dateTo, setDateTo] = useState("2025-11-30");

  useEffect(() => {
    fetchBuildingsStatistics();
  }, [dateFrom, dateTo]);

  const fetchBuildingsStatistics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("authToken");
      const params = new URLSearchParams({
        fromDate: dateFrom,
        toDate: dateTo,
      });

      const res = await fetch(
        `${API_BASE}/api/Reports/buildings-statistics?${params.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();

      // Transform the API response to match your frontend structure
      const transformedData =
        data.buildings?.map((building: any) => ({
          building: `Building ${building.buildingNumber}`,
          students: building.totalStudents,
          capacity: building.currentCapacity,
          meals: building.totalMealsServed,
          attendance: Math.round(building.attendanceRate),
          buildingNumber: building.buildingNumber,
        })) || [];

      setBuildingsData(transformedData);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load buildings statistics");
      setBuildingsData([]);
    } finally {
      setLoading(false);
    }
  };

  const chartData = buildingsData.map((b) => ({
    name: b.building.replace("Building ", ""),
    attendance: b.attendance,
    occupancy: Math.round((b.students / b.capacity) * 100),
  }));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading buildings statistics...</div>
      </div>
    );
  }

  return (
    <>
      {/* Date Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-gray-900 mb-4">Date Range</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Buildings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {buildingsData.map((building, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-gray-900">{building.building}</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Students</span>
                  <span className="text-gray-900">
                    {building.students}/{building.capacity}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${
                        (building.students / building.capacity) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Meals</span>
                  <span className="text-gray-900">{building.meals}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Attendance</span>
                  <span className="text-green-600">{building.attendance}%</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {buildingsData.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-gray-900 mb-2">No Building Data Available</h3>
          <p className="text-gray-600">
            No building statistics found for the selected date range.
          </p>
        </div>
      )}

      {/* Comparison Chart */}
      {buildingsData.length > 0 && (
        <>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-gray-900 mb-4">
              Building Performance Comparison
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="attendance" fill="#10b981" name="Attendance %" />
                <Bar dataKey="occupancy" fill="#3b82f6" name="Occupancy %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-gray-900">Detailed Building Statistics</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-gray-700">
                      Building
                    </th>
                    <th className="px-6 py-3 text-center text-gray-700">
                      Students
                    </th>
                    <th className="px-6 py-3 text-center text-gray-700">
                      Capacity
                    </th>
                    <th className="px-6 py-3 text-center text-gray-700">
                      Occupancy
                    </th>
                    <th className="px-6 py-3 text-center text-gray-700">
                      Total Meals
                    </th>
                    <th className="px-6 py-3 text-center text-gray-700">
                      Attendance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {buildingsData.map((building, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-gray-900">
                        {building.building}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-900">
                        {building.students}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-900">
                        {building.capacity}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                          {Math.round(
                            (building.students / building.capacity) * 100
                          )}
                          %
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-900">
                        {building.meals}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                          {building.attendance}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
