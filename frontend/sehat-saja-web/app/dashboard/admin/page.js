"use client";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { auth, db } from "../../../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlass,
  User,
  Calendar,
  House,
  CurrencyDollar,
  Newspaper,
  ChartBar,
  Spinner,
  Warning,
  SignOut,
} from "@phosphor-icons/react/dist/ssr";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Utility Functions
const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value || 0);

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = dateStr?.toDate?.() || new Date(dateStr);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatTime = (timeStr) => {
  if (!timeStr) return "-";
  return timeStr;
};

// Komponen Loading
const LoadingIndicator = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <Spinner className="animate-spin h-12 w-12 text-blue-500 mx-auto" />
      <p className="mt-4">Loading dashboard...</p>
    </div>
  </div>
);

// Komponen Error
const ErrorDisplay = ({ message, onRetry }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center p-6 bg-red-50 rounded-lg max-w-md">
      <Warning className="h-12 w-12 text-red-500 mx-auto" />
      <h3 className="text-lg font-medium mt-2">Error Occurred</h3>
      <p className="text-gray-600 mt-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      )}
    </div>
  </div>
);

// Komponen StatisticsDashboard
const StatisticsDashboard = ({
  users = [],
  appointments = [],
  payments = [],
  doctors = [],
}) => {
  const dailyVisitors = [
    { day: "Mon", visitors: 120 },
    { day: "Tue", visitors: 150 },
    { day: "Wed", visitors: 200 },
    { day: "Thu", visitors: 180 },
    { day: "Fri", visitors: 250 },
    { day: "Sat", visitors: 100 },
    { day: "Sun", visitors: 80 },
  ];

  const chartData = {
    labels: dailyVisitors.map((day) => day.day),
    datasets: [
      {
        label: "Visitors",
        data: dailyVisitors.map((day) => day.visitors),
        backgroundColor: "rgba(59, 130, 246, 0.7)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: "rgba(59, 130, 246, 1)",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Weekly Visitors",
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `${context.dataset.label}: ${context.raw}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 50,
        },
      },
    },
    maintainAspectRatio: false,
  };

  const totalPatients = users.filter((u) => u?.role === "user").length;
  const totalDoctors = doctors.length;
  const totalAdmins = users.filter((u) => u?.role === "admin").length;
  const onlineUsers = users.filter((u) => {
    const lastLogin = u?.lastLogin?.toDate?.() || new Date(u?.lastLogin || 0);
    const now = new Date();
    return (now - lastLogin) < 30 * 60 * 1000; // Online if last login within 30 minutes
  }).length;

  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter(
    (a) => a?.status === "completed"
  ).length;
  const confirmedAppointments = appointments.filter(
    (a) => a?.status === "confirmed"
  ).length;

  const totalRevenue = payments.reduce(
    (sum, payment) => sum + (payment?.price || 0),
    0
  );
  const completedPayments = payments.filter(
    (p) => p?.paymentStatus === "completed"
  ).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Statistics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card Statistics */}
        {[
          {
            title: "Daily Visitors",
            value: dailyVisitors.reduce((sum, day) => sum + day.visitors, 0),
            change: "+12% from yesterday",
            icon: <ChartBar size={24} className="text-blue-600" />,
            bg: "bg-blue-100",
          },
          {
            title: "Total Patients",
            value: totalPatients,
            change: "+5 new today",
            icon: <User size={24} className="text-green-600" />,
            bg: "bg-green-100",
          },
          {
            title: "Total Doctors",
            value: totalDoctors,
            change: `${doctors.filter(d => d?.status === "active").length} active`,
            icon: <User size={24} className="text-purple-600" />,
            bg: "bg-purple-100",
          },
          {
            title: "Total Admins",
            value: totalAdmins,
            change: `${onlineUsers} online`,
            icon: <User size={24} className="text-yellow-600" />,
            bg: "bg-yellow-100",
          },
        ].map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p
                  className={`text-sm mt-1 ${
                    stat.change.includes("+")
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  {stat.change}
                </p>
              </div>
              <div className={`${stat.bg} p-3 rounded-full`}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* User Statistics */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-4">User Statistics</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Online Users</span>
                <span className="text-sm font-medium">{onlineUsers}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-green-600 h-2.5 rounded-full"
                  style={{
                    width: `${Math.round((onlineUsers / users.length) * 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Offline Users</span>
                <span className="text-sm font-medium">{users.length - onlineUsers}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-gray-600 h-2.5 rounded-full"
                  style={{
                    width: `${Math.round(
                      ((users.length - onlineUsers) / users.length) * 100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex justify-between">
                <span className="text-sm">Total Users</span>
                <span className="text-sm font-bold">{users.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Appointment Statistics */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-4">Appointment Statistics</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Completed</span>
                <span className="text-sm font-medium">
                  {completedAppointments}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{
                    width: `${Math.round(
                      (completedAppointments / totalAppointments) * 100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Confirmed</span>
                <span className="text-sm font-medium">
                  {confirmedAppointments}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-yellow-400 h-2.5 rounded-full"
                  style={{
                    width: `${Math.round(
                      (confirmedAppointments / totalAppointments) * 100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex justify-between">
                <span className="text-sm">Total Appointments</span>
                <span className="text-sm font-bold">{totalAppointments}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Statistics */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-4">Payment Statistics</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Completed Payments</span>
                <span className="text-sm font-medium">{completedPayments}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-green-600 h-2.5 rounded-full"
                  style={{
                    width: `${Math.round(
                      (completedPayments / payments.length) * 100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Total Revenue</span>
                <span className="text-sm font-medium">
                  {formatRupiah(totalRevenue)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-purple-600 h-2.5 rounded-full"
                  style={{ width: "100%" }}
                ></div>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex justify-between">
                <span className="text-sm">Total Transactions</span>
                <span className="text-sm font-bold">{payments.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="h-80">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Recent Appointments */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-4">Recent Appointments</h3>
          <div className="space-y-3">
            {appointments.slice(0, 3).map((app) => (
              <div
                key={app.id}
                className="border-b pb-2 last:border-0 last:pb-0"
              >
                <p className="font-medium">{app.patientName || "Unknown"}</p>
                <p className="text-sm text-gray-600">
                  with {app.doctorName || "Unknown"} ({app.doctorSpecialization})
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(app.appointmentDate)} at {formatTime(app.appointmentTime)}
                </p>
                <p className="text-xs mt-1">
                  Status: <span className={`px-1 rounded ${
                    app.status === "confirmed" ? "bg-green-100 text-green-800" :
                    app.status === "completed" ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>{app.status}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-4">Recent Payments</h3>
          <div className="space-y-3">
            {payments.slice(0, 3).map((payment) => (
              <div
                key={payment.id}
                className="border-b pb-2 last:border-0 last:pb-0"
              >
                <p className="font-medium">{payment.patientName || "Unknown"}</p>
                <p className="text-sm text-gray-600">
                  {formatRupiah(payment.price)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(payment.createdAt)}
                </p>
                <p className="text-xs mt-1">
                  Status: <span className={`px-1 rounded ${
                    payment.paymentStatus === "completed" ? "bg-green-100 text-green-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>{payment.paymentStatus}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Doctors */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-4">Recent Doctors</h3>
          <div className="space-y-3">
            {doctors.slice(0, 3).map((doctor) => (
              <div
                key={doctor.uid}
                className="border-b pb-2 last:border-0 last:pb-0"
              >
                <p className="font-medium">{doctor.name || "Unknown"}</p>
                <p className="text-sm text-gray-600">
                  {doctor.specialization || "No specialization"}
                </p>
                <p className="text-xs text-gray-500">
                  {formatRupiah(doctor.price || 0)} per session
                </p>
                <p className="text-xs mt-1">
                  Status: <span className={`px-1 rounded ${
                    doctor.status === "active" ? "bg-green-100 text-green-800" :
                    doctor.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>{doctor.status || "unknown"}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Komponen UserManagement
const UserManagement = ({ users = [], onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [tempSearchTerm, setTempSearchTerm] = useState("");
  const [tempCategory, setTempCategory] = useState("all");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editData, setEditData] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  const handleEdit = (user) => {
    if (!user) return;
    setSelectedUser(user);
    setEditData({
      id: user.uid || user.id,
      name: user.name || "",
      email: user.email || "",
      role: user.role || "user",
      status: user.status || "offline",
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editData.id) return;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      await updateDoc(doc(db, "users", editData.id), {
        name: editData.name,
        email: editData.email,
        role: editData.role,
        updatedAt: serverTimestamp(),
      });
      await onRefresh();
      setIsEditing(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
      setUpdateError("Failed to update user. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(tempSearchTerm);
    setCategory(tempCategory);
  };

  const filteredUsers = users.filter((user) => {
    if (!user) return false;

    const name = user.name || "";
    const email = user.email || "";
    const role = user.role || "";

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === "all" || role === category;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Users</h1>

      {updateError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>{updateError}</p>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search Account"
              value={tempSearchTerm}
              onChange={(e) => setTempSearchTerm(e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Spinner className="animate-spin h-5 w-5 mr-2" />
              ) : (
                <MagnifyingGlass size={20} />
              )}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={tempCategory}
              onChange={(e) => setTempCategory(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">All</option>
              <option value="doctor">Doctor</option>
              <option value="user">Patient</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => {
                const lastLogin = user?.lastLogin?.toDate?.() || new Date(user?.lastLogin || 0);
                const isOnline = (new Date() - lastLogin) < 30 * 60 * 1000;
                
                return (
                  <tr key={user.uid || user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {user.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                        {user.role || "User"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {user.email || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          isOnline
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {isOnline ? "Online" : "Offline"} ({formatDate(user.lastLogin)})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        disabled={isUpdating}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit User</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                disabled={isUpdating}
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={editData.name}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                  disabled={isUpdating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={editData.email}
                  onChange={(e) =>
                    setEditData({ ...editData, email: e.target.value })
                  }
                  disabled={isUpdating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded"
                  value={editData.role}
                  onChange={(e) =>
                    setEditData({ ...editData, role: e.target.value })
                  }
                  disabled={isUpdating}
                >
                  <option value="doctor">Doctor</option>
                  <option value="user">Patient</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {updateError && (
                <div className="text-red-600 text-sm">{updateError}</div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                  disabled={isUpdating}
                >
                  {isUpdating && (
                    <Spinner className="animate-spin h-4 w-4 mr-2" />
                  )}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Komponen DoctorManagement
const DoctorManagement = ({ doctors = [], onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [tempSearchTerm, setTempSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [editData, setEditData] = useState({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [newScheduleDate, setNewScheduleDate] = useState("");
  const [newScheduleTime, setNewScheduleTime] = useState("");

  const handleEdit = (doctor) => {
    if (!doctor) return;
    setSelectedDoctor(doctor);
    setEditData({
      uid: doctor.uid,
      name: doctor.name || "",
      email: doctor.email || "",
      specialization: doctor.specialization || "",
      licenseNumber: doctor.licenseNumber || "",
      price: doctor.price || 0,
      status: doctor.status || "pending",
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editData.uid) return;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      await updateDoc(doc(db, "users", editData.uid), {
        name: editData.name,
        specialization: editData.specialization,
        licenseNumber: editData.licenseNumber,
        price: editData.price,
        status: editData.status,
        updatedAt: serverTimestamp(),
      });
      await onRefresh();
      setIsEditing(false);
      setSelectedDoctor(null);
    } catch (error) {
      console.error("Error updating doctor:", error);
      setUpdateError("Failed to update doctor. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = async (doctorId, newStatus) => {
    if (!doctorId) return;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      await updateDoc(doc(db, "users", doctorId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      await onRefresh();
    } catch (error) {
      console.error("Error updating doctor status:", error);
      setUpdateError("Failed to update doctor status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddSchedule = async () => {
    if (!selectedDoctor || !newScheduleDate || !newScheduleTime) return;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const doctorRef = doc(db, "users", selectedDoctor.uid);
      const doctorSnap = await getDoc(doctorRef);
      
      if (doctorSnap.exists()) {
        const currentSchedules = doctorSnap.data().dailySchedules || {};
        const updatedSchedules = {
          ...currentSchedules,
          [newScheduleDate]: [...(currentSchedules[newScheduleDate] || []), newScheduleTime]
        };

        await updateDoc(doctorRef, {
          dailySchedules: updatedSchedules,
          updatedAt: serverTimestamp(),
        });
        
        await onRefresh();
        setNewScheduleDate("");
        setNewScheduleTime("");
      }
    } catch (error) {
      console.error("Error adding schedule:", error);
      setUpdateError("Failed to add schedule. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveSchedule = async (date, time) => {
    if (!selectedDoctor || !date || !time) return;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const doctorRef = doc(db, "users", selectedDoctor.uid);
      const doctorSnap = await getDoc(doctorRef);
      
      if (doctorSnap.exists()) {
        const currentSchedules = doctorSnap.data().dailySchedules || {};
        const updatedTimes = (currentSchedules[date] || []).filter(t => t !== time);
        
        const updatedSchedules = updatedTimes.length > 0 
          ? { ...currentSchedules, [date]: updatedTimes }
          : Object.fromEntries(Object.entries(currentSchedules).filter(([d]) => d !== date));

        await updateDoc(doctorRef, {
          dailySchedules: updatedSchedules,
          updatedAt: serverTimestamp(),
        });
        
        await onRefresh();
      }
    } catch (error) {
      console.error("Error removing schedule:", error);
      setUpdateError("Failed to remove schedule. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(tempSearchTerm);
  };

  const filteredDoctors = doctors.filter((doctor) => {
    if (!doctor) return false;

    const name = doctor.name || "";
    const email = doctor.email || "";
    const specialization = doctor.specialization || "";

    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      specialization.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Doctors</h1>

      {updateError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>{updateError}</p>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search Doctors"
              value={tempSearchTerm}
              onChange={(e) => setTempSearchTerm(e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Spinner className="animate-spin h-5 w-5 mr-2" />
              ) : (
                <MagnifyingGlass size={20} />
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Specialization
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
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
            {filteredDoctors.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  No doctors found.
                </td>
              </tr>
            ) : (
              filteredDoctors.map((doctor) => (
                <tr key={doctor.uid} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {doctor.name || "Unknown"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {doctor.specialization || "No specialization"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatRupiah(doctor.price || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        doctor.status === "active"
                          ? "bg-green-100 text-green-800"
                          : doctor.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {doctor.status || "unknown"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(doctor)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      disabled={isUpdating}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => 
                        handleStatusChange(
                          doctor.uid, 
                          doctor.status === "active" ? "inactive" : "active"
                        )
                      }
                      className={`${
                        doctor.status === "active"
                          ? "text-red-600 hover:text-red-900"
                          : "text-green-600 hover:text-green-900"
                      }`}
                      disabled={isUpdating}
                    >
                      {doctor.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isEditing && selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Doctor</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                disabled={isUpdating}
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={editData.name}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                  disabled={isUpdating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={editData.email}
                  onChange={(e) =>
                    setEditData({ ...editData, email: e.target.value })
                  }
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Specialization</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={editData.specialization}
                  onChange={(e) =>
                    setEditData({ ...editData, specialization: e.target.value })
                  }
                  disabled={isUpdating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">License Number</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={editData.licenseNumber}
                  onChange={(e) =>
                    setEditData({ ...editData, licenseNumber: e.target.value })
                  }
                  disabled={isUpdating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={editData.price}
                  onChange={(e) =>
                    setEditData({ ...editData, price: Number(e.target.value) })
                  }
                  disabled={isUpdating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded"
                  value={editData.status}
                  onChange={(e) =>
                    setEditData({ ...editData, status: e.target.value })
                  }
                  disabled={isUpdating}
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-3">Doctor Schedules</h3>
                {selectedDoctor.dailySchedules ? (
                  <div className="space-y-3">
                    {Object.entries(selectedDoctor.dailySchedules).map(([date, times]) => (
                      <div key={date} className="border rounded p-3">
                        <h4 className="font-medium">{formatDate(date)}</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {times.map((time) => (
                            <div key={`${date}-${time}`} className="flex items-center bg-gray-100 px-2 py-1 rounded">
                              <span>{time}</span>
                              <button
                                onClick={() => handleRemoveSchedule(date, time)}
                                className="ml-1 text-red-500 hover:text-red-700"
                                disabled={isUpdating}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No schedules available</p>
                )}

                <div className="mt-4 border-t pt-4">
                  <h4 className="font-medium mb-2">Add New Schedule</h4>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newScheduleDate}
                      onChange={(e) => setNewScheduleDate(e.target.value)}
                      className="p-2 border border-gray-300 rounded"
                      disabled={isUpdating}
                    />
                    <input
                      type="time"
                      value={newScheduleTime}
                      onChange={(e) => setNewScheduleTime(e.target.value)}
                      className="p-2 border border-gray-300 rounded"
                      disabled={isUpdating}
                    />
                    <button
                      onClick={handleAddSchedule}
                      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                      disabled={isUpdating || !newScheduleDate || !newScheduleTime}
                    >
                      {isUpdating ? (
                        <Spinner className="animate-spin h-4 w-4 mr-2" />
                      ) : (
                        "Add"
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {updateError && (
                <div className="text-red-600 text-sm">{updateError}</div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                  disabled={isUpdating}
                >
                  {isUpdating && (
                    <Spinner className="animate-spin h-4 w-4 mr-2" />
                  )}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Komponen AppointmentManagement
const AppointmentManagement = ({ appointments = [], doctors = [], onRefresh }) => {
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  const handleStatusChange = async (appointmentId, newStatus) => {
    if (!appointmentId) return;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      await updateDoc(doc(db, "appointments", appointmentId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      if (newStatus === "completed") {
        const appointment = appointments.find((a) => a.id === appointmentId);
        if (appointment) {
          await updateDoc(doc(db, "appointments", appointmentId), {
            paymentStatus: "completed",
            updatedAt: serverTimestamp(),
          });
        }
      }

      await onRefresh();
    } catch (error) {
      console.error("Error updating appointment:", error);
      setUpdateError("Failed to update appointment status.");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Appointments</h1>

      {updateError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>{updateError}</p>
        </div>
      )}

      <div className="space-y-4">
        {appointments.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow-sm text-center text-gray-500">
            No appointments found.
          </div>
        ) : (
          appointments.map((appointment) => {
            const doctor = doctors.find(d => d.uid === appointment.doctorId);
            
            return (
              <div key={appointment.id} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {appointment.patientName || "Unknown"} with{" "}
                      {appointment.doctorName || "Unknown"}
                    </h3>
                    <p className="text-gray-600">
                      {formatDate(appointment.appointmentDate)} at{" "}
                      {formatTime(appointment.appointmentTime)}
                    </p>
                    <p className="text-sm mt-1">
                      Complaint: {appointment.complaint || "No complaint"}
                    </p>
                    {doctor && (
                      <p className="text-sm">
                        Specialization: {doctor.specialization || "Unknown"}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        appointment.status
                      )}`}
                    >
                      {appointment.status || "Unknown"}
                    </span>
                    <button
                      onClick={() => setSelectedAppointment(appointment)}
                      className="text-blue-600 hover:text-blue-800"
                      aria-label="View details"
                      disabled={isUpdating}
                    >
                      Details
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => handleStatusChange(appointment.id, "cancelled")}
                    disabled={appointment.status === "cancelled" || isUpdating}
                    className={`px-3 py-1 text-sm rounded ${
                      appointment.status === "cancelled"
                        ? "bg-red-600 text-white cursor-not-allowed"
                        : "bg-red-100 text-red-800 hover:bg-red-200"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleStatusChange(appointment.id, "completed")}
                    disabled={
                      appointment.status === "completed" ||
                      appointment.status === "cancelled" ||
                      isUpdating
                    }
                    className={`px-3 py-1 text-sm rounded ${
                      appointment.status === "completed"
                        ? "bg-blue-600 text-white cursor-not-allowed"
                        : appointment.status === "cancelled"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                    }`}
                  >
                    Complete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Appointment Details</h2>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
                disabled={isUpdating}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Patient</p>
                <p className="font-medium">
                  {selectedAppointment.patientName || "Unknown"}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedAppointment.patientEmail || "No email"}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedAppointment.patientPhone || "No phone"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Doctor</p>
                <p className="font-medium">
                  {selectedAppointment.doctorName || "Unknown"}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedAppointment.doctorSpecialization || "No specialization"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-medium">
                  {formatDate(selectedAppointment.appointmentDate)} at{" "}
                  {formatTime(selectedAppointment.appointmentTime)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Complaint</p>
                <p className="font-medium">
                  {selectedAppointment.complaint || "No complaint"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Payment</p>
                <p className="font-medium">
                  {formatRupiah(selectedAppointment.price || 0)} ({selectedAppointment.paymentMethod || "Unknown"})
                </p>
                <p className="text-sm">
                  Status: <span className={`px-1 rounded ${
                    selectedAppointment.paymentStatus === "completed" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-yellow-100 text-yellow-800"
                  }`}>
                    {selectedAppointment.paymentStatus || "Unknown"}
                  </span>
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p
                  className={`font-medium px-2 py-1 inline-block rounded ${getStatusColor(
                    selectedAppointment.status
                  )}`}
                >
                  {selectedAppointment.status || "Unknown"}
                </p>
              </div>

              {updateError && (
                <div className="text-red-600 text-sm">{updateError}</div>
              )}

              <div className="pt-4 flex space-x-3">
                <button
                  onClick={() => {
                    handleStatusChange(selectedAppointment.id, "cancelled");
                    setSelectedAppointment(null);
                  }}
                  disabled={selectedAppointment.status === "cancelled" || isUpdating}
                  className={`flex-1 py-2 rounded ${
                    selectedAppointment.status === "cancelled"
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                >
                  {isUpdating ? (
                    <Spinner className="animate-spin h-5 w-5 mx-auto" />
                  ) : (
                    "Cancel Appointment"
                  )}
                </button>
                <button
                  onClick={() => {
                    handleStatusChange(selectedAppointment.id, "completed");
                    setSelectedAppointment(null);
                  }}
                  disabled={
                    selectedAppointment.status === "completed" ||
                    selectedAppointment.status === "cancelled" ||
                    isUpdating
                  }
                  className={`flex-1 py-2 rounded ${
                    selectedAppointment.status === "completed"
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : selectedAppointment.status === "cancelled"
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isUpdating ? (
                    <Spinner className="animate-spin h-5 w-5 mx-auto" />
                  ) : (
                    "Mark as Complete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Komponen PaymentManagement
const PaymentManagement = ({ payments = [] }) => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Payments</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold">
            {formatRupiah(payments.reduce((sum, p) => sum + (p.price || 0), 0))}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-500">Completed Payments</p>
          <p className="text-2xl font-bold">
            {payments.filter((p) => p?.paymentStatus === "completed").length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-500">Pending Payments</p>
          <p className="text-2xl font-bold">
            {payments.filter((p) => p?.paymentStatus === "pending").length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Doctor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No payments found.
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">
                      {payment.patientName || "Unknown"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {payment.patientEmail || "No email"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payment.doctorName || "Unknown"}
                    <div className="text-sm text-gray-500">
                      {payment.doctorSpecialization || "No specialization"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatRupiah(payment.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(payment.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap capitalize">
                    {payment.paymentMethod || "Unknown"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        payment.paymentStatus === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {payment.paymentStatus || "Unknown"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Komponen NewsManagement
const NewsManagement = ({ news = [], onRefresh }) => {
  const [newArticle, setNewArticle] = useState({
    title: "",
    category: "",
    content: "",
    image: null,
    labels: [],
    author: "Admin",
    date: new Date().toISOString().split("T")[0],
  });
  const [isCreating, setIsCreating] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        setError("Ukuran gambar terlalu besar (maksimal 2MB)");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEditing) {
          setEditingArticle({ ...editingArticle, image: reader.result });
        } else {
          setNewArticle({ ...newArticle, image: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async () => {
    if (!newArticle.title || !newArticle.content) {
      setError("Judul dan konten harus diisi");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await addDoc(collection(db, "news"), {
        title: newArticle.title,
        image: newArticle.image || "/assets/default-news.jpg",
        labels: newArticle.labels,
        description: newArticle.content.substring(0, 100) + "...",
        content: [newArticle.content],
        author: newArticle.author,
        date: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      await onRefresh();
      setIsCreating(false);
      setNewArticle({
        title: "",
        category: "",
        content: "",
        image: null,
        labels: [],
        author: "Admin",
        date: new Date().toISOString().split("T")[0],
      });
    } catch (err) {
      console.error("Error creating news:", err);
      setError("Gagal membuat artikel. Silakan coba lagi.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (
      !editingArticle?.id ||
      !editingArticle.title ||
      !editingArticle.content
    ) {
      setError("Judul dan konten harus diisi");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await updateDoc(doc(db, "news", editingArticle.id), {
        title: editingArticle.title,
        image: editingArticle.image || "/assets/default-news.jpg",
        labels: editingArticle.labels,
        description: editingArticle.content.substring(0, 100) + "...",
        content: [editingArticle.content],
        updatedAt: serverTimestamp(),
      });
      await onRefresh();
      setIsEditing(false);
      setEditingArticle(null);
    } catch (err) {
      console.error("Error updating news:", err);
      setError("Gagal memperbarui artikel. Silakan coba lagi.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (articleId) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus artikel ini?")) {
      setIsProcessing(true);
      setError(null);

      try {
        await deleteDoc(doc(db, "news", articleId));
        await onRefresh();
      } catch (err) {
        console.error("Error deleting news:", err);
        setError("Gagal menghapus artikel. Silakan coba lagi.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleEdit = (article) => {
    if (!article) return;
    setEditingArticle({
      ...article,
      content: article.content?.join?.("\n\n") || "",
      labels: article.labels || [],
    });
    setIsEditing(true);
  };

  const handleLabelChange = (e) => {
    const value = e.target.value.trim();
    if (!value) return;

    if (isEditing) {
      if (!editingArticle.labels.includes(value)) {
        setEditingArticle({
          ...editingArticle,
          labels: [...editingArticle.labels, value],
        });
      }
    } else {
      if (!newArticle.labels.includes(value)) {
        setNewArticle({
          ...newArticle,
          labels: [...newArticle.labels, value],
        });
      }
    }
    e.target.value = "";
  };

  const removeLabel = (labelToRemove) => {
    if (isEditing) {
      setEditingArticle({
        ...editingArticle,
        labels: editingArticle.labels.filter(
          (label) => label !== labelToRemove
        ),
      });
    } else {
      setNewArticle({
        ...newArticle,
        labels: newArticle.labels.filter((label) => label !== labelToRemove),
      });
    }
  };

  const categories = [
    "Medication",
    "Nursing",
    "Emergency",
    "Training",
    "Education",
    "Patient Care",
    "Hygiene",
    "Technology",
    "Innovation",
    "Mental Health",
    "Support",
    "Rural",
    "Access",
    "Diversity",
    "Ethics",
    "Chronic Illness",
    "Long-term Care",
    "Telehealth",
    "Future",
    "Nutrition",
    "Decision Making",
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage News</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>{error}</p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          disabled={isProcessing}
        >
          {isProcessing && <Spinner className="animate-spin h-5 w-5 mr-2" />}
          Create New Article
        </button>
      </div>

      <div className="space-y-4">
        {news.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow-sm text-center text-gray-500">
            No articles found.
          </div>
        ) : (
          news.map((article) => (
            <div key={article.id} className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <img
                    src={article.image || "/assets/default-news.jpg"}
                    alt={article.title}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {article.title || "Untitled"}
                  </h3>
                  <p className="text-gray-600">
                    {formatDate(article.date)} •{" "}
                    {article.labels?.join(", ") || "Uncategorized"}
                  </p>
                  <p className="mt-2 text-gray-700">
                    {article.description || "No description"}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => handleEdit(article)}
                  className="px-2 py-1 text-sm rounded bg-blue-100 text-blue-800 hover:bg-blue-200"
                  disabled={isProcessing}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(article.id)}
                  className="px-2 py-1 text-sm rounded bg-red-100 text-red-800 hover:bg-red-200"
                  disabled={isProcessing}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New Article</h2>
              <button
                onClick={() => setIsCreating(false)}
                className="text-gray-500 hover:text-gray-700"
                disabled={isProcessing}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={newArticle.title}
                  onChange={(e) =>
                    setNewArticle({ ...newArticle, title: e.target.value })
                  }
                  disabled={isProcessing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  disabled={isProcessing}
                />
                {newArticle.image && (
                  <div className="mt-2">
                    <img
                      src={newArticle.image}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 p-2 border border-gray-300 rounded"
                    onChange={handleLabelChange}
                    defaultValue=""
                    disabled={isProcessing}
                  >
                    <option value="" disabled>
                      Select category
                    </option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {newArticle.labels.map((label) => (
                    <span
                      key={label}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center"
                    >
                      {label}
                      <button
                        type="button"
                        onClick={() => removeLabel(label)}
                        className="ml-1 text-blue-600 hover:text-blue-900"
                        disabled={isProcessing}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Content
                </label>
                <textarea
                  rows={6}
                  className="w-full p-2 border border-gray-300 rounded"
                  value={newArticle.content}
                  onChange={(e) =>
                    setNewArticle({ ...newArticle, content: e.target.value })
                  }
                  disabled={isProcessing}
                ></textarea>
              </div>

              {error && <div className="text-red-600 text-sm">{error}</div>}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                  disabled={isProcessing}
                >
                  {isProcessing && (
                    <Spinner className="animate-spin h-4 w-4 mr-2" />
                  )}
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditing && editingArticle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Article</h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-500 hover:text-gray-700"
                disabled={isProcessing}
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={editingArticle.title}
                  onChange={(e) =>
                    setEditingArticle({
                      ...editingArticle,
                      title: e.target.value,
                    })
                  }
                  disabled={isProcessing}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  disabled={isProcessing}
                />
                {editingArticle.image && (
                  <div className="mt-2">
                    <img
                      src={editingArticle.image}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 p-2 border border-gray-300 rounded"
                    onChange={handleLabelChange}
                    defaultValue=""
                    disabled={isProcessing}
                  >
                    <option value="" disabled>
                      Select category
                    </option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {editingArticle.labels.map((label) => (
                    <span
                      key={label}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center"
                    >
                      {label}
                      <button
                        type="button"
                        onClick={() => removeLabel(label)}
                        className="ml-1 text-blue-600 hover:text-blue-900"
                        disabled={isProcessing}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Content
                </label>
                <textarea
                  rows={6}
                  className="w-full p-2 border border-gray-300 rounded"
                  value={editingArticle.content}
                  onChange={(e) =>
                    setEditingArticle({
                      ...editingArticle,
                      content: e.target.value,
                    })
                  }
                  disabled={isProcessing}
                ></textarea>
              </div>

              {error && <div className="text-red-600 text-sm">{error}</div>}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                  disabled={isProcessing}
                >
                  {isProcessing && (
                    <Spinner className="animate-spin h-4 w-4 mr-2" />
                  )}
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Komponen Sidebar
const Sidebar = ({ activeView, setActiveView }) => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      router.push("/sign-in");
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="bg-white shadow-md p-6 w-[25%] min-h-screen fixed top-0 left-0 z-10">
      <div className="flex items-center mb-8">
        <div className="w-full text-center">
          <h2 className="text-xl font-semibold">Admin Dashboard</h2>
        </div>
      </div>
      <div className="nav flex flex-col h-full">
        <nav className="space-y-2">
          {[
            {
              id: "statistics",
              icon: <ChartBar size={20} />,
              label: "Statistics",
            },
            {
              id: "users",
              icon: <User size={20} />,
              label: "Manage Users",
            },
            {
              id: "doctors",
              icon: <User size={20} />,
              label: "Manage Doctors",
            },
            {
              id: "appointments",
              icon: <Calendar size={20} />,
              label: "Manage Appointments",
            },
            {
              id: "payments",
              icon: <CurrencyDollar size={20} />,
              label: "Manage Payments",
            },
            {
              id: "news",
              icon: <Newspaper size={20} />,
              label: "Manage News",
            },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex items-center w-full text-left p-3 rounded-lg transition ${
                activeView === item.id
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "hover:bg-gray-100"
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-10 space-y-2">
          <Link
            href="/"
            className="w-full text-white p-3 font-medium rounded-lg bg-blue-500 hover:bg-blue-700 transition-all duration-100 flex items-center"
          >
            <House size={20} className="mr-3" />
            <h1>Home</h1>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left p-3 font-medium rounded-lg bg-red-500 hover:bg-red-700 text-white transition-all duration-100 flex items-center"
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <Spinner className="animate-spin h-5 w-5 mr-2" />
            ) : (
              <>
                <SignOut size={20} className="mr-3" />
                <span>Logout</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Komponen Utama AdminDashboard
export default function AdminDashboard() {
  const [activeView, setActiveView] = useState("statistics");
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [usersData, doctorsData, appointmentsData, paymentsData, newsData] =
        await Promise.all([
          fetchUsers(),
          fetchDoctors(),
          fetchAppointments(),
          fetchPayments(),
          fetchNews(),
        ]);

      setUsers(usersData);
      setDoctors(doctorsData);
      setAppointments(appointmentsData);
      setPayments(paymentsData);
      setNews(newsData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = async () => {
    const q = query(collection(db, "users"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  };

  const fetchDoctors = async () => {
    const q = query(collection(db, "users"), where("role", "==", "doctor"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    }));
  };

  const fetchAppointments = async () => {
    const q = query(collection(db, "appointments"));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          appointmentDate: data.appointmentDate?.toDate?.() || new Date(data.appointmentDate || Date.now()),
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
          updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt || Date.now()),
        };
      })
      .sort((a, b) => (b.appointmentDate || 0) - (a.appointmentDate || 0));
  };

  const fetchPayments = async () => {
    // Payments are stored within appointments in your data structure
    // So we'll filter appointments that have payment information
    const q = query(collection(db, "appointments"));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((doc) => {
        const data = doc.data();
        if (!data.paymentStatus) return null; // Skip appointments without payment info
        
        return {
          id: doc.id,
          ...data,
          appointmentDate: data.appointmentDate?.toDate?.() || new Date(data.appointmentDate || Date.now()),
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
        };
      })
      .filter(Boolean) // Remove null entries
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  };

  const fetchNews = async () => {
    const q = query(collection(db, "news"));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate?.() || new Date(data.date || Date.now()),
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt || Date.now()),
        };
      })
      .sort((a, b) => (b.date || 0) - (a.date || 0));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role === "admin") {
              setUser(currentUser);
              await fetchAllData();
            } else {
              router.push("/"); // Redirect non-admin users
            }
          } else {
            router.push("/");
          }
        } catch (err) {
          console.error("Error checking user role:", err);
          router.push("/");
        }
      } else {
        router.push("/sign-in");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, fetchAllData]);

  const renderActiveView = () => {
    if (loading) return <LoadingIndicator />;
    if (error) return <ErrorDisplay message={error} onRetry={fetchAllData} />;

    switch (activeView) {
      case "statistics":
        return (
          <StatisticsDashboard
            users={users}
            appointments={appointments}
            payments={payments}
            doctors={doctors}
          />
        );
      case "users":
        return <UserManagement users={users.filter(u => u.role !== "doctor")} onRefresh={fetchAllData} />;
      case "doctors":
        return <DoctorManagement doctors={doctors} onRefresh={fetchAllData} />;
      case "appointments":
        return (
          <AppointmentManagement
            appointments={appointments}
            doctors={doctors}
            onRefresh={fetchAllData}
          />
        );
      case "payments":
        return <PaymentManagement payments={payments} />;
      case "news":
        return <NewsManagement news={news} onRefresh={fetchAllData} />;
      default:
        return (
          <StatisticsDashboard
            users={users}
            appointments={appointments}
            payments={payments}
            doctors={doctors}
          />
        );
    }
  };

  if (!user && loading) {
    return <LoadingIndicator />;
  }

  if (error) {
    return <ErrorDisplay message={error} onRetry={fetchAllData} />;
  }

  return (
    <div className="w-full min-h-screen bg-blue-50 text-black">
      <div className="flex w-full relative">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        <div className="w-[25%]"></div>
        <div className="w-[75%] p-8">{renderActiveView()}</div>
      </div>
    </div>
  );
}









// "use client";

// import Link from "next/link";
// import { useState, useEffect, useCallback } from "react";
// import { auth, db } from "../../../lib/firebase";
// import { onAuthStateChanged, signOut } from "firebase/auth";
// import {
//   collection,
//   query,
//   where,
//   getDocs,
//   doc,
//   getDoc,
//   updateDoc,
//   deleteDoc,
//   addDoc,
//   serverTimestamp,
// } from "firebase/firestore";
// import { useRouter } from "next/navigation";
// import {
//   MagnifyingGlass,
//   User,
//   Calendar,
//   House,
//   CurrencyDollar,
//   Newspaper,
//   ChartBar,
//   SpinnerGap,
//   Warning,
//   SignOut,
// } from "@phosphor-icons/react";
// import { Bar } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
// } from "chart.js";

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend
// );

// // Utility Functions
// const formatRupiah = (value) =>
//   new Intl.NumberFormat("id-ID", {
//     style: "currency",
//     currency: "IDR",
//     minimumFractionDigits: 0,
//   }).format(value || 0);

// const formatDate = (dateStr) => {
//   if (!dateStr) return "-";
//   const date = dateStr?.toDate?.() || new Date(dateStr);
//   return date.toLocaleDateString("id-ID", {
//     day: "numeric",
//     month: "long",
//     year: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// };

// const formatTime = (timeStr) => {
//   if (!timeStr) return "-";
//   return timeStr;
// };

// // Komponen Loading
// const LoadingIndicator = () => (
//   <div className="flex items-center justify-center min-h-screen">
//     <div className="text-center">
//       <Spinner className="animate-spin h-12 w-12 text-blue-500 mx-auto" />
//       <p className="mt-4">Loading dashboard...</p>
//     </div>
//   </div>
// );

// // Komponen Error
// const ErrorDisplay = ({ message, onRetry }) => (
//   <div className="flex items-center justify-center min-h-screen">
//     <div className="text-center p-6 bg-red-50 rounded-lg max-w-md">
//       <Warning className="h-12 w-12 text-red-500 mx-auto" />
//       <h3 className="text-lg font-medium mt-2">Error Occurred</h3>
//       <p className="text-gray-600 mt-1">{message}</p>
//       {onRetry && (
//         <button
//           onClick={onRetry}
//           className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//         >
//           Try Again
//         </button>
//       )}
//     </div>
//   </div>
// );

// // Komponen StatisticsDashboard
// const StatisticsDashboard = ({
//   users = [],
//   appointments = [],
//   payments = [],
//   doctors = [],
// }) => {
//   const dailyVisitors = [
//     { day: "Mon", visitors: 120 },
//     { day: "Tue", visitors: 150 },
//     { day: "Wed", visitors: 200 },
//     { day: "Thu", visitors: 180 },
//     { day: "Fri", visitors: 250 },
//     { day: "Sat", visitors: 100 },
//     { day: "Sun", visitors: 80 },
//   ];

//   const chartData = {
//     labels: dailyVisitors.map((day) => day.day),
//     datasets: [
//       {
//         label: "Visitors",
//         data: dailyVisitors.map((day) => day.visitors),
//         backgroundColor: "rgba(59, 130, 246, 0.7)",
//         borderColor: "rgba(59, 130, 246, 1)",
//         borderWidth: 1,
//         borderRadius: 4,
//         hoverBackgroundColor: "rgba(59, 130, 246, 1)",
//       },
//     ],
//   };

//   const chartOptions = {
//     responsive: true,
//     plugins: {
//       legend: {
//         position: "top",
//       },
//       title: {
//         display: true,
//         text: "Weekly Visitors",
//         font: {
//           size: 16,
//         },
//       },
//       tooltip: {
//         callbacks: {
//           label: (context) => {
//             return `${context.dataset.label}: ${context.raw}`;
//           },
//         },
//       },
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         ticks: {
//           stepSize: 50,
//         },
//       },
//     },
//     maintainAspectRatio: false,
//   };

//   const totalPatients = users.filter((u) => u?.role === "user").length;
//   const totalDoctors = doctors.length;
//   const totalAdmins = users.filter((u) => u?.role === "admin").length;
//   const onlineUsers = users.filter((u) => {
//     const lastLogin = u?.lastLogin?.toDate?.() || new Date(u?.lastLogin || 0);
//     const now = new Date();
//     return now - lastLogin < 30 * 60 * 1000; // Online if last login within 30 minutes
//   }).length;

//   const totalAppointments = appointments.length;
//   const completedAppointments = appointments.filter(
//     (a) => a?.status === "completed"
//   ).length;
//   const confirmedAppointments = appointments.filter(
//     (a) => a?.status === "confirmed"
//   ).length;

//   const totalRevenue = payments.reduce(
//     (sum, payment) => sum + (payment?.price || 0),
//     0
//   );
//   const completedPayments = payments.filter(
//     (p) => p?.paymentStatus === "completed"
//   ).length;

//   return (
//     <div className="space-y-6">
//       <h1 className="text-2xl font-bold">Dashboard Statistics</h1>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//         {/* Card Statistics */}
//         {[
//           {
//             title: "Daily Visitors",
//             value: dailyVisitors.reduce((sum, day) => sum + day.visitors, 0),
//             change: "+12% from yesterday",
//             icon: <ChartBar size={24} className="text-blue-600" />,
//             bg: "bg-blue-100",
//           },
//           {
//             title: "Total Patients",
//             value: totalPatients,
//             change: "+5 new today",
//             icon: <User size={24} className="text-green-600" />,
//             bg: "bg-green-100",
//           },
//           {
//             title: "Total Doctors",
//             value: totalDoctors,
//             change: `${
//               doctors.filter((d) => d?.status === "active").length
//             } active`,
//             icon: <User size={24} className="text-purple-600" />,
//             bg: "bg-purple-100",
//           },
//           {
//             title: "Total Admins",
//             value: totalAdmins,
//             change: `${onlineUsers} online`,
//             icon: <User size={24} className="text-yellow-600" />,
//             bg: "bg-yellow-100",
//           },
//         ].map((stat, index) => (
//           <div
//             key={index}
//             className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
//           >
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-gray-500 text-sm">{stat.title}</p>
//                 <p className="text-2xl font-bold">{stat.value}</p>
//                 <p
//                   className={`text-sm mt-1 ${
//                     stat.change.includes("+")
//                       ? "text-green-600"
//                       : "text-gray-500"
//                   }`}
//                 >
//                   {stat.change}
//                 </p>
//               </div>
//               <div className={`${stat.bg} p-3 rounded-full`}>{stat.icon}</div>
//             </div>
//           </div>
//         ))}
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         {/* User Statistics */}
//         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//           <h3 className="font-semibold mb-4">User Statistics</h3>
//           <div className="space-y-3">
//             <div>
//               <div className="flex justify-between mb-1">
//                 <span className="text-sm font-medium">Online Users</span>
//                 <span className="text-sm font-medium">{onlineUsers}</span>
//               </div>
//               <div className="w-full bg-gray-200 rounded-full h-2.5">
//                 <div
//                   className="bg-green-600 h-2.5 rounded-full"
//                   style={{
//                     width: `${Math.round((onlineUsers / users.length) * 100)}%`,
//                   }}
//                 ></div>
//               </div>
//             </div>

//             <div>
//               <div className="flex justify-between mb-1">
//                 <span className="text-sm font-medium">Offline Users</span>
//                 <span className="text-sm font-medium">
//                   {users.length - onlineUsers}
//                 </span>
//               </div>
//               <div className="w-full bg-gray-200 rounded-full h-2.5">
//                 <div
//                   className="bg-gray-600 h-2.5 rounded-full"
//                   style={{
//                     width: `${Math.round(
//                       ((users.length - onlineUsers) / users.length) * 100
//                     )}%`,
//                   }}
//                 ></div>
//               </div>
//             </div>

//             <div className="pt-2">
//               <div className="flex justify-between">
//                 <span className="text-sm">Total Users</span>
//                 <span className="text-sm font-bold">{users.length}</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Appointment Statistics */}
//         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//           <h3 className="font-semibold mb-4">Appointment Statistics</h3>
//           <div className="space-y-3">
//             <div>
//               <div className="flex justify-between mb-1">
//                 <span className="text-sm font-medium">Completed</span>
//                 <span className="text-sm font-medium">
//                   {completedAppointments}
//                 </span>
//               </div>
//               <div className="w-full bg-gray-200 rounded-full h-2.5">
//                 <div
//                   className="bg-blue-600 h-2.5 rounded-full"
//                   style={{
//                     width: `${Math.round(
//                       (completedAppointments / totalAppointments) * 100
//                     )}%`,
//                   }}
//                 ></div>
//               </div>
//             </div>

//             <div>
//               <div className="flex justify-between mb-1">
//                 <span className="text-sm font-medium">Confirmed</span>
//                 <span className="text-sm font-medium">
//                   {confirmedAppointments}
//                 </span>
//               </div>
//               <div className="w-full bg-gray-200 rounded-full h-2.5">
//                 <div
//                   className="bg-yellow-400 h-2.5 rounded-full"
//                   style={{
//                     width: `${Math.round(
//                       (confirmedAppointments / totalAppointments) * 100
//                     )}%`,
//                   }}
//                 ></div>
//               </div>
//             </div>

//             <div className="pt-2">
//               <div className="flex justify-between">
//                 <span className="text-sm">Total Appointments</span>
//                 <span className="text-sm font-bold">{totalAppointments}</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Payment Statistics */}
//         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//           <h3 className="font-semibold mb-4">Payment Statistics</h3>
//           <div className="space-y-3">
//             <div>
//               <div className="flex justify-between mb-1">
//                 <span className="text-sm font-medium">Completed Payments</span>
//                 <span className="text-sm font-medium">{completedPayments}</span>
//               </div>
//               <div className="w-full bg-gray-200 rounded-full h-2.5">
//                 <div
//                   className="bg-green-600 h-2.5 rounded-full"
//                   style={{
//                     width: `${Math.round(
//                       (completedPayments / payments.length) * 100
//                     )}%`,
//                   }}
//                 ></div>
//               </div>
//             </div>

//             <div>
//               <div className="flex justify-between mb-1">
//                 <span className="text-sm font-medium">Total Revenue</span>
//                 <span className="text-sm font-medium">
//                   {formatRupiah(totalRevenue)}
//                 </span>
//               </div>
//               <div className="w-full bg-gray-200 rounded-full h-2.5">
//                 <div
//                   className="bg-purple-600 h-2.5 rounded-full"
//                   style={{ width: "100%" }}
//                 ></div>
//               </div>
//             </div>

//             <div className="pt-2">
//               <div className="flex justify-between">
//                 <span className="text-sm">Total Transactions</span>
//                 <span className="text-sm font-bold">{payments.length}</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//         <div className="h-80">
//           <Bar data={chartData} options={chartOptions} />
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         {/* Recent Appointments */}
//         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//           <h3 className="font-semibold mb-4">Recent Appointments</h3>
//           <div className="space-y-3">
//             {appointments.slice(0, 3).map((app) => (
//               <div
//                 key={app.id}
//                 className="border-b pb-2 last:border-0 last:pb-0"
//               >
//                 <p className="font-medium">{app.patientName || "Unknown"}</p>
//                 <p className="text-sm text-gray-600">
//                   with {app.doctorName || "Unknown"} ({app.doctorSpecialization}
//                   )
//                 </p>
//                 <p className="text-xs text-gray-500">
//                   {formatDate(app.appointmentDate)} at{" "}
//                   {formatTime(app.appointmentTime)}
//                 </p>
//                 <p className="text-xs mt-1">
//                   Status:{" "}
//                   <span
//                     className={`px-1 rounded ${
//                       app.status === "confirmed"
//                         ? "bg-green-100 text-green-800"
//                         : app.status === "completed"
//                         ? "bg-blue-100 text-blue-800"
//                         : "bg-gray-100 text-gray-800"
//                     }`}
//                   >
//                     {app.status}
//                   </span>
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Recent Payments */}
//         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//           <h3 className="font-semibold mb-4">Recent Payments</h3>
//           <div className="space-y-3">
//             {payments.slice(0, 3).map((payment) => (
//               <div
//                 key={payment.id}
//                 className="border-b pb-2 last:border-0 last:pb-0"
//               >
//                 <p className="font-medium">
//                   {payment.patientName || "Unknown"}
//                 </p>
//                 <p className="text-sm text-gray-600">
//                   {formatRupiah(payment.price)}
//                 </p>
//                 <p className="text-xs text-gray-500">
//                   {formatDate(payment.createdAt)}
//                 </p>
//                 <p className="text-xs mt-1">
//                   Status:{" "}
//                   <span
//                     className={`px-1 rounded ${
//                       payment.paymentStatus === "completed"
//                         ? "bg-green-100 text-green-800"
//                         : "bg-yellow-100 text-yellow-800"
//                     }`}
//                   >
//                     {payment.paymentStatus}
//                   </span>
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Recent Doctors */}
//         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//           <h3 className="font-semibold mb-4">Recent Doctors</h3>
//           <div className="space-y-3">
//             {doctors.slice(0, 3).map((doctor) => (
//               <div
//                 key={doctor.uid}
//                 className="border-b pb-2 last:border-0 last:pb-0"
//               >
//                 <p className="font-medium">{doctor.name || "Unknown"}</p>
//                 <p className="text-sm text-gray-600">
//                   {doctor.specialization || "No specialization"}
//                 </p>
//                 <p className="text-xs text-gray-500">
//                   {formatRupiah(doctor.price || 0)} per session
//                 </p>
//                 <p className="text-xs mt-1">
//                   Status:{" "}
//                   <span
//                     className={`px-1 rounded ${
//                       doctor.status === "active"
//                         ? "bg-green-100 text-green-800"
//                         : doctor.status === "pending"
//                         ? "bg-yellow-100 text-yellow-800"
//                         : "bg-gray-100 text-gray-800"
//                     }`}
//                   >
//                     {doctor.status || "unknown"}
//                   </span>
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };
// // Komponen UserManagement
// const UserManagement = ({ users = [], onRefresh }) => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [category, setCategory] = useState("all");
//   const [tempSearchTerm, setTempSearchTerm] = useState("");
//   const [tempCategory, setTempCategory] = useState("all");
//   const [isEditing, setIsEditing] = useState(false);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [editData, setEditData] = useState({});
//   const [isUpdating, setIsUpdating] = useState(false);
//   const [updateError, setUpdateError] = useState(null);

//   const handleEdit = (user) => {
//     if (!user) return;
//     setSelectedUser(user);
//     setEditData({
//       id: user.uid || user.id,
//       name: user.name || "",
//       email: user.email || "",
//       role: user.role || "user",
//       status: user.status || "offline",
//     });
//     setIsEditing(true);
//   };

//   const handleSave = async () => {
//     if (!editData.id) return;

//     setIsUpdating(true);
//     setUpdateError(null);

//     try {
//       await updateDoc(doc(db, "users", editData.id), {
//         name: editData.name,
//         email: editData.email,
//         role: editData.role,
//         updatedAt: serverTimestamp(),
//       });
//       await onRefresh();
//       setIsEditing(false);
//       setSelectedUser(null);
//     } catch (error) {
//       console.error("Error updating user:", error);
//       setUpdateError("Failed to update user. Please try again.");
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     setSearchTerm(tempSearchTerm);
//     setCategory(tempCategory);
//   };

//   const filteredUsers = users.filter((user) => {
//     if (!user) return false;

//     const name = user.name || "";
//     const email = user.email || "";
//     const role = user.role || "";

//     const matchesSearch =
//       name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       email.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesCategory = category === "all" || role === category;

//     return matchesSearch && matchesCategory;
//   });

//   return (
//     <div className="space-y-6">
//       <h1 className="text-2xl font-bold">Manage Users</h1>

//       {updateError && (
//         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
//           <p>{updateError}</p>
//         </div>
//       )}

//       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="flex gap-4">
//             <input
//               type="text"
//               placeholder="Search Account"
//               value={tempSearchTerm}
//               onChange={(e) => setTempSearchTerm(e.target.value)}
//               className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
//             />
//             <button
//               type="submit"
//               className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center"
//               disabled={isUpdating}
//             >
//               {isUpdating ? (
//                 <Spinner className="animate-spin h-5 w-5 mr-2" />
//               ) : (
//                 <MagnifyingGlass size={20} />
//               )}
//             </button>
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-2">Category</label>
//             <select
//               value={tempCategory}
//               onChange={(e) => setTempCategory(e.target.value)}
//               className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
//             >
//               <option value="all">All</option>
//               <option value="doctor">Doctor</option>
//               <option value="user">Patient</option>
//               <option value="admin">Admin</option>
//             </select>
//           </div>
//         </form>
//       </div>

//       <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Name
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Role
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Email
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Last Login
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Actions
//               </th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {filteredUsers.length === 0 ? (
//               <tr>
//                 <td colSpan="5" className="text-center py-4 text-gray-500">
//                   No users found.
//                 </td>
//               </tr>
//             ) : (
//               filteredUsers.map((user) => {
//                 const lastLogin =
//                   user?.lastLogin?.toDate?.() || new Date(user?.lastLogin || 0);
//                 const isOnline = new Date() - lastLogin < 30 * 60 * 1000;

//                 return (
//                   <tr key={user.uid || user.id} className="hover:bg-gray-50">
//                     <td className="px-6 py-4 whitespace-nowrap font-medium">
//                       {user.name || "Unknown"}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
//                         {user.role || "User"}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-gray-500">
//                       {user.email || "Unknown"}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span
//                         className={`px-2 py-1 text-xs font-semibold rounded-full ${
//                           isOnline
//                             ? "bg-green-100 text-green-800"
//                             : "bg-gray-100 text-gray-800"
//                         }`}
//                       >
//                         {isOnline ? "Online" : "Offline"} (
//                         {formatDate(user.lastLogin)})
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                       <button
//                         onClick={() => handleEdit(user)}
//                         className="text-blue-600 hover:text-blue-900 mr-3"
//                         disabled={isUpdating}
//                       >
//                         Edit
//                       </button>
//                     </td>
//                   </tr>
//                 );
//               })
//             )}
//           </tbody>
//         </table>
//       </div>

//       {isEditing && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl p-6 w-full max-w-md">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-bold">Edit User</h2>
//               <button
//                 onClick={() => setIsEditing(false)}
//                 className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
//                 disabled={isUpdating}
//               >
//                 &times;
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium mb-1">Name</label>
//                 <input
//                   type="text"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.name}
//                   onChange={(e) =>
//                     setEditData({ ...editData, name: e.target.value })
//                   }
//                   disabled={isUpdating}
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Email</label>
//                 <input
//                   type="email"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.email}
//                   onChange={(e) =>
//                     setEditData({ ...editData, email: e.target.value })
//                   }
//                   disabled={isUpdating}
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Role</label>
//                 <select
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.role}
//                   onChange={(e) =>
//                     setEditData({ ...editData, role: e.target.value })
//                   }
//                   disabled={isUpdating}
//                 >
//                   <option value="doctor">Doctor</option>
//                   <option value="user">Patient</option>
//                   <option value="admin">Admin</option>
//                 </select>
//               </div>

//               {updateError && (
//                 <div className="text-red-600 text-sm">{updateError}</div>
//               )}

//               <div className="flex justify-end space-x-3 pt-4">
//                 <button
//                   onClick={() => setIsEditing(false)}
//                   className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
//                   disabled={isUpdating}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSave}
//                   className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
//                   disabled={isUpdating}
//                 >
//                   {isUpdating && (
//                     <Spinner className="animate-spin h-4 w-4 mr-2" />
//                   )}
//                   Save
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // Komponen DoctorManagement
// const DoctorManagement = ({ doctors = [], onRefresh }) => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [tempSearchTerm, setTempSearchTerm] = useState("");
//   const [isEditing, setIsEditing] = useState(false);
//   const [selectedDoctor, setSelectedDoctor] = useState(null);
//   const [editData, setEditData] = useState({});
//   const [isUpdating, setIsUpdating] = useState(false);
//   const [updateError, setUpdateError] = useState(null);
//   const [newScheduleDate, setNewScheduleDate] = useState("");
//   const [newScheduleTime, setNewScheduleTime] = useState("");

//   const handleEdit = (doctor) => {
//     if (!doctor) return;
//     setSelectedDoctor(doctor);
//     setEditData({
//       uid: doctor.uid,
//       name: doctor.name || "",
//       email: doctor.email || "",
//       specialization: doctor.specialization || "",
//       licenseNumber: doctor.licenseNumber || "",
//       price: doctor.price || 0,
//       status: doctor.status || "pending",
//     });
//     setIsEditing(true);
//   };

//   const handleSave = async () => {
//     if (!editData.uid) return;

//     setIsUpdating(true);
//     setUpdateError(null);

//     try {
//       await updateDoc(doc(db, "users", editData.uid), {
//         name: editData.name,
//         specialization: editData.specialization,
//         licenseNumber: editData.licenseNumber,
//         price: editData.price,
//         status: editData.status,
//         updatedAt: serverTimestamp(),
//       });
//       await onRefresh();
//       setIsEditing(false);
//       setSelectedDoctor(null);
//     } catch (error) {
//       console.error("Error updating doctor:", error);
//       setUpdateError("Failed to update doctor. Please try again.");
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   const handleStatusChange = async (doctorId, newStatus) => {
//     if (!doctorId) return;

//     setIsUpdating(true);
//     setUpdateError(null);

//     try {
//       await updateDoc(doc(db, "users", doctorId), {
//         status: newStatus,
//         updatedAt: serverTimestamp(),
//       });
//       await onRefresh();
//     } catch (error) {
//       console.error("Error updating doctor status:", error);
//       setUpdateError("Failed to update doctor status.");
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   const handleAddSchedule = async () => {
//     if (!selectedDoctor || !newScheduleDate || !newScheduleTime) return;

//     setIsUpdating(true);
//     setUpdateError(null);

//     try {
//       const doctorRef = doc(db, "users", selectedDoctor.uid);
//       const doctorSnap = await getDoc(doctorRef);

//       if (doctorSnap.exists()) {
//         const currentSchedules = doctorSnap.data().dailySchedules || {};
//         const updatedSchedules = {
//           ...currentSchedules,
//           [newScheduleDate]: [
//             ...(currentSchedules[newScheduleDate] || []),
//             newScheduleTime,
//           ],
//         };

//         await updateDoc(doctorRef, {
//           dailySchedules: updatedSchedules,
//           updatedAt: serverTimestamp(),
//         });

//         await onRefresh();
//         setNewScheduleDate("");
//         setNewScheduleTime("");
//       }
//     } catch (error) {
//       console.error("Error adding schedule:", error);
//       setUpdateError("Failed to add schedule. Please try again.");
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   const handleRemoveSchedule = async (date, time) => {
//     if (!selectedDoctor || !date || !time) return;

//     setIsUpdating(true);
//     setUpdateError(null);

//     try {
//       const doctorRef = doc(db, "users", selectedDoctor.uid);
//       const doctorSnap = await getDoc(doctorRef);

//       if (doctorSnap.exists()) {
//         const currentSchedules = doctorSnap.data().dailySchedules || {};
//         const updatedTimes = (currentSchedules[date] || []).filter(
//           (t) => t !== time
//         );

//         const updatedSchedules =
//           updatedTimes.length > 0
//             ? { ...currentSchedules, [date]: updatedTimes }
//             : Object.fromEntries(
//                 Object.entries(currentSchedules).filter(([d]) => d !== date)
//               );

//         await updateDoc(doctorRef, {
//           dailySchedules: updatedSchedules,
//           updatedAt: serverTimestamp(),
//         });

//         await onRefresh();
//       }
//     } catch (error) {
//       console.error("Error removing schedule:", error);
//       setUpdateError("Failed to remove schedule. Please try again.");
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     setSearchTerm(tempSearchTerm);
//   };

//   const filteredDoctors = doctors.filter((doctor) => {
//     if (!doctor) return false;

//     const name = doctor.name || "";
//     const email = doctor.email || "";
//     const specialization = doctor.specialization || "";

//     return (
//       name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       email.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       specialization.toLowerCase().includes(searchTerm.toLowerCase())
//     );
//   });

//   return (
//     <div className="space-y-6">
//       <h1 className="text-2xl font-bold">Manage Doctors</h1>

//       {updateError && (
//         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
//           <p>{updateError}</p>
//         </div>
//       )}

//       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="flex gap-4">
//             <input
//               type="text"
//               placeholder="Search Doctors"
//               value={tempSearchTerm}
//               onChange={(e) => setTempSearchTerm(e.target.value)}
//               className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
//             />
//             <button
//               type="submit"
//               className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center"
//               disabled={isUpdating}
//             >
//               {isUpdating ? (
//                 <Spinner className="animate-spin h-5 w-5 mr-2" />
//               ) : (
//                 <MagnifyingGlass size={20} />
//               )}
//             </button>
//           </div>
//         </form>
//       </div>

//       <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Name
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Specialization
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Price
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Status
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Actions
//               </th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {filteredDoctors.length === 0 ? (
//               <tr>
//                 <td colSpan="5" className="text-center py-4 text-gray-500">
//                   No doctors found.
//                 </td>
//               </tr>
//             ) : (
//               filteredDoctors.map((doctor) => (
//                 <tr key={doctor.uid} className="hover:bg-gray-50">
//                   <td className="px-6 py-4 whitespace-nowrap font-medium">
//                     {doctor.name || "Unknown"}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     {doctor.specialization || "No specialization"}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     {formatRupiah(doctor.price || 0)}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span
//                       className={`px-2 py-1 text-xs font-semibold rounded-full ${
//                         doctor.status === "active"
//                           ? "bg-green-100 text-green-800"
//                           : doctor.status === "pending"
//                           ? "bg-yellow-100 text-yellow-800"
//                           : "bg-gray-100 text-gray-800"
//                       }`}
//                     >
//                       {doctor.status || "unknown"}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                     <button
//                       onClick={() => handleEdit(doctor)}
//                       className="text-blue-600 hover:text-blue-900 mr-3"
//                       disabled={isUpdating}
//                     >
//                       Edit
//                     </button>
//                     <button
//                       onClick={() =>
//                         handleStatusChange(
//                           doctor.uid,
//                           doctor.status === "active" ? "inactive" : "active"
//                         )
//                       }
//                       className={`${
//                         doctor.status === "active"
//                           ? "text-red-600 hover:text-red-900"
//                           : "text-green-600 hover:text-green-900"
//                       }`}
//                       disabled={isUpdating}
//                     >
//                       {doctor.status === "active" ? "Deactivate" : "Activate"}
//                     </button>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       {isEditing && selectedDoctor && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-bold">Edit Doctor</h2>
//               <button
//                 onClick={() => setIsEditing(false)}
//                 className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
//                 disabled={isUpdating}
//               >
//                 &times;
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium mb-1">Name</label>
//                 <input
//                   type="text"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.name}
//                   onChange={(e) =>
//                     setEditData({ ...editData, name: e.target.value })
//                   }
//                   disabled={isUpdating}
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Email</label>
//                 <input
//                   type="email"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.email}
//                   onChange={(e) =>
//                     setEditData({ ...editData, email: e.target.value })
//                   }
//                   disabled
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Specialization
//                 </label>
//                 <input
//                   type="text"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.specialization}
//                   onChange={(e) =>
//                     setEditData({ ...editData, specialization: e.target.value })
//                   }
//                   disabled={isUpdating}
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   License Number
//                 </label>
//                 <input
//                   type="text"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.licenseNumber}
//                   onChange={(e) =>
//                     setEditData({ ...editData, licenseNumber: e.target.value })
//                   }
//                   disabled={isUpdating}
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Price</label>
//                 <input
//                   type="number"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.price}
//                   onChange={(e) =>
//                     setEditData({ ...editData, price: Number(e.target.value) })
//                   }
//                   disabled={isUpdating}
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Status</label>
//                 <select
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.status}
//                   onChange={(e) =>
//                     setEditData({ ...editData, status: e.target.value })
//                   }
//                   disabled={isUpdating}
//                 >
//                   <option value="active">Active</option>
//                   <option value="pending">Pending</option>
//                   <option value="inactive">Inactive</option>
//                 </select>
//               </div>

//               <div className="pt-4 border-t">
//                 <h3 className="font-medium mb-3">Doctor Schedules</h3>
//                 {selectedDoctor.dailySchedules ? (
//                   <div className="space-y-3">
//                     {Object.entries(selectedDoctor.dailySchedules).map(
//                       ([date, times]) => (
//                         <div key={date} className="border rounded p-3">
//                           <h4 className="font-medium">{formatDate(date)}</h4>
//                           <div className="flex flex-wrap gap-2 mt-2">
//                             {times.map((time) => (
//                               <div
//                                 key={`${date}-${time}`}
//                                 className="flex items-center bg-gray-100 px-2 py-1 rounded"
//                               >
//                                 <span>{time}</span>
//                                 <button
//                                   onClick={() =>
//                                     handleRemoveSchedule(date, time)
//                                   }
//                                   className="ml-1 text-red-500 hover:text-red-700"
//                                   disabled={isUpdating}
//                                 >
//                                   ×
//                                 </button>
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       )
//                     )}
//                   </div>
//                 ) : (
//                   <p className="text-gray-500">No schedules available</p>
//                 )}

//                 <div className="mt-4 border-t pt-4">
//                   <h4 className="font-medium mb-2">Add New Schedule</h4>
//                   <div className="flex gap-2">
//                     <input
//                       type="date"
//                       value={newScheduleDate}
//                       onChange={(e) => setNewScheduleDate(e.target.value)}
//                       className="p-2 border border-gray-300 rounded"
//                       disabled={isUpdating}
//                     />
//                     <input
//                       type="time"
//                       value={newScheduleTime}
//                       onChange={(e) => setNewScheduleTime(e.target.value)}
//                       className="p-2 border border-gray-300 rounded"
//                       disabled={isUpdating}
//                     />
//                     <button
//                       onClick={handleAddSchedule}
//                       className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
//                       disabled={
//                         isUpdating || !newScheduleDate || !newScheduleTime
//                       }
//                     >
//                       {isUpdating ? (
//                         <Spinner className="animate-spin h-4 w-4 mr-2" />
//                       ) : (
//                         "Add"
//                       )}
//                     </button>
//                   </div>
//                 </div>
//               </div>

//               {updateError && (
//                 <div className="text-red-600 text-sm">{updateError}</div>
//               )}

//               <div className="flex justify-end space-x-3 pt-4">
//                 <button
//                   onClick={() => setIsEditing(false)}
//                   className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
//                   disabled={isUpdating}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSave}
//                   className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
//                   disabled={isUpdating}
//                 >
//                   {isUpdating && (
//                     <Spinner className="animate-spin h-4 w-4 mr-2" />
//                   )}
//                   Save
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // Komponen AppointmentManagement
// const AppointmentManagement = ({
//   appointments = [],
//   doctors = [],
//   onRefresh,
// }) => {
//   const [selectedAppointment, setSelectedAppointment] = useState(null);
//   const [isUpdating, setIsUpdating] = useState(false);
//   const [updateError, setUpdateError] = useState(null);

//   const handleStatusChange = async (appointmentId, newStatus) => {
//     if (!appointmentId) return;

//     setIsUpdating(true);
//     setUpdateError(null);

//     try {
//       await updateDoc(doc(db, "appointments", appointmentId), {
//         status: newStatus,
//         updatedAt: serverTimestamp(),
//       });

//       if (newStatus === "completed") {
//         const appointment = appointments.find((a) => a.id === appointmentId);
//         if (appointment) {
//           await updateDoc(doc(db, "appointments", appointmentId), {
//             paymentStatus: "completed",
//             updatedAt: serverTimestamp(),
//           });
//         }
//       }

//       await onRefresh();
//     } catch (error) {
//       console.error("Error updating appointment:", error);
//       setUpdateError("Failed to update appointment status.");
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   const getStatusColor = (status) => {
//     switch (status?.toLowerCase()) {
//       case "confirmed":
//         return "bg-green-100 text-green-800";
//       case "completed":
//         return "bg-blue-100 text-blue-800";
//       case "pending":
//         return "bg-yellow-100 text-yellow-800";
//       case "cancelled":
//         return "bg-red-100 text-red-800";
//       default:
//         return "bg-gray-100 text-gray-800";
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <h1 className="text-2xl font-bold">Manage Appointments</h1>

//       {updateError && (
//         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
//           <p>{updateError}</p>
//         </div>
//       )}

//       <div className="space-y-4">
//         {appointments.length === 0 ? (
//           <div className="bg-white p-6 rounded-xl shadow-sm text-center text-gray-500">
//             No appointments found.
//           </div>
//         ) : (
//           appointments.map((appointment) => {
//             const doctor = doctors.find((d) => d.uid === appointment.doctorId);

//             return (
//               <div
//                 key={appointment.id}
//                 className="bg-white p-6 rounded-xl shadow-sm"
//               >
//                 <div className="flex justify-between items-start">
//                   <div>
//                     <h3 className="font-semibold text-lg">
//                       {appointment.patientName || "Unknown"} with{" "}
//                       {appointment.doctorName || "Unknown"}
//                     </h3>
//                     <p className="text-gray-600">
//                       {formatDate(appointment.appointmentDate)} at{" "}
//                       {formatTime(appointment.appointmentTime)}
//                     </p>
//                     <p className="text-sm mt-1">
//                       Complaint: {appointment.complaint || "No complaint"}
//                     </p>
//                     {doctor && (
//                       <p className="text-sm">
//                         Specialization: {doctor.specialization || "Unknown"}
//                       </p>
//                     )}
//                   </div>
//                   <div className="flex items-center space-x-3">
//                     <span
//                       className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
//                         appointment.status
//                       )}`}
//                     >
//                       {appointment.status || "Unknown"}
//                     </span>
//                     <button
//                       onClick={() => setSelectedAppointment(appointment)}
//                       className="text-blue-600 hover:text-blue-800"
//                       aria-label="View details"
//                       disabled={isUpdating}
//                     >
//                       Details
//                     </button>
//                   </div>
//                 </div>

//                 <div className="mt-4 flex space-x-3">
//                   <button
//                     onClick={() =>
//                       handleStatusChange(appointment.id, "cancelled")
//                     }
//                     disabled={appointment.status === "cancelled" || isUpdating}
//                     className={`px-3 py-1 text-sm rounded ${
//                       appointment.status === "cancelled"
//                         ? "bg-red-600 text-white cursor-not-allowed"
//                         : "bg-red-100 text-red-800 hover:bg-red-200"
//                     }`}
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     onClick={() =>
//                       handleStatusChange(appointment.id, "completed")
//                     }
//                     disabled={
//                       appointment.status === "completed" ||
//                       appointment.status === "cancelled" ||
//                       isUpdating
//                     }
//                     className={`px-3 py-1 text-sm rounded ${
//                       appointment.status === "completed"
//                         ? "bg-blue-600 text-white cursor-not-allowed"
//                         : appointment.status === "cancelled"
//                         ? "bg-gray-300 text-gray-500 cursor-not-allowed"
//                         : "bg-blue-100 text-blue-800 hover:bg-blue-200"
//                     }`}
//                   >
//                     Complete
//                   </button>
//                 </div>
//               </div>
//             );
//           })
//         )}
//       </div>

//       {selectedAppointment && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl p-6 w-full max-w-md">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-bold">Appointment Details</h2>
//               <button
//                 onClick={() => setSelectedAppointment(null)}
//                 className="text-gray-500 hover:text-gray-700"
//                 aria-label="Close modal"
//                 disabled={isUpdating}
//               >
//                 ✕
//               </button>
//             </div>

//             <div className="space-y-3">
//               <div>
//                 <p className="text-sm text-gray-500">Patient</p>
//                 <p className="font-medium">
//                   {selectedAppointment.patientName || "Unknown"}
//                 </p>
//                 <p className="text-sm text-gray-600">
//                   {selectedAppointment.patientEmail || "No email"}
//                 </p>
//                 <p className="text-sm text-gray-600">
//                   {selectedAppointment.patientPhone || "No phone"}
//                 </p>
//               </div>

//               <div>
//                 <p className="text-sm text-gray-500">Doctor</p>
//                 <p className="font-medium">
//                   {selectedAppointment.doctorName || "Unknown"}
//                 </p>
//                 <p className="text-sm text-gray-600">
//                   {selectedAppointment.doctorSpecialization ||
//                     "No specialization"}
//                 </p>
//               </div>

//               <div>
//                 <p className="text-sm text-gray-500">Date & Time</p>
//                 <p className="font-medium">
//                   {formatDate(selectedAppointment.appointmentDate)} at{" "}
//                   {formatTime(selectedAppointment.appointmentTime)}
//                 </p>
//               </div>

//               <div>
//                 <p className="text-sm text-gray-500">Complaint</p>
//                 <p className="font-medium">
//                   {selectedAppointment.complaint || "No complaint"}
//                 </p>
//               </div>

//               <div>
//                 <p className="text-sm text-gray-500">Payment</p>
//                 <p className="font-medium">
//                   {formatRupiah(selectedAppointment.price || 0)} (
//                   {selectedAppointment.paymentMethod || "Unknown"})
//                 </p>
//                 <p className="text-sm">
//                   Status:{" "}
//                   <span
//                     className={`px-1 rounded ${
//                       selectedAppointment.paymentStatus === "completed"
//                         ? "bg-green-100 text-green-800"
//                         : "bg-yellow-100 text-yellow-800"
//                     }`}
//                   >
//                     {selectedAppointment.paymentStatus || "Unknown"}
//                   </span>
//                 </p>
//               </div>

//               <div>
//                 <p className="text-sm text-gray-500">Status</p>
//                 <p
//                   className={`font-medium px-2 py-1 inline-block rounded ${getStatusColor(
//                     selectedAppointment.status
//                   )}`}
//                 >
//                   {selectedAppointment.status || "Unknown"}
//                 </p>
//               </div>

//               {updateError && (
//                 <div className="text-red-600 text-sm">{updateError}</div>
//               )}

//               <div className="pt-4 flex space-x-3">
//                 <button
//                   onClick={() => {
//                     handleStatusChange(selectedAppointment.id, "cancelled");
//                     setSelectedAppointment(null);
//                   }}
//                   disabled={
//                     selectedAppointment.status === "cancelled" || isUpdating
//                   }
//                   className={`flex-1 py-2 rounded ${
//                     selectedAppointment.status === "cancelled"
//                       ? "bg-gray-300 text-gray-500 cursor-not-allowed"
//                       : "bg-red-600 text-white hover:bg-red-700"
//                   }`}
//                 >
//                   {isUpdating ? (
//                     <Spinner className="animate-spin h-5 w-5 mx-auto" />
//                   ) : (
//                     "Cancel Appointment"
//                   )}
//                 </button>
//                 <button
//                   onClick={() => {
//                     handleStatusChange(selectedAppointment.id, "completed");
//                     setSelectedAppointment(null);
//                   }}
//                   disabled={
//                     selectedAppointment.status === "completed" ||
//                     selectedAppointment.status === "cancelled" ||
//                     isUpdating
//                   }
//                   className={`flex-1 py-2 rounded ${
//                     selectedAppointment.status === "completed"
//                       ? "bg-gray-300 text-gray-500 cursor-not-allowed"
//                       : selectedAppointment.status === "cancelled"
//                       ? "bg-gray-300 text-gray-500 cursor-not-allowed"
//                       : "bg-blue-600 text-white hover:bg-blue-700"
//                   }`}
//                 >
//                   {isUpdating ? (
//                     <Spinner className="animate-spin h-5 w-5 mx-auto" />
//                   ) : (
//                     "Mark as Complete"
//                   )}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // Komponen PaymentManagement
// const PaymentManagement = ({ payments = [] }) => {
//   return (
//     <div className="space-y-6">
//       <h1 className="text-2xl font-bold">Manage Payments</h1>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <div className="bg-white p-6 rounded-xl shadow-sm">
//           <p className="text-gray-500">Total Revenue</p>
//           <p className="text-2xl font-bold">
//             {formatRupiah(payments.reduce((sum, p) => sum + (p.price || 0), 0))}
//           </p>
//         </div>
//         <div className="bg-white p-6 rounded-xl shadow-sm">
//           <p className="text-gray-500">Completed Payments</p>
//           <p className="text-2xl font-bold">
//             {payments.filter((p) => p?.paymentStatus === "completed").length}
//           </p>
//         </div>
//         <div className="bg-white p-6 rounded-xl shadow-sm">
//           <p className="text-gray-500">Pending Payments</p>
//           <p className="text-2xl font-bold">
//             {payments.filter((p) => p?.paymentStatus === "pending").length}
//           </p>
//         </div>
//       </div>

//       <div className="bg-white rounded-xl shadow-sm overflow-hidden">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Patient
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Doctor
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Amount
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Date
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Method
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Status
//               </th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {payments.length === 0 ? (
//               <tr>
//                 <td colSpan="6" className="text-center py-4 text-gray-500">
//                   No payments found.
//                 </td>
//               </tr>
//             ) : (
//               payments.map((payment) => (
//                 <tr key={payment.id} className="hover:bg-gray-50">
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="font-medium">
//                       {payment.patientName || "Unknown"}
//                     </div>
//                     <div className="text-sm text-gray-500">
//                       {payment.patientEmail || "No email"}
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     {payment.doctorName || "Unknown"}
//                     <div className="text-sm text-gray-500">
//                       {payment.doctorSpecialization || "No specialization"}
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     {formatRupiah(payment.price)}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     {formatDate(payment.createdAt)}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap capitalize">
//                     {payment.paymentMethod || "Unknown"}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span
//                       className={`px-2 py-1 text-xs font-semibold rounded-full ${
//                         payment.paymentStatus === "completed"
//                           ? "bg-green-100 text-green-800"
//                           : "bg-yellow-100 text-yellow-800"
//                       }`}
//                     >
//                       {payment.paymentStatus || "Unknown"}
//                     </span>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// const NewsManagement = ({ news = [], onRefresh }) => {
//   const [newArticle, setNewArticle] = useState({
//     title: "",
//     category: "",
//     content: "",
//     image: null,
//     labels: [],
//     author: "Admin",
//     date: new Date().toISOString().split("T")[0],
//   });
//   const [isCreating, setIsCreating] = useState(false);
//   const [editingArticle, setEditingArticle] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [error, setError] = useState(null);

//   const handleImageChange = (e) => {
//     if (e.target.files && e.target.files[0]) {
//       const file = e.target.files[0];
//       if (file.size > 2 * 1024 * 1024) {
//         setError("Image size too large (max 2MB)");
//         return;
//       }

//       const reader = new FileReader();
//       reader.onloadend = () => {
//         if (isEditing) {
//           setEditingArticle({ ...editingArticle, image: reader.result });
//         } else {
//           setNewArticle({ ...newArticle, image: reader.result });
//         }
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleCreate = async () => {
//     if (!newArticle.title || !newArticle.content) {
//       setError("Title and content are required");
//       return;
//     }

//     setIsProcessing(true);
//     setError(null);

//     try {
//       await addDoc(collection(db, "news"), {
//         title: newArticle.title,
//         image: newArticle.image || "/assets/default-news.jpg",
//         labels: newArticle.labels,
//         description: newArticle.content.substring(0, 100) + "...",
//         content: [newArticle.content],
//         author: newArticle.author,
//         date: serverTimestamp(),
//         createdAt: serverTimestamp(),
//       });
//       await onRefresh();
//       setIsCreating(false);
//       setNewArticle({
//         title: "",
//         category: "",
//         content: "",
//         image: null,
//         labels: [],
//         author: "Admin",
//         date: new Date().toISOString().split("T")[0],
//       });
//     } catch (err) {
//       console.error("Error creating news:", err);
//       setError("Failed to create article. Please try again.");
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const handleUpdate = async () => {
//     if (
//       !editingArticle?.id ||
//       !editingArticle.title ||
//       !editingArticle.content
//     ) {
//       setError("Title and content are required");
//       return;
//     }

//     setIsProcessing(true);
//     setError(null);

//     try {
//       await updateDoc(doc(db, "news", editingArticle.id), {
//         title: editingArticle.title,
//         image: editingArticle.image || "/assets/default-news.jpg",
//         labels: editingArticle.labels,
//         description: editingArticle.content.substring(0, 100) + "...",
//         content: [editingArticle.content],
//         updatedAt: serverTimestamp(),
//       });
//       await onRefresh();
//       setIsEditing(false);
//       setEditingArticle(null);
//     } catch (err) {
//       console.error("Error updating news:", err);
//       setError("Failed to update article. Please try again.");
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const handleDelete = async (articleId) => {
//     if (window.confirm("Are you sure you want to delete this article?")) {
//       setIsProcessing(true);
//       setError(null);

//       try {
//         await deleteDoc(doc(db, "news", articleId));
//         await onRefresh();
//       } catch (err) {
//         console.error("Error deleting news:", err);
//         setError("Failed to delete article. Please try again.");
//       } finally {
//         setIsProcessing(false);
//       }
//     }
//   };

//   const handleEdit = (article) => {
//     if (!article) return;
//     setEditingArticle({
//       ...article,
//       content: article.content?.join?.("\n\n") || "",
//       labels: article.labels || [],
//     });
//     setIsEditing(true);
//   };

//   const handleLabelChange = (e) => {
//     const value = e.target.value.trim();
//     if (!value) return;

//     if (isEditing) {
//       if (!editingArticle.labels.includes(value)) {
//         setEditingArticle({
//           ...editingArticle,
//           labels: [...editingArticle.labels, value],
//         });
//       }
//     } else {
//       if (!newArticle.labels.includes(value)) {
//         setNewArticle({
//           ...newArticle,
//           labels: [...newArticle.labels, value],
//         });
//       }
//     }
//     e.target.value = "";
//   };

//   const removeLabel = (labelToRemove) => {
//     if (isEditing) {
//       setEditingArticle({
//         ...editingArticle,
//         labels: editingArticle.labels.filter(
//           (label) => label !== labelToRemove
//         ),
//       });
//     } else {
//       setNewArticle({
//         ...newArticle,
//         labels: newArticle.labels.filter((label) => label !== labelToRemove),
//       });
//     }
//   };

//   const categories = [
//     "Medication",
//     "Nursing",
//     "Emergency",
//     "Training",
//     "Education",
//     "Patient Care",
//     "Hygiene",
//     "Technology",
//     "Innovation",
//     "Mental Health",
//     "Support",
//     "Rural",
//     "Access",
//     "Diversity",
//     "Ethics",
//     "Chronic Illness",
//     "Long-term Care",
//     "Telehealth",
//     "Future",
//     "Nutrition",
//     "Decision Making",
//   ];

//   return (
//     <div className="space-y-6">
//       <h1 className="text-2xl font-bold">Manage News</h1>

//       {error && (
//         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
//           <p>{error}</p>
//         </div>
//       )}

//       <div className="flex justify-end">
//         <button
//           onClick={() => setIsCreating(true)}
//           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
//           disabled={isProcessing}
//         >
//           {isProcessing ? (
//             <Spinner className="animate-spin h-5 w-5 mr-2" />
//           ) : null}
//           Create New Article
//         </button>
//       </div>

//       <div className="space-y-4">
//         {news.length === 0 ? (
//           <div className="bg-white p-6 rounded-xl shadow-sm text-center text-gray-500">
//             No articles found.
//           </div>
//         ) : (
//           news.map((article) => (
//             <div key={article.id} className="bg-white p-6 rounded-xl shadow-sm">
//               <div className="flex items-start gap-4">
//                 <div className="flex-shrink-0">
//                   <img
//                     src={article.image || "/assets/default-news.jpg"}
//                     alt={article.title}
//                     className="w-32 h-32 object-cover rounded-lg"
//                   />
//                 </div>
//                 <div className="flex-1">
//                   <h3 className="font-semibold text-lg">
//                     {article.title || "Untitled"}
//                   </h3>
//                   <p className="text-gray-600">
//                     {formatDate(article.date)} •{" "}
//                     {article.labels?.join(", ") || "Uncategorized"}
//                   </p>
//                   <p className="mt-2 text-gray-700">
//                     {article.description || "No description"}
//                   </p>
//                 </div>
//               </div>
//               <div className="mt-4 flex space-x-2">
//                 <button
//                   onClick={() => handleEdit(article)}
//                   className="px-2 py-1 text-sm rounded bg-blue-100 text-blue-800 hover:bg-blue-200"
//                   disabled={isProcessing}
//                 >
//                   Edit
//                 </button>
//                 <button
//                   onClick={() => handleDelete(article.id)}
//                   className="px-2 py-1 text-sm rounded bg-red-100 text-red-800 hover:bg-red-200"
//                   disabled={isProcessing}
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           ))
//         )}
//       </div>

//       {isCreating && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-bold">Create New Article</h2>
//               <button
//                 onClick={() => setIsCreating(false)}
//                 className="text-gray-500 hover:text-gray-700"
//                 disabled={isProcessing}
//               >
//                 ✕
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium mb-1">Title</label>
//                 <input
//                   type="text"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={newArticle.title}
//                   onChange={(e) =>
//                     setNewArticle({ ...newArticle, title: e.target.value })
//                   }
//                   disabled={isProcessing}
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Image</label>
//                 <input
//                   type="file"
//                   accept="image/*"
//                   onChange={handleImageChange}
//                   className="w-full p-2 border border-gray-300 rounded"
//                   disabled={isProcessing}
//                 />
//                 {newArticle.image && (
//                   <div className="mt-2">
//                     <img
//                       src={newArticle.image}
//                       alt="Preview"
//                       className="w-32 h-32 object-cover rounded-lg"
//                     />
//                   </div>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Category
//                 </label>
//                 <div className="flex gap-2">
//                   <select
//                     className="flex-1 p-2 border border-gray-300 rounded"
//                     onChange={handleLabelChange}
//                     defaultValue=""
//                     disabled={isProcessing}
//                   >
//                     <option value="" disabled>
//                       Select category
//                     </option>
//                     {categories.map((cat) => (
//                       <option key={cat} value={cat}>
//                         {cat}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//                 <div className="flex flex-wrap gap-2 mt-2">
//                   {newArticle.labels.map((label) => (
//                     <span
//                       key={label}
//                       className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center"
//                     >
//                       {label}
//                       <button
//                         type="button"
//                         onClick={() => removeLabel(label)}
//                         className="ml-1 text-blue-600 hover:text-blue-900"
//                         disabled={isProcessing}
//                       >
//                         ×
//                       </button>
//                     </span>
//                   ))}
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Content
//                 </label>
//                 <textarea
//                   rows={6}
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={newArticle.content}
//                   onChange={(e) =>
//                     setNewArticle({ ...newArticle, content: e.target.value })
//                   }
//                   disabled={isProcessing}
//                 ></textarea>
//               </div>

//               {error && <div className="text-red-600 text-sm">{error}</div>}

//               <div className="flex justify-end space-x-3 pt-4">
//                 <button
//                   onClick={() => setIsCreating(false)}
//                   className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
//                   disabled={isProcessing}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleCreate}
//                   className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
//                   disabled={isProcessing}
//                 >
//                   {isProcessing && (
//                     <Spinner className="animate-spin h-4 w-4 mr-2" />
//                   )}
//                   Create
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {isEditing && editingArticle && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-bold">Edit Article</h2>
//               <button
//                 onClick={() => setIsEditing(false)}
//                 className="text-gray-500 hover:text-gray-700"
//                 disabled={isProcessing}
//               >
//                 ✕
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium mb-1">Title</label>
//                 <input
//                   type="text"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editingArticle.title}
//                   onChange={(e) =>
//                     setEditingArticle({
//                       ...editingArticle,
//                       title: e.target.value,
//                     })
//                   }
//                   disabled={isProcessing}
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Image</label>
//                 <input
//                   type="file"
//                   accept="image/*"
//                   onChange={handleImageChange}
//                   className="w-full p-2 border border-gray-300 rounded"
//                   disabled={isProcessing}
//                 />
//                 {editingArticle.image && (
//                   <div className="mt-2">
//                     <img
//                       src={editingArticle.image}
//                       alt="Preview"
//                       className="w-32 h-32 object-cover rounded-lg"
//                     />
//                   </div>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Category
//                 </label>
//                 <div className="flex gap-2">
//                   <select
//                     className="flex-1 p-2 border border-gray-300 rounded"
//                     onChange={handleLabelChange}
//                     defaultValue=""
//                     disabled={isProcessing}
//                   >
//                     <option value="" disabled>
//                       Select category
//                     </option>
//                     {categories.map((cat) => (
//                       <option key={cat} value={cat}>
//                         {cat}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//                 <div className="flex flex-wrap gap-2 mt-2">
//                   {editingArticle.labels.map((label) => (
//                     <span
//                       key={label}
//                       className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center"
//                     >
//                       {label}
//                       <button
//                         type="button"
//                         onClick={() => removeLabel(label)}
//                         className="ml-1 text-blue-600 hover:text-blue-900"
//                         disabled={isProcessing}
//                       >
//                         ×
//                       </button>
//                     </span>
//                   ))}
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Content
//                 </label>
//                 <textarea
//                   rows={6}
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editingArticle.content}
//                   onChange={(e) =>
//                     setEditingArticle({
//                       ...editingArticle,
//                       content: e.target.value,
//                     })
//                   }
//                   disabled={isProcessing}
//                 ></textarea>
//               </div>

//               {error && <div className="text-red-600 text-sm">{error}</div>}

//               <div className="flex justify-end space-x-3 pt-4">
//                 <button
//                   onClick={() => setIsEditing(false)}
//                   className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
//                   disabled={isProcessing}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleUpdate}
//                   className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
//                   disabled={isProcessing}
//                 >
//                   {isProcessing && (
//                     <Spinner className="animate-spin h-4 w-4 mr-2" />
//                   )}
//                   Update
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };















// // "use client";
// // import Link from "next/link";
// // import { useState, useEffect, useCallback } from "react";
// // import { auth, db } from "../../../lib/firebase";
// // import { onAuthStateChanged, signOut } from "firebase/auth";
// // import {
// //   collection,
// //   query,
// //   where,
// //   getDocs,
// //   doc,
// //   getDoc,
// //   updateDoc,
// //   deleteDoc,
// //   addDoc,
// //   serverTimestamp,
// // } from "firebase/firestore";
// // import { useRouter } from "next/navigation";
// // import {
// //   MagnifyingGlass,
// //   User,
// //   Calendar,
// //   House,
// //   CurrencyDollar,
// //   Newspaper,
// //   ChartBar,
// //   Spinner,
// //   Warning,
// //   SignOut,
// //   UserCircle,
// //   CheckCircle,
// //   XCircle
// // } from "@phosphor-icons/react/dist/ssr";
// // import { Bar } from "react-chartjs-2";
// // import {
// //   Chart as ChartJS,
// //   CategoryScale,
// //   LinearScale,
// //   BarElement,
// //   Title,
// //   Tooltip,
// //   Legend,
// // } from "chart.js";

// // ChartJS.register(
// //   CategoryScale,
// //   LinearScale,
// //   BarElement,
// //   Title,
// //   Tooltip,
// //   Legend
// // );

// // // Utility Functions
// // const formatRupiah = (value) =>
// //   new Intl.NumberFormat("id-ID", {
// //     style: "currency",
// //     currency: "IDR",
// //     minimumFractionDigits: 0,
// //   }).format(value || 0);

// // const formatDate = (dateStr) => {
// //   if (!dateStr) return "-";
// //   const date = dateStr?.toDate?.() || new Date(dateStr);
// //   return date.toLocaleDateString("id-ID", {
// //     day: "numeric",
// //     month: "long",
// //     year: "numeric",
// //     hour: "2-digit",
// //     minute: "2-digit",
// //   });
// // };

// // const formatTime = (timeStr) => {
// //   if (!timeStr) return "-";
// //   return timeStr;
// // };

// // // Komponen Loading
// // const LoadingIndicator = () => (
// //   <div className="flex items-center justify-center min-h-screen">
// //     <div className="text-center">
// //       <Spinner className="animate-spin h-12 w-12 text-blue-500 mx-auto" />
// //       <p className="mt-4">Loading dashboard...</p>
// //     </div>
// //   </div>
// // );

// // // Komponen Error
// // const ErrorDisplay = ({ message, onRetry }) => (
// //   <div className="flex items-center justify-center min-h-screen">
// //     <div className="text-center p-6 bg-red-50 rounded-lg max-w-md">
// //       <Warning className="h-12 w-12 text-red-500 mx-auto" />
// //       <h3 className="text-lg font-medium mt-2">Error Occurred</h3>
// //       <p className="text-gray-600 mt-1">{message}</p>
// //       {onRetry && (
// //         <button
// //           onClick={onRetry}
// //           className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
// //         >
// //           Try Again
// //         </button>
// //       )}
// //     </div>
// //   </div>
// // );

// // // Komponen StatisticsDashboard
// // const StatisticsDashboard = ({
// //   users = [],
// //   appointments = [],
// //   payments = [],
// //   doctors = [],
// // }) => {
// //   const dailyVisitors = [
// //     { day: "Mon", visitors: 120 },
// //     { day: "Tue", visitors: 150 },
// //     { day: "Wed", visitors: 200 },
// //     { day: "Thu", visitors: 180 },
// //     { day: "Fri", visitors: 250 },
// //     { day: "Sat", visitors: 100 },
// //     { day: "Sun", visitors: 80 },
// //   ];

// //   const chartData = {
// //     labels: dailyVisitors.map((day) => day.day),
// //     datasets: [
// //       {
// //         label: "Visitors",
// //         data: dailyVisitors.map((day) => day.visitors),
// //         backgroundColor: "rgba(59, 130, 246, 0.7)",
// //         borderColor: "rgba(59, 130, 246, 1)",
// //         borderWidth: 1,
// //         borderRadius: 4,
// //         hoverBackgroundColor: "rgba(59, 130, 246, 1)",
// //       },
// //     ],
// //   };

// //   const chartOptions = {
// //     responsive: true,
// //     plugins: {
// //       legend: {
// //         position: "top",
// //       },
// //       title: {
// //         display: true,
// //         text: "Weekly Visitors",
// //         font: {
// //           size: 16,
// //         },
// //       },
// //       tooltip: {
// //         callbacks: {
// //           label: (context) => {
// //             return `${context.dataset.label}: ${context.raw}`;
// //           },
// //         },
// //       },
// //     },
// //     scales: {
// //       y: {
// //         beginAtZero: true,
// //         ticks: {
// //           stepSize: 50,
// //         },
// //       },
// //     },
// //     maintainAspectRatio: false,
// //   };

// //   const totalPatients = users.filter((u) => u?.role === "user").length;
// //   const totalDoctors = doctors.length;
// //   const totalAdmins = users.filter((u) => u?.role === "admin").length;
// //   const onlineUsers = users.filter((u) => {
// //     const lastLogin = u?.lastLogin?.toDate?.() || new Date(u?.lastLogin || 0);
// //     const now = new Date();
// //     return now - lastLogin < 30 * 60 * 1000; // Online if last login within 30 minutes
// //   }).length;

// //   const totalAppointments = appointments.length;
// //   const completedAppointments = appointments.filter(
// //     (a) => a?.status === "completed"
// //   ).length;
// //   const confirmedAppointments = appointments.filter(
// //     (a) => a?.status === "confirmed"
// //   ).length;

// //   const totalRevenue = payments.reduce(
// //     (sum, payment) => sum + (payment?.price || 0),
// //     0
// //   );
// //   const completedPayments = payments.filter(
// //     (p) => p?.paymentStatus === "completed"
// //   ).length;

// //   return (
// //     <div className="space-y-6 bg-blue-50 text-black">
// //       <h1 className="text-2xl font-bold">Dashboard Statistics</h1>

// //       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
// //         {/* Card Statistics */}
// //         {[
// //           {
// //             title: "Daily Visitors",
// //             value: dailyVisitors.reduce((sum, day) => sum + day.visitors, 0),
// //             change: "+12% from yesterday",
// //             icon: <ChartBar size={24} className="text-blue-600" />,
// //             bg: "bg-blue-100",
// //           },
// //           {
// //             title: "Total Patients",
// //             value: totalPatients,
// //             change: "+5 new today",
// //             icon: <User size={24} className="text-green-600" />,
// //             bg: "bg-green-100",
// //           },
// //           {
// //             title: "Total Doctors",
// //             value: totalDoctors,
// //             change: `${
// //               doctors.filter((d) => d?.status === "active").length
// //             } active`,
// //             icon: <User size={24} className="text-purple-600" />,
// //             bg: "bg-purple-100",
// //           },
// //           {
// //             title: "Total Admins",
// //             value: totalAdmins,
// //             change: `${onlineUsers} online`,
// //             icon: <User size={24} className="text-yellow-600" />,
// //             bg: "bg-yellow-100",
// //           },
// //         ].map((stat, index) => (
// //           <div
// //             key={index}
// //             className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
// //           >
// //             <div className="flex items-center justify-between">
// //               <div>
// //                 <p className="text-gray-500 text-sm">{stat.title}</p>
// //                 <p className="text-2xl font-bold">{stat.value}</p>
// //                 <p
// //                   className={`text-sm mt-1 ${
// //                     stat.change.includes("+")
// //                       ? "text-green-600"
// //                       : "text-gray-500"
// //                   }`}
// //                 >
// //                   {stat.change}
// //                 </p>
// //               </div>
// //               <div className={`${stat.bg} p-3 rounded-full`}>{stat.icon}</div>
// //             </div>
// //           </div>
// //         ))}
// //       </div>

// //       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
// //         {/* User Statistics */}
// //         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
// //           <h3 className="font-semibold mb-4">User Statistics</h3>
// //           <div className="space-y-3">
// //             <div>
// //               <div className="flex justify-between mb-1">
// //                 <span className="text-sm font-medium">Online Users</span>
// //                 <span className="text-sm font-medium">{onlineUsers}</span>
// //               </div>
// //               <div className="w-full bg-gray-200 rounded-full h-2.5">
// //                 <div
// //                   className="bg-green-600 h-2.5 rounded-full"
// //                   style={{
// //                     width: `${Math.round((onlineUsers / users.length) * 100)}%`,
// //                   }}
// //                 ></div>
// //               </div>
// //             </div>

// //             <div>
// //               <div className="flex justify-between mb-1">
// //                 <span className="text-sm font-medium">Offline Users</span>
// //                 <span className="text-sm font-medium">
// //                   {users.length - onlineUsers}
// //                 </span>
// //               </div>
// //               <div className="w-full bg-gray-200 rounded-full h-2.5">
// //                 <div
// //                   className="bg-gray-600 h-2.5 rounded-full"
// //                   style={{
// //                     width: `${Math.round(
// //                       ((users.length - onlineUsers) / users.length) * 100
// //                     )}%`,
// //                   }}
// //                 ></div>
// //               </div>
// //             </div>

// //             <div className="pt-2">
// //               <div className="flex justify-between">
// //                 <span className="text-sm">Total Users</span>
// //                 <span className="text-sm font-bold">{users.length}</span>
// //               </div>
// //             </div>
// //           </div>
// //         </div>

// //         {/* Appointment Statistics */}
// //         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
// //           <h3 className="font-semibold mb-4">Appointment Statistics</h3>
// //           <div className="space-y-3">
// //             <div>
// //               <div className="flex justify-between mb-1">
// //                 <span className="text-sm font-medium">Completed</span>
// //                 <span className="text-sm font-medium">
// //                   {completedAppointments}
// //                 </span>
// //               </div>
// //               <div className="w-full bg-gray-200 rounded-full h-2.5">
// //                 <div
// //                   className="bg-blue-600 h-2.5 rounded-full"
// //                   style={{
// //                     width: `${Math.round(
// //                       (completedAppointments / totalAppointments) * 100
// //                     )}%`,
// //                   }}
// //                 ></div>
// //               </div>
// //             </div>

// //             <div>
// //               <div className="flex justify-between mb-1">
// //                 <span className="text-sm font-medium">Confirmed</span>
// //                 <span className="text-sm font-medium">
// //                   {confirmedAppointments}
// //                 </span>
// //               </div>
// //               <div className="w-full bg-gray-200 rounded-full h-2.5">
// //                 <div
// //                   className="bg-yellow-400 h-2.5 rounded-full"
// //                   style={{
// //                     width: `${Math.round(
// //                       (confirmedAppointments / totalAppointments) * 100
// //                     )}%`,
// //                   }}
// //                 ></div>
// //               </div>
// //             </div>

// //             <div className="pt-2">
// //               <div className="flex justify-between">
// //                 <span className="text-sm">Total Appointments</span>
// //                 <span className="text-sm font-bold">{totalAppointments}</span>
// //               </div>
// //             </div>
// //           </div>
// //         </div>

// //         {/* Payment Statistics */}
// //         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
// //           <h3 className="font-semibold mb-4">Payment Statistics</h3>
// //           <div className="space-y-3">
// //             <div>
// //               <div className="flex justify-between mb-1">
// //                 <span className="text-sm font-medium">Completed Payments</span>
// //                 <span className="text-sm font-medium">{completedPayments}</span>
// //               </div>
// //               <div className="w-full bg-gray-200 rounded-full h-2.5">
// //                 <div
// //                   className="bg-green-600 h-2.5 rounded-full"
// //                   style={{
// //                     width: `${Math.round(
// //                       (completedPayments / payments.length) * 100
// //                     )}%`,
// //                   }}
// //                 ></div>
// //               </div>
// //             </div>

// //             <div>
// //               <div className="flex justify-between mb-1">
// //                 <span className="text-sm font-medium">Total Revenue</span>
// //                 <span className="text-sm font-medium">
// //                   {formatRupiah(totalRevenue)}
// //                 </span>
// //               </div>
// //               <div className="w-full bg-gray-200 rounded-full h-2.5">
// //                 <div
// //                   className="bg-purple-600 h-2.5 rounded-full"
// //                   style={{ width: "100%" }}
// //                 ></div>
// //               </div>
// //             </div>

// //             <div className="pt-2">
// //               <div className="flex justify-between">
// //                 <span className="text-sm">Total Transactions</span>
// //                 <span className="text-sm font-bold">{payments.length}</span>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
// //         <div className="h-80">
// //           <Bar data={chartData} options={chartOptions} />
// //         </div>
// //       </div>

// //       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
// //         {/* Recent Appointments */}
// //         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
// //           <h3 className="font-semibold mb-4">Recent Appointments</h3>
// //           <div className="space-y-3">
// //             {appointments.slice(0, 3).map((app) => (
// //               <div
// //                 key={app.id}
// //                 className="border-b pb-2 last:border-0 last:pb-0"
// //               >
// //                 <p className="font-medium">{app.patientName || "Unknown"}</p>
// //                 <p className="text-sm text-gray-600">
// //                   with {app.doctorName || "Unknown"} ({app.specialization}
// //                   )
// //                 </p>
// //                 <p className="text-xs text-gray-500">
// //                   {formatDate(app.appointmentDate)} at{" "}
// //                   {formatTime(app.appointmentTime)}
// //                 </p>
// //                 <p className="text-xs mt-1">
// //                   Status:{" "}
// //                   <span
// //                     className={`px-1 rounded ${
// //                       app.status === "confirmed"
// //                         ? "bg-green-100 text-green-800"
// //                         : app.status === "completed"
// //                         ? "bg-blue-100 text-blue-800"
// //                         : "bg-gray-100 text-gray-800"
// //                     }`}
// //                   >
// //                     {app.status}
// //                   </span>
// //                 </p>
// //               </div>
// //             ))}
// //           </div>
// //         </div>

// //         {/* Recent Payments */}
// //         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
// //           <h3 className="font-semibold mb-4">Recent Payments</h3>
// //           <div className="space-y-3">
// //             {payments.slice(0, 3).map((payment) => (
// //               <div
// //                 key={payment.id}
// //                 className="border-b pb-2 last:border-0 last:pb-0"
// //               >
// //                 <p className="font-medium">
// //                   {payment.patientName || "Unknown"}
// //                 </p>
// //                 <p className="text-sm text-gray-600">
// //                   {formatRupiah(payment.price)}
// //                 </p>
// //                 <p className="text-xs text-gray-500">
// //                   {formatDate(payment.createdAt)}
// //                 </p>
// //                 <p className="text-xs mt-1">
// //                   Status:{" "}
// //                   <span
// //                     className={`px-1 rounded ${
// //                       payment.paymentStatus === "completed"
// //                         ? "bg-green-100 text-green-800"
// //                         : "bg-yellow-100 text-yellow-800"
// //                     }`}
// //                   >
// //                     {payment.paymentStatus}
// //                   </span>
// //                 </p>
// //               </div>
// //             ))}
// //           </div>
// //         </div>

// //         {/* Recent Doctors */}
// //         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
// //           <h3 className="font-semibold mb-4">Recent Doctors</h3>
// //           <div className="space-y-3">
// //             {doctors.slice(0, 3).map((doctor) => (
// //               <div
// //                 key={doctor.uid}
// //                 className="border-b pb-2 last:border-0 last:pb-0"
// //               >
// //                 <p className="font-medium">{doctor.name || "Unknown"}</p>
// //                 <p className="text-sm text-gray-600">
// //                   {doctor.specialization || "No specialization"}
// //                 </p>
// //                 <p className="text-xs text-gray-500">
// //                   {formatRupiah(doctor.price || 0)} per session
// //                 </p>
// //                 <p className="text-xs mt-1">
// //                   Status:{" "}
// //                   <span
// //                     className={`px-1 rounded ${
// //                       doctor.status === "active"
// //                         ? "bg-green-100 text-green-800"
// //                         : doctor.status === "pending"
// //                         ? "bg-yellow-100 text-yellow-800"
// //                         : "bg-gray-100 text-gray-800"
// //                     }`}
// //                   >
// //                     {doctor.status || "unknown"}
// //                   </span>
// //                 </p>
// //               </div>
// //             ))}
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // // Komponen UserManagement
// // const UserManagement = ({ users = [], onRefresh }) => {
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [category, setCategory] = useState("all");
// //   const [tempSearchTerm, setTempSearchTerm] = useState("");
// //   const [tempCategory, setTempCategory] = useState("all");
// //   const [isEditing, setIsEditing] = useState(false);
// //   const [selectedUser, setSelectedUser] = useState(null);
// //   const [editData, setEditData] = useState({});
// //   const [isUpdating, setIsUpdating] = useState(false);
// //   const [updateError, setUpdateError] = useState(null);

// //   const handleEdit = (user) => {
// //     if (!user) return;
// //     setSelectedUser(user);
// //     setEditData({
// //       id: user.uid || user.id,
// //       name: user.name || "",
// //       email: user.email || "",
// //       role: user.role || "user",
// //       status: user.status || "offline",
// //     });
// //     setIsEditing(true);
// //   };

// //   const handleSave = async () => {
// //     if (!editData.id) return;

// //     setIsUpdating(true);
// //     setUpdateError(null);

// //     try {
// //       await updateDoc(doc(db, "users", editData.id), {
// //         name: editData.name,
// //         email: editData.email,
// //         role: editData.role,
// //         updatedAt: serverTimestamp(),
// //       });
// //       await onRefresh();
// //       setIsEditing(false);
// //       setSelectedUser(null);
// //     } catch (error) {
// //       console.error("Error updating user:", error);
// //       setUpdateError("Failed to update user. Please try again.");
// //     } finally {
// //       setIsUpdating(false);
// //     }
// //   };

// //   const handleSubmit = (e) => {
// //     e.preventDefault();
// //     setSearchTerm(tempSearchTerm);
// //     setCategory(tempCategory);
// //   };

// //   const filteredUsers = users.filter((user) => {
// //     if (!user) return false;

// //     const name = user.name || "";
// //     const email = user.email || "";
// //     const role = user.role || "";

// //     const matchesSearch =
// //       name.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //       email.toLowerCase().includes(searchTerm.toLowerCase());
// //     const matchesCategory = category === "all" || role === category;

// //     return matchesSearch && matchesCategory;
// //   });

// //   return (
// //     <div className="space-y-6 text-black">
// //       <h1 className="text-2xl font-bold">Manage Users</h1>

// //       {updateError && (
// //         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
// //           <p>{updateError}</p>
// //         </div>
// //       )}

// //       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
// //         <form onSubmit={handleSubmit} className="space-y-4">
// //           <div className="flex gap-4">
// //             <input
// //               type="text"
// //               placeholder="Search Account"
// //               value={tempSearchTerm}
// //               onChange={(e) => setTempSearchTerm(e.target.value)}
// //               className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
// //             />
// //             <button
// //               type="submit"
// //               className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center"
// //               disabled={isUpdating}
// //             >
// //               {isUpdating ? (
// //                 <Spinner className="animate-spin h-5 w-5 mr-2" />
// //               ) : (
// //                 <MagnifyingGlass size={20} />
// //               )}
// //             </button>
// //           </div>

// //           <div>
// //             <label className="block text-sm font-medium mb-2">Category</label>
// //             <select
// //               value={tempCategory}
// //               onChange={(e) => setTempCategory(e.target.value)}
// //               className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
// //             >
// //               <option value="all">All</option>
// //               <option value="doctor">Doctor</option>
// //               <option value="user">Patient</option>
// //               <option value="admin">Admin</option>
// //             </select>
// //           </div>
// //         </form>
// //       </div>

// //       <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
// //         <table className="min-w-full divide-y divide-gray-200">
// //           <thead className="bg-gray-50">
// //             <tr>
// //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                 Name
// //               </th>
// //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                 Role
// //               </th>
// //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                 Email
// //               </th>
// //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                 Last Login
// //               </th>
// //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                 Actions
// //               </th>
// //             </tr>
// //           </thead>
// //           <tbody className="bg-white divide-y divide-gray-200">
// //             {filteredUsers.length === 0 ? (
// //               <tr>
// //                 <td colSpan="5" className="text-center py-4 text-gray-500">
// //                   No users found.
// //                 </td>
// //               </tr>
// //             ) : (
// //               filteredUsers.map((user) => {
// //                 const lastLogin =
// //                   user?.lastLogin?.toDate?.() || new Date(user?.lastLogin || 0);
// //                 const isOnline = new Date() - lastLogin < 30 * 60 * 1000;

// //                 return (
// //                   <tr key={user.uid || user.id} className="hover:bg-gray-50 text-black">
// //                     <td className="px-6 py-4 whitespace-nowrap font-medium">
// //                       {user.name || "Unknown"}
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap">
// //                       <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
// //                         {user.role || "User"}
// //                       </span>
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap text-gray-500">
// //                       {user.email || "Unknown"}
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap">
// //                       <span
// //                         className={`px-2 py-1 text-xs font-semibold rounded-full ${
// //                           isOnline
// //                             ? "bg-green-100 text-green-800"
// //                             : "bg-gray-100 text-gray-800"
// //                         }`}
// //                       >
// //                         {isOnline ? "Online" : "Offline"} (
// //                         {formatDate(user.lastLogin)})
// //                       </span>
// //                     </td>
// //                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
// //                       <button
// //                         onClick={() => handleEdit(user)}
// //                         className="text-blue-600 hover:text-blue-900 mr-3"
// //                         disabled={isUpdating}
// //                       >
// //                         Edit
// //                       </button>
// //                     </td>
// //                   </tr>
// //                 );
// //               })
// //             )}
// //           </tbody>
// //         </table>
// //       </div>

// //       {isEditing && (
// //         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
// //           <div className="bg-white rounded-xl p-6 w-full max-w-md">
// //             <div className="flex justify-between items-center mb-4">
// //               <h2 className="text-xl font-bold">Edit User</h2>
// //               <button
// //                 onClick={() => setIsEditing(false)}
// //                 className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
// //                 disabled={isUpdating}
// //               >
// //                 &times;
// //               </button>
// //             </div>

// //             <div className="space-y-4">
// //               <div>
// //                 <label className="block text-sm font-medium mb-1">Name</label>
// //                 <input
// //                   type="text"
// //                   className="w-full p-2 border border-gray-300 rounded"
// //                   value={editData.name}
// //                   onChange={(e) =>
// //                     setEditData({ ...editData, name: e.target.value })
// //                   }
// //                   disabled={isUpdating}
// //                 />
// //               </div>

// //               <div>
// //                 <label className="block text-sm font-medium mb-1">Email</label>
// //                 <input
// //                   type="email"
// //                   className="w-full p-2 border border-gray-300 rounded"
// //                   value={editData.email}
// //                   onChange={(e) =>
// //                     setEditData({ ...editData, email: e.target.value })
// //                   }
// //                   disabled={isUpdating}
// //                 />
// //               </div>

// //               <div>
// //                 <label className="block text-sm font-medium mb-1">Role</label>
// //                 <select
// //                   className="w-full p-2 border border-gray-300 rounded"
// //                   value={editData.role}
// //                   onChange={(e) =>
// //                     setEditData({ ...editData, role: e.target.value })
// //                   }
// //                   disabled={isUpdating}
// //                 >
// //                   <option value="doctor">Doctor</option>
// //                   <option value="user">Patient</option>
// //                   <option value="admin">Admin</option>
// //                 </select>
// //               </div>

// //               {updateError && (
// //                 <div className="text-red-600 text-sm">{updateError}</div>
// //               )}

// //               <div className="flex justify-end space-x-3 pt-4">
// //                 <button
// //                   onClick={() => setIsEditing(false)}
// //                   className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
// //                   disabled={isUpdating}
// //                 >
// //                   Cancel
// //                 </button>
// //                 <button
// //                   onClick={handleSave}
// //                   className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
// //                   disabled={isUpdating}
// //                 >
// //                   {isUpdating && (
// //                     <Spinner className="animate-spin h-4 w-4 mr-2" />
// //                   )}
// //                   Save
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // // Komponen DoctorManagement
// // const DoctorManagement = ({ doctors = [], onRefresh }) => {
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [tempSearchTerm, setTempSearchTerm] = useState("");
// //   const [isEditing, setIsEditing] = useState(false);
// //   const [selectedDoctor, setSelectedDoctor] = useState(null);
// //   const [editData, setEditData] = useState({});
// //   const [isUpdating, setIsUpdating] = useState(false);
// //   const [updateError, setUpdateError] = useState(null);
// //   const [newScheduleDate, setNewScheduleDate] = useState("");
// //   const [newScheduleTime, setNewScheduleTime] = useState("");

// //   const handleEdit = (doctor) => {
// //     if (!doctor) return;
// //     setSelectedDoctor(doctor);
// //     setEditData({
// //       uid: doctor.uid,
// //       name: doctor.name || "",
// //       email: doctor.email || "",
// //       specialization: doctor.specialization || "",
// //       licenseNumber: doctor.licenseNumber || "",
// //       price: doctor.price || 0,
// //       status: doctor.status || "pending",
// //     });
// //     setIsEditing(true);
// //   };

// //   const handleSave = async () => {
// //     if (!editData.uid) return;

// //     setIsUpdating(true);
// //     setUpdateError(null);

// //     try {
// //       await updateDoc(doc(db, "users", editData.uid), {
// //         name: editData.name,
// //         specialization: editData.specialization,
// //         licenseNumber: editData.licenseNumber,
// //         price: editData.price,
// //         status: editData.status,
// //         updatedAt: serverTimestamp(),
// //       });
// //       await onRefresh();
// //       setIsEditing(false);
// //       setSelectedDoctor(null);
// //     } catch (error) {
// //       console.error("Error updating doctor:", error);
// //       setUpdateError("Failed to update doctor. Please try again.");
// //     } finally {
// //       setIsUpdating(false);
// //     }
// //   };

// //   const handleStatusChange = async (doctorId, newStatus) => {
// //     if (!doctorId) return;

// //     setIsUpdating(true);
// //     setUpdateError(null);

// //     try {
// //       await updateDoc(doc(db, "users", doctorId), {
// //         status: newStatus,
// //         updatedAt: serverTimestamp(),
// //       });
// //       await onRefresh();
// //     } catch (error) {
// //       console.error("Error updating doctor status:", error);
// //       setUpdateError("Failed to update doctor status.");
// //     } finally {
// //       setIsUpdating(false);
// //     }
// //   };

// //   const handleAddSchedule = async () => {
// //     if (!selectedDoctor || !newScheduleDate || !newScheduleTime) return;

// //     setIsUpdating(true);
// //     setUpdateError(null);

// //     try {
// //       const doctorRef = doc(db, "users", selectedDoctor.uid);
// //       const doctorSnap = await getDoc(doctorRef);

// //       if (doctorSnap.exists()) {
// //         const currentSchedules = doctorSnap.data().dailySchedules || {};
// //         const updatedSchedules = {
// //           ...currentSchedules,
// //           [newScheduleDate]: [
// //             ...(currentSchedules[newScheduleDate] || []),
// //             newScheduleTime,
// //           ],
// //         };

// //         await updateDoc(doctorRef, {
// //           dailySchedules: updatedSchedules,
// //           updatedAt: serverTimestamp(),
// //         });

// //         await onRefresh();
// //         setNewScheduleDate("");
// //         setNewScheduleTime("");
// //       }
// //     } catch (error) {
// //       console.error("Error adding schedule:", error);
// //       setUpdateError("Failed to add schedule. Please try again.");
// //     } finally {
// //       setIsUpdating(false);
// //     }
// //   };

// //   const handleRemoveSchedule = async (date, time) => {
// //     if (!selectedDoctor || !date || !time) return;

// //     setIsUpdating(true);
// //     setUpdateError(null);

// //     try {
// //       const doctorRef = doc(db, "users", selectedDoctor.uid);
// //       const doctorSnap = await getDoc(doctorRef);

// //       if (doctorSnap.exists()) {
// //         const currentSchedules = doctorSnap.data().dailySchedules || {};
// //         const updatedTimes = (currentSchedules[date] || []).filter(
// //           (t) => t !== time
// //         );

// //         const updatedSchedules =
// //           updatedTimes.length > 0
// //             ? { ...currentSchedules, [date]: updatedTimes }
// //             : Object.fromEntries(
// //                 Object.entries(currentSchedules).filter(([d]) => d !== date)
// //               );

// //         await updateDoc(doctorRef, {
// //           dailySchedules: updatedSchedules,
// //           updatedAt: serverTimestamp(),
// //         });

// //         await onRefresh();
// //       }
// //     } catch (error) {
// //       console.error("Error removing schedule:", error);
// //       setUpdateError("Failed to remove schedule. Please try again.");
// //     } finally {
// //       setIsUpdating(false);
// //     }
// //   };

// //   const handleSubmit = (e) => {
// //     e.preventDefault();
// //     setSearchTerm(tempSearchTerm);
// //   };

// //   const filteredDoctors = doctors.filter((doctor) => {
// //     if (!doctor) return false;

// //     const name = doctor.name || "";
// //     const email = doctor.email || "";
// //     const specialization = doctor.specialization || "";

// //     return (
// //       name.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //       email.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //       specialization.toLowerCase().includes(searchTerm.toLowerCase())
// //     );
// //   });

// //   return (
// //     <div className="space-y-6  text-black">
// //       <h1 className="text-2xl font-bold">Manage Doctors</h1>

// //       {updateError && (
// //         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
// //           <p>{updateError}</p>
// //         </div>
// //       )}

// //       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
// //         <form onSubmit={handleSubmit} className="space-y-4">
// //           <div className="flex gap-4">
// //             <input
// //               type="text"
// //               placeholder="Search Doctors"
// //               value={tempSearchTerm}
// //               onChange={(e) => setTempSearchTerm(e.target.value)}
// //               className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
// //             />
// //             <button
// //               type="submit"
// //               className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center"
// //               disabled={isUpdating}
// //             >
// //               {isUpdating ? (
// //                 <Spinner className="animate-spin h-5 w-5 mr-2" />
// //               ) : (
// //                 <MagnifyingGlass size={20} />
// //               )}
// //             </button>
// //           </div>
// //         </form>
// //       </div>

// //       <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
// //         <table className="min-w-full divide-y divide-gray-200">
// //           <thead className="bg-gray-50">
// //             <tr>
// //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                 Name
// //               </th>
// //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                 Specialization
// //               </th>
// //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                 Price
// //               </th>
// //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                 Status
// //               </th>
// //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                 Actions
// //               </th>
// //             </tr>
// //           </thead>
// //           <tbody className="bg-white divide-y divide-gray-200">
// //             {filteredDoctors.length === 0 ? (
// //               <tr>
// //                 <td colSpan="5" className="text-center py-4 text-gray-500">
// //                   No doctors found.
// //                 </td>
// //               </tr>
// //             ) : (
// //               filteredDoctors.map((doctor) => (
// //                 <tr key={doctor.uid} className="hover:bg-gray-50">
// //                   <td className="px-6 py-4 whitespace-nowrap font-medium">
// //                     {doctor.name || "Unknown"}
// //                   </td>
// //                   <td className="px-6 py-4 whitespace-nowrap">
// //                     {doctor.specialization || "No specialization"}
// //                   </td>
// //                   <td className="px-6 py-4 whitespace-nowrap">
// //                     {formatRupiah(doctor.price || 0)}
// //                   </td>
// //                   <td className="px-6 py-4 whitespace-nowrap">
// //                     <span
// //                       className={`px-2 py-1 text-xs font-semibold rounded-full ${
// //                         doctor.status === "active"
// //                           ? "bg-green-100 text-green-800"
// //                           : doctor.status === "pending"
// //                           ? "bg-yellow-100 text-yellow-800"
// //                           : "bg-gray-100 text-gray-800"
// //                       }`}
// //                     >
// //                       {doctor.status || "unknown"}
// //                     </span>
// //                   </td>
// //                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
// //                     <button
// //                       onClick={() => handleEdit(doctor)}
// //                       className="text-blue-600 hover:text-blue-900 mr-3"
// //                       disabled={isUpdating}
// //                     >
// //                       Edit
// //                     </button>
// //                     <button
// //                       onClick={() =>
// //                         handleStatusChange(
// //                           doctor.uid,
// //                           doctor.status === "active" ? "inactive" : "active"
// //                         )
// //                       }
// //                       className={`${
// //                         doctor.status === "active"
// //                           ? "text-red-600 hover:text-red-900"
// //                           : "text-green-600 hover:text-green-900"
// //                       }`}
// //                       disabled={isUpdating}
// //                     >
// //                       {doctor.status === "active" ? "Deactivate" : "Activate"}
// //                     </button>
// //                   </td>
// //                 </tr>
// //               ))
// //             )}
// //           </tbody>
// //         </table>
// //       </div>

// //       {isEditing && selectedDoctor && (
// //         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
// //           <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
// //             <div className="flex justify-between items-center mb-4">
// //               <h2 className="text-xl font-bold">Edit Doctor</h2>
// //               <button
// //                 onClick={() => setIsEditing(false)}
// //                 className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
// //                 disabled={isUpdating}
// //               >
// //                 &times;
// //               </button>
// //             </div>

// //             <div className="space-y-4">
// //               <div>
// //                 <label className="block text-sm font-medium mb-1">Name</label>
// //                 <input
// //                   type="text"
// //                   className="w-full p-2 border border-gray-300 rounded"
// //                   value={editData.name}
// //                   onChange={(e) =>
// //                     setEditData({ ...editData, name: e.target.value })
// //                   }
// //                   disabled={isUpdating}
// //                 />
// //               </div>

// //               <div>
// //                 <label className="block text-sm font-medium mb-1">Email</label>
// //                 <input
// //                   type="email"
// //                   className="w-full p-2 border border-gray-300 rounded"
// //                   value={editData.email}
// //                   disabled
// //                 />
// //               </div>

// //               <div>
// //                 <label className="block text-sm font-medium mb-1">
// //                   Specialization
// //                 </label>
// //                 <input
// //                   type="text"
// //                   className="w-full p-2 border border-gray-300 rounded"
// //                   value={editData.specialization}
// //                   onChange={(e) =>
// //                     setEditData({ ...editData, specialization: e.target.value })
// //                   }
// //                   disabled={isUpdating}
// //                 />
// //               </div>

// //               <div>
// //                 <label className="block text-sm font-medium mb-1">
// //                   License Number
// //                 </label>
// //                 <input
// //                   type="text"
// //                   className="w-full p-2 border border-gray-300 rounded"
// //                   value={editData.licenseNumber}
// //                   onChange={(e) =>
// //                     setEditData({ ...editData, licenseNumber: e.target.value })
// //                   }
// //                   disabled={isUpdating}
// //                 />
// //               </div>

// //               <div>
// //                 <label className="block text-sm font-medium mb-1">
// //                   Consultation Price
// //                 </label>
// //                 <input
// //                   type="number"
// //                   className="w-full p-2 border border-gray-300 rounded"
// //                   value={editData.price}
// //                   onChange={(e) =>
// //                     setEditData({ ...editData, price: Number(e.target.value) })
// //                   }
// //                   disabled={isUpdating}
// //                 />
// //               </div>

// //               <div>
// //                 <label className="block text-sm font-medium mb-1">Status</label>
// //                 <select
// //                   className="w-full p-2 border border-gray-300 rounded"
// //                   value={editData.status}
// //                   onChange={(e) =>
// //                     setEditData({ ...editData, status: e.target.value })
// //                   }
// //                   disabled={isUpdating}
// //                 >
// //                   <option value="active">Active</option>
// //                   <option value="pending">Pending</option>
// //                   <option value="inactive">Inactive</option>
// //                 </select>
// //               </div>

// //               <div className="pt-4 border-t">
// //                 <h3 className="font-semibold mb-2">Doctor Schedules</h3>
// //                 {selectedDoctor.dailySchedules ? (
// //                   <div className="space-y-2">
// //                     {Object.entries(selectedDoctor.dailySchedules).map(
// //                       ([date, times]) => (
// //                         <div key={date} className="border rounded p-2">
// //                           <p className="font-medium">{date}</p>
// //                           <div className="flex flex-wrap gap-2 mt-1">
// //                             {times.map((time) => (
// //                               <span
// //                                 key={`${date}-${time}`}
// //                                 className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center"
// //                               >
// //                                 {time}
// //                                 <button
// //                                   type="button"
// //                                   onClick={() =>
// //                                     handleRemoveSchedule(date, time)
// //                                   }
// //                                   className="ml-1 text-blue-600 hover:text-blue-900"
// //                                   disabled={isUpdating}
// //                                 >
// //                                   ×
// //                                 </button>
// //                               </span>
// //                             ))}
// //                           </div>
// //                         </div>
// //                       )
// //                     )}
// //                   </div>
// //                 ) : (
// //                   <p className="text-gray-500">No schedules available</p>
// //                 )}

// //                 <div className="mt-4 grid grid-cols-2 gap-4">
// //                   <div>
// //                     <label className="block text-sm font-medium mb-1">
// //                       Add Date
// //                     </label>
// //                     <input
// //                       type="date"
// //                       className="w-full p-2 border border-gray-300 rounded"
// //                       value={newScheduleDate}
// //                       onChange={(e) => setNewScheduleDate(e.target.value)}
// //                       disabled={isUpdating}
// //                     />
// //                   </div>
// //                   <div>
// //                     <label className="block text-sm font-medium mb-1">
// //                       Add Time
// //                     </label>
// //                     <input
// //                       type="time"
// //                       className="w-full p-2 border border-gray-300 rounded"
// //                       value={newScheduleTime}
// //                       onChange={(e) => setNewScheduleTime(e.target.value)}
// //                       disabled={isUpdating}
// //                     />
// //                   </div>
// //                 </div>
// //                 <button
// //                   onClick={handleAddSchedule}
// //                   className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center"
// //                   disabled={!newScheduleDate || !newScheduleTime || isUpdating}
// //                 >
// //                   {isUpdating ? (
// //                     <Spinner className="animate-spin h-4 w-4 mr-2" />
// //                   ) : (
// //                     "Add Schedule"
// //                   )}
// //                 </button>
// //               </div>

// //               {updateError && (
// //                 <div className="text-red-600 text-sm">{updateError}</div>
// //               )}

// //               <div className="flex justify-end space-x-3 pt-4">
// //                 <button
// //                   onClick={() => setIsEditing(false)}
// //                   className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
// //                   disabled={isUpdating}
// //                 >
// //                   Cancel
// //                 </button>
// //                 <button
// //                   onClick={handleSave}
// //                   className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
// //                   disabled={isUpdating}
// //                 >
// //                   {isUpdating && (
// //                     <Spinner className="animate-spin h-4 w-4 mr-2" />
// //                   )}
// //                   Save Changes
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // // Komponen AppointmentManagement
// // const AppointmentManagement = ({
// //   appointments = [],
// //   users = [],
// //   doctors = [],
// //   onRefresh,
// // }) => {
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [statusFilter, setStatusFilter] = useState("all");
// //   const [tempSearchTerm, setTempSearchTerm] = useState("");
// //   const [tempStatusFilter, setTempStatusFilter] = useState("all");
// //   const [selectedAppointment, setSelectedAppointment] = useState(null);
// //   const [isUpdating, setIsUpdating] = useState(false);
// //   const [updateError, setUpdateError] = useState(null);

// //   const handleStatusChange = async (appointmentId, newStatus) => {
// //     if (!appointmentId) return;

// //     setIsUpdating(true);
// //     setUpdateError(null);

// //     try {
// //       await updateDoc(doc(db, "appointments", appointmentId), {
// //         status: newStatus,
// //         updatedAt: serverTimestamp(),
// //       });

// //       if (newStatus === "completed") {
// //         const appointment = appointments.find((a) => a.id === appointmentId);
// //         if (appointment) {
// //           await updateDoc(doc(db, "payments", appointment.id), {
// //             paymentStatus: "completed",
// //             updatedAt: serverTimestamp(),
// //           });
// //         }
// //       }

// //       await onRefresh();
// //     } catch (error) {
// //       console.error("Error updating appointment:", error);
// //       setUpdateError("Failed to update appointment status.");
// //     } finally {
// //       setIsUpdating(false);
// //     }
// //   };

// //   const handleSubmit = (e) => {
// //     e.preventDefault();
// //     setSearchTerm(tempSearchTerm);
// //     setStatusFilter(tempStatusFilter);
// //   };

// //   const filteredAppointments = appointments.filter((appointment) => {
// //     if (!appointment) return false;

// //     const patientName = appointment.patientName || "";
// //     const doctorName = appointment.doctorName || "";
// //     const complaint = appointment.complaint || "";

// //     const matchesSearch =
// //       patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //       doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //       complaint.toLowerCase().includes(searchTerm.toLowerCase());

// //     const matchesStatus =
// //       statusFilter === "all" || appointment.status === statusFilter;

// //     return matchesSearch && matchesStatus;
// //   });

// //   const getStatusColor = (status) => {
// //     switch (status?.toLowerCase()) {
// //       case "confirmed":
// //         return "bg-green-100 text-green-800";
// //       case "completed":
// //         return "bg-blue-100 text-blue-800";
// //       case "pending":
// //         return "bg-yellow-100 text-yellow-800";
// //       case "cancelled":
// //         return "bg-red-100 text-red-800";
// //       default:
// //         return "bg-gray-100 text-gray-800";
// //     }
// //   };

// //   return (
// //     <div className="space-y-6 text-black">
// //       <h1 className="text-2xl font-bold">Manage Appointments</h1>

// //       {updateError && (
// //         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
// //           <p>{updateError}</p>
// //         </div>
// //       )}

// //       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
// //         <form onSubmit={handleSubmit} className="space-y-4">
// //           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
// //             <div className="md:col-span-2">
// //               <input
// //                 type="text"
// //                 placeholder="Search appointments..."
// //                 value={tempSearchTerm}
// //                 onChange={(e) => setTempSearchTerm(e.target.value)}
// //                 className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
// //               />
// //             </div>
// //             <div>
// //               <select
// //                 value={tempStatusFilter}
// //                 onChange={(e) => setTempStatusFilter(e.target.value)}
// //                 className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
// //               >
// //                 <option value="all">All Statuses</option>
// //                 <option value="pending">Pending</option>
// //                 <option value="confirmed">Confirmed</option>
// //                 <option value="completed">Completed</option>
// //                 <option value="cancelled">Cancelled</option>
// //               </select>
// //             </div>
// //             <div className="md:col-span-3 flex justify-end">
// //               <button
// //                 type="submit"
// //                 className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center"
// //                 disabled={isUpdating}
// //               >
// //                 {isUpdating ? (
// //                   <Spinner className="animate-spin h-5 w-5 mr-2" />
// //                 ) : (
// //                   <MagnifyingGlass size={20} />
// //                 )}
// //                 Search
// //               </button>
// //             </div>
// //           </div>
// //         </form>
// //       </div>

// //       <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
// //         <table className="min-w-full divide-y divide-gray-200">
// //           <thead className="bg-gray-50">
// //             <tr>
// //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                 Patient
// //               </th>
// //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                 Doctor
// //               </th>
// //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                 Date & Time
// //               </th>
// //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                 Status
// //               </th>
// //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                 Actions
// //               </th>
// //             </tr>
// //           </thead>
// //           <tbody className="bg-white divide-y divide-gray-200">
// //             {filteredAppointments.length === 0 ? (
// //               <tr>
// //                 <td colSpan="5" className="text-center py-4 text-gray-500">
// //                   No appointments found.
// //                 </td>
// //               </tr>
// //             ) : (
// //               filteredAppointments.map((appointment) => (
// //                 <tr key={appointment.id} className="hover:bg-gray-50">
// //                   <td className="px-6 py-4 whitespace-nowrap">
// //                     <div className="font-medium">{appointment.patientName}</div>
// //                     <div className="text-sm text-gray-500">
// //                       {appointment.patientPhone}
// //                     </div>
// //                   </td>
// //                   <td className="px-6 py-4 whitespace-nowrap">
// //                     <div className="font-medium">{appointment.doctorName}</div>
// //                     <div className="text-sm text-gray-500">
// //                       {appointment.specialization}
// //                     </div>
// //                   </td>
// //                   <td className="px-6 py-4 whitespace-nowrap">
// //                     <div>{formatDate(appointment.appointmentDate)}</div>
// //                     <div className="text-sm text-gray-500">
// //                       {formatTime(appointment.appointmentTime)}
// //                     </div>
// //                   </td>
// //                   <td className="px-6 py-4 whitespace-nowrap">
// //                     <span
// //                       className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
// //                         appointment.status
// //                       )}`}
// //                     >
// //                       {appointment.status}
// //                     </span>
// //                   </td>
// //                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
// //                     <div className="flex flex-col space-y-2">
// //                       {appointment.status !== "completed" &&
// //                         appointment.status !== "cancelled" && (
// //                           <button
// //                             onClick={() =>
// //                               handleStatusChange(appointment.id, "completed")
// //                             }
// //                             className="text-green-600 hover:text-green-900 flex items-center"
// //                             disabled={isUpdating}
// //                           >
// //                             <CheckCircle size={16} className="mr-1" />
// //                             Complete
// //                           </button>
// //                         )}
// //                       {appointment.status !== "cancelled" && (
// //                         <button
// //                           onClick={() =>
// //                             handleStatusChange(appointment.id, "cancelled")
// //                           }
// //                           className="text-red-600 hover:text-red-900 flex items-center"
// //                           disabled={isUpdating}
// //                         >
// //                           <XCircle size={16} className="mr-1" />
// //                           Cancel
// //                         </button>
// //                       )}
// //                       <button
// //                         onClick={() => setSelectedAppointment(appointment)}
// //                         className="text-blue-600 hover:text-blue-900 flex items-center"
// //                         disabled={isUpdating}
// //                       >
// //                         <MagnifyingGlass size={16} className="mr-1" />
// //                         Details
// //                       </button>
// //                     </div>
// //                   </td>
// //                 </tr>
// //               ))
// //             )}
// //           </tbody>
// //         </table>
// //       </div>

// //       {selectedAppointment && (
// //         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
// //           <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
// //             <div className="flex justify-between items-center mb-4">
// //               <h2 className="text-xl font-bold">Appointment Details</h2>
// //               <button
// //                 onClick={() => setSelectedAppointment(null)}
// //                 className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
// //                 disabled={isUpdating}
// //               >
// //                 &times;
// //               </button>
// //             </div>

// //             <div className="space-y-4">
// //               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //                 <div>
// //                   <h3 className="font-semibold mb-2">Patient Information</h3>
// //                   <div className="bg-gray-50 p-4 rounded-lg">
// //                     <p className="font-medium">
// //                       {selectedAppointment.patientName}
// //                     </p>
// //                     <p className="text-sm text-gray-600">
// //                       {selectedAppointment.patientEmail}
// //                     </p>
// //                     <p className="text-sm text-gray-600">
// //                       {selectedAppointment.patientPhone}
// //                     </p>
// //                   </div>
// //                 </div>
// //                 <div>
// //                   <h3 className="font-semibold mb-2">Doctor Information</h3>
// //                   <div className="bg-gray-50 p-4 rounded-lg">
// //                     <p className="font-medium">
// //                       {selectedAppointment.doctorName}
// //                     </p>
// //                     <p className="text-sm text-gray-600">
// //                       {selectedAppointment.specialization}
// //                     </p>
// //                     <p className="text-sm text-gray-600">
// //                       {formatRupiah(selectedAppointment.price)}
// //                     </p>
// //                   </div>
// //                 </div>
// //               </div>

// //               <div>
// //                 <h3 className="font-semibold mb-2">Appointment Details</h3>
// //                 <div className="bg-gray-50 p-4 rounded-lg">
// //                   <p>
// //                     <span className="font-medium">Date:</span>{" "}
// //                     {formatDate(selectedAppointment.appointmentDate)}
// //                   </p>
// //                   <p>
// //                     <span className="font-medium">Time:</span>{" "}
// //                     {formatTime(selectedAppointment.appointmentTime)}
// //                   </p>
// //                   <p>
// //                     <span className="font-medium">Status:</span>{" "}
// //                     <span
// //                       className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
// //                         selectedAppointment.status
// //                       )}`}
// //                     >
// //                       {selectedAppointment.status}
// //                     </span>
// //                   </p>
// //                   <p>
// //                     <span className="font-medium">Payment:</span>{" "}
// //                     <span
// //                       className={`px-2 py-1 rounded-full text-xs ${
// //                         selectedAppointment.paymentStatus === "completed"
// //                           ? "bg-green-100 text-green-800"
// //                           : "bg-yellow-100 text-yellow-800"
// //                       }`}
// //                     >
// //                       {selectedAppointment.paymentStatus}
// //                     </span>
// //                   </p>
// //                 </div>
// //               </div>

// //               <div>
// //                 <h3 className="font-semibold mb-2">Complaint</h3>
// //                 <div className="bg-gray-50 p-4 rounded-lg">
// //                   <p>
// //                     {selectedAppointment.complaint || "No complaint provided"}
// //                   </p>
// //                 </div>
// //               </div>

// //               {updateError && (
// //                 <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
// //                   <p>{updateError}</p>
// //                 </div>
// //               )}

// //               <div className="flex justify-end space-x-3 pt-4">
// //                 <button
// //                   onClick={() => setSelectedAppointment(null)}
// //                   className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
// //                   disabled={isUpdating}
// //                 >
// //                   Close
// //                 </button>
// //                 {selectedAppointment.status !== "completed" &&
// //                   selectedAppointment.status !== "cancelled" && (
// //                     <button
// //                       onClick={() => {
// //                         handleStatusChange(selectedAppointment.id, "completed");
// //                         setSelectedAppointment(null);
// //                       }}
// //                       className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
// //                       disabled={isUpdating}
// //                     >
// //                       {isUpdating ? (
// //                         <Spinner className="animate-spin h-4 w-4 mr-2" />
// //                       ) : (
// //                         <>
// //                           <CheckCircle size={16} className="mr-1" />
// //                           Mark as Completed
// //                         </>
// //                       )}
// //                     </button>
// //                   )}
// //                 {selectedAppointment.status !== "cancelled" && (
// //                   <button
// //                     onClick={() => {
// //                       handleStatusChange(selectedAppointment.id, "cancelled");
// //                       setSelectedAppointment(null);
// //                     }}
// //                     className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
// //                     disabled={isUpdating}
// //                   >
// //                     {isUpdating ? (
// //                       <Spinner className="animate-spin h-4 w-4 mr-2" />
// //                     ) : (
// //                       <>
// //                         <XCircle size={16} className="mr-1" />
// //                         Cancel Appointment
// //                       </>
// //                     )}
// //                   </button>
// //                 )}
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // // Komponen PaymentManagement
// // const PaymentManagement = ({ payments = [], onRefresh }) => {
// //   const [searchTerm, setSearchTerm] = useState("");
// //   const [statusFilter, setStatusFilter] = useState("all");
// //   const [tempSearchTerm, setTempSearchTerm] = useState("");
// //   const [tempStatusFilter, setTempStatusFilter] = useState("all");
// //   const [selectedPayment, setSelectedPayment] = useState(null);
// //   const [isUpdating, setIsUpdating] = useState(false);
// //   const [updateError, setUpdateError] = useState(null);

// //   const handleStatusChange = async (paymentId, newStatus) => {
// //     if (!paymentId) return;

// //     setIsUpdating(true);
// //     setUpdateError(null);

// //     try {
// //       await updateDoc(doc(db, "payments", paymentId), {
// //         paymentStatus: newStatus,
// //         updatedAt: serverTimestamp(),
// //       });

// //       if (newStatus === "completed") {
// //         const payment = payments.find((p) => p.id === paymentId);
// //         if (payment) {
// //           await updateDoc(doc(db, "appointments", payment.appointmentId), {
// //             status: "completed",
// //             updatedAt: serverTimestamp(),
// //           });
// //         }
// //       }

// //       await onRefresh();
// //     } catch (error) {
// //       console.error("Error updating payment:", error);
// //       setUpdateError("Failed to update payment status.");
// //     } finally {
// //       setIsUpdating(false);
// //     }
// //   };

// //   const handleSubmit = (e) => {
// //     e.preventDefault();
// //     setSearchTerm(tempSearchTerm);
// //     setStatusFilter(tempStatusFilter);
// //   };

// //   const filteredPayments = payments.filter((payment) => {
// //     if (!payment) return false;

// //     const patientName = payment.patientName || "";
// //     const doctorName = payment.doctorName || "";
// //     const paymentMethod = payment.paymentMethod || "";

// //     const matchesSearch =
// //       patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //       doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //       paymentMethod.toLowerCase().includes(searchTerm.toLowerCase());

// //     const matchesStatus =
// //       statusFilter === "all" || payment.paymentStatus === statusFilter;

// //     return matchesSearch && matchesStatus;
// //   });

// //   return (
// //     <div className="space-y-6 text-black">
// //       <h1 className="text-2xl font-bold">Manage Payments</h1>

// //       {updateError && (
// //         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
// //           <p>{updateError}</p>
// //         </div>
// //       )}

// //       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
// //         <form onSubmit={handleSubmit} className="space-y-4">
// //           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
// //             <div className="md:col-span-2">
// //               <input
// //                 type="text"
// //                 placeholder="Search payments..."
// //                 value={tempSearchTerm}
// //                 onChange={(e) => setTempSearchTerm(e.target.value)}
// //                 className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
// //               />
// //             </div>
// //             <div>
// //               <select
// //                 value={tempStatusFilter}
// //                 onChange={(e) => setTempStatusFilter(e.target.value)}
// //                 className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
// //               >
// //                 <option value="all">All Statuses</option>
// //                 <option value="pending">Pending</option>
// //                 <option value="completed">Completed</option>
// //                 <option value="failed">Failed</option>
// //               </select>
// //             </div>
// //             <div className="md:col-span-3 flex justify-end">
// //               <button
// //                 type="submit"
// //                 className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center"
// //                 disabled={isUpdating}
// //               >
// //                 {isUpdating ? (
// //                   <Spinner className="animate-spin h-5 w-5 mr-2" />
// //                 ) : (
// //                   <MagnifyingGlass size={20} />
// //                 )}
// //                 Search
// //               </button>
// //             </div>
// //           </div>
// //         </form>
// //       </div>

// //       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
// //         <div className="bg-white p-6 rounded-xl shadow-sm">
// //           <p className="text-gray-500">Total Revenue</p>
// //           <p className="text-2xl font-bold">
// //             {formatRupiah(
// //               payments.reduce((sum, payment) => sum + (payment?.price || 0), 0)
// //             )}
// //           </p>
// //         </div>
// //         <div className="bg-white p-6 rounded-xl shadow-sm">
// //           <p className="text-gray-500">Completed Payments</p>
// //           <p className="text-2xl font-bold">
// //             {payments.filter((p) => p?.paymentStatus === "completed").length}
// //           </p>
// //         </div>
// //         <div className="bg-white p-6 rounded-xl shadow-sm">
// //           <p className="text-gray-500">Pending Payments</p>
// //           <p className="text-2xl font-bold">
// //             {payments.filter((p) => p?.paymentStatus === "pending").length}
// //           </p>
// //         </div>
// //       </div>

// //       <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
// //         <table className="min-w-full divide-y divide-gray-200">
// //           <thead className="bg-gray-50">
// //             <tr>
// //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                 Patient
// //               </th>
// //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                 Doctor
// //               </th>
// //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                 Amount
// //               </th>
// //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                 Method
// //               </th>
// //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                 Status
// //               </th>
// //               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
// //                 Actions
// //               </th>
// //             </tr>
// //           </thead>
// //           <tbody className="bg-white divide-y divide-gray-200">
// //             {filteredPayments.length === 0 ? (
// //               <tr>
// //                 <td colSpan="6" className="text-center py-4 text-gray-500">
// //                   No payments found.
// //                 </td>
// //               </tr>
// //             ) : (
// //               filteredPayments.map((payment) => (
// //                 <tr key={payment.id} className="hover:bg-gray-50">
// //                   <td className="px-6 py-4 whitespace-nowrap">
// //                     <div className="font-medium">{payment.patientName}</div>
// //                     <div className="text-sm text-gray-500">
// //                       {payment.patientEmail}
// //                     </div>
// //                   </td>
// //                   <td className="px-6 py-4 whitespace-nowrap">
// //                     <div className="font-medium">{payment.doctorName}</div>
// //                     <div className="text-sm text-gray-500">
// //                       {payment.specialization}
// //                     </div>
// //                   </td>
// //                   <td className="px-6 py-4 whitespace-nowrap">
// //                     {formatRupiah(payment.price)}
// //                   </td>
// //                   <td className="px-6 py-4 whitespace-nowrap">
// //                     <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
// //                       {payment.paymentMethod}
// //                     </span>
// //                   </td>
// //                   <td className="px-6 py-4 whitespace-nowrap">
// //                     <span
// //                       className={`px-2 py-1 text-xs font-semibold rounded-full ${
// //                         payment.paymentStatus === "completed"
// //                           ? "bg-green-100 text-green-800"
// //                           : payment.paymentStatus === "pending"
// //                           ? "bg-yellow-100 text-yellow-800"
// //                           : "bg-red-100 text-red-800"
// //                       }`}
// //                     >
// //                       {payment.paymentStatus}
// //                     </span>
// //                   </td>
// //                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
// //                     <div className="flex flex-col space-y-2">
// //                       {payment.paymentStatus !== "completed" && (
// //                         <button
// //                           onClick={() =>
// //                             handleStatusChange(payment.id, "completed")
// //                           }
// //                           className="text-green-600 hover:text-green-900 flex items-center"
// //                           disabled={isUpdating}
// //                         >
// //                           <CheckCircle size={16} className="mr-1" />
// //                           Complete
// //                         </button>
// //                       )}
// //                       {payment.paymentStatus !== "failed" && (
// //                         <button
// //                           onClick={() =>
// //                             handleStatusChange(payment.id, "failed")
// //                           }
// //                           className="text-red-600 hover:text-red-900 flex items-center"
// //                           disabled={isUpdating}
// //                         >
// //                           <XCircle size={16} className="mr-1" />
// //                           Mark as Failed
// //                         </button>
// //                       )}
// //                       <button
// //                         onClick={() => setSelectedPayment(payment)}
// //                         className="text-blue-600 hover:text-blue-900 flex items-center"
// //                         disabled={isUpdating}
// //                       >
// //                         <MagnifyingGlass size={16} className="mr-1" />
// //                         Details
// //                       </button>
// //                     </div>
// //                   </td>
// //                 </tr>
// //               ))
// //             )}
// //           </tbody>
// //         </table>
// //       </div>

// //       {selectedPayment && (
// //         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
// //           <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
// //             <div className="flex justify-between items-center mb-4">
// //               <h2 className="text-xl font-bold">Payment Details</h2>
// //               <button
// //                 onClick={() => setSelectedPayment(null)}
// //                 className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
// //                 disabled={isUpdating}
// //               >
// //                 &times;
// //               </button>
// //             </div>

// //             <div className="space-y-4">
// //               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
// //                 <div>
// //                   <h3 className="font-semibold mb-2">Patient Information</h3>
// //                   <div className="bg-gray-50 p-4 rounded-lg">
// //                     <p className="font-medium">{selectedPayment.patientName}</p>
// //                     <p className="text-sm text-gray-600">
// //                       {selectedPayment.patientEmail}
// //                     </p>
// //                     <p className="text-sm text-gray-600">
// //                       {selectedPayment.patientPhone}
// //                     </p>
// //                   </div>
// //                 </div>
// //                 <div>
// //                   <h3 className="font-semibold mb-2">Doctor Information</h3>
// //                   <div className="bg-gray-50 p-4 rounded-lg">
// //                     <p className="font-medium">{selectedPayment.doctorName}</p>
// //                     <p className="text-sm text-gray-600">
// //                       {selectedPayment.specialization}
// //                     </p>
// //                     <p className="text-sm text-gray-600">
// //                       {formatRupiah(selectedPayment.price)}
// //                     </p>
// //                   </div>
// //                 </div>
// //               </div>

// //               <div>
// //                 <h3 className="font-semibold mb-2">Payment Details</h3>
// //                 <div className="bg-gray-50 p-4 rounded-lg">
// //                   <p>
// //                     <span className="font-medium">Amount:</span>{" "}
// //                     {formatRupiah(selectedPayment.price)}
// //                   </p>
// //                   <p>
// //                     <span className="font-medium">Method:</span>{" "}
// //                     <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 capitalize">
// //                       {selectedPayment.paymentMethod}
// //                     </span>
// //                   </p>
// //                   <p>
// //                     <span className="font-medium">Status:</span>{" "}
// //                     <span
// //                       className={`px-2 py-1 rounded-full text-xs ${
// //                         selectedPayment.paymentStatus === "completed"
// //                           ? "bg-green-100 text-green-800"
// //                           : selectedPayment.paymentStatus === "pending"
// //                           ? "bg-yellow-100 text-yellow-800"
// //                           : "bg-red-100 text-red-800"
// //                       }`}
// //                     >
// //                       {selectedPayment.paymentStatus}
// //                     </span>
// //                   </p>
// //                   <p>
// //                     <span className="font-medium">Date:</span>{" "}
// //                     {formatDate(selectedPayment.createdAt)}
// //                   </p>
// //                 </div>
// //               </div>

// //               {updateError && (
// //                 <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
// //                   <p>{updateError}</p>
// //                 </div>
// //               )}

// //               <div className="flex justify-end space-x-3 pt-4">
// //                 <button
// //                   onClick={() => setSelectedPayment(null)}
// //                   className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
// //                   disabled={isUpdating}
// //                 >
// //                   Close
// //                 </button>
// //                 {selectedPayment.paymentStatus !== "completed" && (
// //                   <button
// //                     onClick={() => {
// //                       handleStatusChange(selectedPayment.id, "completed");
// //                       setSelectedPayment(null);
// //                     }}
// //                     className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
// //                     disabled={isUpdating}
// //                   >
// //                     {isUpdating ? (
// //                       <Spinner className="animate-spin h-4 w-4 mr-2" />
// //                     ) : (
// //                       <>
// //                         <CheckCircle size={16} className="mr-1" />
// //                         Mark as Completed
// //                       </>
// //                     )}
// //                   </button>
// //                 )}
// //                 {selectedPayment.paymentStatus !== "failed" && (
// //                   <button
// //                     onClick={() => {
// //                       handleStatusChange(selectedPayment.id, "failed");
// //                       setSelectedPayment(null);
// //                     }}
// //                     className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
// //                     disabled={isUpdating}
// //                   >
// //                     {isUpdating ? (
// //                       <Spinner className="animate-spin h-4 w-4 mr-2" />
// //                     ) : (
// //                       <>
// //                         <XCircle size={16} className="mr-1" />
// //                         Mark as Failed
// //                       </>
// //                     )}
// //                   </button>
// //                 )}
// //               </div>
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// // // Komponen Sidebar
// // const Sidebar = ({ activeView, setActiveView, user }) => {
// //   const router = useRouter();
// //   const [isLoggingOut, setIsLoggingOut] = useState(false);

// //   const handleLogout = async () => {
// //     setIsLoggingOut(true);
// //     try {
// //       await signOut(auth);
// //       router.push("/sign-in");
// //     } catch (error) {
// //       console.error("Error logging out:", error);
// //     } finally {
// //       setIsLoggingOut(false);
// //     }
// //   };

// //   return (
// //     <div className="bg-white shadow-md p-6 w-[25%] min-h-screen fixed top-0 left-0 z-10 text-black">
// //       <div className="flex items-center mb-8">
// //         <div className="w-full text-center">
// //           <h2 className="text-xl font-semibold">Admin Dashboard</h2>
// //           {user && (
// //             <div className="mt-2 flex items-center justify-center space-x-2">
// //               <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
// //                 <UserCircle size={20} className="text-blue-600" />
// //               </div>
// //               <span className="text-sm font-medium">{user.name}</span>
// //             </div>
// //           )}
// //         </div>
// //       </div>

// //       <nav className="space-y-1">
// //         {[
// //           { icon: <House size={20} />, label: "Dashboard", view: "dashboard" },
// //           { icon: <User size={20} />, label: "Users", view: "users" },
// //           { icon: <User size={20} />, label: "Doctors", view: "doctors" },
// //           {
// //             icon: <Calendar size={20} />,
// //             label: "Appointments",
// //             view: "appointments",
// //           },
// //           {
// //             icon: <CurrencyDollar size={20} />,
// //             label: "Payments",
// //             view: "payments",
// //           },
// //           { icon: <Newspaper size={20} />, label: "Reports", view: "reports" },
// //         ].map((item) => (
// //           <button
// //             key={item.view}
// //             onClick={() => setActiveView(item.view)}
// //             className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
// //               activeView === item.view
// //                 ? "bg-blue-50 text-blue-700"
// //                 : "text-gray-700 hover:bg-gray-100"
// //             }`}
// //           >
// //             <span className="text-lg">{item.icon}</span>
// //             <span>{item.label}</span>
// //           </button>
// //         ))}
// //       </nav>

// //       <div className="mt-8 pt-4 border-t border-gray-200">
// //         <button
// //           onClick={handleLogout}
// //           className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
// //           disabled={isLoggingOut}
// //         >
// //           {isLoggingOut ? (
// //             <Spinner className="animate-spin h-5 w-5" />
// //           ) : (
// //             <>
// //               <SignOut size={20} />
// //               <span>Logout</span>
// //             </>
// //           )}
// //         </button>
// //       </div>
// //     </div>
// //   );
// // };

// // // Komponen Main Dashboard
// // const Dashboard = () => {
// //   const [activeView, setActiveView] = useState("dashboard");
// //   const [user, setUser] = useState(null);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);
// //   const [users, setUsers] = useState([]);
// //   const [doctors, setDoctors] = useState([]);
// //   const [appointments, setAppointments] = useState([]);
// //   const [payments, setPayments] = useState([]);
// //   const router = useRouter();

// //   const fetchData = useCallback(async () => {
// //     try {
// //       setLoading(true);

// //       // Fetch users
// //       const usersQuery = query(collection(db, "users"));
// //       const usersSnapshot = await getDocs(usersQuery);
// //       const usersData = usersSnapshot.docs.map((doc) => ({
// //         ...doc.data(),
// //         id: doc.id,
// //       }));
// //       setUsers(usersData);

// //       // Fetch doctors (users with role 'doctor')
// //       const doctorsData = usersData.filter((u) => u.role === "doctor");
// //       setDoctors(doctorsData);

// //       // Fetch appointments
// //       const appointmentsQuery = query(collection(db, "appointments"));
// //       const appointmentsSnapshot = await getDocs(appointmentsQuery);
// //       const appointmentsData = appointmentsSnapshot.docs.map((doc) => ({
// //         ...doc.data(),
// //         id: doc.id,
// //       }));
// //       setAppointments(appointmentsData);

// //       // Fetch payments
// //       const paymentsQuery = query(collection(db, "payments"));
// //       const paymentsSnapshot = await getDocs(paymentsQuery);
// //       const paymentsData = paymentsSnapshot.docs.map((doc) => ({
// //         ...doc.data(),
// //         id: doc.id,
// //       }));
// //       setPayments(paymentsData);

// //       setError(null);
// //     } catch (err) {
// //       console.error("Error fetching data:", err);
// //       setError("Failed to load data. Please try again.");
// //     } finally {
// //       setLoading(false);
// //     }
// //   }, []);

// //   useEffect(() => {
// //     const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
// //       if (!currentUser) {
// //         router.push("/sign-in");
// //         return;
// //       }

// //       // Check if user is admin
// //       const userDoc = await getDoc(doc(db, "users", currentUser.uid));
// //       if (userDoc.exists()) {
// //         const userData = userDoc.data();
// //         if (userData.role !== "admin") {
// //           router.push("/");
// //           return;
// //         }
// //         setUser({ ...userData, uid: currentUser.uid });
// //       } else {
// //         router.push("/sign-in");
// //         return;
// //       }

// //       await fetchData();
// //     });

// //     return () => unsubscribe();
// //   }, [fetchData, router]);

// //   if (loading) return <LoadingIndicator />;
// //   if (error) return <ErrorDisplay message={error} onRetry={fetchData} />;

// //   return (
// //     <div className="flex  text-black">
// //       <Sidebar
// //         activeView={activeView}
// //         setActiveView={setActiveView}
// //         user={user}
// //       />

// //       <main className="flex-1 ml-[25%] p-8 bg-blue-50">
// //         {activeView === "dashboard" && (
// //           <StatisticsDashboard
// //             users={users}
// //             appointments={appointments}
// //             payments={payments}
// //             doctors={doctors}
// //           />
// //         )}

// //         {activeView === "users" && (
// //           <UserManagement users={users} onRefresh={fetchData} />
// //         )}

// //         {activeView === "doctors" && (
// //           <DoctorManagement doctors={doctors} onRefresh={fetchData} />
// //         )}

// //         {activeView === "appointments" && (
// //           <AppointmentManagement
// //             appointments={appointments}
// //             users={users}
// //             doctors={doctors}
// //             onRefresh={fetchData}
// //           />
// //         )}

// //         {activeView === "payments" && (
// //           <PaymentManagement payments={payments} onRefresh={fetchData} />
// //         )}

// //         {activeView === "reports" && (
// //           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
// //             <h1 className="text-2xl font-bold">Reports</h1>
// //             <p className="mt-4 text-gray-600">Reports feature coming soon.</p>
// //           </div>
// //         )}
// //       </main>
// //     </div>
// //   );
// // };

// // export default Dashboard;






























// "use client";
// import Link from "next/link";
// import { useState, useEffect, useCallback } from "react";
// import { auth, db } from "../../../lib/firebase";
// import { onAuthStateChanged, signOut } from "firebase/auth";
// import {
//   collection,
//   query,
//   where,
//   getDocs,
//   doc,
//   getDoc,
//   updateDoc,
//   deleteDoc,
//   addDoc,
//   serverTimestamp,
// } from "firebase/firestore";
// import { useRouter } from "next/navigation";
// import {
//   MagnifyingGlass,
//   User,
//   Calendar,
//   House,
//   CurrencyDollar,
//   Newspaper,
//   ChartBar,
//   Spinner,
//   Warning,
//   SignOut,
// } from "@phosphor-icons/react/dist/ssr";
// import { Bar } from "react-chartjs-2";
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
// } from "chart.js";

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend
// );

// // Komponen Loading
// const LoadingIndicator = () => (
//   <div className="flex items-center justify-center min-h-screen">
//     <div className="text-center">
//       <Spinner className="animate-spin h-12 w-12 text-blue-500 mx-auto" />
//       <p className="mt-4">Loading dashboard...</p>
//     </div>
//   </div>
// );

// // Komponen Error
// const ErrorDisplay = ({ message, onRetry }) => (
//   <div className="flex items-center justify-center min-h-screen">
//     <div className="text-center p-6 bg-red-50 rounded-lg max-w-md">
//       <Warning className="h-12 w-12 text-red-500 mx-auto" />
//       <h3 className="text-lg font-medium mt-2">Error Occurred</h3>
//       <p className="text-gray-600 mt-1">{message}</p>
//       {onRetry && (
//         <button
//           onClick={onRetry}
//           className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//         >
//           Try Again
//         </button>
//       )}
//     </div>
//   </div>
// );

// // Komponen StatisticsDashboard
// const StatisticsDashboard = ({
//   users = [],
//   appointments = [],
//   payments = [],
//   news = [],
// }) => {
//   const formatRupiah = (value) =>
//     new Intl.NumberFormat("id-ID", {
//       style: "currency",
//       currency: "IDR",
//       minimumFractionDigits: 0,
//     }).format(value || 0);

//   const formatDate = (dateStr) => {
//     if (!dateStr) return "-";
//     const date = dateStr?.toDate?.() || new Date(dateStr);
//     return date.toLocaleDateString("id-ID", {
//       day: "numeric",
//       month: "long",
//       year: "numeric",
//     });
//   };

//   const dailyVisitors = [
//     { day: "Mon", visitors: 120 },
//     { day: "Tue", visitors: 150 },
//     { day: "Wed", visitors: 200 },
//     { day: "Thu", visitors: 180 },
//     { day: "Fri", visitors: 250 },
//     { day: "Sat", visitors: 100 },
//     { day: "Sun", visitors: 80 },
//   ];

//   const chartData = {
//     labels: dailyVisitors.map((day) => day.day),
//     datasets: [
//       {
//         label: "Visitors",
//         data: dailyVisitors.map((day) => day.visitors),
//         backgroundColor: "rgba(59, 130, 246, 0.7)",
//         borderColor: "rgba(59, 130, 246, 1)",
//         borderWidth: 1,
//         borderRadius: 4,
//         hoverBackgroundColor: "rgba(59, 130, 246, 1)",
//       },
//     ],
//   };

//   const chartOptions = {
//     responsive: true,
//     plugins: {
//       legend: {
//         position: "top",
//       },
//       title: {
//         display: true,
//         text: "Weekly Visitors",
//         font: {
//           size: 16,
//         },
//       },
//       tooltip: {
//         callbacks: {
//           label: (context) => {
//             return `${context.dataset.label}: ${context.raw}`;
//           },
//         },
//       },
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         ticks: {
//           stepSize: 50,
//         },
//       },
//     },
//     maintainAspectRatio: false,
//   };

//   const totalPatients = users.filter((u) => u?.role === "user").length;
//   const totalDoctors = users.filter((u) => u?.role === "doctor").length;
//   const totalAdmins = users.filter((u) => u?.role === "admin").length;
//   const onlineUsers = users.filter((u) => u?.status === "online").length;
//   const offlineUsers = users.filter((u) => u?.status === "offline").length;

//   const totalAppointments = appointments.length;
//   const completedAppointments = appointments.filter(
//     (a) => a?.status === "completed"
//   ).length;
//   const pendingAppointments = appointments.filter(
//     (a) => a?.status === "confirmed"
//   ).length;

//   const totalRevenue = payments.reduce(
//     (sum, payment) => sum + (payment?.amount || 0),
//     0
//   );
//   const completedPayments = payments.filter(
//     (p) => p?.status === "completed"
//   ).length;

//   const totalArticles = news.length;

//   return (
//     <div className="space-y-6">
//       <h1 className="text-2xl font-bold">Dashboard Statistics</h1>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//         {/* Card Statistics */}
//         {[
//           {
//             title: "Daily Visitors",
//             value: dailyVisitors.reduce((sum, day) => sum + day.visitors, 0),
//             change: "+12% from yesterday",
//             icon: <ChartBar size={24} className="text-blue-600" />,
//             bg: "bg-blue-100",
//           },
//           {
//             title: "Total Patients",
//             value: totalPatients,
//             change: "+5 new today",
//             icon: <User size={24} className="text-green-600" />,
//             bg: "bg-green-100",
//           },
//           {
//             title: "Total Doctors",
//             value: totalDoctors,
//             change: "2 available now",
//             icon: <User size={24} className="text-purple-600" />,
//             bg: "bg-purple-100",
//           },
//           {
//             title: "Total Admins",
//             value: totalAdmins,
//             change: `${onlineUsers} online`,
//             icon: <User size={24} className="text-yellow-600" />,
//             bg: "bg-yellow-100",
//           },
//         ].map((stat, index) => (
//           <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-gray-500 text-sm">{stat.title}</p>
//                 <p className="text-2xl font-bold">{stat.value}</p>
//                 <p
//                   className={`text-sm mt-1 ${
//                     stat.change.includes("+")
//                       ? "text-green-600"
//                       : "text-gray-500"
//                   }`}
//                 >
//                   {stat.change}
//                 </p>
//               </div>
//               <div className={`${stat.bg} p-3 rounded-full`}>{stat.icon}</div>
//             </div>
//           </div>
//         ))}
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         {/* User Statistics */}
//         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//           <h3 className="font-semibold mb-4">User Statistics</h3>
//           <div className="space-y-3">
//             <div>
//               <div className="flex justify-between mb-1">
//                 <span className="text-sm font-medium">Online Users</span>
//                 <span className="text-sm font-medium">{onlineUsers}</span>
//               </div>
//               <div className="w-full bg-gray-200 rounded-full h-2.5">
//                 <div
//                   className="bg-green-600 h-2.5 rounded-full"
//                   style={{
//                     width: `${Math.round((onlineUsers / users.length) * 100)}%`,
//                   }}
//                 ></div>
//               </div>
//             </div>

//             <div>
//               <div className="flex justify-between mb-1">
//                 <span className="text-sm font-medium">Offline Users</span>
//                 <span className="text-sm font-medium">{offlineUsers}</span>
//               </div>
//               <div className="w-full bg-gray-200 rounded-full h-2.5">
//                 <div
//                   className="bg-gray-600 h-2.5 rounded-full"
//                   style={{
//                     width: `${Math.round(
//                       (offlineUsers / users.length) * 100
//                     )}%`,
//                   }}
//                 ></div>
//               </div>
//             </div>

//             <div className="pt-2">
//               <div className="flex justify-between">
//                 <span className="text-sm">Total Users</span>
//                 <span className="text-sm font-bold">{users.length}</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Appointment Statistics */}
//         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//           <h3 className="font-semibold mb-4">Appointment Statistics</h3>
//           <div className="space-y-3">
//             <div>
//               <div className="flex justify-between mb-1">
//                 <span className="text-sm font-medium">Completed</span>
//                 <span className="text-sm font-medium">
//                   {completedAppointments}
//                 </span>
//               </div>
//               <div className="w-full bg-gray-200 rounded-full h-2.5">
//                 <div
//                   className="bg-blue-600 h-2.5 rounded-full"
//                   style={{
//                     width: `${Math.round(
//                       (completedAppointments / totalAppointments) * 100
//                     )}%`,
//                   }}
//                 ></div>
//               </div>
//             </div>

//             <div>
//               <div className="flex justify-between mb-1">
//                 <span className="text-sm font-medium">Pending</span>
//                 <span className="text-sm font-medium">
//                   {pendingAppointments}
//                 </span>
//               </div>
//               <div className="w-full bg-gray-200 rounded-full h-2.5">
//                 <div
//                   className="bg-yellow-400 h-2.5 rounded-full"
//                   style={{
//                     width: `${Math.round(
//                       (pendingAppointments / totalAppointments) * 100
//                     )}%`,
//                   }}
//                 ></div>
//               </div>
//             </div>

//             <div className="pt-2">
//               <div className="flex justify-between">
//                 <span className="text-sm">Total Appointments</span>
//                 <span className="text-sm font-bold">{totalAppointments}</span>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Payment Statistics */}
//         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//           <h3 className="font-semibold mb-4">Payment Statistics</h3>
//           <div className="space-y-3">
//             <div>
//               <div className="flex justify-between mb-1">
//                 <span className="text-sm font-medium">Completed Payments</span>
//                 <span className="text-sm font-medium">{completedPayments}</span>
//               </div>
//               <div className="w-full bg-gray-200 rounded-full h-2.5">
//                 <div
//                   className="bg-green-600 h-2.5 rounded-full"
//                   style={{
//                     width: `${Math.round(
//                       (completedPayments / payments.length) * 100
//                     )}%`,
//                   }}
//                 ></div>
//               </div>
//             </div>

//             <div>
//               <div className="flex justify-between mb-1">
//                 <span className="text-sm font-medium">Total Revenue</span>
//                 <span className="text-sm font-medium">
//                   {formatRupiah(totalRevenue)}
//                 </span>
//               </div>
//               <div className="w-full bg-gray-200 rounded-full h-2.5">
//                 <div
//                   className="bg-purple-600 h-2.5 rounded-full"
//                   style={{ width: "100%" }}
//                 ></div>
//               </div>
//             </div>

//             <div className="pt-2">
//               <div className="flex justify-between">
//                 <span className="text-sm">Total Transactions</span>
//                 <span className="text-sm font-bold">{payments.length}</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//         <div className="h-80">
//           <Bar data={chartData} options={chartOptions} />
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         {/* Recent Appointments */}
//         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//           <h3 className="font-semibold mb-4">Recent Appointments</h3>
//           <div className="space-y-3">
//             {appointments.slice(0, 3).map((app) => {
//               const patient = users.find((u) => u.id === app.patientId);
//               const doctor = users.find((u) => u.id === app.doctorId);
//               return (
//                 <div
//                   key={app.id}
//                   className="border-b pb-2 last:border-0 last:pb-0"
//                 >
//                   <p className="font-medium">{patient?.name || "Unknown"}</p>
//                   <p className="text-sm text-gray-600">
//                     with {doctor?.name || "Unknown"}
//                   </p>
//                   <p className="text-xs text-gray-500">
//                     {formatDate(app.date)} at {app.time || "Unknown"}
//                   </p>
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {/* Recent Payments */}
//         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//           <h3 className="font-semibold mb-4">Recent Payments</h3>
//           <div className="space-y-3">
//             {payments.slice(0, 3).map((payment) => {
//               const patient = users.find((u) => u.id === payment.patientId);
//               return (
//                 <div
//                   key={payment.id}
//                   className="border-b pb-2 last:border-0 last:pb-0"
//                 >
//                   <p className="font-medium">{patient?.name || "Unknown"}</p>
//                   <p className="text-sm text-gray-600">
//                     {formatRupiah(payment.amount)}
//                   </p>
//                   <p className="text-xs text-gray-500">
//                     {formatDate(payment.date)}
//                   </p>
//                 </div>
//               );
//             })}
//           </div>
//         </div>

//         {/* Recent Articles */}
//         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//           <h3 className="font-semibold mb-4">Recent Articles</h3>
//           <div className="space-y-3">
//             {news.slice(0, 3).map((article) => (
//               <div
//                 key={article.id}
//                 className="border-b pb-2 last:border-0 last:pb-0"
//               >
//                 <p className="font-medium">{article.title || "Untitled"}</p>
//                 <p className="text-sm text-gray-600">
//                   {article.author || "Unknown"}
//                 </p>
//                 <p className="text-xs text-gray-500">
//                   {formatDate(article.date)}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Komponen UserManagement
// const UserManagement = ({ users = [], onRefresh }) => {
//   const [searchTerm, setSearchTerm] = useState("");
//   const [category, setCategory] = useState("all");
//   const [tempSearchTerm, setTempSearchTerm] = useState("");
//   const [tempCategory, setTempCategory] = useState("all");
//   const [isEditing, setIsEditing] = useState(false);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [editData, setEditData] = useState({});
//   const [isUpdating, setIsUpdating] = useState(false);
//   const [updateError, setUpdateError] = useState(null);

//   const handleEdit = (user) => {
//     if (!user) return;
//     setSelectedUser(user);
//     setEditData({
//       id: user.id,
//       name: user.name || "",
//       email: user.email || "",
//       role: user.role || "user",
//       status: user.status || "offline",
//     });
//     setIsEditing(true);
//   };

//   const handleSave = async () => {
//     if (!editData.id) return;

//     setIsUpdating(true);
//     setUpdateError(null);

//     try {
//       await updateDoc(doc(db, "users", editData.id), {
//         name: editData.name,
//         email: editData.email,
//         role: editData.role,
//         status: editData.status,
//         updatedAt: serverTimestamp(),
//       });
//       await onRefresh();
//       setIsEditing(false);
//       setSelectedUser(null);
//     } catch (error) {
//       console.error("Error updating user:", error);
//       setUpdateError("Failed to update user. Please try again.");
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   const handleStatusChange = async (userId) => {
//     if (!userId) return;

//     setIsUpdating(true);
//     setUpdateError(null);

//     try {
//       const user = users.find((u) => u.id === userId);
//       if (!user) return;

//       await updateDoc(doc(db, "users", userId), {
//         status: user.status === "online" ? "offline" : "online",
//         updatedAt: serverTimestamp(),
//       });
//       await onRefresh();
//     } catch (error) {
//       console.error("Error updating user status:", error);
//       setUpdateError("Failed to update user status.");
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     setSearchTerm(tempSearchTerm);
//     setCategory(tempCategory);
//   };

//   const filteredUsers = users.filter((user) => {
//     if (!user) return false;

//     const name = user.name || "";
//     const email = user.email || "";
//     const role = user.role || "";

//     const matchesSearch =
//       name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       email.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesCategory = category === "all" || role === category;

//     return matchesSearch && matchesCategory;
//   });

//   return (
//     <div className="space-y-6">
//       <h1 className="text-2xl font-bold">Manage Users</h1>

//       {updateError && (
//         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
//           <p>{updateError}</p>
//         </div>
//       )}

//       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div className="flex gap-4">
//             <input
//               type="text"
//               placeholder="Search Account"
//               value={tempSearchTerm}
//               onChange={(e) => setTempSearchTerm(e.target.value)}
//               className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
//             />
//             <button
//               type="submit"
//               className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center"
//               disabled={isUpdating}
//             >
//               {isUpdating ? (
//                 <Spinner className="animate-spin h-5 w-5 mr-2" />
//               ) : (
//                 <MagnifyingGlass size={20} />
//               )}
//             </button>
//           </div>

//           <div>
//             <label className="block text-sm font-medium mb-2">Category</label>
//             <select
//               value={tempCategory}
//               onChange={(e) => setTempCategory(e.target.value)}
//               className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
//             >
//               <option value="all">All</option>
//               <option value="doctor">Doctor</option>
//               <option value="user">Patient</option>
//               <option value="admin">Admin</option>
//             </select>
//           </div>
//         </form>
//       </div>

//       <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Name
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Role
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Email
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Status
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Actions
//               </th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {filteredUsers.length === 0 ? (
//               <tr>
//                 <td colSpan="5" className="text-center py-4 text-gray-500">
//                   No users found.
//                 </td>
//               </tr>
//             ) : (
//               filteredUsers.map((user) => (
//                 <tr key={user.id} className="hover:bg-gray-50">
//                   <td className="px-6 py-4 whitespace-nowrap font-medium">
//                     {user.name || "Unknown"}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
//                       {user.role || "User"}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-gray-500">
//                     {user.email || "Unknown"}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span
//                       className={`px-2 py-1 text-xs font-semibold rounded-full ${
//                         user.status === "online"
//                           ? "bg-green-100 text-green-800"
//                           : "bg-gray-100 text-gray-800"
//                       }`}
//                     >
//                       {user.status || "offline"}
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                     <button
//                       onClick={() => handleEdit(user)}
//                       className="text-blue-600 hover:text-blue-900 mr-3"
//                       disabled={isUpdating}
//                     >
//                       Edit
//                     </button>
//                     <button
//                       onClick={() => handleStatusChange(user.id)}
//                       className={`${
//                         user.status === "online"
//                           ? "text-red-600 hover:text-red-900"
//                           : "text-green-600 hover:text-green-900"
//                       }`}
//                       disabled={isUpdating}
//                     >
//                       {user.status === "online" ? "Set Offline" : "Set Online"}
//                     </button>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       {isEditing && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl p-6 w-full max-w-md">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-bold">Edit User</h2>
//               <button
//                 onClick={() => setIsEditing(false)}
//                 className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
//                 disabled={isUpdating}
//               >
//                 &times;
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium mb-1">Name</label>
//                 <input
//                   type="text"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.name}
//                   onChange={(e) =>
//                     setEditData({ ...editData, name: e.target.value })
//                   }
//                   disabled={isUpdating}
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Email</label>
//                 <input
//                   type="email"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.email}
//                   onChange={(e) =>
//                     setEditData({ ...editData, email: e.target.value })
//                   }
//                   disabled={isUpdating}
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Role</label>
//                 <select
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.role}
//                   onChange={(e) =>
//                     setEditData({ ...editData, role: e.target.value })
//                   }
//                   disabled={isUpdating}
//                 >
//                   <option value="doctor">Doctor</option>
//                   <option value="user">Patient</option>
//                   <option value="admin">Admin</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Status</label>
//                 <select
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.status}
//                   onChange={(e) =>
//                     setEditData({ ...editData, status: e.target.value })
//                   }
//                   disabled={isUpdating}
//                 >
//                   <option value="online">Online</option>
//                   <option value="offline">Offline</option>
//                 </select>
//               </div>

//               {updateError && (
//                 <div className="text-red-600 text-sm">{updateError}</div>
//               )}

//               <div className="flex justify-end space-x-3 pt-4">
//                 <button
//                   onClick={() => setIsEditing(false)}
//                   className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
//                   disabled={isUpdating}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSave}
//                   className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
//                   disabled={isUpdating}
//                 >
//                   {isUpdating && (
//                     <Spinner className="animate-spin h-4 w-4 mr-2" />
//                   )}
//                   Save
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // Komponen AppointmentManagement
// const AppointmentManagement = ({ appointments = [], users = [], onRefresh }) => {
//   const [selectedAppointment, setSelectedAppointment] = useState(null);
//   const [isUpdating, setIsUpdating] = useState(false);
//   const [updateError, setUpdateError] = useState(null);

//   const formatDate = (dateStr) => {
//     if (!dateStr) return "-";
//     const date = dateStr?.toDate?.() || new Date(dateStr);
//     return date.toLocaleDateString("id-ID", {
//       day: "numeric",
//       month: "long",
//       year: "numeric",
//     });
//   };

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat("id-ID", {
//       style: "currency",
//       currency: "IDR",
//       minimumFractionDigits: 0,
//     }).format(amount || 0);
//   };

//   const handleStatusChange = async (appointmentId, newStatus) => {
//     if (!appointmentId) return;

//     setIsUpdating(true);
//     setUpdateError(null);

//     try {
//       await updateDoc(doc(db, "appointments", appointmentId), {
//         status: newStatus,
//         updatedAt: serverTimestamp(),
//       });

//       if (newStatus === "completed") {
//         const appointment = appointments.find((a) => a.id === appointmentId);
//         if (appointment) {
//           const patient = users.find((u) => u.id === appointment.patientId);
//           const doctor = users.find((u) => u.id === appointment.doctorId);

//           await addDoc(collection(db, "payments"), {
//             appointmentId: appointmentId,
//             patientId: appointment.patientId,
//             doctorId: appointment.doctorId,
//             patient: patient?.name || "Unknown",
//             doctor: doctor?.name || "Unknown",
//             amount: appointment.price || 0,
//             status: "completed",
//             date: serverTimestamp(),
//             createdAt: serverTimestamp(),
//           });
//         }
//       }

//       await onRefresh();
//     } catch (error) {
//       console.error("Error updating appointment:", error);
//       setUpdateError("Failed to update appointment status.");
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   const getStatusColor = (status) => {
//     switch (status?.toLowerCase()) {
//       case "confirmed":
//         return "bg-green-100 text-green-800";
//       case "completed":
//         return "bg-blue-100 text-blue-800";
//       case "waiting":
//         return "bg-yellow-100 text-yellow-800";
//       case "cancelled":
//         return "bg-red-100 text-red-800";
//       default:
//         return "bg-gray-100 text-gray-800";
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <h1 className="text-2xl font-bold">Manage Appointments</h1>

//       {updateError && (
//         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
//           <p>{updateError}</p>
//         </div>
//       )}

//       <div className="space-y-4">
//         {appointments.length === 0 ? (
//           <div className="bg-white p-6 rounded-xl shadow-sm text-center text-gray-500">
//             No appointments found.
//           </div>
//         ) : (
//           appointments.map((appointment) => {
//             const patient = users.find(u => u.id === appointment.patientId);
//             const doctor = users.find(u => u.id === appointment.doctorId);

//             return (
//               <div key={appointment.id} className="bg-white p-6 rounded-xl shadow-sm">
//                 <div className="flex justify-between items-start">
//                   <div>
//                     <h3 className="font-semibold text-lg">
//                       {patient?.name || "Unknown"} with{" "}
//                       {doctor?.name || "Unknown"}
//                     </h3>
//                     <p className="text-gray-600">
//                       {formatDate(appointment.date)} at{" "}
//                       {appointment.time || "Unknown"}
//                     </p>
//                   </div>
//                   <div className="flex items-center space-x-3">
//                     <span
//                       className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
//                         appointment.status
//                       )}`}
//                     >
//                       {appointment.status || "Unknown"}
//                     </span>
//                     <button
//                       onClick={() => setSelectedAppointment(appointment)}
//                       className="text-blue-600 hover:text-blue-800"
//                       aria-label="View details"
//                       disabled={isUpdating}
//                     >
//                       Details
//                     </button>
//                   </div>
//                 </div>

//                 <div className="mt-4 flex space-x-3">
//                   <button
//                     onClick={() => handleStatusChange(appointment.id, "cancelled")}
//                     disabled={appointment.status === "cancelled" || isUpdating}
//                     className={`px-3 py-1 text-sm rounded ${
//                       appointment.status === "cancelled"
//                         ? "bg-red-600 text-white cursor-not-allowed"
//                         : "bg-red-100 text-red-800 hover:bg-red-200"
//                     }`}
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     onClick={() => handleStatusChange(appointment.id, "completed")}
//                     disabled={
//                       appointment.status === "completed" ||
//                       appointment.status === "cancelled" ||
//                       isUpdating
//                     }
//                     className={`px-3 py-1 text-sm rounded ${
//                       appointment.status === "completed"
//                         ? "bg-blue-600 text-white cursor-not-allowed"
//                         : appointment.status === "cancelled"
//                         ? "bg-gray-300 text-gray-500 cursor-not-allowed"
//                         : "bg-blue-100 text-blue-800 hover:bg-blue-200"
//                     }`}
//                   >
//                     Complete
//                   </button>
//                 </div>
//               </div>
//             );
//           })
//         )}
//       </div>

//       {selectedAppointment && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl p-6 w-full max-w-md">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-bold">Appointment Details</h2>
//               <button
//                 onClick={() => setSelectedAppointment(null)}
//                 className="text-gray-500 hover:text-gray-700"
//                 aria-label="Close modal"
//                 disabled={isUpdating}
//               >
//                 ✕
//               </button>
//             </div>

//             <div className="space-y-3">
//               <div>
//                 <p className="text-sm text-gray-500">Patient</p>
//                 <p className="font-medium">
//                   {users.find(u => u.id === selectedAppointment.patientId)?.name || "Unknown"}
//                 </p>
//               </div>

//               <div>
//                 <p className="text-sm text-gray-500">Doctor</p>
//                 <p className="font-medium">
//                   {users.find(u => u.id === selectedAppointment.doctorId)?.name || "Unknown"}
//                 </p>
//               </div>

//               <div>
//                 <p className="text-sm text-gray-500">Date & Time</p>
//                 <p className="font-medium">
//                   {formatDate(selectedAppointment.date)} at{" "}
//                   {selectedAppointment.time || "Unknown"}
//                 </p>
//               </div>

//               <div>
//                 <p className="text-sm text-gray-500">Status</p>
//                 <p
//                   className={`font-medium px-2 py-1 inline-block rounded ${getStatusColor(
//                     selectedAppointment.status
//                   )}`}
//                 >
//                   {selectedAppointment.status || "Unknown"}
//                 </p>
//               </div>

//               {updateError && (
//                 <div className="text-red-600 text-sm">{updateError}</div>
//               )}

//               <div className="pt-4 flex space-x-3">
//                 <button
//                   onClick={() => {
//                     handleStatusChange(selectedAppointment.id, "cancelled");
//                     setSelectedAppointment(null);
//                   }}
//                   disabled={selectedAppointment.status === "cancelled" || isUpdating}
//                   className={`flex-1 py-2 rounded ${
//                     selectedAppointment.status === "cancelled"
//                       ? "bg-gray-300 text-gray-500 cursor-not-allowed"
//                       : "bg-red-600 text-white hover:bg-red-700"
//                   }`}
//                 >
//                   {isUpdating ? (
//                     <Spinner className="animate-spin h-5 w-5 mx-auto" />
//                   ) : (
//                     "Cancel Appointment"
//                   )}
//                 </button>
//                 <button
//                   onClick={() => {
//                     handleStatusChange(selectedAppointment.id, "completed");
//                     setSelectedAppointment(null);
//                   }}
//                   disabled={
//                     selectedAppointment.status === "completed" ||
//                     selectedAppointment.status === "cancelled" ||
//                     isUpdating
//                   }
//                   className={`flex-1 py-2 rounded ${
//                     selectedAppointment.status === "completed"
//                       ? "bg-gray-300 text-gray-500 cursor-not-allowed"
//                       : selectedAppointment.status === "cancelled"
//                       ? "bg-gray-300 text-gray-500 cursor-not-allowed"
//                       : "bg-blue-600 text-white hover:bg-blue-700"
//                   }`}
//                 >
//                   {isUpdating ? (
//                     <Spinner className="animate-spin h-5 w-5 mx-auto" />
//                   ) : (
//                     "Mark as Complete"
//                   )}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // Komponen PaymentManagement
// const PaymentManagement = ({ payments = [], users = [] }) => {
//   const formatRupiah = (value) =>
//     new Intl.NumberFormat("id-ID", {
//       style: "currency",
//       currency: "IDR",
//       minimumFractionDigits: 0,
//     }).format(value || 0);

//   const formatDate = (dateStr) => {
//     if (!dateStr) return "-";
//     const date = dateStr?.toDate?.() || new Date(dateStr);
//     return date.toLocaleDateString("id-ID", {
//       day: "numeric",
//       month: "long",
//       year: "numeric",
//     });
//   };

//   const totalRevenue = payments.reduce(
//     (sum, payment) => sum + (payment?.amount || 0),
//     0
//   );

//   return (
//     <div className="space-y-6">
//       <h1 className="text-2xl font-bold">Manage Payments</h1>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <div className="bg-white p-6 rounded-xl shadow-sm">
//           <p className="text-gray-500">Total Revenue</p>
//           <p className="text-2xl font-bold">{formatRupiah(totalRevenue)}</p>
//         </div>
//         <div className="bg-white p-6 rounded-xl shadow-sm">
//           <p className="text-gray-500">Completed Payments</p>
//           <p className="text-2xl font-bold">
//             {payments.filter((p) => p?.status === "completed").length}
//           </p>
//         </div>
//         <div className="bg-white p-6 rounded-xl shadow-sm">
//           <p className="text-gray-500">Pending Payments</p>
//           <p className="text-2xl font-bold">
//             {payments.filter((p) => p?.status === "pending").length}
//           </p>
//         </div>
//       </div>

//       <div className="bg-white rounded-xl shadow-sm overflow-hidden">
//         <table className="min-w-full divide-y divide-gray-200">
//           <thead className="bg-gray-50">
//             <tr>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Payment ID
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Patient
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Doctor
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Amount
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Date
//               </th>
//               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                 Status
//               </th>
//             </tr>
//           </thead>
//           <tbody className="bg-white divide-y divide-gray-200">
//             {payments.length === 0 ? (
//               <tr>
//                 <td colSpan="6" className="text-center py-4 text-gray-500">
//                   No payments found.
//                 </td>
//               </tr>
//             ) : (
//               payments.map((payment) => {
//                 const patient = users.find((u) => u.id === payment.patientId);
//                 const doctor = users.find((u) => u.id === payment.doctorId);
//                 return (
//                   <tr key={payment.id} className="hover:bg-gray-50">
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="font-medium">
//                         {payment.id.substring(0, 8)}...
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       {patient?.name || "Unknown"}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       {doctor?.name || "Unknown"}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       {formatRupiah(payment.amount)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       {formatDate(payment.date)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span
//                         className={`px-2 py-1 text-xs font-semibold rounded-full ${
//                           payment.status === "completed"
//                             ? "bg-green-100 text-green-800"
//                             : "bg-yellow-100 text-yellow-800"
//                         }`}
//                       >
//                         {payment.status || "Unknown"}
//                       </span>
//                     </td>
//                   </tr>
//                 );
//               })
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// // Komponen NewsManagement
// const NewsManagement = ({ news = [], onRefresh }) => {
//   const [newArticle, setNewArticle] = useState({
//     title: "",
//     category: "",
//     content: "",
//     image: null,
//     labels: [],
//     author: "Admin",
//     date: new Date().toISOString().split("T")[0],
//   });
//   const [isCreating, setIsCreating] = useState(false);
//   const [editingArticle, setEditingArticle] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [error, setError] = useState(null);

//   const formatDate = (dateStr) => {
//     if (!dateStr) return "-";
//     const date = dateStr?.toDate?.() || new Date(dateStr);
//     return date.toLocaleDateString("id-ID", {
//       day: "numeric",
//       month: "long",
//       year: "numeric",
//     });
//   };

//   const handleImageChange = (e) => {
//     if (e.target.files && e.target.files[0]) {
//       const file = e.target.files[0];
//       if (file.size > 2 * 1024 * 1024) {
//         setError("Ukuran gambar terlalu besar (maksimal 2MB)");
//         return;
//       }

//       const reader = new FileReader();
//       reader.onloadend = () => {
//         if (isEditing) {
//           setEditingArticle({ ...editingArticle, image: reader.result });
//         } else {
//           setNewArticle({ ...newArticle, image: reader.result });
//         }
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleCreate = async () => {
//     if (!newArticle.title || !newArticle.content) {
//       setError("Judul dan konten harus diisi");
//       return;
//     }

//     setIsProcessing(true);
//     setError(null);

//     try {
//       await addDoc(collection(db, "news"), {
//         title: newArticle.title,
//         image: newArticle.image || "/assets/default-news.jpg",
//         labels: newArticle.labels,
//         description: newArticle.content.substring(0, 100) + "...",
//         content: [newArticle.content],
//         author: newArticle.author,
//         date: serverTimestamp(),
//         createdAt: serverTimestamp(),
//       });
//       await onRefresh();
//       setIsCreating(false);
//       setNewArticle({
//         title: "",
//         category: "",
//         content: "",
//         image: null,
//         labels: [],
//         author: "Admin",
//         date: new Date().toISOString().split("T")[0],
//       });
//     } catch (err) {
//       console.error("Error creating news:", err);
//       setError("Gagal membuat artikel. Silakan coba lagi.");
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const handleUpdate = async () => {
//     if (
//       !editingArticle?.id ||
//       !editingArticle.title ||
//       !editingArticle.content
//     ) {
//       setError("Judul dan konten harus diisi");
//       return;
//     }

//     setIsProcessing(true);
//     setError(null);

//     try {
//       await updateDoc(doc(db, "news", editingArticle.id), {
//         title: editingArticle.title,
//         image: editingArticle.image || "/assets/default-news.jpg",
//         labels: editingArticle.labels,
//         description: editingArticle.content.substring(0, 100) + "...",
//         content: [editingArticle.content],
//         updatedAt: serverTimestamp(),
//       });
//       await onRefresh();
//       setIsEditing(false);
//       setEditingArticle(null);
//     } catch (err) {
//       console.error("Error updating news:", err);
//       setError("Gagal memperbarui artikel. Silakan coba lagi.");
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   const handleDelete = async (articleId) => {
//     if (window.confirm("Apakah Anda yakin ingin menghapus artikel ini?")) {
//       setIsProcessing(true);
//       setError(null);

//       try {
//         await deleteDoc(doc(db, "news", articleId));
//         await onRefresh();
//       } catch (err) {
//         console.error("Error deleting news:", err);
//         setError("Gagal menghapus artikel. Silakan coba lagi.");
//       } finally {
//         setIsProcessing(false);
//       }
//     }
//   };

//   const handleEdit = (article) => {
//     if (!article) return;
//     setEditingArticle({
//       ...article,
//       content: article.content?.join?.("\n\n") || "",
//       labels: article.labels || [],
//     });
//     setIsEditing(true);
//   };

//   const handleLabelChange = (e) => {
//     const value = e.target.value.trim();
//     if (!value) return;

//     if (isEditing) {
//       if (!editingArticle.labels.includes(value)) {
//         setEditingArticle({
//           ...editingArticle,
//           labels: [...editingArticle.labels, value],
//         });
//       }
//     } else {
//       if (!newArticle.labels.includes(value)) {
//         setNewArticle({
//           ...newArticle,
//           labels: [...newArticle.labels, value],
//         });
//       }
//     }
//     e.target.value = "";
//   };

//   const removeLabel = (labelToRemove) => {
//     if (isEditing) {
//       setEditingArticle({
//         ...editingArticle,
//         labels: editingArticle.labels.filter(
//           (label) => label !== labelToRemove
//         ),
//       });
//     } else {
//       setNewArticle({
//         ...newArticle,
//         labels: newArticle.labels.filter((label) => label !== labelToRemove),
//       });
//     }
//   };

//   const categories = [
//     "Medication",
//     "Nursing",
//     "Emergency",
//     "Training",
//     "Education",
//     "Patient Care",
//     "Hygiene",
//     "Technology",
//     "Innovation",
//     "Mental Health",
//     "Support",
//     "Rural",
//     "Access",
//     "Diversity",
//     "Ethics",
//     "Chronic Illness",
//     "Long-term Care",
//     "Telehealth",
//     "Future",
//     "Nutrition",
//     "Decision Making",
//   ];

//   return (
//     <div className="space-y-6">
//       <h1 className="text-2xl font-bold">Manage News</h1>

//       {error && (
//         <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
//           <p>{error}</p>
//         </div>
//       )}

//       <div className="flex justify-end">
//         <button
//           onClick={() => setIsCreating(true)}
//           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
//           disabled={isProcessing}
//         >
//           {isProcessing && <Spinner className="animate-spin h-5 w-5 mr-2" />}
//           Create New Article
//         </button>
//       </div>

//       <div className="space-y-4">
//         {news.length === 0 ? (
//           <div className="bg-white p-6 rounded-xl shadow-sm text-center text-gray-500">
//             No articles found.
//           </div>
//         ) : (
//           news.map((article) => (
//             <div key={article.id} className="bg-white p-6 rounded-xl shadow-sm">
//               <div className="flex items-start gap-4">
//                 <div className="flex-shrink-0">
//                   <img
//                     src={article.image || "/assets/default-news.jpg"}
//                     alt={article.title}
//                     className="w-32 h-32 object-cover rounded-lg"
//                   />
//                 </div>
//                 <div className="flex-1">
//                   <h3 className="font-semibold text-lg">
//                     {article.title || "Untitled"}
//                   </h3>
//                   <p className="text-gray-600">
//                     {formatDate(article.date)} •{" "}
//                     {article.labels?.join(", ") || "Uncategorized"}
//                   </p>
//                   <p className="mt-2 text-gray-700">
//                     {article.description || "No description"}
//                   </p>
//                 </div>
//               </div>
//               <div className="mt-4 flex space-x-2">
//                 <button
//                   onClick={() => handleEdit(article)}
//                   className="px-2 py-1 text-sm rounded bg-blue-100 text-blue-800 hover:bg-blue-200"
//                   disabled={isProcessing}
//                 >
//                   Edit
//                 </button>
//                 <button
//                   onClick={() => handleDelete(article.id)}
//                   className="px-2 py-1 text-sm rounded bg-red-100 text-red-800 hover:bg-red-200"
//                   disabled={isProcessing}
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           ))
//         )}
//       </div>

//       {isCreating && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-bold">Create New Article</h2>
//               <button
//                 onClick={() => setIsCreating(false)}
//                 className="text-gray-500 hover:text-gray-700"
//                 disabled={isProcessing}
//               >
//                 ✕
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium mb-1">Title</label>
//                 <input
//                   type="text"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={newArticle.title}
//                   onChange={(e) =>
//                     setNewArticle({ ...newArticle, title: e.target.value })
//                   }
//                   disabled={isProcessing}
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Image</label>
//                 <input
//                   type="file"
//                   accept="image/*"
//                   onChange={handleImageChange}
//                   className="w-full p-2 border border-gray-300 rounded"
//                   disabled={isProcessing}
//                 />
//                 {newArticle.image && (
//                   <div className="mt-2">
//                     <img
//                       src={newArticle.image}
//                       alt="Preview"
//                       className="w-32 h-32 object-cover rounded-lg"
//                     />
//                   </div>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Category
//                 </label>
//                 <div className="flex gap-2">
//                   <select
//                     className="flex-1 p-2 border border-gray-300 rounded"
//                     onChange={handleLabelChange}
//                     defaultValue=""
//                     disabled={isProcessing}
//                   >
//                     <option value="" disabled>
//                       Select category
//                     </option>
//                     {categories.map((cat) => (
//                       <option key={cat} value={cat}>
//                         {cat}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//                 <div className="flex flex-wrap gap-2 mt-2">
//                   {newArticle.labels.map((label) => (
//                     <span
//                       key={label}
//                       className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center"
//                     >
//                       {label}
//                       <button
//                         type="button"
//                         onClick={() => removeLabel(label)}
//                         className="ml-1 text-blue-600 hover:text-blue-900"
//                         disabled={isProcessing}
//                       >
//                         ×
//                       </button>
//                     </span>
//                   ))}
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Content
//                 </label>
//                 <textarea
//                   rows={6}
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={newArticle.content}
//                   onChange={(e) =>
//                     setNewArticle({ ...newArticle, content: e.target.value })
//                   }
//                   disabled={isProcessing}
//                 ></textarea>
//               </div>

//               {error && <div className="text-red-600 text-sm">{error}</div>}

//               <div className="flex justify-end space-x-3 pt-4">
//                 <button
//                   onClick={() => setIsCreating(false)}
//                   className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
//                   disabled={isProcessing}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleCreate}
//                   className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
//                   disabled={isProcessing}
//                 >
//                   {isProcessing && (
//                     <Spinner className="animate-spin h-4 w-4 mr-2" />
//                   )}
//                   Create
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {isEditing && editingArticle && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-bold">Edit Article</h2>
//               <button
//                 onClick={() => setIsEditing(false)}
//                 className="text-gray-500 hover:text-gray-700"
//                 disabled={isProcessing}
//               >
//                 ✕
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium mb-1">Title</label>
//                 <input
//                   type="text"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editingArticle.title}
//                   onChange={(e) =>
//                     setEditingArticle({
//                       ...editingArticle,
//                       title: e.target.value,
//                     })
//                   }
//                   disabled={isProcessing}
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">Image</label>
//                 <input
//                   type="file"
//                   accept="image/*"
//                   onChange={handleImageChange}
//                   className="w-full p-2 border border-gray-300 rounded"
//                   disabled={isProcessing}
//                 />
//                 {editingArticle.image && (
//                   <div className="mt-2">
//                     <img
//                       src={editingArticle.image}
//                       alt="Preview"
//                       className="w-32 h-32 object-cover rounded-lg"
//                     />
//                   </div>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Category
//                 </label>
//                 <div className="flex gap-2">
//                   <select
//                     className="flex-1 p-2 border border-gray-300 rounded"
//                     onChange={handleLabelChange}
//                     defaultValue=""
//                     disabled={isProcessing}
//                   >
//                     <option value="" disabled>
//                       Select category
//                     </option>
//                     {categories.map((cat) => (
//                       <option key={cat} value={cat}>
//                         {cat}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//                 <div className="flex flex-wrap gap-2 mt-2">
//                   {editingArticle.labels.map((label) => (
//                     <span
//                       key={label}
//                       className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center"
//                     >
//                       {label}
//                       <button
//                         type="button"
//                         onClick={() => removeLabel(label)}
//                         className="ml-1 text-blue-600 hover:text-blue-900"
//                         disabled={isProcessing}
//                       >
//                         ×
//                       </button>
//                     </span>
//                   ))}
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Content
//                 </label>
//                 <textarea
//                   rows={6}
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editingArticle.content}
//                   onChange={(e) =>
//                     setEditingArticle({
//                       ...editingArticle,
//                       content: e.target.value,
//                     })
//                   }
//                   disabled={isProcessing}
//                 ></textarea>
//               </div>

//               {error && <div className="text-red-600 text-sm">{error}</div>}

//               <div className="flex justify-end space-x-3 pt-4">
//                 <button
//                   onClick={() => setIsEditing(false)}
//                   className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
//                   disabled={isProcessing}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleUpdate}
//                   className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
//                   disabled={isProcessing}
//                 >
//                   {isProcessing && (
//                     <Spinner className="animate-spin h-4 w-4 mr-2" />
//                   )}
//                   Update
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // Komponen Sidebar
// const Sidebar = ({ activeView, setActiveView }) => {
//   const router = useRouter();
//   const [isLoggingOut, setIsLoggingOut] = useState(false);

//   const handleLogout = async () => {
//     setIsLoggingOut(true);
//     try {
//       await signOut(auth);
//       router.push("/sign-in");
//     } catch (error) {
//       console.error("Error logging out:", error);
//     } finally {
//       setIsLoggingOut(false);
//     }
//   };

//   return (
//     <div className="bg-white shadow-md p-6 w-[25%] min-h-screen fixed top-0 left-0 z-10">
//       <div className="flex items-center mb-8">
//         <div className="w-full text-center">
//           <h2 className="text-xl font-semibold">Admin Dashboard</h2>
//         </div>
//       </div>
//       <div className="nav flex flex-col h-full">
//         <nav className="space-y-2">
//           {[
//             {
//               id: "statistics",
//               icon: <ChartBar size={20} />,
//               label: "Statistics",
//             },
//             {
//               id: "users",
//               icon: <User size={20} />,
//               label: "Manage Users",
//             },
//             {
//               id: "appointments",
//               icon: <Calendar size={20} />,
//               label: "Manage Appointments",
//             },
//             {
//               id: "payments",
//               icon: <CurrencyDollar size={20} />,
//               label: "Manage Payments",
//             },
//             {
//               id: "news",
//               icon: <Newspaper size={20} />,
//               label: "Manage News",
//             },
//           ].map((item) => (
//             <button
//               key={item.id}
//               onClick={() => setActiveView(item.id)}
//               className={`flex items-center w-full text-left p-3 rounded-lg transition ${
//                 activeView === item.id
//                   ? "bg-blue-50 text-blue-600 font-medium"
//                   : "hover:bg-gray-100"
//               }`}
//             >
//               <span className="mr-3">{item.icon}</span>
//               {item.label}
//             </button>
//           ))}
//         </nav>

//         <div className="mt-10 space-y-2">
//           <Link
//             href="/"
//             className="w-full text-white p-3 font-medium rounded-lg bg-blue-500 hover:bg-blue-700 transition-all duration-100 flex items-center"
//           >
//             <House size={20} className="mr-3" />
//             <h1>Home</h1>
//           </Link>
//           <button
//             onClick={handleLogout}
//             className="w-full text-left p-3 font-medium rounded-lg bg-red-500 hover:bg-red-700 text-white transition-all duration-100 flex items-center"
//             disabled={isLoggingOut}
//           >
//             {isLoggingOut ? (
//               <Spinner className="animate-spin h-5 w-5 mr-2" />
//             ) : (
//               <>
//                 <span className="mr-3">Logout</span>
//               </>
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Komponen Utama AdminDashboard
// export default function AdminDashboard() {
//   const [activeView, setActiveView] = useState("statistics");
//   const [users, setUsers] = useState([]);
//   const [appointments, setAppointments] = useState([]);
//   const [payments, setPayments] = useState([]);
//   const [news, setNews] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [user, setUser] = useState(null);
//   const router = useRouter();

//   const fetchAllData = useCallback(async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const [usersData, appointmentsData, paymentsData, newsData] =
//         await Promise.all([
//           fetchUsers(),
//           fetchAppointments(),
//           fetchPayments(),
//           fetchNews(),
//         ]);

//       setUsers(usersData);
//       setAppointments(appointmentsData);
//       setPayments(paymentsData);
//       setNews(newsData);
//     } catch (err) {
//       console.error("Error fetching data:", err);
//       setError("Failed to fetch data. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const fetchUsers = async () => {
//     const q = query(collection(db, "users"));
//     const snapshot = await getDocs(q);
//     return snapshot.docs.map((doc) => ({
//       id: doc.id,
//       ...doc.data(),
//     }));
//   };

//   const fetchAppointments = async () => {
//     const q = query(collection(db, "appointments"));
//     const snapshot = await getDocs(q);
//     return snapshot.docs
//       .map((doc) => {
//         const data = doc.data();
//         return {
//           id: doc.id,
//           ...data,
//           date: data.date?.toDate?.() || new Date(data.date || Date.now()),
//         };
//       })
//       .sort((a, b) => (b.date || 0) - (a.date || 0));
//   };

//   const fetchPayments = async () => {
//     const q = query(collection(db, "payments"));
//     const snapshot = await getDocs(q);
//     return snapshot.docs
//       .map((doc) => {
//         const data = doc.data();
//         return {
//           id: doc.id,
//           ...data,
//           date: data.date?.toDate?.() || new Date(data.date || Date.now()),
//         };
//       })
//       .sort((a, b) => (b.date || 0) - (a.date || 0));
//   };

//   const fetchNews = async () => {
//     const q = query(collection(db, "news"));
//     const snapshot = await getDocs(q);
//     return snapshot.docs
//       .map((doc) => {
//         const data = doc.data();
//         return {
//           id: doc.id,
//           ...data,
//           date: data.date?.toDate?.() || new Date(data.date || Date.now()),
//         };
//       })
//       .sort((a, b) => (b.date || 0) - (a.date || 0));
//   };

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
//       if (currentUser) {
//         try {
//           const userDoc = await getDoc(doc(db, "users", currentUser.uid));
//           if (userDoc.exists()) {
//             setUser(currentUser);
//             await fetchAllData();
//           } else {
//             router.push("/");
//           }
//         } catch (err) {
//           console.error("Error checking user role:", err);
//           router.push("/");
//         }
//       } else {
//         router.push("/sign-in");
//       }
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, [router, fetchAllData]);

//   const renderActiveView = () => {
//     if (loading) return <LoadingIndicator />;
//     if (error) return <ErrorDisplay message={error} onRetry={fetchAllData} />;

//     switch (activeView) {
//       case "statistics":
//         return (
//           <StatisticsDashboard
//             users={users}
//             appointments={appointments}
//             payments={payments}
//             news={news}
//           />
//         );
//       case "users":
//         return <UserManagement users={users} onRefresh={fetchAllData} />;
//       case "appointments":
//         return (
//           <AppointmentManagement
//             appointments={appointments}
//             users={users}
//             onRefresh={fetchAllData}
//           />
//         );
//       case "payments":
//         return <PaymentManagement payments={payments} users={users} />
//       case "news":
//         return <NewsManagement news={news} onRefresh={fetchAllData} />;
//       default:
//         return (
//           <StatisticsDashboard
//             users={users}
//             appointments={appointments}
//             payments={payments}
//             news={news}
//           />
//         );
//     }
//   };

//   if (!user && loading) {
//     return <LoadingIndicator />;
//   }

//   if (error) {
//     return <ErrorDisplay message={error} onRetry={fetchAllData} />;
//   }

//   return (
//     <div className="w-full min-h-screen bg-blue-50 text-black">
//       <div className="flex w-full relative">
//         <Sidebar activeView={activeView} setActiveView={setActiveView} />
//         <div className="w-[25%]"></div>
//         <div className="w-[75%] p-8">{renderActiveView()}</div>
//       </div>
//     </div>
//   );
// }
