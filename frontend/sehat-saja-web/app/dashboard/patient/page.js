"use client";

import { useState } from "react";
import { User, Calendar, CurrencyDollar, Clock } from "@phosphor-icons/react/dist/ssr";

export default function PatientDashboard() {
  const [activeView, setActiveView] = useState("appointments");
  
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      doctor: "Dr. Mulyadi Akbar Denüst",
      date: "2025-04-15",
      time: "10:00",
      status: "confirmed",
      complaint: "Regular checkup"
    },
    {
      id: 2,
      doctor: "Dr. Hakim Ismail",
      date: "2025-04-20",
      time: "14:30",
      status: "completed",
      complaint: "Headache consultation"
    },
    {
      id: 3,
      doctor: "Dr. Sarah Wijaya",
      date: "2025-05-02",
      time: "09:15",
      status: "cancelled",
      complaint: "Annual physical exam"
    }
  ]);

  const [payments, setPayments] = useState([
    {
      id: "PAY-001",
      appointment: "Checkup with Dr. Mulyadi",
      amount: 40000,
      date: "2025-04-15",
      status: "completed",
      method: "BCA Virtual Account"
    },
    {
      id: "PAY-002",
      appointment: "Consultation with Dr. Hakim",
      amount: 45000,
      date: "2025-04-20",
      status: "completed",
      method: "GOPAY"
    },
    {
      id: "PAY-003",
      appointment: "Lab Test Package",
      amount: 45000,
      date: "2025-04-25",
      status: "pending",
      method: "Credit Card"
    }
  ]);

  const [accountData, setAccountData] = useState({
    name: "Ahmad Dimas",
    email: "ahmaddimas@gmail.com",
    phone: "+6281304128523",
    birthDate: "1999-07-15"
  });

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatRupiah = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);

  const AppointmentManagement = () => {
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    const handleCancel = (appointmentId) => {
      if (window.confirm("Are you sure you want to cancel this appointment?")) {
        const updated = appointments.map(a => 
          a.id === appointmentId ? { ...a, status: "cancelled" } : a
        );
        setAppointments(updated);
      }
    };

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Appointments</h1>
        
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">With {appointment.doctor}</h3>
                  <p className="text-gray-600">{formatDate(appointment.date)} at {appointment.time}</p>
                  <p className="mt-2 text-gray-700">Complaint: {appointment.complaint}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    appointment.status === "confirmed" ? "bg-blue-100 text-blue-800" :
                    appointment.status === "completed" ? "bg-green-100 text-green-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {appointment.status}
                  </span>
                  <button
                    onClick={() => setSelectedAppointment(appointment)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Details
                  </button>
                </div>
              </div>
              
              {appointment.status === "confirmed" && (
                <div className="mt-4">
                  <button
                    onClick={() => handleCancel(appointment.id)}
                    className="px-3 py-1 text-sm rounded bg-red-100 text-red-800 hover:bg-red-200"
                  >
                    Cancel Appointment
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Appointment Details</h2>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Doctor</p>
                  <p className="font-medium">{selectedAppointment.doctor}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium">
                    {formatDate(selectedAppointment.date)} at {selectedAppointment.time}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Complaint</p>
                  <p className="font-medium">{selectedAppointment.complaint}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`font-medium px-2 py-1 inline-block rounded ${
                    selectedAppointment.status === "confirmed" ? "bg-blue-100 text-blue-800" :
                    selectedAppointment.status === "completed" ? "bg-green-100 text-green-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {selectedAppointment.status}
                  </p>
                </div>
                
                <div className="pt-4">
                  <button
                    onClick={() => setSelectedAppointment(null)}
                    className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const PaymentHistory = () => {
    const totalSpent = payments.reduce((sum, payment) => sum + payment.amount, 0);

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Payment History</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-gray-500">Total Spent</p>
            <p className="text-2xl font-bold">{formatRupiah(totalSpent)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-gray-500">Completed Payments</p>
            <p className="text-2xl font-bold">
              {payments.filter(p => p.status === "completed").length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-gray-500">Pending Payments</p>
            <p className="text-2xl font-bold">
              {payments.filter(p => p.status === "pending").length}
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{payment.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{payment.appointment}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatRupiah(payment.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(payment.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      payment.status === "completed" ? "bg-green-100 text-green-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const AccountSettings = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ ...accountData });
  
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
  
    const handleSave = () => {
      setAccountData(editData);
      setIsEditing(false);
    };
  
    const handleChangePassword = () => {
      if (!currentPassword || !newPassword || !confirmPassword) {
        alert("Please fill in all password fields.");
        return;
      }
  
      if (newPassword !== confirmPassword) {
        alert("New passwords do not match.");
        return;
      }
  
      alert("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    };
  
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Account Settings</h1>
  
        {!isEditing ? (
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="space-y-4">
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
                <p className="font-medium">{accountData.phone}</p>
              </div>
  
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-medium">{formatDate(accountData.birthDate)}</p>
              </div>
  
              <div className="pt-4">
                <button
                  onClick={() => {
                    setEditData({ ...accountData });
                    setIsEditing(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                />
              </div>
  
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                />
              </div>
  
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={editData.phone}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                />
              </div>
  
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <input
                  type="date"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={editData.birthDate}
                  onChange={(e) => setEditData({ ...editData, birthDate: e.target.value })}
                />
              </div>
  
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
  
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Change Password</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Current Password</label>
              <input
                type="password"
                className="w-full p-2 border border-gray-300 hover:bg-blue-50/50 transition-all duration-200 outline-none focus:border-blue-500 rounded"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <input
                type="password"
                className="w-full p-2 border border-gray-300 hover:bg-blue-50/50 transition-all duration-200 outline-none focus:border-blue-500 rounded"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Confirm New Password</label>
              <input
                type="password"
                className="w-full p-2 border border-gray-300 hover:bg-blue-50/50 transition-all duration-200 outline-none focus:border-blue-500 rounded"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <div className="flex justify-end pt-4">
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Update Password
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  

  const renderActiveView = () => {
    switch(activeView) {
      case "appointments": return <AppointmentManagement />;
      case "payments": return <PaymentHistory />;
      case "account": return <AccountSettings />;
      default: return <AppointmentManagement />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-blue-50 text-black">
      <div className="flex w-full relative">
        <div className="bg-white shadow-md p-6 w-[25%] min-h-screen fixed top-0 left-0 z-10">
          <div className="flex items-center mb-8 flex-col">
            <img src="/assets/patient_1.jpg" className="rounded-full aspect-square w-[35%] mb-3" alt="" />
            <div className="w-full text-center">
              <h2 className="text-xl font-semibold">{accountData.name}</h2>
              <p className="text-gray-600">Patient</p>
            </div>
          </div>
          <div className="nav flex flex-col">
            <nav className="space-y-2">
                <button
                onClick={() => setActiveView("appointments")}
                className={`flex items-center w-full text-left p-3 rounded-lg transition ${
                    activeView === "appointments" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
                }`}
                >
                <Calendar size={20} className="mr-3" />
                My Appointments
                </button>
                <button
                onClick={() => setActiveView("payments")}
                className={`flex items-center w-full text-left p-3 rounded-lg transition ${
                    activeView === "payments" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
                }`}
                >
                <CurrencyDollar size={20} className="mr-3" />
                Payment History
                </button>
                <button
                onClick={() => setActiveView("account")}
                className={`flex items-center w-full text-left p-3 rounded-lg transition ${
                    activeView === "account" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
                }`}
                >
                <User size={20} className="mr-3" />
                Account Settings
                </button>
            </nav>
            <a href="/" className="w-full mt-16 text-white p-3 font-medium bg-blue-500">
                Home
            </a>
          </div>
        </div>

        <div className="w-[25%]"></div>

        <div className="w-[75%] p-8">
          {renderActiveView()}
        </div>
      </div>
    </div>
  );
}