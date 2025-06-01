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
  news = [],
}) => {
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
    });
  };

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
  const totalDoctors = users.filter((u) => u?.role === "doctor").length;
  const totalAdmins = users.filter((u) => u?.role === "admin").length;
  const onlineUsers = users.filter((u) => u?.status === "online").length;
  const offlineUsers = users.filter((u) => u?.status === "offline").length;

  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter(
    (a) => a?.status === "completed"
  ).length;
  const pendingAppointments = appointments.filter(
    (a) => a?.status === "confirmed"
  ).length;

  const totalRevenue = payments.reduce(
    (sum, payment) => sum + (payment?.amount || 0),
    0
  );
  const completedPayments = payments.filter(
    (p) => p?.status === "completed"
  ).length;

  const totalArticles = news.length;

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
            change: "2 available now",
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
                <span className="text-sm font-medium">{offlineUsers}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-gray-600 h-2.5 rounded-full"
                  style={{
                    width: `${Math.round(
                      (offlineUsers / users.length) * 100
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
                <span className="text-sm font-medium">Pending</span>
                <span className="text-sm font-medium">
                  {pendingAppointments}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-yellow-400 h-2.5 rounded-full"
                  style={{
                    width: `${Math.round(
                      (pendingAppointments / totalAppointments) * 100
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
            {appointments.slice(0, 3).map((app) => {
              const patient = users.find((u) => u.id === app.patientId);
              const doctor = users.find((u) => u.id === app.doctorId);
              return (
                <div
                  key={app.id}
                  className="border-b pb-2 last:border-0 last:pb-0"
                >
                  <p className="font-medium">{patient?.name || "Unknown"}</p>
                  <p className="text-sm text-gray-600">
                    with {doctor?.name || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(app.date)} at {app.time || "Unknown"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-4">Recent Payments</h3>
          <div className="space-y-3">
            {payments.slice(0, 3).map((payment) => {
              const patient = users.find((u) => u.id === payment.patientId);
              return (
                <div
                  key={payment.id}
                  className="border-b pb-2 last:border-0 last:pb-0"
                >
                  <p className="font-medium">{patient?.name || "Unknown"}</p>
                  <p className="text-sm text-gray-600">
                    {formatRupiah(payment.amount)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(payment.date)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Articles */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-4">Recent Articles</h3>
          <div className="space-y-3">
            {news.slice(0, 3).map((article) => (
              <div
                key={article.id}
                className="border-b pb-2 last:border-0 last:pb-0"
              >
                <p className="font-medium">{article.title || "Untitled"}</p>
                <p className="text-sm text-gray-600">
                  {article.author || "Unknown"}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(article.date)}
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
      id: user.id,
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
        status: editData.status,
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

  const handleStatusChange = async (userId) => {
    if (!userId) return;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const user = users.find((u) => u.id === userId);
      if (!user) return;

      await updateDoc(doc(db, "users", userId), {
        status: user.status === "online" ? "offline" : "online",
        updatedAt: serverTimestamp(),
      });
      await onRefresh();
    } catch (error) {
      console.error("Error updating user status:", error);
      setUpdateError("Failed to update user status.");
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
                Status
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
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
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
                        user.status === "online"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.status || "offline"}
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
                    <button
                      onClick={() => handleStatusChange(user.id)}
                      className={`${
                        user.status === "online"
                          ? "text-red-600 hover:text-red-900"
                          : "text-green-600 hover:text-green-900"
                      }`}
                      disabled={isUpdating}
                    >
                      {user.status === "online" ? "Set Offline" : "Set Online"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
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

// Komponen AppointmentManagement
const AppointmentManagement = ({ appointments = [], users = [], onRefresh }) => {
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = dateStr?.toDate?.() || new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

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
          const patient = users.find((u) => u.id === appointment.patientId);
          const doctor = users.find((u) => u.id === appointment.doctorId);

          await addDoc(collection(db, "payments"), {
            appointmentId: appointmentId,
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
            patient: patient?.name || "Unknown",
            doctor: doctor?.name || "Unknown",
            amount: appointment.price || 0,
            status: "completed",
            date: serverTimestamp(),
            createdAt: serverTimestamp(),
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
      case "waiting":
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
            const patient = users.find(u => u.id === appointment.patientId);
            const doctor = users.find(u => u.id === appointment.doctorId);
            
            return (
              <div key={appointment.id} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {patient?.name || "Unknown"} with{" "}
                      {doctor?.name || "Unknown"}
                    </h3>
                    <p className="text-gray-600">
                      {formatDate(appointment.date)} at{" "}
                      {appointment.time || "Unknown"}
                    </p>
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
                  {users.find(u => u.id === selectedAppointment.patientId)?.name || "Unknown"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Doctor</p>
                <p className="font-medium">
                  {users.find(u => u.id === selectedAppointment.doctorId)?.name || "Unknown"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-medium">
                  {formatDate(selectedAppointment.date)} at{" "}
                  {selectedAppointment.time || "Unknown"}
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
const PaymentManagement = ({ payments = [], users = [] }) => {
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
    });
  };

  const totalRevenue = payments.reduce(
    (sum, payment) => sum + (payment?.amount || 0),
    0
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Payments</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold">{formatRupiah(totalRevenue)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-500">Completed Payments</p>
          <p className="text-2xl font-bold">
            {payments.filter((p) => p?.status === "completed").length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-500">Pending Payments</p>
          <p className="text-2xl font-bold">
            {payments.filter((p) => p?.status === "pending").length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment ID
              </th>
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
              payments.map((payment) => {
                const patient = users.find((u) => u.id === payment.patientId);
                const doctor = users.find((u) => u.id === payment.doctorId);
                return (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">
                        {payment.id.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {patient?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doctor?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatRupiah(payment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(payment.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          payment.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {payment.status || "Unknown"}
                      </span>
                    </td>
                  </tr>
                );
              })
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

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = dateStr?.toDate?.() || new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

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
                <span className="mr-3">Logout</span>
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
      const [usersData, appointmentsData, paymentsData, newsData] =
        await Promise.all([
          fetchUsers(),
          fetchAppointments(),
          fetchPayments(),
          fetchNews(),
        ]);

      setUsers(usersData);
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

  const fetchAppointments = async () => {
    const q = query(collection(db, "appointments"));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate?.() || new Date(data.date || Date.now()),
        };
      })
      .sort((a, b) => (b.date || 0) - (a.date || 0));
  };

  const fetchPayments = async () => {
    const q = query(collection(db, "payments"));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate?.() || new Date(data.date || Date.now()),
        };
      })
      .sort((a, b) => (b.date || 0) - (a.date || 0));
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
            setUser(currentUser);
            await fetchAllData();
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
            news={news}
          />
        );
      case "users":
        return <UserManagement users={users} onRefresh={fetchAllData} />;
      case "appointments":
        return (
          <AppointmentManagement
            appointments={appointments}
            users={users}
            onRefresh={fetchAllData}
          />
        );
      case "payments":
        return <PaymentManagement payments={payments} users={users} />
      case "news":
        return <NewsManagement news={news} onRefresh={fetchAllData} />;
      default:
        return (
          <StatisticsDashboard
            users={users}
            appointments={appointments}
            payments={payments}
            news={news}
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