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
  Receipt,
  SignOut,
  FirstAid,
  Clock
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
  const fetchPayments = async () => {
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
const PaymentDetailModal = ({ payment, onClose, onRefresh }) => {
  const formatRupiah = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency", 
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Payment Details</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="pb-4 border-b border-gray-100">
              <p className="text-sm text-gray-500">Payment ID</p>
              <p className="font-medium font-mono">#{payment.id?.slice(-8).toUpperCase()}</p>
            </div>

            <div className="pb-4 border-b border-gray-100">
              <p className="text-sm text-gray-500">Patient</p>
              <p className="font-medium">{payment.patientName}</p>
              <p className="text-sm text-gray-500">{payment.patientEmail}</p>
            </div>

            <div className="pb-4 border-b border-gray-100">
              <p className="text-sm text-gray-500">Doctor</p>
              <p className="font-medium">{payment.doctorName}</p>
              <p className="text-sm text-gray-500">{payment.doctorSpecialization}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium text-lg text-blue-600">
                  {formatRupiah(payment.amount || payment.price)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Method</p>
                <p className="font-medium capitalize">{payment.paymentMethod}</p>
              </div>
            </div>

            <div className="pb-4 border-b border-gray-100">
              <p className="text-sm text-gray-500">Payment Date</p>
              <p className="font-medium">{formatDate(payment.paymentDate || payment.createdAt)}</p>
            </div>

            <div className="pb-4 border-b border-gray-100">
              <p className="text-sm text-gray-500">Status</p>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                payment.paymentStatus === "completed" ? "bg-green-100 text-green-800" :
                payment.paymentStatus === "pending" ? "bg-yellow-100 text-yellow-800" :
                "bg-red-100 text-red-800"
              }`}>
                {payment.paymentStatus}
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
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
const Sidebar = ({ activeView, setActiveView, adminData }) => {
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
    <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
      <div className="flex flex-col h-full">
        {/* Header Profile Section */}
        <div className="p-4 flex items-center gap-3 border-b border-gray-200">
          <div className="relative">
            <img
              src={adminData?.photoUrl || "/assets/default-profile.jpg"}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border border-gray-300"
              onError={(e) => {
                e.target.src = "/assets/default-profile.jpg";
              }}
            />
          </div>
          <div>
            <h2 className="font-semibold">{adminData?.name || "Admin"}</h2>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => setActiveView("statistics")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
              activeView === "statistics"
                ? "bg-blue-100 text-blue-600"
                : "hover:bg-gray-100"
            } transition-colors`}
          >
            <ChartBar size={20} />
            Statistics
          </button>
          
          <button
            onClick={() => setActiveView("users")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
              activeView === "users"
                ? "bg-blue-100 text-blue-600"
                : "hover:bg-gray-100"
            } transition-colors`}
          >
            <User size={20} />
            Manage Users
          </button>
          
          <button
            onClick={() => setActiveView("doctors")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
              activeView === "doctors"
                ? "bg-blue-100 text-blue-600"
                : "hover:bg-gray-100"
            } transition-colors`}
          >
            <FirstAid size={20} />
            Manage Doctors
          </button>
          
          <button
            onClick={() => setActiveView("appointments")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
              activeView === "appointments"
                ? "bg-blue-100 text-blue-600"
                : "hover:bg-gray-100"
            } transition-colors`}
          >
            <Calendar size={20} />
            Manage Appointments
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
            Manage Payments
          </button>
          
          <button
            onClick={() => setActiveView("news")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
              activeView === "news"
                ? "bg-blue-100 text-blue-600"
                : "hover:bg-gray-100"
            } transition-colors`}
          >
            <Newspaper size={20} />
            Manage News
          </button>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 flex flex-col gap-2">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left bg-red-100 hover:bg-red-400 hover:text-white text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-red-600"></div>
                Signing Out...
              </>
            ) : (
              <>
                <SignOut size={20} />
                Sign Out
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
  const [adminData, setAdminData] = useState(null); // TAMBAHAN: untuk data admin
  const router = useRouter();

  // ============================================
  // FETCH FUNCTIONS - DIPERBAIKI
  // ============================================
  const fetchUsers = async () => {
    try {
      const q = query(collection(db, "users"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt || Date.now()),
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  };

  const fetchDoctors = async () => {
    try {
      const q = query(collection(db, "users"), where("role", "==", "doctor"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        uid: doc.id,
        id: doc.id, // TAMBAHAN: untuk konsistensi
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt || Date.now()),
      }));
    } catch (error) {
      console.error("Error fetching doctors:", error);
      return [];
    }
  };

  const fetchAppointments = async () => {
    try {
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
    } catch (error) {
      console.error("Error fetching appointments:", error);
      return [];
    }
  };

  const fetchNews = async () => {
    try {
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
            publishedAt: data.publishedAt?.toDate?.() || null, // TAMBAHAN: untuk published date
          };
        })
        .sort((a, b) => (b.date || b.createdAt || 0) - (a.date || a.createdAt || 0));
    } catch (error) {
      console.error("Error fetching news:", error);
      return [];
    }
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("🔄 Fetching all admin data...");
      
      const [usersData, doctorsData, appointmentsData, paymentsData, newsData] = await Promise.all([
        fetchUsers(),
        fetchDoctors(),
        fetchAppointments(),
        fetchPayments(),
        fetchNews(),
      ]);

      console.log("📊 Data fetched:", {
        users: usersData.length,
        doctors: doctorsData.length,
        appointments: appointmentsData.length,
        payments: paymentsData.length,
        news: newsData.length,
      });

      setUsers(usersData);
      setDoctors(doctorsData);
      setAppointments(appointmentsData);
      setPayments(paymentsData);
      setNews(newsData);
    } catch (err) {
      console.error("❌ Error fetching admin data:", err);
      setError("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Role checking dan redirect
            if (userData.role === "admin") {
              setUser(currentUser);
              
              // Set admin data untuk sidebar
              setAdminData({
                uid: currentUser.uid,
                name: userData.name || "",
                email: userData.email || "",
                photoUrl: userData.photoUrl || "",
                role: userData.role,
              });
              
              // Fetch semua data setelah auth berhasil
              await fetchAllData();
            } else if (userData.role === "user") {
              router.push("/dashboard/patient");
              return;
            } else if (userData.role === "doctor") {
              router.push("/dashboard/doctor");
              return;
            } else {
              // Role tidak dikenal
              router.push("/");
              return;
            }
          } else {
            // User document tidak ada
            router.push("/");
            return;
          }
        } catch (err) {
          console.error("Error checking user role:", err);
          router.push("/sign-in");
          return;
        }
      } else {
        // User tidak login
        router.push("/sign-in");
        return;
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]); 

  const LoadingIndicator = () => (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
      </div>
    </div>
  );

  const ErrorDisplay = ({ message, onRetry }) => (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="text-center bg-white p-8 rounded-xl shadow-md">
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Data</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );

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
            onRefresh={fetchAllData}
          />
        );
      case "users":
        return (
          <UserManagement 
            users={users.filter(u => u.role !== "doctor")} 
            onRefresh={fetchAllData} 
          />
        );
      case "doctors":
        return (
          <DoctorManagement 
            doctors={doctors} 
            onRefresh={fetchAllData} 
          />
        );
      case "appointments":
        return (
          <AppointmentManagement
            appointments={appointments}
            doctors={doctors}
            users={users}
            onRefresh={fetchAllData}
          />
        );
      case "payments":
        return (
          <PaymentManagement 
            payments={payments} 
            onRefresh={fetchAllData}
          />
        );
      case "news":
        return (
          <NewsManagement 
            news={news} 
            onRefresh={fetchAllData} 
          />
        );
      default:
        return (
          <StatisticsDashboard
            users={users}
            appointments={appointments}
            payments={payments}
            doctors={doctors}
            onRefresh={fetchAllData}
          />
        );
    }
  };

  if (!user && loading) {
    return <LoadingIndicator />;
  }

  if (error && !user) {
    return <ErrorDisplay message={error} onRetry={fetchAllData} />;
  }

  return (
    <div className="min-h-screen text-black bg-blue-50">
      {/* Sidebar Component */}
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView}
        adminData={adminData}
      />

      {/* Main Content Area - PERBAIKAN LAYOUT */}
      <div className="ml-64 p-8">
        {renderActiveView()}
      </div>
    </div>
  );
}




