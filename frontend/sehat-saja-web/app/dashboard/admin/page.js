"use client";

import { useState } from "react";
import { MagnifyingGlass, User, Calendar, CurrencyDollar, Newspaper } from "@phosphor-icons/react/dist/ssr";
import { Article } from "../../data/articles";

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState("users");
  
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Dr. Mulyadi Akbar",
      role: "doctor",
      email: "mulyadi@gmail.com",
      status: "online"
    },
    {
      id: 2,
      name: "Ahmad Dimas",
      role: "patient",
      email: "ahmaddimas@gmail.com",
      status: "offline"
    },
    {
      id: 3,
      name: "Admin Utama",
      role: "admin",
      email: "admin@gmail.com",
      status: "online"
    }
  ]);

  const [appointments, setAppointments] = useState([
    {
      id: 1,
      patient: "Ahmad Dimas",
      doctor: "Dr. Hakim Ismail",
      date: "2025-04-15",
      time: "10:00",
      status: "confirmed"
    },
    {
      id: 2,
      patient: "Ninik Mulyani",
      doctor: "Dr. Mulyadi Akbar",
      date: "2025-04-16",
      time: "14:30",
      status: "waiting"
    }
  ]);

  const [payments, setPayments] = useState([
    {
      id: "PAY-001",
      patient: "Ahmad Dimas",
      doctor: "Dr. Hakim Ismail",
      amount: 150000,
      date: "2025-04-10",
      status: "completed"
    },
    {
      id: "PAY-002",
      patient: "Ninik Mulyani",
      doctor: "Dr. Mulyadi Akbar Denüst",
      amount: 200000,
      date: "2025-04-12",
      status: "pending"
    }
  ]);

  const [news, setNews] = useState(Article);

  const formatRupiah = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const UserManagement = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [category, setCategory] = useState("all");
    const [tempSearchTerm, setTempSearchTerm] = useState("");
    const [tempCategory, setTempCategory] = useState("all");
    const [isEditing, setIsEditing] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editData, setEditData] = useState({});
  
    const handleEdit = (user) => {
      setSelectedUser(user);
      setEditData({ ...user });
      setIsEditing(true);
    };
  
    const handleSave = () => {
      const updatedUsers = users.map((u) =>
        u.id === editData.id ? { ...editData } : u
      );
      setUsers(updatedUsers);
      setIsEditing(false);
      setSelectedUser(null);
    };
  
    const handleStatusChange = (userId) => {
      const updatedUsers = users.map((u) =>
        u.id === userId
          ? {
              ...u,
              status: u.status === "online" ? "offline" : "online"
            }
          : u
      );
      setUsers(updatedUsers);
    };
  
    const handleSubmit = (e) => {
      e.preventDefault();
      setSearchTerm(tempSearchTerm);
      setCategory(tempCategory);
    };
  
    const filteredUsers = users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = category === "all" || user.role === category;
      return matchesSearch && matchesCategory;
    });
  
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Manage Users</h1>
  
        <div className="bg-white p-6 rounded-xl shadow-sm">
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
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                <MagnifyingGlass size={20} />
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
                <option value="patient">Patient</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </form>
        </div>
  
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.status === "online"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
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
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
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
                  >
                    <option value="doctor">Doctor</option>
                    <option value="patient">Patient</option>
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
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
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

  const AppointmentManagement = () => {
    const [selectedAppointment, setSelectedAppointment] = useState(null);
  
    const handleStatusChange = (appointmentId, newStatus) => {
      const updatedAppointments = appointments.map(a => 
        a.id === appointmentId ? { ...a, status: newStatus } : a
      );
      setAppointments(updatedAppointments);
      
      if (selectedAppointment && selectedAppointment.id === appointmentId) {
        setSelectedAppointment({ ...selectedAppointment, status: newStatus });
      }
    };
  
    const getStatusColor = (status) => {
      switch (status) {
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
        
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{appointment.patient} with {appointment.doctor}</h3>
                  <p className="text-gray-600">{formatDate(appointment.date)} at {appointment.time}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                    {appointment.status}
                  </span>
                  <button
                    onClick={() => setSelectedAppointment(appointment)}
                    className="text-blue-600 hover:text-blue-800"
                    aria-label="View details"
                  >
                    Details
                  </button>
                </div>
              </div>
              
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => handleStatusChange(appointment.id, "cancelled")}
                  disabled={appointment.status === "cancelled"}
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
                  disabled={appointment.status === "completed" || appointment.status === "cancelled"}
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
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Patient</p>
                  <p className="font-medium">{selectedAppointment.patient}</p>
                </div>
                
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
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`font-medium px-2 py-1 inline-block rounded ${getStatusColor(selectedAppointment.status)}`}>
                    {selectedAppointment.status}
                  </p>
                </div>
                
                <div className="pt-4 flex space-x-3">
                  <button
                    onClick={() => {
                      handleStatusChange(selectedAppointment.id, "cancelled");
                      setSelectedAppointment(null);
                    }}
                    disabled={selectedAppointment.status === "cancelled"}
                    className={`flex-1 py-2 rounded ${
                      selectedAppointment.status === "cancelled"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                  >
                    Cancel Appointment
                  </button>
                  <button
                    onClick={() => {
                      handleStatusChange(selectedAppointment.id, "completed");
                      setSelectedAppointment(null);
                    }}
                    disabled={selectedAppointment.status === "completed" || selectedAppointment.status === "cancelled"}
                    className={`flex-1 py-2 rounded ${
                      selectedAppointment.status === "completed"
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : selectedAppointment.status === "cancelled"
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    Mark as Complete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const PaymentManagement = () => {
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
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
                  <td className="px-6 py-4 whitespace-nowrap">{payment.patient}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{payment.doctor}</td>
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

  const NewsManagement = () => {
    const [newArticle, setNewArticle] = useState({
      title: "",
      category: "",
      content: "",
      image: null,
      labels: [],
      author: "Admin",
      date: new Date().toISOString().split('T')[0]
    });
    const [isCreating, setIsCreating] = useState(false);
    const [editingArticle, setEditingArticle] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    const handleImageChange = (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
          if (isEditing) {
            setEditingArticle({...editingArticle, image: reader.result});
          } else {
            setNewArticle({...newArticle, image: reader.result});
          }
        };
        reader.readAsDataURL(file);
      }
    };

    const handleCreate = () => {
      const newId = Math.max(...news.map(n => n.id)) + 1;
      setNews([...news, {
        id: newId,
        title: newArticle.title,
        image: newArticle.image || "/assets/default-news.jpg",
        labels: newArticle.labels,
        description: newArticle.content.substring(0, 100) + "...",
        author: newArticle.author,
        date: newArticle.date,
        content: [newArticle.content]
      }]);
      setNewArticle({ 
        title: "", 
        category: "", 
        content: "", 
        image: null,
        labels: [],
        author: "Admin",
        date: new Date().toISOString().split('T')[0]
      });
      setIsCreating(false);
    };

    const handleEdit = (article) => {
      setEditingArticle({
        ...article,
        content: article.content.join("\n\n")
      });
      setIsEditing(true);
    };

    const handleUpdate = () => {
      const updatedNews = news.map(n => 
        n.id === editingArticle.id ? {
          ...n,
          title: editingArticle.title,
          image: editingArticle.image || n.image,
          labels: editingArticle.labels,
          description: editingArticle.content.substring(0, 100) + "...",
          content: [editingArticle.content]
        } : n
      );
      setNews(updatedNews);
      setIsEditing(false);
      setEditingArticle(null);
    };

    const handleDelete = (articleId) => {
      if (window.confirm("Are you sure you want to delete this article?")) {
        setNews(news.filter(n => n.id !== articleId));
      }
    };

    const handleLabelChange = (e) => {
      const value = e.target.value;
      if (value && !newArticle.labels.includes(value)) {
        if (isEditing) {
          setEditingArticle({...editingArticle, labels: [...editingArticle.labels, value]});
        } else {
          setNewArticle({...newArticle, labels: [...newArticle.labels, value]});
        }
      }
    };

    const removeLabel = (labelToRemove) => {
      if (isEditing) {
        setEditingArticle({
          ...editingArticle,
          labels: editingArticle.labels.filter(label => label !== labelToRemove)
        });
      } else {
        setNewArticle({
          ...newArticle,
          labels: newArticle.labels.filter(label => label !== labelToRemove)
        });
      }
    };

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Manage News</h1>
        
        <div className="flex justify-end">
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create New Article
          </button>
        </div>
        
        {/* News List */}
        <div className="space-y-4">
          {news.map((article) => (
            <div key={article.id} className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <img 
                    src={article.image} 
                    alt={article.title}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{article.title}</h3>
                  <p className="text-gray-600">
                    {formatDate(article.date)} • {article.labels.join(", ")}
                  </p>
                  <p className="mt-2 text-gray-700">{article.description}</p>
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <button 
                  onClick={() => handleEdit(article)}
                  className="px-2 py-1 text-sm rounded bg-blue-100 text-blue-800 hover:bg-blue-200"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(article.id)}
                  className="px-2 py-1 text-sm rounded bg-red-100 text-red-800 hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {isCreating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Create New Article</h2>
                <button
                  onClick={() => setIsCreating(false)}
                  className="text-gray-500 hover:text-gray-700"
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
                    onChange={(e) => setNewArticle({...newArticle, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full p-2 border border-gray-300 rounded"
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
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 p-2 border border-gray-300 rounded"
                      onChange={handleLabelChange}
                      defaultValue=""
                    >
                        <option value="all">All</option>
                        <option value="medication">Medication</option>
                        <option value="nursing">Nursing</option>
                        <option value="emergency">Emergency</option>
                        <option value="training">Training</option>
                        <option value="education">Education</option>
                        <option value="patient care">Patient Care</option>
                        <option value="hygiene">Hygiene</option>
                        <option value="technology">Technology</option>
                        <option value="innovation">Innovation</option>
                        <option value="mental health">Mental Health</option>
                        <option value="support">Support</option>
                        <option value="rural">Rural</option>
                        <option value="access">Access</option>
                        <option value="diversity">Diversity</option>
                        <option value="ethics">Ethics</option>
                        <option value="chronic illness">Chronic Illness</option>
                        <option value="long-term care">Long-term Care</option>
                        <option value="telehealth">Telehealth</option>
                        <option value="future">Future</option>
                        <option value="nutrition">Nutrition</option>
                        <option value="decision making">Decision Making</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newArticle.labels.map(label => (
                      <span key={label} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center">
                        {label}
                        <button 
                          type="button" 
                          onClick={() => removeLabel(label)}
                          className="ml-1 text-blue-600 hover:text-blue-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Content</label>
                  <textarea
                    rows={6}
                    className="w-full p-2 border border-gray-300 rounded"
                    value={newArticle.content}
                    onChange={(e) => setNewArticle({...newArticle, content: e.target.value})}
                  ></textarea>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isEditing && editingArticle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Edit Article</h2>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-gray-500 hover:text-gray-700"
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
                    onChange={(e) => setEditingArticle({...editingArticle, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full p-2 border border-gray-300 rounded"
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
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 p-2 border border-gray-300 rounded"
                      onChange={handleLabelChange}
                      defaultValue=""
                    >
                      <option value="" disabled>Select category</option>
                      <option value="Medication">Medication</option>
                      <option value="Nursing">Nursing</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Training">Training</option>
                      <option value="Education">Education</option>
                      <option value="Patient Care">Patient Care</option>
                      <option value="Hygiene">Hygiene</option>
                      <option value="Technology">Technology</option>
                      <option value="Innovation">Innovation</option>
                      <option value="Mental Health">Mental Health</option>
                      <option value="Support">Support</option>
                      <option value="Rural">Rural</option>
                      <option value="Access">Access</option>
                      <option value="Diversity">Diversity</option>
                      <option value="Ethics">Ethics</option>
                      <option value="Chronic Illness">Chronic Illness</option>
                      <option value="Long-term Care">Long-term Care</option>
                      <option value="Telehealth">Telehealth</option>
                      <option value="Future">Future</option>
                      <option value="Nutrition">Nutrition</option>
                      <option value="Decision Making">Decision Making</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {editingArticle.labels.map(label => (
                      <span key={label} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center">
                        {label}
                        <button 
                          type="button" 
                          onClick={() => removeLabel(label)}
                          className="ml-1 text-blue-600 hover:text-blue-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Content</label>
                  <textarea
                    rows={6}
                    className="w-full p-2 border border-gray-300 rounded"
                    value={editingArticle.content}
                    onChange={(e) => setEditingArticle({...editingArticle, content: e.target.value})}
                  ></textarea>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
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

  const renderActiveView = () => {
    switch(activeView) {
      case "users": return <UserManagement />;
      case "appointments": return <AppointmentManagement />;
      case "payments": return <PaymentManagement />;
      case "news": return <NewsManagement />;
      default: return <UserManagement />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-blue-50 text-black">
      <div className="flex w-full relative">
        <div className="bg-white shadow-md p-6 w-[25%] min-h-screen fixed top-0 left-0 z-10">
          <div className="flex items-center mb-8">
            <div className="w-full text-center">
              <h2 className="text-xl font-semibold">Admin Dashboard</h2>
            </div>
          </div>
          
          <nav className="space-y-2">
            <button
              onClick={() => setActiveView("users")}
              className={`flex items-center w-full text-left p-3 rounded-lg transition ${
                activeView === "users" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
              }`}
            >
              <User size={20} className="mr-3" />
              Manage Users
            </button>
            <button
              onClick={() => setActiveView("appointments")}
              className={`flex items-center w-full text-left p-3 rounded-lg transition ${
                activeView === "appointments" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
              }`}
            >
              <Calendar size={20} className="mr-3" />
              Manage Appointments
            </button>
            <button
              onClick={() => setActiveView("payments")}
              className={`flex items-center w-full text-left p-3 rounded-lg transition ${
                activeView === "payments" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
              }`}
            >
              <CurrencyDollar size={20} className="mr-3" />
              Manage Payments
            </button>
            <button
              onClick={() => setActiveView("news")}
              className={`flex items-center w-full text-left p-3 rounded-lg transition ${
                activeView === "news" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
              }`}
            >
              <Newspaper size={20} className="mr-3" />
              Manage News
            </button>
          </nav>
        </div>

        <div className="w-[25%]"></div>

        <div className="w-[75%] p-8">
          {renderActiveView()}
        </div>
      </div>
    </div>
  );
}