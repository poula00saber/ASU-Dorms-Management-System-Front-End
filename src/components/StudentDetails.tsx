// src/components/StudentDetails.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building,
  User,
  Edit,
  GraduationCap,
  Home,
  Users,
  Hash,
  Calendar,
  BookOpen,
  Award,
  Shield,
  Heart,
  DollarSign,
} from "lucide-react";
import { fetchAPI } from "../lib/api";
import { resolvePhotoUrl } from "../utils/resolvePhotoUrl";

// Helper functions for translations
const translateReligion = (religion: number): string => {
  switch (religion) {
    case 1:
      return "مسلم";
    case 2:
      return "مسيحي";
    case 3:
      return "أخرى";
    default:
      return "غير محدد";
  }
};

const translateStatus = (status: number): string => {
  switch (status) {
    case 0:
      return "غير نشط";
    case 1:
      return "نشط";
    case 2:
      return "متخرج";
    case 3:
      return "منقول";
    default:
      return "غير محدد";
  }
};

const translateDormType = (dormType: number | string): string => {
  if (typeof dormType === "string") {
    return dormType;
  }

  switch (dormType) {
    case 1:
      return "عادي";
    case 2:
      return "مميز";
    case 3:
      return "فندقي";
    default:
      return "غير محدد";
  }
};

const translateLevel = (level: number): string => {
  switch (level) {
    case 1:
      return "الفرقة الأولى";
    case 2:
      return "الفرقة الثانية";
    case 3:
      return "الفرقة الثالثة";
    case 4:
      return "الفرقة الرابعة";
    case 5:
      return "الفرقة الخامسة";
    case 6:
      return "الفرقة السادسة";
    case 7:
      return "دراسات عليا";
    default:
      return "غير محدد";
  }
};

export default function StudentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadStudent(id);
    }
  }, [id]);

  const loadStudent = async (studentId: string) => {
    try {
      setLoading(true);

      // Use fetchAPI instead of direct fetch
      const data = await fetchAPI(`/api/Students/${studentId}`);
      console.log("Student data loaded:", {
        studentId,
        photoUrl: data.photoUrl,
        resolvedPhotoUrl: resolvePhotoUrl(data.photoUrl),
      });
      setStudent(data);
    } catch (error: any) {
      console.error("Error loading student:", error);
      toast.error(error.message || "فشل تحميل بيانات الطالب");

      // Handle specific error cases
      if (
        error.message?.includes("401") ||
        error.message?.includes("غير مصرح")
      ) {
        toast.error("غير مصرح بالوصول");
        navigate("/login");
        return;
      }

      if (
        error.message?.includes("404") ||
        error.message?.includes("لم يتم العثور")
      ) {
        toast.error("لم يتم العثور على الطالب");
        navigate("/students");
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="mr-3 text-gray-600">جاري تحميل البيانات...</span>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-8" dir="rtl">
        <p className="text-gray-600 text-lg">لم يتم العثور على الطالب</p>
        <button
          onClick={() => navigate("/students")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          العودة إلى القائمة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/students")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="العودة إلى القائمة"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">تفاصيل الطالب</h1>
            <p className="text-gray-600 mt-1">عرض كافة معلومات الطالب</p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/students/edit/${student.studentId}`)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Edit className="w-5 h-5" />
          تعديل البيانات
        </button>
      </div>

      {/* Student Profile */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {student.photoUrl ? (
              <div className="relative">
                <img
                  src={resolvePhotoUrl(student.photoUrl)}
                  alt={`${student.firstName} ${student.lastName}`}
                  className="w-40 h-40 rounded-lg object-cover border-4 border-white shadow"
                  style={{
                    maxWidth: "160px",
                    maxHeight: "160px",
                    width: "160px",
                    height: "160px",
                  }}
                  onError={(e) => {
                    console.error("Image failed to load:", student.photoUrl);
                    (e.target as HTMLImageElement).src =
                      "https://via.placeholder.com/160x160/3B82F6/FFFFFF?text=صورة";
                  }}
                />
              </div>
            ) : (
              <div
                className="w-40 h-40 rounded-lg bg-blue-100 flex items-center justify-center border-4 border-white shadow"
                style={{
                  maxWidth: "160px",
                  maxHeight: "160px",
                  width: "160px",
                  height: "160px",
                }}
              >
                <User className="w-16 h-16 text-blue-600" />
              </div>
            )}

            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {student.firstName} {student.lastName}
                  </h2>
                  <div className="flex flex-wrap gap-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      <Hash className="w-4 h-4" />
                      {student.studentId}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      <Shield className="w-4 h-4" />
                      {translateStatus(student.status)}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      <Heart className="w-4 h-4" />
                      {translateReligion(student.religion)}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      آخر تحديث: {new Date().toLocaleDateString("ar-EG")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Basic Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information Card */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  المعلومات الأساسية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">الرقم القومي:</span>
                      <span className="font-semibold text-gray-900">
                        {student.nationalId}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">البريد الإلكتروني:</span>
                      <span className="font-semibold text-gray-900 flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {student.email}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">رقم الهاتف:</span>
                      <span className="font-semibold text-gray-900 flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {student.phoneNumber}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">نوع السكن:</span>
                      <span className="font-semibold text-gray-900">
                        {translateDormType(student.dormType)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">المبنى:</span>
                      <span className="font-semibold text-gray-900 flex items-center gap-1">
                        <Building className="w-4 h-4" />
                        {student.buildingNumber}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">رقم الغرفة:</span>
                      <span className="font-semibold text-gray-900">
                        {student.roomNumber}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Academic Information Card */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-green-600" />
                  المعلومات الأكاديمية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">الكلية:</span>
                      <span className="font-semibold text-gray-900">
                        {student.faculty}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">الفرقة:</span>
                      <span className="font-semibold text-gray-900">
                        {translateLevel(student.level)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">التقدير:</span>
                      <span className="font-semibold text-gray-900">
                        {student.grade}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">الحالة:</span>
                      <span
                        className={`font-semibold ${
                          student.status === 1
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {translateStatus(student.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Additional Info */}
            <div className="space-y-6">
              {/* Address Card */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red-600" />
                  العنوان
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-600 mb-1">المحافظة:</p>
                    <p className="font-semibold text-gray-900">
                      {student.government}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">المركز/الحي:</p>
                    <p className="font-semibold text-gray-900">
                      {student.district}
                    </p>
                  </div>
                  {student.streetName && (
                    <div>
                      <p className="text-gray-600 mb-1">الشارع:</p>
                      <p className="font-semibold text-gray-900">
                        {student.streetName}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Family Information Card */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  معلومات الأسرة
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-600 mb-1">اسم الأب:</p>
                    <p className="font-semibold text-gray-900">
                      {student.fatherName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">هاتف الأب:</p>
                    <p className="font-semibold text-gray-900">
                      {student.fatherPhone}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">مهنة الأب:</p>
                    <p className="font-semibold text-gray-900">
                      {student.fatherProfession || "غير محدد"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Guardian Information Card */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-orange-600" />
                  معلومات ولي الأمر
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-600 mb-1">اسم ولي الأمر:</p>
                    <p className="font-semibold text-gray-900">
                      {student.guardianName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">العلاقة:</p>
                    <p className="font-semibold text-gray-900">
                      {student.guardianRelationship}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 mb-1">هاتف ولي الأمر:</p>
                    <p className="font-semibold text-gray-900">
                      {student.guardianPhone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Special Information Card */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  معلومات إضافية
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">لديه إعاقة:</span>
                    <span
                      className={`font-semibold ${
                        student.hasSpecialNeeds
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {student.hasSpecialNeeds ? "نعم" : "لا"}
                    </span>
                  </div>
                  {student.hasSpecialNeeds && student.specialNeedsDetails && (
                    <div>
                      <p className="text-gray-600 mb-1">تفاصيل الإعاقة:</p>
                      <p className="text-sm text-gray-700">
                        {student.specialNeedsDetails}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">معفى من الرسوم:</span>
                    <span
                      className={`font-semibold ${
                        student.isExemptFromFees
                          ? "text-green-600"
                          : "text-gray-600"
                      }`}
                    >
                      {student.isExemptFromFees ? "نعم" : "لا"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
