import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Upload, User, X } from "lucide-react";
import { toast } from "sonner";
import { API_BASE } from "../lib/api";

export default function StudentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUploaded, setPhotoUploaded] = useState(false); // ADD THIS LINE

  // Ain Shams University Faculties
  const ainShamsFaculties = [
    "كلية الهندسة",
    "كلية الطب",
    "كلية طب الأسنان",
    "كلية الصيدلة",
    "كلية العلوم",
    "كلية الآداب",
    "كلية التجارة",
    "كلية الحقوق",
    "كلية الزراعة",
    "كلية البنات للآداب والعلوم والتربية",
    "كلية التربية",
    "كلية التربية النوعية",
    "كلية الحاسبات والمعلومات",
    "كلية التمريض",
    "كلية العلاج الطبيعي",
    "كلية العلوم الاجتماعية",
    "كلية الآثار",
    "كلية اللغات والترجمة",
    "كلية التربية الرياضية للبنين",
    "كلية التربية الرياضية للبنين",
  ];

  // Grade options in Arabic
  const gradeOptions = [
    { value: "امتياز", label: "امتياز" },
    { value: "جيد جدا", label: "جيد جدا" },
    { value: "جيد", label: "جيد" },
    { value: "مقبول", label: "مقبول" },
    { value: "ضعيف", label: "ضعيف" },
    { value: "راسب", label: "راسب" },
  ];

  // Egyptian Governorates (محافظات مصر)
  const egyptianGovernorates = [
    "القاهرة",
    "الجيزة",
    "الإسكندرية",
    "القليوبية",
    "المنوفية",
    "الغربية",
    "الشرقية",
    "الدقهلية",
    "كفر الشيخ",
    "دمياط",
    "بورسعيد",
    "الإسماعيلية",
    "السويس",
    "شمال سيناء",
    "جنوب سيناء",
    "البحر الأحمر",
    "بني سويف",
    "الفيوم",
    "المنيا",
    "أسيوط",
    "سوهاج",
    "قنا",
    "الأقصر",
    "أسوان",
    "الوادي الجديد",
    "مطروح",
    "البحيرة",
  ];

  // Sort and remove duplicates
  const uniqueGovernorates = [...new Set(egyptianGovernorates)].sort();

  const [formData, setFormData] = useState({
    studentId: "",
    nationalId: "",
    isEgyptian: true,
    firstName: "",
    lastName: "",
    status: 1,
    email: "",
    phoneNumber: "",
    religion: 1,
    government: "",
    district: "",
    streetName: "",
    faculty: "",
    level: 1,
    grade: "",
    percentageGrade: null,
    secondarySchoolName: "",
    secondarySchoolGovernment: "",
    highSchoolPercentage: null,
    dormType: 1,
    buildingNumber: "",
    roomNumber: "",
    hasSpecialNeeds: false,
    specialNeedsDetails: "",
    isExemptFromFees: false,
    fatherName: "",
    fatherNationalId: "",
    fatherProfession: "",
    fatherPhone: "",
    guardianName: "",
    guardianRelationship: "",
    guardianPhone: "",
    photoUrl: "",
  });

  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? e.target.checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      toast.error("الرجاء اختيار صورة بصيغة JPG, JPEG, PNG أو GIF");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile) {
      toast.error("الرجاء اختيار صورة أولاً");
      return;
    }

    if (!formData.studentId) {
      toast.error("الرجاء إدخال رقم الملف أولاً");
      return;
    }

    setUploadingPhoto(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("لم يتم العثور على رمز المصادقة");
        navigate("/");
        return;
      }

      const formDataObj = new FormData();
      formDataObj.append("file", selectedFile);

      const response = await fetch(
        `${API_BASE}/api/Students/${formData.studentId}/photo`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataObj,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `خطأ في رفع الصورة: ${response.status}`);
      }

      const result = await response.json();
      const photoUrl = result.photoUrl;

      // Update form data with the new photo URL
      setFormData((prev) => ({
        ...prev,
        photoUrl: photoUrl,
      }));

      toast.success("تم رفع الصورة بنجاح");

      // Clear selected file and preview
      setPhotoUploaded(true); // ADD THIS LINE
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error(error.message || "فشل رفع الصورة");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = () => {
    setFormData((prev) => ({
      ...prev,
      photoUrl: "",
    }));
    setPreviewUrl(""); // ADD THIS
    setPhotoUploaded(false); // ADD THIS
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error(
          "لم يتم العثور على رمز المصادقة. يرجى تسجيل الدخول مرة أخرى."
        );
        navigate("/");
        return;
      }

      // Debug: Check what photoUrl we have
      console.log("photoUrl before submission:", formData.photoUrl);
      console.log("Is photoUrl empty?", !formData.photoUrl);
      console.log("Is photoUrl null?", formData.photoUrl === null);

      // Prepare the data - IMPORTANT: Send empty string instead of null for PhotoUrl
      const studentData = {
        studentId: formData.studentId,
        nationalId: formData.nationalId,
        isEgyptian: formData.isEgyptian,
        firstName: formData.firstName,
        lastName: formData.lastName,
        status: parseInt(formData.status),
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        religion: parseInt(formData.religion),
        government: formData.government,
        district: formData.district,
        streetName: formData.streetName || "", // Use empty string instead of null
        faculty: formData.faculty,
        level: parseInt(formData.level),
        grade: formData.grade,
        percentageGrade: formData.percentageGrade
          ? parseFloat(formData.percentageGrade)
          : null,
        secondarySchoolName: formData.secondarySchoolName || "", // Use empty string instead of null
        secondarySchoolGovernment: formData.secondarySchoolGovernment || "", // Use empty string instead of null
        highSchoolPercentage: formData.highSchoolPercentage
          ? parseFloat(formData.highSchoolPercentage)
          : null,
        dormType: parseInt(formData.dormType),
        buildingNumber: formData.buildingNumber,
        roomNumber: formData.roomNumber,
        hasSpecialNeeds: formData.hasSpecialNeeds,
        specialNeedsDetails: formData.hasSpecialNeeds
          ? formData.specialNeedsDetails || ""
          : "", // Use empty string instead of null
        isExemptFromFees: formData.isExemptFromFees,
        fatherName: formData.fatherName,
        fatherNationalId: formData.fatherNationalId,
        fatherProfession: formData.fatherProfession || "", // Use empty string instead of null
        fatherPhone: formData.fatherPhone,
        guardianName: formData.guardianName,
        guardianRelationship: formData.guardianRelationship,
        guardianPhone: formData.guardianPhone,
        photoUrl: formData.photoUrl || "", // Use empty string instead of null
      };

      console.log("Student data being sent:", studentData);
      console.log("PhotoUrl in data:", studentData.photoUrl);

      const url = isEditMode
        ? `${API_BASE}/api/Students/${id}`
        : `${API_BASE}/api/Students`;

      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(studentData),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(errorText || `خطأ HTTP! الحالة: ${response.status}`);
      }

      const result = await response.json();
      console.log("Success:", result);

      toast.success(
        isEditMode ? "تم تحديث بيانات الطالب بنجاح!" : "تم إنشاء الطالب بنجاح!"
      );
      navigate("/students");
    } catch (error) {
      console.error("Error saving student:", error);
      toast.error(error.message || "فشل حفظ بيانات الطالب");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isEditMode) return;

    const fetchStudent = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          toast.error("لم يتم العثور على رمز المصادقة");
          navigate("/");
          return;
        }

        const response = await fetch(`${API_BASE}/api/Students/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`خطأ HTTP! الحالة: ${response.status}`);
        }

        const data = await response.json();

        setFormData({
          studentId: data.studentId || "",
          nationalId: data.nationalId || "",
          isEgyptian: data.isEgyptian ?? true,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          status: data.status ?? 1,
          email: data.email || "",
          phoneNumber: data.phoneNumber || "",
          religion: data.religion ?? 1,
          government: data.government || "",
          district: data.district || "",
          streetName: data.streetName || "",
          faculty: data.faculty || "",
          level: data.level || 1,
          grade: data.grade || "",
          percentageGrade: data.percentageGrade || null,
          secondarySchoolName: data.secondarySchoolName || "",
          secondarySchoolGovernment: data.secondarySchoolGovernment || "",
          highSchoolPercentage: data.highSchoolPercentage || null,
          dormType: data.dormType || 1,
          buildingNumber: data.buildingNumber || "",
          roomNumber: data.roomNumber || "",
          hasSpecialNeeds: data.hasSpecialNeeds || false,
          specialNeedsDetails: data.specialNeedsDetails || "",
          isExemptFromFees: data.isExemptFromFees || false,
          fatherName: data.fatherName || "",
          fatherNationalId: data.fatherNationalId || "",
          fatherProfession: data.fatherProfession || "",
          fatherPhone: data.fatherPhone || "",
          guardianName: data.guardianName || "",
          guardianRelationship: data.guardianRelationship || "",
          guardianPhone: data.guardianPhone || "",
          photoUrl: data.photoUrl || "",
        });
      } catch (error) {
        console.error("Error fetching student:", error);
        toast.error(error.message || "فشل تحميل بيانات الطالب");
      }
    };

    fetchStudent();
  }, [id, isEditMode, navigate]);

  const isNewStudent = parseInt(formData.status) === 1;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          aria-label="العودة إلى قائمة الطلاب"
          onClick={() => navigate("/students")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? "تحديث بيانات الطالب" : "إضافة طالب جديد"}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditMode
              ? "قم بتحديث معلومات الطالب"
              : "املأ التفاصيل لتسجيل طالب جديد"}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
        <div className="p-6 space-y-8">
          {/* Photo Upload Section - Moved to top */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              صورة الطالب
            </h2>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Photo Preview */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  {previewUrl || formData.photoUrl ? (
                    <div className="relative">
                      <img
                        src={
                          previewUrl ||
                          (formData.photoUrl &&
                          formData.photoUrl.startsWith("http")
                            ? formData.photoUrl
                            : formData.photoUrl
                            ? `${API_BASE}${formData.photoUrl}`
                            : "")
                        }
                        alt="Preview"
                        className="w-40 h-40 max-w-[160px] max-h-[160px] rounded-lg object-cover border-4 border-white shadow"
                      />
                      {photoUploaded && (
                        <button
                          type="button"
                          onClick={removePhoto}
                          className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="w-40 h-40 max-w-[160px] max-h-[160px] rounded-lg bg-blue-100 flex items-center justify-center border-4 border-white shadow">
                      <User className="w-16 h-16 text-blue-600" />
                    </div>
                  )}
                </div>

                {/* File Input */}
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    {selectedFile ? "تغيير الصورة" : "اختر صورة"}
                  </label>

                  {selectedFile && (
                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        {selectedFile.name}
                      </p>
                      <button
                        type="button"
                        onClick={handleUploadPhoto}
                        disabled={uploadingPhoto}
                        className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {uploadingPhoto ? "جاري الرفع..." : "رفع الصورة"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-gray-600">
                <p className="mb-2">متطلبات الصورة:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>الصيغ المسموحة: JPG, JPEG, PNG, GIF</li>
                  <li>الحجم الأقصى: 5 ميجابايت</li>
                  <li>الأبعاد الموصى بها: 160×160 بيكسل</li>
                  <li>يجب أن تكون الصورة واضحة ومواجهة للكاميرا</li>
                  <li>خلفية موحدة (يفضل خلفية بيضاء)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              المعلومات الأساسية
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="studentId" className="block text-gray-700 mb-2">
                  رقم الملف *
                </label>
                <input
                  id="studentId"
                  name="studentId"
                  type="text"
                  value={formData.studentId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  placeholder="STU001234"
                  required
                  dir="ltr"
                />
              </div>

              <div>
                <label
                  htmlFor="nationalId"
                  className="block text-gray-700 mb-2"
                >
                  الرقم القومي *
                </label>
                <input
                  id="nationalId"
                  name="nationalId"
                  type="text"
                  value={formData.nationalId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  placeholder="12345678901234"
                  required
                  dir="ltr"
                />
              </div>

              <div>
                <label className="inline-flex items-center gap-2">
                  <input
                    id="isEgyptian"
                    name="isEgyptian"
                    type="checkbox"
                    checked={formData.isEgyptian}
                    onChange={handleChange}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span>مصري الجنسية</span>
                </label>
              </div>

              <div>
                <label htmlFor="status" className="block text-gray-700 mb-2">
                  حالة الطالب *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  required
                >
                  <option value="1">طالب جديد</option>
                  <option value="2">طالب قديم</option>
                </select>
              </div>

              <div>
                <label htmlFor="firstName" className="block text-gray-700 mb-2">
                  الاسم الأول *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  placeholder="محمد"
                  required
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-gray-700 mb-2">
                  الاسم الأخير *
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  placeholder="سامح السيد عبدالرحمن"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-gray-700 mb-2">
                  البريد الإلكتروني *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  placeholder="student@asu.edu.eg"
                  required
                  dir="ltr"
                />
              </div>

              <div>
                <label
                  htmlFor="phoneNumber"
                  className="block text-gray-700 mb-2"
                >
                  رقم الهاتف *
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  placeholder="+20 123 456 7890"
                  required
                  dir="ltr"
                />
              </div>

              <div>
                <label htmlFor="religion" className="block text-gray-700 mb-2">
                  الديانة *
                </label>
                <select
                  id="religion"
                  name="religion"
                  value={formData.religion}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  required
                >
                  <option value="1">مسلم</option>
                  <option value="2">مسيحي</option>
                  <option value="3">أخرى</option>
                </select>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              العنوان
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="government"
                  className="block text-gray-700 mb-2"
                >
                  المحافظة *
                </label>
                <select
                  id="government"
                  name="government"
                  value={formData.government}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  required
                >
                  <option value="">اختر المحافظة</option>
                  {uniqueGovernorates.map((governorate, index) => (
                    <option key={index} value={governorate}>
                      {governorate}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="district" className="block text-gray-700 mb-2">
                  المركز/الحي *
                </label>
                <input
                  id="district"
                  name="district"
                  type="text"
                  value={formData.district}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  placeholder="مدينة نصر"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="streetName"
                  className="block text-gray-700 mb-2"
                >
                  اسم الشارع
                </label>
                <input
                  id="streetName"
                  name="streetName"
                  type="text"
                  value={formData.streetName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  placeholder="شارع النيل"
                />
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              المعلومات الأكاديمية
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="faculty" className="block text-gray-700 mb-2">
                  الكلية *
                </label>
                <select
                  id="faculty"
                  name="faculty"
                  value={formData.faculty}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  required
                >
                  <option value="">اختر الكلية</option>
                  {ainShamsFaculties.map((faculty, index) => (
                    <option key={index} value={faculty}>
                      {faculty}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="level" className="block text-gray-700 mb-2">
                  الفرقة (المستوى) *
                </label>
                <select
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  required
                >
                  <option value="1">الفرقة الأولى</option>
                  <option value="2">الفرقة الثانية</option>
                  <option value="3">الفرقة الثالثة</option>
                  <option value="4">الفرقة الرابعة</option>
                  <option value="5">الفرقة الخامسة</option>
                  <option value="6">الفرقة السادسة</option>
                </select>
              </div>

              <div>
                <label htmlFor="grade" className="block text-gray-700 mb-2">
                  التقدير *
                </label>
                <select
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  required
                >
                  <option value="">اختر التقدير</option>
                  {gradeOptions.map((grade, index) => (
                    <option key={index} value={grade.value}>
                      {grade.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="percentageGrade"
                  className="block text-gray-700 mb-2"
                >
                  النسبة المئوية للدرجة
                </label>
                <input
                  id="percentageGrade"
                  name="percentageGrade"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.percentageGrade || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  placeholder="85.5"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Secondary School Information (for New Students) */}
          {isNewStudent && (
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                معلومات الثانوية العامة (للطلاب الجدد)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="secondarySchoolName"
                    className="block text-gray-700 mb-2"
                  >
                    اسم المدرسة الثانوية *
                  </label>
                  <input
                    id="secondarySchoolName"
                    name="secondarySchoolName"
                    type="text"
                    value={formData.secondarySchoolName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                    placeholder="مدرسة عين شمس الثانوية"
                    required={isNewStudent}
                  />
                </div>

                <div>
                  <label
                    htmlFor="secondarySchoolGovernment"
                    className="block text-gray-700 mb-2"
                  >
                    محافظة المدرسة الثانوية *
                  </label>
                  <select
                    id="secondarySchoolGovernment"
                    name="secondarySchoolGovernment"
                    value={formData.secondarySchoolGovernment}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                    required={isNewStudent}
                  >
                    <option value="">اختر المحافظة</option>
                    {uniqueGovernorates.map((governorate, index) => (
                      <option key={index} value={governorate}>
                        {governorate}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="highSchoolPercentage"
                    className="block text-gray-700 mb-2"
                  >
                    النسبة المئوية للثانوية العامة *
                  </label>
                  <input
                    id="highSchoolPercentage"
                    name="highSchoolPercentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.highSchoolPercentage || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                    placeholder="92.5"
                    required={isNewStudent}
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Accommodation Information */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              معلومات السكن
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="dormType" className="block text-gray-700 mb-2">
                  نوع السكن *
                </label>
                <select
                  id="dormType"
                  name="dormType"
                  value={formData.dormType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  required
                >
                  <option value="1">عادي</option>
                  <option value="2">مميز</option>
                  <option value="3">فندقي</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="buildingNumber"
                  className="block text-gray-700 mb-2"
                >
                  المبنى *
                </label>
                <select
                  id="buildingNumber"
                  name="buildingNumber"
                  value={formData.buildingNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  required
                >
                  <option value="">اختر المبنى</option>
                  <option value="المبنى أ">المبنى أ</option>
                  <option value="المبنى ب">المبنى ب</option>
                  <option value="المبنى ج">المبنى ج</option>
                  <option value="المبنى د">المبنى د</option>
                  <option value="المبنى هـ">المبنى هـ</option>
                  <option value="المبنى و">المبنى و</option>
                  <option value="المبنى الجمهوري">المبنى الجمهوري</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="roomNumber"
                  className="block text-gray-700 mb-2"
                >
                  رقم الغرفة *
                </label>
                <input
                  id="roomNumber"
                  name="roomNumber"
                  type="text"
                  value={formData.roomNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  placeholder="٢٠٥"
                  required
                  dir="rtl"
                />
              </div>
            </div>
          </div>

          {/* Family Information */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              معلومات الأسرة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="fatherName"
                  className="block text-gray-700 mb-2"
                >
                  اسم الأب *
                </label>
                <input
                  id="fatherName"
                  name="fatherName"
                  type="text"
                  value={formData.fatherName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  placeholder="محمد حسن"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="fatherNationalId"
                  className="block text-gray-700 mb-2"
                >
                  الرقم القومي للأب *
                </label>
                <input
                  id="fatherNationalId"
                  name="fatherNationalId"
                  type="text"
                  value={formData.fatherNationalId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  placeholder="23456789012345"
                  required
                  dir="ltr"
                />
              </div>

              <div>
                <label
                  htmlFor="fatherProfession"
                  className="block text-gray-700 mb-2"
                >
                  مهنة الأب
                </label>
                <input
                  id="fatherProfession"
                  name="fatherProfession"
                  type="text"
                  value={formData.fatherProfession}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  placeholder="مهندس"
                />
              </div>

              <div>
                <label
                  htmlFor="fatherPhone"
                  className="block text-gray-700 mb-2"
                >
                  هاتف الأب *
                </label>
                <input
                  id="fatherPhone"
                  name="fatherPhone"
                  type="tel"
                  value={formData.fatherPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  placeholder="+20 111 222 3333"
                  required
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Guardian Information */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              معلومات ولي الأمر
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="guardianName"
                  className="block text-gray-700 mb-2"
                >
                  اسم ولي الأمر *
                </label>
                <input
                  id="guardianName"
                  name="guardianName"
                  type="text"
                  value={formData.guardianName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  placeholder="الاسم الكامل"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="guardianRelationship"
                  className="block text-gray-700 mb-2"
                >
                  العلاقة *
                </label>
                <select
                  id="guardianRelationship"
                  name="guardianRelationship"
                  value={formData.guardianRelationship}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  required
                >
                  <option value="">اختر العلاقة</option>
                  <option value="الأب">الأب</option>
                  <option value="الأم">الأم</option>
                  <option value="الوصي">الوصي</option>
                  <option value="الأخ">الأخ</option>
                  <option value="الأخت">الأخت</option>
                  <option value="العم">العم</option>
                  <option value="الخال">الخال</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="guardianPhone"
                  className="block text-gray-700 mb-2"
                >
                  رقم هاتف ولي الأمر *
                </label>
                <input
                  id="guardianPhone"
                  name="guardianPhone"
                  type="tel"
                  value={formData.guardianPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                  placeholder="+20 111 222 3333"
                  required
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              معلومات إضافية
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="inline-flex items-center gap-2">
                  <input
                    id="hasSpecialNeeds"
                    name="hasSpecialNeeds"
                    type="checkbox"
                    checked={formData.hasSpecialNeeds}
                    onChange={handleChange}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span>لديه إعاقة / احتياجات خاصة</span>
                </label>
                {formData.hasSpecialNeeds && (
                  <div className="mt-2">
                    <label
                      htmlFor="specialNeedsDetails"
                      className="block text-gray-700 mb-2"
                    >
                      تفاصيل الإعاقة / الاحتياجات الخاصة
                    </label>
                    <textarea
                      id="specialNeedsDetails"
                      name="specialNeedsDetails"
                      value={formData.specialNeedsDetails}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                      placeholder="تفاصيل عن الاحتياجات الخاصة أو الإعاقة"
                      rows={3}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="inline-flex items-center gap-2">
                  <input
                    id="isExemptFromFees"
                    name="isExemptFromFees"
                    type="checkbox"
                    checked={formData.isExemptFromFees}
                    onChange={handleChange}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span>معفى من الرسوم</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <button
            type="button"
            onClick={() => navigate("/students")}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading || uploadingPhoto}
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || uploadingPhoto}
          >
            <Save className="w-5 h-5" />
            {loading
              ? "جاري الحفظ..."
              : isEditMode
              ? "تحديث بيانات الطالب"
              : "إضافة طالب جديد"}
          </button>
        </div>
      </form>
    </div>
  );
}
