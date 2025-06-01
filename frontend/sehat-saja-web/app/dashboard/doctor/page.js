"use client";
import { useState, useEffect, useRef } from "react";
import {
  User,
  Calendar,
  CurrencyDollar,
  House,
  Clock,
  FirstAid,
  Receipt,
  Camera,
  UsersThree,
  CaretRight,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "../../../lib/firebase";
import {
  onAuthStateChanged,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

export default function DoctorDashboard() {
  const [activeView, setActiveView] = useState("schedule");
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [payments, setPayments] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [newTime, setNewTime] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const fileInputRef = useRef(null);
  const router = useRouter();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Formatting functions
  const formatDate = (date) => {
    if (!date) return "N/A";
    const d = date?.toDate?.() || new Date(date);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (time) => time || "N/A";

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Data fetching methods
  const fetchDoctorData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setDoctorData({
          uid: uid,
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          specialization: data.specialization || "",
          gender: data.gender || "",
          birthDate: data.birthDate || "",
          licenseNumber: data.licenseNumber || "",
          photoUrl: data.photoUrl || "",
          role: data.role || "role",
          price: data.price || 0,
          description: data.description || "",
          status: data.status || "pending",
          createdAt: data.createdAt || "",
          lastLogin: data.lastLogin || "",
          dailySchedules: data.dailySchedules || {},
        });
      }
    } catch (error) {
      console.error("Error fetching doctor data:", error);
    }
  };

  const fetchAppointments = async (uid) => {
    try {
      const q = query(
        collection(db, "appointments"),
        where("doctorId", "==", uid)
      );
      const snapshot = await getDocs(q);
      const appointmentsData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          patientName: doc.data().patientName || "",
          patientAge: doc.data().patientAge || "",
          date: doc.data().date?.toDate?.() || new Date(doc.data().date),
          time: doc.data().time || "",
          complaint: doc.data().complaint || "",
          status: doc.data().status || "pending",
        }))
        .sort((a, b) => b.date - a.date);

      return appointmentsData;
    } catch (error) {
      console.error("Error fetching appointments:", error);
      return [];
    }
  };

  const fetchSchedules = async (uid) => {
    try {
      const q = query(
        collection(db, "schedules"),
        where("doctorId", "==", uid)
      );
      const snapshot = await getDocs(q);
      const schedulesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        date: doc.data().date?.toDate?.() || new Date(doc.data().date),
        time: doc.data().time || "",
        status: doc.data().status || "available",
      }));

      return schedulesData;
    } catch (error) {
      console.error("Error fetching schedules:", error);
      return [];
    }
  };

  const fetchPayments = async (uid) => {
    try {
      const q = query(collection(db, "payments"), where("doctorId", "==", uid));
      const snapshot = await getDocs(q);
      const paymentsData = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          patientName: doc.data().patientName || "",
          amount: doc.data().amount || 0,
          method: doc.data().method || "",
          status: doc.data().status || "pending",
          date: doc.data().date?.toDate?.() || new Date(doc.data().date),
        }))
        .sort((a, b) => b.date - a.date);

      return paymentsData;
    } catch (error) {
      console.error("Error fetching payments:", error);
      return [];
    }
  };

  const fetchAllData = async (uid) => {
    try {
      const [appointmentsData, schedulesData, paymentsData] = await Promise.all(
        [fetchAppointments(uid), fetchSchedules(uid), fetchPayments(uid)]
      );

      setAppointments(appointmentsData);
      setSchedules(schedulesData);
      setPayments(paymentsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Initial data loading
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          await fetchDoctorData(currentUser.uid);
          await fetchAllData(currentUser.uid);
        } catch (error) {
          console.error("Error loading data:", error);
        }
      } else {
        router.push("/sign-in");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Schedule Management
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const availableDates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleDateSelect = (date) => setSelectedDate(date);

  const handleMonthChange = (increment) => {
    let newMonth = currentMonth + increment;
    let newYear = currentYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    setSelectedDate(null);
  };

  const handleAddTimeSlot = async () => {
    if (!selectedDate || !newTime) return;

    try {
      const selectedDateObj = new Date(currentYear, currentMonth, selectedDate);
      const dateString = selectedDateObj.toISOString().split("T")[0]; // Format: YYYY-MM-DD

      // Get current doctor document
      const doctorDocRef = doc(db, "users", auth.currentUser?.uid);
      const doctorDoc = await getDoc(doctorDocRef);

      if (doctorDoc.exists()) {
        const currentData = doctorDoc.data();
        const currentSchedules = currentData.dailySchedules || {};

        // Add new time slot to the specific date
        if (!currentSchedules[dateString]) {
          currentSchedules[dateString] = [];
        }

        // Check if time slot already exists
        if (!currentSchedules[dateString].includes(newTime)) {
          currentSchedules[dateString].push(newTime);

          // Sort time slots for the day
          currentSchedules[dateString].sort();

          // Update the document
          await updateDoc(doctorDocRef, {
            dailySchedules: currentSchedules,
            updatedAt: new Date(),
          });

          await fetchDoctorData(auth.currentUser?.uid);
          setNewTime("");
          console.log("Time slot added successfully!");
        } else {
          console.log("Time slot already exists for this date");
        }
      }
    } catch (error) {
      console.error("Error adding time slot:", error);
    }
  };

  const handleDeleteTimeSlot = async (scheduleId) => {
    try {
      const [dateString, timeSlot] = scheduleId.split("-");

      const doctorDocRef = doc(db, "users", auth.currentUser?.uid);
      const doctorDoc = await getDoc(doctorDocRef);

      if (doctorDoc.exists()) {
        const currentData = doctorDoc.data();
        const currentSchedules = currentData.dailySchedules || {};

        if (currentSchedules[dateString]) {
          // Remove the specific time slot
          currentSchedules[dateString] = currentSchedules[dateString].filter(
            (time) => time !== timeSlot
          );

          // If no time slots left for this date, remove the date entry
          if (currentSchedules[dateString].length === 0) {
            delete currentSchedules[dateString];
          }

          // Update the document
          await updateDoc(doctorDocRef, {
            dailySchedules: currentSchedules,
            updatedAt: new Date(),
          });

          await fetchDoctorData(auth.currentUser?.uid);
        }
      }
    } catch (error) {
      console.error("Error deleting time slot:", error);
    }
  };

  // Appointment Management
  const handleAppointmentStatusChange = async (appointmentId, status) => {
    try {
      await updateDoc(doc(db, "appointments", appointmentId), { status });
      await fetchAllData(auth.currentUser?.uid);
    } catch (error) {
      console.error("Error updating appointment status:", error);
    }
  };

  // Account Management
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: doctorData?.name || "",
    email: doctorData?.email || "",
    phone: doctorData?.phone || "",
    specialization: doctorData?.specialization || "",
    photoUrl: doctorData?.photoUrl || "",
    price: doctorData?.price || 0,
    description: doctorData?.description || "",
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [tempPhotoUrl, setTempPhotoUrl] = useState("");

  useEffect(() => {
    if (doctorData) {
      setEditData({
        name: doctorData.name || "",
        email: doctorData.email || "",
        phone: doctorData.phone || "",
        specialization: doctorData.specialization || "",
        photoUrl: doctorData.photoUrl || "",
        price: doctorData.price || 0,
        description: doctorData.description || "", // TAMBAH INI
      });
    }
  }, [doctorData]);

  const handleImageChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (!file.type.match("image.*")) {
        setPasswordError("File must be an image");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setPasswordError("Image size too large (max 2MB)");
        return;
      }

      setIsUploading(true);
      setPasswordError("");

      try {
        const reader = new FileReader();
        reader.onload = (e) => setTempPhotoUrl(e.target.result);
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Error creating preview:", error);
        setPasswordError("Failed to process image");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const uploadProfileImage = async (file) => {
    if (!file || !doctorData) return null;

    try {
      // Delete old image if exists
      if (doctorData.photoUrl && doctorData.photoUrl.startsWith("https://")) {
        const oldImageRef = ref(storage, doctorData.photoUrl);
        await deleteObject(oldImageRef).catch(() => {});
      }

      // Upload new image
      const storageRef = ref(
        storage,
        `profile_images/${doctorData.uid}/${Date.now()}`
      );
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const handleSave = async () => {
    try {
      if (!doctorData) return;

      setIsPasswordLoading(true);
      setPasswordError("");
      setPasswordSuccess("");

      let photoUrl = doctorData.photoUrl;

      // Upload new image if exists
      if (tempPhotoUrl && fileInputRef.current.files[0]) {
        photoUrl = await uploadProfileImage(fileInputRef.current.files[0]);

        // Update photoURL in Firebase Auth
        await updateProfile(auth.currentUser, {
          displayName: editData.name,
          photoURL: photoUrl,
        });
      }

      // Update user document in Firestore
      const userDocRef = doc(db, "users", doctorData.uid);
      await updateDoc(userDocRef, {
        name: editData.name,
        phone: editData.phone,
        specialization: editData.specialization,
        price: Number(editData.price),
        description: editData.description, // TAMBAH INI
        photoUrl: photoUrl,
        updatedAt: new Date(),
      });

      // Update local state
      setDoctorData({
        ...doctorData,
        name: editData.name,
        phone: editData.phone,
        specialization: editData.specialization,
        price: Number(editData.price),
        description: editData.description, // TAMBAH INI
        photoUrl: photoUrl,
      });

      setTempPhotoUrl("");
      setIsEditing(false);
      setPasswordSuccess("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      setPasswordError("Failed to update profile. Please try again.");
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }

    try {
      setIsPasswordLoading(true);

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        doctorData.email, // Ganti dari user.email
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential); // Ganti dari reauthenticateWithCredential(user, credential)

      // Update password
      await updatePassword(auth.currentUser, newPassword); // Ganti dari updatePassword(user, newPassword)

      // Update Firestore with password change timestamp
      const userDocRef = doc(db, "users", auth.currentUser.uid); // Ganti dari doc(db, "users", user.uid)
      await updateDoc(userDocRef, {
        lastPasswordChange: new Date().toISOString(),
      });

      // Clear form and show success
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess("Password changed successfully!");
    } catch (error) {
      console.error("Error changing password:", error);

      if (error.code === "auth/wrong-password") {
        setPasswordError("Current password is incorrect.");
      } else if (error.code === "auth/too-many-requests") {
        setPasswordError(
          "Too many unsuccessful attempts. Please try again later."
        );
      } else {
        setPasswordError("Failed to change password. " + error.message);
      }
    } finally {
      setIsPasswordLoading(false);
    }
  };

  // View Components
  const ScheduleView = () => {
    const displayCurrentSchedules = () => {
      if (!doctorData?.dailySchedules) return [];

      const schedules = [];
      const currentMonthSchedules = Object.entries(
        doctorData.dailySchedules
      ).filter(([dateString]) => {
        const date = new Date(dateString);
        return (
          date.getMonth() === currentMonth && date.getFullYear() === currentYear
        );
      });

      currentMonthSchedules.forEach(([dateString, timeSlots]) => {
        const date = new Date(dateString);
        timeSlots.forEach((timeSlot) => {
          schedules.push({
            id: `${dateString}-${timeSlot}`,
            date: date,
            time: timeSlot,
            dateString: dateString,
          });
        });
      });

      return schedules.sort((a, b) => a.date - b.date);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar size={24} /> Schedule Management
          </h1>
          <button
            onClick={() => fetchDoctorData(doctorData.uid)}
            className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* BAGIAN MENAMPILKAN SCHEDULES YANG SUDAH ADA */}
        <div className="mb-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-6">Available Time Slots</h2>
          {(() => {
            const currentSchedules = displayCurrentSchedules();

            if (currentSchedules.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">
                  No schedules created yet for {monthNames[currentMonth]}{" "}
                  {currentYear}
                </div>
              );
            }

            // Group schedules by date
            const groupedSchedules = currentSchedules.reduce(
              (acc, schedule) => {
                const dateKey = schedule.date.toDateString();
                if (!acc[dateKey]) {
                  acc[dateKey] = [];
                }
                acc[dateKey].push(schedule);
                return acc;
              },
              {}
            );

            return (
              <div className="space-y-4">
                {Object.entries(groupedSchedules).map(
                  ([dateKey, schedules]) => (
                    <div key={dateKey} className="pb-4">
                      <h3 className="font-medium text-lg mb-3">
                        {schedules[0].date.getDate()}{" "}
                        {monthNames[schedules[0].date.getMonth()]}{" "}
                        {schedules[0].date.getFullYear()}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {schedules.map((schedule) => (
                          <div
                            key={schedule.id}
                            className="flex justify-between items-center p-3 bg-blue-50 rounded-lg"
                          >
                            <span className="font-medium">{schedule.time}</span>
                            <button
                              onClick={() => handleDeleteTimeSlot(schedule.id)}
                              className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                              title="Delete time slot"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            );
          })()}
        </div>

        {/* BAGIAN UNTUK MENAMBAH SCHEDULE BARU - INI YANG HILANG! */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-6">Add New Schedule</h2>

          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => handleMonthChange(-1)}
              className="p-2 rounded-full hover:bg-blue-50"
            >
              <CaretRight className="rotate-180" size={20} />
            </button>
            <div className="text-center">
              <span className="text-xl font-medium">
                {monthNames[currentMonth]} {currentYear}
              </span>
            </div>
            <button
              onClick={() => handleMonthChange(1)}
              className="p-2 rounded-full hover:bg-blue-50"
            >
              <CaretRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-8">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-medium py-2">
                {day}
              </div>
            ))}

            {Array.from({
              length: new Date(currentYear, currentMonth, 1).getDay(),
            }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10"></div>
            ))}

            {availableDates.map((date) => (
              <button
                key={date}
                onClick={() => handleDateSelect(date)}
                className={`h-10 rounded-lg transition flex items-center justify-center ${
                  selectedDate === date
                    ? "bg-blue-600 text-white font-medium"
                    : "hover:bg-blue-50"
                }`}
              >
                {date}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">
                Selected Date:{" "}
                {selectedDate
                  ? `${selectedDate} ${monthNames[currentMonth]} ${currentYear}`
                  : "None"}
              </label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <button
              onClick={handleAddTimeSlot}
              disabled={!selectedDate || !newTime}
              className={`mt-6 px-6 py-3 rounded-lg transition font-medium ${
                selectedDate && newTime
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              Add Time Slot
            </button>
          </div>
        </div>
      </div>
    );
  };

  const AppointmentsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UsersThree size={24} /> Patient Appointments
        </h1>
        <button
          onClick={() => fetchAllData(doctorData.uid)}
          className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
        >
          Refresh
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow text-center border border-gray-100">
          <p className="text-gray-500">No appointments found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white p-5 rounded-xl shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-100"
              onClick={() =>
                setSelectedItem({ type: "appointment", data: appointment })
              }
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">
                    {appointment.patientName}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Age: {appointment.patientAge || "N/A"}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    appointment.status === "confirmed"
                      ? "bg-blue-100 text-blue-800"
                      : appointment.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : appointment.status === "cancelled"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {appointment.status}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={16} />
                  <span>{formatDate(appointment.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={16} />
                  <span>{formatTime(appointment.time)}</span>
                </div>
                <div className="pt-2">
                  <p className="font-medium text-gray-700">Complaint:</p>
                  <p className="text-gray-600">
                    {appointment.complaint || "Not specified"}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100">
                {appointment.status === "confirmed" && (
                  <div className="flex justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAppointmentStatusChange(
                          appointment.id,
                          "completed"
                        );
                      }}
                      className="px-3 py-1 text-xs text-green-600 hover:text-green-800 bg-green-50 rounded-lg transition-colors"
                    >
                      Mark Completed
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAppointmentStatusChange(
                          appointment.id,
                          "cancelled"
                        );
                      }}
                      className="px-3 py-1 text-xs text-red-600 hover:text-red-800 bg-red-50 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const PaymentsView = () => {
    const stats = {
      total: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
      completed: payments.filter((p) => p.status === "completed").length,
      pending: payments.filter((p) => p.status === "pending").length,
    };

    return (
      <div className="space-y-6 text-black">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CurrencyDollar size={24} /> Payment Records
          </h1>
          <button
            onClick={() => fetchAllData(doctorData.uid)}
            className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
            <p className="text-gray-500 text-sm">Total Earnings</p>
            <p className="text-2xl font-bold">{formatCurrency(stats.total)}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
            <p className="text-gray-500 text-sm">Completed Payments</p>
            <p className="text-2xl font-bold">{stats.completed}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
            <p className="text-gray-500 text-sm">Pending Payments</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow text-center border border-gray-100">
            <p className="text-gray-500">No payment records found</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="hover:bg-blue-50 cursor-pointer"
                      onClick={() =>
                        setSelectedItem({ type: "payment", data: payment })
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payment.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.patientName || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            payment.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : payment.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const AccountView = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
      name: doctorData?.name || "",
      email: doctorData?.email || "",
      phone: doctorData?.phone || "",
      specialization: doctorData?.specialization || "",
      photoUrl: doctorData?.photoUrl || "",
      price: doctorData?.price || 0,
      description: doctorData?.description || "",
    });
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [profileImage, setProfileImage] = useState("");
    const fileInputRef = useRef(null);

    const handleImageChange = (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];

        if (!file.type.match("image.*")) {
          setPasswordError("File must be an image");
          return;
        }
        if (file.size > 2 * 1024 * 1024) {
          setPasswordError("Image size too large (max 2MB)");
          return;
        }

        setIsUploading(true);
        setPasswordError("");

        const reader = new FileReader();
        reader.onloadend = () => {
          setProfileImage(reader.result);
          setIsUploading(false);
        };
        reader.onerror = () => {
          console.error("Error creating preview");
          setPasswordError("Failed to process image");
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
      }
    };

    const triggerFileInput = () => {
      fileInputRef.current.click();
    };

    const handleSave = async () => {
      try {
        if (!auth.currentUser) return;

        setIsPasswordLoading(true);
        setPasswordError("");
        setPasswordSuccess("");

        let photoUrl = doctorData.photoUrl;

        if (profileImage && profileImage.startsWith("data:")) {
          photoUrl = profileImage;
        }

        // Ganti dari const doctorDocRef = doc(db, "doctors", user.uid)
        const userDocRef = doc(db, "users", auth.currentUser.uid);

        await updateDoc(userDocRef, {
          name: editData.name,
          phone: editData.phone,
          specialization: editData.specialization,
          price: Number(editData.price),
          description: editData.description,
          photoUrl: photoUrl,
          updatedAt: new Date(),
        });

        await updateProfile(auth.currentUser, {
          // Ganti dari updateProfile(user, ...)
          displayName: editData.name,
        });

        setDoctorData({
          ...editData,
          photoUrl: photoUrl,
        });

        setProfileImage("");
        setIsEditing(false);
        setPasswordSuccess("Profile updated successfully!");
      } catch (error) {
        console.error("Error updating profile:", error);
        setPasswordError("Failed to update profile. Please try again.");
      } finally {
        setIsPasswordLoading(false);
      }
    };

    const handleChangePassword = async () => {
      setPasswordError("");
      setPasswordSuccess("");

      if (!currentPassword || !newPassword || !confirmPassword) {
        setPasswordError("Please fill in all password fields.");
        return;
      }

      if (newPassword !== confirmPassword) {
        setPasswordError("New passwords do not match.");
        return;
      }

      if (newPassword.length < 8) {
        setPasswordError("Password must be at least 8 characters long.");
        return;
      }

      try {
        setIsPasswordLoading(true);

        // Reauthenticate user
        const credential = EmailAuthProvider.credential(
          doctorData.email, // Ganti dari user.email
          currentPassword
        );
        await reauthenticateWithCredential(auth.currentUser, credential); // Ganti dari reauthenticateWithCredential(user, credential)

        // Update password
        await updatePassword(auth.currentUser, newPassword); // Ganti dari updatePassword(user, newPassword)

        // Update Firestore with password change timestamp
        const userDocRef = doc(db, "users", auth.currentUser.uid); // Ganti dari doc(db, "users", user.uid)
        await updateDoc(userDocRef, {
          lastPasswordChange: new Date().toISOString(),
        });

        // Clear form and show success
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordSuccess("Password changed successfully!");
      } catch (error) {
        console.error("Error changing password:", error);

        if (error.code === "auth/wrong-password") {
          setPasswordError("Current password is incorrect.");
        } else if (error.code === "auth/too-many-requests") {
          setPasswordError(
            "Too many unsuccessful attempts. Please try again later."
          );
        } else {
          setPasswordError("Failed to change password. " + error.message);
        }
      } finally {
        setIsPasswordLoading(false);
      }
    };

    return (
      <div className="space-y-6 text-black">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User size={24} /> Account Settings
        </h1>

        {/* Profile Information Section */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Profile Information</h2>
            {!isEditing ? (
              <button
                onClick={() => {
                  setEditData({
                    name: doctorData.name || "",
                    email: doctorData.email || "",
                    phone: doctorData.phone || "",
                    specialization: doctorData.specialization || "",
                    photoUrl: doctorData.photoUrl || "",
                    price: doctorData.price || 0,
                  });
                  setIsEditing(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setProfileImage("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isPasswordLoading}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                    isPasswordLoading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isPasswordLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>

          {!isEditing ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <img
                  src={doctorData?.photoUrl || "/assets/default-profile.jpg"}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => {
                    e.target.src = "/assets/default-profile.jpg";
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">
                    {doctorData?.name || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">
                    {doctorData?.email || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="font-medium">
                    {doctorData?.description || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-medium">
                    {doctorData?.phone || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Specialization</p>
                  <p className="font-medium">
                    {doctorData?.specialization || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">License Number</p>
                  <p className="font-medium">
                    {doctorData?.licenseNumber || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium capitalize">
                    {doctorData?.status || "pending"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="font-medium">
                    {formatCurrency(doctorData?.price || 0)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div
                  className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer border-2 border-gray-300 hover:border-blue-500 transition-colors"
                  onClick={triggerFileInput}
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : doctorData?.photoUrl ? (
                    <img
                      src={doctorData.photoUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "/assets/default-profile.jpg";
                      }}
                    />
                  ) : (
                    <Camera size={32} className="text-gray-400" />
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                  </div>
                )}
                <p className="text-xs text-gray-500 text-center mt-2">
                  Click to change photo (max 2MB, JPG/PNG)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={editData.name}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100"
                    value={editData.email}
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    rows="3"
                    value={editData.description}
                    onChange={(e) =>
                      setEditData({ ...editData, description: e.target.value })
                    }
                    placeholder="Describe your experience, qualifications, and approach to patient care"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tell patients about your background and expertise
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={editData.phone}
                    onChange={(e) =>
                      setEditData({ ...editData, phone: e.target.value })
                    }
                    placeholder="e.g. +1 234 567 8900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Specialization *
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={editData.specialization}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        specialization: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Consultation Price (IDR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={editData.price}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        price:
                          e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    placeholder="e.g. 150000"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Change Password Section */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Change Password</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Current Password *
              </label>
              <input
                type="password"
                className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                New Password *
              </label>
              <input
                type="password"
                className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>

          {(passwordError || passwordSuccess) && (
            <div
              className={`mt-4 p-3 rounded-lg ${
                passwordError
                  ? "bg-red-50 text-red-700"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {passwordError || passwordSuccess}
            </div>
          )}

          <div className="flex justify-end mt-4">
            <button
              onClick={handleChangePassword}
              disabled={isPasswordLoading}
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 ${
                isPasswordLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isPasswordLoading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Updating...
                </span>
              ) : (
                "Update Password"
              )}
            </button>
          </div>
        </div>

        {/* Account Actions Section */}
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Account Actions</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Delete Account</h3>
                <p className="text-sm text-gray-500">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <button
                className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                onClick={() => {
                  if (
                    confirm(
                      "Are you sure you want to delete your account? This action cannot be undone."
                    )
                  ) {
                    // Handle account deletion
                  }
                }}
              >
                Delete Account
              </button>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Logout</h3>
                <p className="text-sm text-gray-500">
                  Sign out of your account on this device
                </p>
              </div>
              <button
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => {
                  // Handle logout logic
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DetailModal = () => {
    if (!selectedItem) return null;

    const { type, data } = selectedItem;
    const isAppointment = type === "appointment";
    const isPayment = type === "payment";

    return (
      <div className="fixed inset-0 text-black bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {isAppointment ? "Appointment Details" : "Payment Details"}
              </h2>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {isAppointment && (
                <>
                  <div className="pb-4 border-b border-gray-100">
                    <p className="text-sm text-gray-500">Patient</p>
                    <p className="font-medium text-lg">{data.patientName}</p>
                    <p className="text-gray-600">
                      Age: {data.patientAge || "N/A"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">{formatDate(data.date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-medium">{formatTime(data.time)}</p>
                    </div>
                  </div>

                  <div className="pb-4 border-b border-gray-100">
                    <p className="text-sm text-gray-500">Complaint</p>
                    <p className="font-medium">
                      {data.complaint || "Not specified"}
                    </p>
                  </div>

                  <div className="pb-4 border-b border-gray-100">
                    <p className="text-sm text-gray-500">Status</p>
                    <select
                      value={data.status}
                      onChange={(e) => {
                        handleAppointmentStatusChange(data.id, e.target.value);
                        setSelectedItem(null);
                      }}
                      className={`mt-1 w-full p-2 border rounded ${
                        data.status === "confirmed"
                          ? "bg-blue-100 text-blue-800"
                          : data.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : data.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </>
              )}

              {isPayment && (
                <>
                  <div className="pb-4 border-b border-gray-100">
                    <p className="text-sm text-gray-500">Payment ID</p>
                    <p className="font-medium">
                      {data.id.substring(0, 8).toUpperCase()}
                    </p>
                  </div>

                  <div className="pb-4 border-b border-gray-100">
                    <p className="text-sm text-gray-500">Patient</p>
                    <p className="font-medium">{data.patientName || "N/A"}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-medium text-blue-600">
                        {formatCurrency(data.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payment Method</p>
                      <p className="font-medium capitalize">
                        {data.method || "Not specified"}
                      </p>
                    </div>
                  </div>

                  <div className="pb-4 border-b border-gray-100">
                    <p className="text-sm text-gray-500">Status</p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        data.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : data.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {data.status}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setSelectedItem(null)}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-black bg-blue-50">
      {/* Sidebar*/}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center gap-3 border-b border-gray-200">
            <div className="relative">
              <img
                src={doctorData?.photoUrl || "/assets/default-profile.jpg"}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border border-gray-300"
                onError={(e) => {
                  e.target.src = "/assets/default-profile.jpg";
                }}
              />
            </div>
            <div>
              <h2 className="font-semibold">{doctorData?.name || "Doctor"}</h2>
              <p className="text-xs text-gray-500">
                {doctorData?.specialization || "Specialty"}
              </p>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <button
              onClick={() => setActiveView("schedule")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
                activeView === "schedule"
                  ? "bg-blue-100 text-blue-600"
                  : "hover:bg-gray-100"
              } transition-colors`}
            >
              <Calendar size={20} />
              Schedule Management
            </button>
            <button
              onClick={() => setActiveView("appointments")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
                activeView === "appointments"
                  ? "bg-blue-100 text-blue-600"
                  : "hover:bg-gray-100"
              } transition-colors`}
            >
              <UsersThree size={20} />
              Patient Appointments
            </button>
            <button
              onClick={() => setActiveView("payments")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
                activeView === "payments"
                  ? "bg-blue-100 text-blue-600"
                  : "hover:bg-gray-100"
              } transition-colors`}
            >
              <CurrencyDollar size={20} />
              Payment Records
            </button>
            <button
              onClick={() => setActiveView("account")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
                activeView === "account"
                  ? "bg-blue-100 text-blue-600"
                  : "hover:bg-gray-100"
              } transition-colors`}
            >
              <User size={20} />
              Account Settings
            </button>
          </nav>

          <div className="p-4 border-t border-gray-200 flex flex-col gap-2">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-1000 hover:text-white bg-blue-100 text-blue-600 transition-colors"
            >
              <House size={20} />
              Back to Home
            </Link>
            <button
              onClick={() => signOut(auth)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left bg-red-100 hover:bg-red-400 hover:text-white text-red-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {activeView === "schedule" && <ScheduleView />}
            {activeView === "appointments" && <AppointmentsView />}
            {activeView === "payments" && <PaymentsView />}
            {activeView === "account" && <AccountView />}
          </>
        )}
      </div>

      <DetailModal />
    </div>
  );
}