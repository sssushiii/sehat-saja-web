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
} from "@phosphor-icons/react";
import Link from "next/link";
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
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  updateDoc,
  limit,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { useRouter } from "next/navigation";

export default function PatientDashboard() {
  const [activeView, setActiveView] = useState("appointments");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [accountData, setAccountData] = useState({
    name: "",
    email: "",
    phone: "",
    birthDate: "",
    gender: "",
    photoUrl: "",
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const fileInputRef = useRef(null);
  const router = useRouter();

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

  // Data fetching
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          await fetchUserData(currentUser.uid);
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

  const fetchUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setAccountData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          birthDate: data.birthDate || "",
          gender: data.gender || "",
          photoUrl: data.photoUrl || "",
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchAllData = async (uid) => {
    try {
      const [appointmentsData, paymentsData] = await Promise.all([
        fetchAppointments(uid),
        fetchPayments(uid),
      ]);

      // Link payments to appointments
      const paymentsWithAppointments = await Promise.all(
        paymentsData.map(async (payment) => {
          if (payment.appointmentId) {
            const appointmentDoc = await getDoc(
              doc(db, "appointments", payment.appointmentId)
            );
            if (appointmentDoc.exists()) {
              payment.appointment = {
                id: appointmentDoc.id,
                ...appointmentDoc.data(),
                date:
                  appointmentDoc.data().date?.toDate?.() ||
                  new Date(appointmentDoc.data().date),
              };
            }
          }
          return payment;
        })
      );

      setAppointments(appointmentsData);
      setPayments(paymentsWithAppointments);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchAppointments = async (uid) => {
    try {
      const q = query(
        collection(db, "appointments"),
        where("patientId", "==", uid)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate?.() || new Date(doc.data().date),
        }))
        .sort((a, b) => b.date - a.date);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      return [];
    }
  };

  const fetchPayments = async (uid) => {
    try {
      const q = query(
        collection(db, "payments"),
        where("patientId", "==", uid)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate?.() || new Date(doc.data().date),
        }))
        .sort((a, b) => b.date - a.date);
    } catch (error) {
      console.error("Error fetching payments:", error);
      return [];
    }
  };

  const AccountView = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ ...accountData });
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [tempPhotoUrl, setTempPhotoUrl] = useState("");

    const handleImageChange = async (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];

        // Validate image
        if (!file.type.match("image.*")) {
          setPasswordError("File harus berupa gambar");
          return;
        }
        if (file.size > 2 * 1024 * 1024) {
          // 2MB
          setPasswordError("Ukuran gambar terlalu besar (maksimal 2MB)");
          return;
        }

        setIsUploading(true);
        setPasswordError("");

        try {
          // Create preview
          const reader = new FileReader();
          reader.onload = (e) => setTempPhotoUrl(e.target.result);
          reader.readAsDataURL(file);

          setIsUploading(false);
        } catch (error) {
          console.error("Error creating preview:", error);
          setPasswordError("Gagal memproses gambar");
          setIsUploading(false);
        }
      }
    };

    const triggerFileInput = () => {
      fileInputRef.current.click();
    };

    const uploadProfileImage = async (file) => {
      if (!file || !user) return null;

      try {
        // Delete old image if exists
        if (
          accountData.photoUrl &&
          accountData.photoUrl.startsWith("https://")
        ) {
          const oldImageRef = ref(storage, accountData.photoUrl);
          await deleteObject(oldImageRef).catch(() => {});
        }

        // Upload new image
        const storageRef = ref(
          storage,
          `profile_images/${user.uid}/${Date.now()}`
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
        if (!user) return;

        setIsPasswordLoading(true);
        setPasswordError("");
        setPasswordSuccess("");

        let photoUrl = accountData.photoUrl;

        // Upload new image if exists
        if (tempPhotoUrl && fileInputRef.current.files[0]) {
          photoUrl = await uploadProfileImage(fileInputRef.current.files[0]);

          // Update photoURL in Firebase Auth
          await updateProfile(user, {
            displayName: editData.name,
            photoURL: photoUrl,
          });
        }

        // Update user document in Firestore
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          name: editData.name,
          phone: editData.phone,
          birthDate: editData.birthDate,
          gender: editData.gender,
          photoUrl: photoUrl,
          updatedAt: new Date(),
        });

        // Update local state
        setAccountData({
          ...editData,
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

      if (newPassword.length < 6) {
        setPasswordError("Password must be at least 6 characters long.");
        return;
      }

      try {
        setIsPasswordLoading(true);

        // Reauthenticate user
        const credential = EmailAuthProvider.credential(
          user.email,
          currentPassword
        );
        await reauthenticateWithCredential(user, credential);

        // Update password
        await updatePassword(user, newPassword);

        // Update Firestore with password change timestamp
        const userDocRef = doc(db, "users", user.uid);
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
                  setEditData({ ...accountData });
                  setIsEditing(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setTempPhotoUrl("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-blue-50 transition-colors"
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
                  src={accountData.photoUrl || "/assets/default-profile.jpg"}
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
                  <p className="font-medium">{accountData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{accountData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-medium">
                    {accountData.phone || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium">
                    {accountData.birthDate
                      ? formatDate(accountData.birthDate)
                      : "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium capitalize">
                    {accountData.gender || "Not specified"}
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
                  {tempPhotoUrl ? (
                    <img
                      src={tempPhotoUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : accountData.photoUrl ? (
                    <img
                      src={accountData.photoUrl}
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
                  Click to change photo (max 2MB)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Full Name
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
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={editData.birthDate}
                    onChange={(e) =>
                      setEditData({ ...editData, birthDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Gender
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={editData.gender}
                    onChange={(e) =>
                      setEditData({ ...editData, gender: e.target.value })
                    }
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
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
                Current Password
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
                New Password
              </label>
              <input
                type="password"
                className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Confirm New Password
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
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
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
      </div>
    );
  };

  const AppointmentsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FirstAid size={24} /> My Appointments
        </h1>
        <button
          onClick={() => fetchAllData(user.uid)}
          className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
        >
          Refresh
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow text-center">
          <p className="text-gray-500">No appointments found</p>
          <Link
            href="/appointment"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Book an Appointment
          </Link>
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
                    {appointment.doctorName}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {appointment.specialization}
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

              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="font-semibold text-blue-600">
                  {formatCurrency(appointment.price)}
                </span>
                {appointment.status === "confirmed" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelAppointment(appointment.id);
                    }}
                    className="px-3 py-1 text-xs text-red-600 hover:text-red-800 bg-red-50 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
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
            <Receipt size={24} /> Payment History
          </h1>
          <button
            onClick={() => fetchAllData(user.uid)}
            className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
            <p className="text-gray-500 text-sm">Total Spent</p>
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
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
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
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.description}
                        </div>
                        {payment.appointment && (
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(payment.appointment.date)} at{" "}
                            {payment.appointment.time}
                          </div>
                        )}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {payment.status === "pending" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePayNow(payment.id);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Pay Now
                          </button>
                        )}
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
                    <p className="text-sm text-gray-500">Doctor</p>
                    <p className="font-medium text-lg">{data.doctorName}</p>
                    <p className="text-gray-600">{data.specialization}</p>
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

                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="font-medium text-blue-600">
                        {formatCurrency(data.price)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          data.status === "confirmed"
                            ? "bg-blue-100 text-blue-800"
                            : data.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : data.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {data.status}
                      </span>
                    </div>
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
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="font-medium">{data.description}</p>
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
                        {data.paymentMethod || "Not specified"}
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

                  {data.appointment && (
                    <div className="pt-2">
                      <p className="font-medium text-gray-700 mb-2">
                        Associated Appointment
                      </p>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <FirstAid size={16} className="text-gray-500" />
                          <span className="font-medium">
                            {data.appointment.doctorName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm mt-1 text-gray-600">
                          <Calendar size={16} />
                          <span>{formatDate(data.appointment.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm mt-1 text-gray-600">
                          <Clock size={16} />
                          <span>{data.appointment.time}</span>
                        </div>
                      </div>
                    </div>
                  )}
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
                src={accountData.photoUrl || "/assets/default-profile.jpg"}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border border-gray-300"
                onError={(e) => {
                  e.target.src = "/assets/default-profile.jpg";
                }}
              />
            </div>
            <div>
              <h2 className="font-semibold">{accountData.name}</h2>
              <p className="text-xs text-gray-500">Patient</p>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <button
              onClick={() => setActiveView("appointments")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
                activeView === "appointments"
                  ? "bg-blue-100 text-blue-600"
                  : "hover:bg-gray-100"
              } transition-colors`}
            >
              <FirstAid size={20} />
              Appointments
            </button>
            <button
              onClick={() => setActiveView("payments")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
                activeView === "payments"
                  ? "bg-blue-100 text-blue-600"
                  : "hover:bg-gray-100"
              } transition-colors`}
            >
              <Receipt size={20} />
              Payments
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
              Account
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
        {activeView === "appointments" && <AppointmentsView />}
        {activeView === "payments" && <PaymentsView />}
        {activeView === "account" && <AccountView />}
      </div>

      <DetailModal />
    </div>
  );
}
