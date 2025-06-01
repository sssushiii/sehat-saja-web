"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { CaretRight, House, User, Calendar, CurrencyDollar, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { auth, db } from "../../../lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState("dashboard");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);

  // Fetch all data on component mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch admin data
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData({ id: user.uid, ...userDoc.data() });
        }

        // Fetch all users data
        await fetchAllData();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch all users
      const usersQuery = query(collection(db, "users"));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersData);

      // Fetch doctors (users with role 'doctor')
      const doctorsData = usersData.filter(user => user.role === 'doctor');
      setDoctors(doctorsData);

      // Fetch appointments
      const appointmentsQuery = query(collection(db, "appointments"));
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      const appointmentsData = appointmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppointments(appointmentsData);

      // Fetch payments
      const paymentsQuery = query(collection(db, "payments"));
      const paymentsSnapshot = await getDocs(paymentsQuery);
      const paymentsData = paymentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPayments(paymentsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Dashboard View
  const DashboardView = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
          <p className="text-3xl font-bold mt-2">{users.length}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Total Doctors</h3>
          <p className="text-3xl font-bold mt-2">{doctors.length}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Appointments</h3>
          <p className="text-3xl font-bold mt-2">{appointments.length}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
          <p className="text-3xl font-bold mt-2">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(
              payments.reduce((total, payment) => total + (payment.amount || 0), 0)
            )}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Recent Appointments</h2>
        {appointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Patient</th>
                  <th className="text-left py-3 px-4">Doctor</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Time</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.slice(0, 5).map(appointment => (
                  <tr key={appointment.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{appointment.patientName}</td>
                    <td className="py-3 px-4">{appointment.doctorName}</td>
                    <td className="py-3 px-4">{new Date(appointment.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{appointment.time}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No appointments found</p>
        )}
      </div>
    </div>
  );

  // Users Management View
  const UsersManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter(user =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRoleChange = async (userId, newRole) => {
      try {
        await updateDoc(doc(db, "users", userId), { role: newRole });
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ));
        alert('User role updated successfully');
      } catch (error) {
        console.error('Error updating role:', error);
        alert('Failed to update role');
      }
    };

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Users Management</h1>
        
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Phone</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 flex items-center">
                      <img 
                        src={user.photoUrl || "/assets/default-profile.jpg"} 
                        alt={user.name} 
                        className="w-8 h-8 rounded-full mr-3"
                        onError={(e) => {
                          e.target.src = "/assets/default-profile.jpg";
                        }}
                      />
                      {user.name}
                    </td>
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4">{user.phone || '-'}</td>
                    <td className="py-3 px-4">
                      <select
                        value={user.role || 'user'}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option value="admin">Admin</option>
                        <option value="doctor">Doctor</option>
                        <option value="user">User</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <button className="text-blue-600 hover:text-blue-800 mr-3">View</button>
                      <button className="text-red-600 hover:text-red-800">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Doctors Management View
  const DoctorsManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredDoctors = doctors.filter(doctor =>
      doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Doctors Management</h1>
        
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search doctors..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Add New Doctor
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map(doctor => (
              <div key={doctor.id} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-center mb-4">
                  <img 
                    src={doctor.photoUrl || "/assets/default-profile.jpg"} 
                    alt={doctor.name} 
                    className="w-16 h-16 rounded-full mr-4"
                    onError={(e) => {
                      e.target.src = "/assets/default-profile.jpg";
                    }}
                  />
                  <div>
                    <h3 className="font-semibold">{doctor.name}</h3>
                    <p className="text-sm text-gray-600">{doctor.specialty || 'General Practitioner'}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Email:</span> {doctor.email}</p>
                  <p><span className="font-medium">Phone:</span> {doctor.phone || '-'}</p>
                  <p><span className="font-medium">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      doctor.status === 'active' ? 'bg-green-100 text-green-800' :
                      doctor.status === 'inactive' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {doctor.status || 'active'}
                    </span>
                  </p>
                </div>
                <div className="mt-4 flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">View Profile</button>
                  <button className="text-green-600 hover:text-green-800 text-sm">Edit</button>
                  <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Appointments Management View
  const AppointmentsManagement = () => {
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredAppointments = appointments.filter(appointment => 
      statusFilter === 'all' || appointment.status === statusFilter
    );

    const handleStatusChange = async (appointmentId, newStatus) => {
      try {
        await updateDoc(doc(db, "appointments", appointmentId), { status: newStatus });
        setAppointments(appointments.map(app => 
          app.id === appointmentId ? { ...app, status: newStatus } : app
        ));
        alert('Appointment status updated successfully');
      } catch (error) {
        console.error('Error updating appointment:', error);
        alert('Failed to update appointment');
      }
    };

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Appointments Management</h1>
        
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2 rounded-lg ${statusFilter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('confirmed')}
                className={`px-4 py-2 rounded-lg ${statusFilter === 'confirmed' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Confirmed
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-4 py-2 rounded-lg ${statusFilter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Completed
              </button>
              <button
                onClick={() => setStatusFilter('cancelled')}
                className={`px-4 py-2 rounded-lg ${statusFilter === 'cancelled' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Cancelled
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Patient</th>
                  <th className="text-left py-3 px-4">Doctor</th>
                  <th className="text-left py-3 px-4">Date & Time</th>
                  <th className="text-left py-3 px-4">Complaint</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map(appointment => (
                  <tr key={appointment.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{appointment.patientName}</td>
                    <td className="py-3 px-4">{appointment.doctorName}</td>
                    <td className="py-3 px-4">
                      {new Date(appointment.date).toLocaleDateString()} at {appointment.time}
                    </td>
                    <td className="py-3 px-4">{appointment.complaint || '-'}</td>
                    <td className="py-3 px-4">
                      <select
                        value={appointment.status}
                        onChange={(e) => handleStatusChange(appointment.id, e.target.value)}
                        className={`border rounded px-2 py-1 text-sm ${
                          appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <button className="text-blue-600 hover:text-blue-800 mr-3">View</button>
                      <button className="text-red-600 hover:text-red-800">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Payments Management View
  const PaymentsManagement = () => {
    const [statusFilter, setStatusFilter] = useState('all');

    const filteredPayments = payments.filter(payment => 
      statusFilter === 'all' || payment.status === statusFilter
    );

    const formatRupiah = (value) =>
      new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(value);

    const handleStatusChange = async (paymentId, newStatus) => {
      try {
        await updateDoc(doc(db, "payments", paymentId), { status: newStatus });
        setPayments(payments.map(payment => 
          payment.id === paymentId ? { ...payment, status: newStatus } : payment
        ));
        alert('Payment status updated successfully');
      } catch (error) {
        console.error('Error updating payment:', error);
        alert('Failed to update payment');
      }
    };

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Payments Management</h1>
        
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg ${statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-4 py-2 rounded-lg ${statusFilter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-4 py-2 rounded-lg ${statusFilter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Completed
              </button>
              <button
                onClick={() => setStatusFilter('failed')}
                className={`px-4 py-2 rounded-lg ${statusFilter === 'failed' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                Failed
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Payment ID</th>
                  <th className="text-left py-3 px-4">Patient</th>
                  <th className="text-left py-3 px-4">Appointment</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Method</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map(payment => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{payment.id.substring(0, 8)}...</td>
                    <td className="py-3 px-4">{payment.patientName || '-'}</td>
                    <td className="py-3 px-4">
                      {payment.appointmentId ? payment.appointmentId.substring(0, 8) + '...' : '-'}
                    </td>
                    <td className="py-3 px-4">{formatRupiah(payment.amount)}</td>
                    <td className="py-3 px-4">{payment.method || '-'}</td>
                    <td className="py-3 px-4">
                      {payment.timestamp ? new Date(payment.timestamp).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={payment.status}
                        onChange={(e) => handleStatusChange(payment.id, e.target.value)}
                        className={`border rounded px-2 py-1 text-sm ${
                          payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <button className="text-blue-600 hover:text-blue-800 mr-3">View</button>
                      <button className="text-red-600 hover:text-red-800">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Account Settings View
  const AccountSettings = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ ...userData });
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleSave = async () => {
      try {
        await updateDoc(doc(db, "users", userData.id), {
          name: editData.name,
          phone: editData.phone
        });
        setUserData(editData);
        setIsEditing(false);
        alert('Profile updated successfully');
      } catch (error) {
        console.error('Error updating profile:', error);
        alert('Failed to update profile');
      }
    };

    const handlePasswordChange = () => {
      alert("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    };

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Account Settings</h1>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          {!isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Name</label>
                <p className="font-medium">{userData?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <p className="font-medium">{userData?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Phone</label>
                <p className="font-medium">{userData?.phone || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Role</label>
                <p className="font-medium capitalize">{userData?.role}</p>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => {
                    setEditData({ ...userData });
                    setIsEditing(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={editData.name || ''}
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={editData.phone || ''}
                  onChange={(e) => setEditData({...editData, phone: e.target.value})}
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
          )}
        </div>
  
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
            <div className="pt-2">
              <button
                onClick={handlePasswordChange}
                disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
                className={`px-4 py-2 rounded ${
                  currentPassword && newPassword && newPassword === confirmPassword
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderActiveView = () => {
    if (loading) return <div className="text-center py-8">Loading...</div>;
    
    switch(activeView) {
      case "dashboard": return <DashboardView />;
      case "users": return <UsersManagement />;
      case "doctors": return <DoctorsManagement />;
      case "appointments": return <AppointmentsManagement />;
      case "payments": return <PaymentsManagement />;
      case "account": return <AccountSettings />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-blue-50 text-black">
      <div className="flex w-full relative">
        {/* Sticky Sidebar */}
        <div className="bg-white shadow-md p-6 w-[25%] min-h-screen fixed top-0 left-0 z-10">
          <div className="flex items-center mb-8 flex-col">
            <img 
              src={userData?.photoUrl || "/assets/default-profile.jpg"} 
              className="rounded-full aspect-square w-[35%] mb-3" 
              alt="Admin Profile"
              onError={(e) => {
                e.target.src = "/assets/default-profile.jpg";
              }}
            />
            <div className="w-full text-center">
              <h2 className="text-xl font-semibold">{userData?.name || 'Admin'}</h2>
              <p className="capitalize">{userData?.role}</p>
            </div>
          </div>
          
          <nav className="space-y-2">
            <button
              onClick={() => setActiveView("dashboard")}
              className={`flex items-center w-full text-left p-3 rounded-lg transition ${
                activeView === "dashboard" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
              }`}
            > 
              <House size={20} className="mr-3"/>
              Dashboard
            </button>
            
            <button
              onClick={() => setActiveView("users")}
              className={`flex items-center w-full text-left p-3 rounded-lg transition ${
                activeView === "users" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
              }`}
            >
              <UsersThree size={20} className="mr-3"/>
              Users Management
            </button>
            
            <button
              onClick={() => setActiveView("doctors")}
              className={`flex items-center w-full text-left p-3 rounded-lg transition ${
                activeView === "doctors" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
              }`}
            >
              <User size={20} className="mr-3"/>
              Doctors Management
            </button>
            
            <button
              onClick={() => setActiveView("appointments")}
              className={`flex items-center w-full text-left p-3 rounded-lg transition ${
                activeView === "appointments" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
              }`}
            >
              <Calendar size={20} className="mr-3"/>
              Appointments
            </button>
            
            <button
              onClick={() => setActiveView("payments")}
              className={`flex items-center w-full text-left p-3 rounded-lg transition ${
                activeView === "payments" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
              }`}
            >
              <CurrencyDollar size={20} className="mr-3"/>
              Payments
            </button>
            
            <button
              onClick={() => setActiveView("account")}
              className={`flex items-center w-full text-left p-3 rounded-lg transition ${
                activeView === "account" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
              }`}
            >
              <User size={20} className="mr-3"/>
              Account Settings
            </button>
          </nav>
          
          <Link 
            href="/" 
            className="w-full mt-16 text-white p-3 font-medium rounded-lg bg-blue-500 hover:bg-blue-700 transition-all duration-100 flex items-center justify-center"
          >
            <House size={20} className="mr-3"/>
            Back to Home
          </Link>
        </div>

        <div className="w-[25%]"></div>

        <div className="w-[75%] p-8">
          {renderActiveView()}
        </div>
      </div>
    </div>
  );
}


