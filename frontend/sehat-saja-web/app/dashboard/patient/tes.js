// "use client";

// import { useState, useEffect } from "react";
// import { User, Calendar, CurrencyDollar, House} from "@phosphor-icons/react/dist/ssr";
// import Link from "next/link";
// import { getAuth, onAuthStateChanged } from "firebase/auth";
// import { getFirestore, doc, getDoc } from "firebase/firestore";
// import { app } from "../../../lib/firebase";

// export default function PatientDashboard() {
//   const [activeView, setActiveView] = useState("appointments");
//   const [loading, setLoading] = useState(true);
//   const [userData, setUserData] = useState(null);
  
//   const [appointments, setAppointments] = useState([
//     {
//       id: 1,
//       doctor: "Dr. Mulyadi Akbar Denüst",
//       date: "2025-04-15",
//       time: "10:00",
//       status: "confirmed",
//       complaint: "Regular checkup"
//     },
//     {
//       id: 2,
//       doctor: "Dr. Hakim Ismail",
//       date: "2025-04-20",
//       time: "14:30",
//       status: "completed",
//       complaint: "Headache consultation"
//     },
//     {
//       id: 3,
//       doctor: "Dr. Sarah Wijaya",
//       date: "2025-05-02",
//       time: "09:15",
//       status: "cancelled",
//       complaint: "Annual physical exam"
//     }
//   ]);

//   const [payments, setPayments] = useState([
//     {
//       id: "PAY-001",
//       appointment: "Checkup with Dr. Mulyadi",
//       amount: 40000,
//       date: "2025-04-15",
//       status: "completed",
//       method: "BCA Virtual Account"
//     },
//     {
//       id: "PAY-002",
//       appointment: "Consultation with Dr. Hakim",
//       amount: 45000,
//       date: "2025-04-20",
//       status: "completed",
//       method: "GOPAY"
//     },
//     {
//       id: "PAY-003",
//       appointment: "Lab Test Package",
//       amount: 45000,
//       date: "2025-04-25",
//       status: "pending",
//       method: "Credit Card"
//     }
//   ]);

//   const [accountData, setAccountData] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     birthDate: "",
//     gender: ""
//   });

//   // Firebase authentication and user data fetching
//   useEffect(() => {
//     const auth = getAuth(app);
//     const db = getFirestore(app);
    
//     const unsubscribe = onAuthStateChanged(auth, async (user) => {
//       if (user) {
//         try {
//           // Get user document from Firestore
//           const userDocRef = doc(db, "users", user.uid);
//           const userDocSnap = await getDoc(userDocRef);
          
//           if (userDocSnap.exists()) {
//             const userFirestoreData = userDocSnap.data();
//             setUserData(userFirestoreData);
            
//             // Update account data with Firestore data
//             setAccountData({
//               name: userFirestoreData.name || user.displayName || "User",
//               email: userFirestoreData.email || user.email,
//               phone: userFirestoreData.phone || "",
//               birthDate: userFirestoreData.birthDate || "1999-07-15",
//               gender: userFirestoreData.gender || ""
//             });
//           } else {
//             console.log("No user document found!");
//           }
//         } catch (error) {
//           console.error("Error fetching user data:", error);
//         }
//       } else {
//         // User is signed out, redirect to login page
//         window.location.href = "/login";
//       }
//       setLoading(false);
//     });

//     // Cleanup subscription on unmount
//     return () => unsubscribe();
//   }, []);

//   const formatDate = (dateStr) => {
//     const date = new Date(dateStr);
//     return date.toLocaleDateString("id-ID", {
//       weekday: 'long',
//       day: 'numeric',
//       month: 'long',
//       year: 'numeric'
//     });
//   };

//   const formatRupiah = (value) =>
//     new Intl.NumberFormat("id-ID", {
//       style: "currency",
//       currency: "IDR",
//       minimumFractionDigits: 0,
//     }).format(value);

//   const AppointmentManagement = () => {
//     const [selectedAppointment, setSelectedAppointment] = useState(null);

//     const handleCancel = (appointmentId) => {
//       if (window.confirm("Are you sure you want to cancel this appointment?")) {
//         const updated = appointments.map(a => 
//           a.id === appointmentId ? { ...a, status: "cancelled" } : a
//         );
//         setAppointments(updated);
//       }
//     };

//     return (
//       <div className="space-y-6">
//         <h1 className="text-2xl font-bold">My Appointments</h1>
        
//         <div className="space-y-4">
//           {appointments.map((appointment) => (
//             <div key={appointment.id} className="bg-white p-6 rounded-xl shadow-sm">
//               <div className="flex justify-between items-start">
//                 <div>
//                   <h3 className="font-semibold text-lg">With {appointment.doctor}</h3>
//                   <p className="text-gray-600">{formatDate(appointment.date)} at {appointment.time}</p>
//                   <p className="mt-2 text-gray-700">Complaint: {appointment.complaint}</p>
//                 </div>
//                 <div className="flex items-center space-x-3">
//                   <span className={`px-3 py-1 rounded-full text-sm font-medium ${
//                     appointment.status === "confirmed" ? "bg-blue-100 text-blue-800" :
//                     appointment.status === "completed" ? "bg-green-100 text-green-800" :
//                     "bg-gray-100 text-gray-800"
//                   }`}>
//                     {appointment.status}
//                   </span>
//                   <button
//                     onClick={() => setSelectedAppointment(appointment)}
//                     className="text-blue-600 hover:text-blue-800"
//                   >
//                     Details
//                   </button>
//                 </div>
//               </div>
              
//               {appointment.status === "confirmed" && (
//                 <div className="mt-4">
//                   <button
//                     onClick={() => handleCancel(appointment.id)}
//                     className="px-3 py-1 text-sm rounded bg-red-100 text-red-800 hover:bg-red-200"
//                   >
//                     Cancel Appointment
//                   </button>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
        
//         {selectedAppointment && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white rounded-xl p-6 w-full max-w-md">
//               <div className="flex justify-between items-center mb-4">
//                 <h2 className="text-xl font-bold">Appointment Details</h2>
//                 <button
//                   onClick={() => setSelectedAppointment(null)}
//                   className="text-gray-500 hover:text-gray-700"
//                 >
//                   ✕
//                 </button>
//               </div>
              
//               <div className="space-y-3">
//                 <div>
//                   <p className="text-sm text-gray-500">Doctor</p>
//                   <p className="font-medium">{selectedAppointment.doctor}</p>
//                 </div>
                
//                 <div>
//                   <p className="text-sm text-gray-500">Date & Time</p>
//                   <p className="font-medium">
//                     {formatDate(selectedAppointment.date)} at {selectedAppointment.time}
//                   </p>
//                 </div>
                
//                 <div>
//                   <p className="text-sm text-gray-500">Complaint</p>
//                   <p className="font-medium">{selectedAppointment.complaint}</p>
//                 </div>
                
//                 <div>
//                   <p className="text-sm text-gray-500">Status</p>
//                   <p className={`font-medium px-2 py-1 inline-block rounded ${
//                     selectedAppointment.status === "confirmed" ? "bg-blue-100 text-blue-800" :
//                     selectedAppointment.status === "completed" ? "bg-green-100 text-green-800" :
//                     "bg-gray-100 text-gray-800"
//                   }`}>
//                     {selectedAppointment.status}
//                   </p>
//                 </div>
                
//                 <div className="pt-4">
//                   <button
//                     onClick={() => setSelectedAppointment(null)}
//                     className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//                   >
//                     Close
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   };

//   const PaymentHistory = () => {
//     const totalSpent = payments.reduce((sum, payment) => sum + payment.amount, 0);

//     return (
//       <div className="space-y-6">
//         <h1 className="text-2xl font-bold">Payment History</h1>
        
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <div className="bg-white p-6 rounded-xl shadow-sm">
//             <p className="text-gray-500">Total Spent</p>
//             <p className="text-2xl font-bold">{formatRupiah(totalSpent)}</p>
//           </div>
//           <div className="bg-white p-6 rounded-xl shadow-sm">
//             <p className="text-gray-500">Completed Payments</p>
//             <p className="text-2xl font-bold">
//               {payments.filter(p => p.status === "completed").length}
//             </p>
//           </div>
//           <div className="bg-white p-6 rounded-xl shadow-sm">
//             <p className="text-gray-500">Pending Payments</p>
//             <p className="text-2xl font-bold">
//               {payments.filter(p => p.status === "pending").length}
//             </p>
//           </div>
//         </div>
        
//         <div className="bg-white rounded-xl shadow-sm overflow-hidden">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointment</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {payments.map((payment) => (
//                 <tr key={payment.id} className="hover:bg-gray-50">
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="font-medium">{payment.id}</div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">{payment.appointment}</td>
//                   <td className="px-6 py-4 whitespace-nowrap">{formatRupiah(payment.amount)}</td>
//                   <td className="px-6 py-4 whitespace-nowrap">{formatDate(payment.date)}</td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
//                       payment.status === "completed" ? "bg-green-100 text-green-800" :
//                       "bg-yellow-100 text-yellow-800"
//                     }`}>
//                       {payment.status}
//                     </span>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     );
//   };

//   const AccountSettings = () => {
//     const [isEditing, setIsEditing] = useState(false);
//     const [editData, setEditData] = useState({ ...accountData });
  
//     const [currentPassword, setCurrentPassword] = useState("");
//     const [newPassword, setNewPassword] = useState("");
//     const [confirmPassword, setConfirmPassword] = useState("");
  
//     useEffect(() => {
//       if (userData) {
//         setEditData({ ...accountData });
//       }
//     }, [accountData]);
  
//     const handleSave = async () => {
//       try {
//         // In a real application, you would update the user data in Firestore here
//         // const auth = getAuth(app);
//         // const db = getFirestore(app);
//         // const userDocRef = doc(db, "users", auth.currentUser.uid);
//         // await updateDoc(userDocRef, {
//         //   name: editData.name,
//         //   email: editData.email,
//         //   phone: editData.phone,
//         //   birthDate: editData.birthDate,
//         //   gender: editData.gender
//         // });
        
//         setAccountData(editData);
//         setIsEditing(false);
//         alert("Profile updated successfully!");
//       } catch (error) {
//         console.error("Error updating profile:", error);
//         alert("Failed to update profile.");
//       }
//     };
  
//     const handleChangePassword = async () => {
//       if (!currentPassword || !newPassword || !confirmPassword) {
//         alert("Please fill in all password fields.");
//         return;
//       }
  
//       if (newPassword !== confirmPassword) {
//         alert("New passwords do not match.");
//         return;
//       }
  
//       try {
//         // In a real application, you would update the password in Firebase Auth here
//         // const auth = getAuth(app);
//         // const user = auth.currentUser;
//         // const credential = EmailAuthProvider.credential(user.email, currentPassword);
//         // await reauthenticateWithCredential(user, credential);
//         // await updatePassword(user, newPassword);
        
//         alert("Password changed successfully!");
//         setCurrentPassword("");
//         setNewPassword("");
//         setConfirmPassword("");
//       } catch (error) {
//         console.error("Error changing password:", error);
//         alert("Failed to change password. Please check your current password.");
//       }
//     };
  
//     return (
//       <div className="space-y-6">
//         <h1 className="text-2xl font-bold">Account Settings</h1>
  
//         {!isEditing ? (
//           <div className="bg-white p-6 rounded-xl shadow-sm">
//             <div className="space-y-4">
//               <div>
//                 <p className="text-sm text-gray-500">Full Name</p>
//                 <p className="font-medium">{accountData.name}</p>
//               </div>
  
//               <div>
//                 <p className="text-sm text-gray-500">Email</p>
//                 <p className="font-medium">{accountData.email}</p>
//               </div>
  
//               <div>
//                 <p className="text-sm text-gray-500">Phone Number</p>
//                 <p className="font-medium">{accountData.phone}</p>
//               </div>
              
//               <div>
//                 <p className="text-sm text-gray-500">Gender</p>
//                 <p className="font-medium">{accountData.gender}</p>
//               </div>
  
//               <div>
//                 <p className="text-sm text-gray-500">Date of Birth</p>
//                 <p className="font-medium">{accountData.birthDate ? formatDate(accountData.birthDate) : "Not set"}</p>
//               </div>
              
//               {userData && userData.createdAt && (
//                 <div>
//                   <p className="text-sm text-gray-500">Member Since</p>
//                   <p className="font-medium">{new Date(userData.createdAt.seconds * 1000).toLocaleDateString("id-ID")}</p>
//                 </div>
//               )}
  
//               <div className="pt-4">
//                 <button
//                   onClick={() => {
//                     setEditData({ ...accountData });
//                     setIsEditing(true);
//                   }}
//                   className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//                 >
//                   Edit Profile
//                 </button>
//               </div>
//             </div>
//           </div>
//         ) : (
//           <div className="bg-white p-6 rounded-xl shadow-sm">
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium mb-1">Full Name</label>
//                 <input
//                   type="text"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.name}
//                   onChange={(e) => setEditData({ ...editData, name: e.target.value })}
//                 />
//               </div>
  
//               <div>
//                 <label className="block text-sm font-medium mb-1">Email</label>
//                 <input
//                   type="email"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.email}
//                   onChange={(e) => setEditData({ ...editData, email: e.target.value })}
//                 />
//               </div>
  
//               <div>
//                 <label className="block text-sm font-medium mb-1">Phone Number</label>
//                 <input
//                   type="tel"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.phone}
//                   onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
//                 />
//               </div>
              
//               <div>
//                 <label className="block text-sm font-medium mb-1">Gender</label>
//                 <select
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.gender}
//                   onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
//                 >
//                   <option value="">Select gender</option>
//                   <option value="male">Male</option>
//                   <option value="female">Female</option>
//                   <option value="other">Other</option>
//                 </select>
//               </div>
  
//               <div>
//                 <label className="block text-sm font-medium mb-1">Date of Birth</label>
//                 <input
//                   type="date"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.birthDate}
//                   onChange={(e) => setEditData({ ...editData, birthDate: e.target.value })}
//                 />
//               </div>
  
//               <div className="flex justify-end space-x-3 pt-4">
//                 <button
//                   onClick={() => setIsEditing(false)}
//                   className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSave}
//                   className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//                 >
//                   Save Changes
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
  
//         <div className="bg-white rounded-xl shadow-sm p-6">
//           <h2 className="text-xl font-semibold mb-4">Change Password</h2>
//           <div className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium mb-1">Current Password</label>
//               <input
//                 type="password"
//                 className="w-full p-2 border border-gray-300 hover:bg-blue-50/50 transition-all duration-200 outline-none focus:border-blue-500 rounded"
//                 value={currentPassword}
//                 onChange={(e) => setCurrentPassword(e.target.value)}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-1">New Password</label>
//               <input
//                 type="password"
//                 className="w-full p-2 border border-gray-300 hover:bg-blue-50/50 transition-all duration-200 outline-none focus:border-blue-500 rounded"
//                 value={newPassword}
//                 onChange={(e) => setNewPassword(e.target.value)}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-1">Confirm New Password</label>
//               <input
//                 type="password"
//                 className="w-full p-2 border border-gray-300 hover:bg-blue-50/50 transition-all duration-200 outline-none focus:border-blue-500 rounded"
//                 value={confirmPassword}
//                 onChange={(e) => setConfirmPassword(e.target.value)}
//               />
//             </div>
//             <div className="flex justify-end pt-4">
//               <button
//                 onClick={handleChangePassword}
//                 className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//               >
//                 Update Password
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };
  
//   // Show loading state while fetching user data
//   if (loading) {
//     return (
//       <div className="w-full min-h-screen bg-blue-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
//           <p className="mt-4 text-lg text-gray-700">Loading user data...</p>
//         </div>
//       </div>
//     );
//   }

//   const renderActiveView = () => {
//     switch(activeView) {
//       case "appointments": return <AppointmentManagement />;
//       case "payments": return <PaymentHistory />;
//       case "account": return <AccountSettings />;
//       default: return <AppointmentManagement />;
//     }
//   };

//   return (
//     <div className="w-full min-h-screen bg-blue-50 text-black">
//       <div className="flex w-full relative">
//         <div className="bg-white shadow-md p-6 w-[25%] min-h-screen fixed top-0 left-0 z-10">
//           <div className="flex items-center mb-8 flex-col">
//             <img src="/assets/patient_1.jpg" className="rounded-full aspect-square w-[35%] mb-3" alt="" />
//             <div className="w-full text-center">
//               <h2 className="text-xl font-semibold">{accountData.name}</h2>
//               <p className="text-gray-600">Patient</p>
//             </div>
//           </div>
//           <div className="nav flex flex-col">
//             <nav className="space-y-2">
//                 <button
//                 onClick={() => setActiveView("appointments")}
//                 className={`flex items-center w-full text-left p-3 rounded-lg transition ${
//                     activeView === "appointments" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
//                 }`}
//                 >
//                 <Calendar size={20} className="mr-3" />
//                 My Appointments
//                 </button>
//                 <button
//                 onClick={() => setActiveView("payments")}
//                 className={`flex items-center w-full text-left p-3 rounded-lg transition ${
//                     activeView === "payments" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
//                 }`}
//                 >
//                 <CurrencyDollar size={20} className="mr-3" />
//                 Payment History
//                 </button>
//                 <button
//                 onClick={() => setActiveView("account")}
//                 className={`flex items-center w-full text-left p-3 rounded-lg transition ${
//                     activeView === "account" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
//                 }`}
//                 >
//                 <User size={20} className="mr-3" />
//                 Account Settings
//                 </button>
//             </nav>
//             <Link href="/" className="w-full mt-16 text-white p-3 font-medium rounded-lg bg-blue-500 hover:bg-blue-700 transition-all duration-100 flex items-center">
//                 <House size={20} className="mr-3"/>
//                 <h1>
//                     Home
//                 </h1>
//             </Link>
//           </div>
//         </div>

//         <div className="w-[25%]"></div>

//         <div className="w-[75%] p-8">
//           {renderActiveView()}
//         </div>
//       </div>
//     </div>
//   );
// }


















// "use client";

// import { useState } from "react";
// import { User, Calendar, CurrencyDollar, House} from "@phosphor-icons/react/dist/ssr";
// import Link from "next/link";

// export default function PatientDashboard() {
//   const [activeView, setActiveView] = useState("appointments");
  
//   const [appointments, setAppointments] = useState([
//     {
//       id: 1,
//       doctor: "Dr. Mulyadi Akbar Denüst",
//       date: "2025-04-15",
//       time: "10:00",
//       status: "confirmed",
//       complaint: "Regular checkup"
//     },
//     {
//       id: 2,
//       doctor: "Dr. Hakim Ismail",
//       date: "2025-04-20",
//       time: "14:30",
//       status: "completed",
//       complaint: "Headache consultation"
//     },
//     {
//       id: 3,
//       doctor: "Dr. Sarah Wijaya",
//       date: "2025-05-02",
//       time: "09:15",
//       status: "cancelled",
//       complaint: "Annual physical exam"
//     }
//   ]);

//   const [payments, setPayments] = useState([
//     {
//       id: "PAY-001",
//       appointment: "Checkup with Dr. Mulyadi",
//       amount: 40000,
//       date: "2025-04-15",
//       status: "completed",
//       method: "BCA Virtual Account"
//     },
//     {
//       id: "PAY-002",
//       appointment: "Consultation with Dr. Hakim",
//       amount: 45000,
//       date: "2025-04-20",
//       status: "completed",
//       method: "GOPAY"
//     },
//     {
//       id: "PAY-003",
//       appointment: "Lab Test Package",
//       amount: 45000,
//       date: "2025-04-25",
//       status: "pending",
//       method: "Credit Card"
//     }
//   ]);

//   const [accountData, setAccountData] = useState({
//     name: "Ahmad Dimas",
//     email: "ahmaddimas@gmail.com",
//     phone: "+6281304128523",
//     birthDate: "1999-07-15"
//   });

//   const formatDate = (dateStr) => {
//     const date = new Date(dateStr);
//     return date.toLocaleDateString("id-ID", {
//       weekday: 'long',
//       day: 'numeric',
//       month: 'long',
//       year: 'numeric'
//     });
//   };

//   const formatRupiah = (value) =>
//     new Intl.NumberFormat("id-ID", {
//       style: "currency",
//       currency: "IDR",
//       minimumFractionDigits: 0,
//     }).format(value);

//   const AppointmentManagement = () => {
//     const [selectedAppointment, setSelectedAppointment] = useState(null);

//     const handleCancel = (appointmentId) => {
//       if (window.confirm("Are you sure you want to cancel this appointment?")) {
//         const updated = appointments.map(a => 
//           a.id === appointmentId ? { ...a, status: "cancelled" } : a
//         );
//         setAppointments(updated);
//       }
//     };

//     return (
//       <div className="space-y-6">
//         <h1 className="text-2xl font-bold">My Appointments</h1>
        
//         <div className="space-y-4">
//           {appointments.map((appointment) => (
//             <div key={appointment.id} className="bg-white p-6 rounded-xl shadow-sm">
//               <div className="flex justify-between items-start">
//                 <div>
//                   <h3 className="font-semibold text-lg">With {appointment.doctor}</h3>
//                   <p className="text-gray-600">{formatDate(appointment.date)} at {appointment.time}</p>
//                   <p className="mt-2 text-gray-700">Complaint: {appointment.complaint}</p>
//                 </div>
//                 <div className="flex items-center space-x-3">
//                   <span className={`px-3 py-1 rounded-full text-sm font-medium ${
//                     appointment.status === "confirmed" ? "bg-blue-100 text-blue-800" :
//                     appointment.status === "completed" ? "bg-green-100 text-green-800" :
//                     "bg-gray-100 text-gray-800"
//                   }`}>
//                     {appointment.status}
//                   </span>
//                   <button
//                     onClick={() => setSelectedAppointment(appointment)}
//                     className="text-blue-600 hover:text-blue-800"
//                   >
//                     Details
//                   </button>
//                 </div>
//               </div>
              
//               {appointment.status === "confirmed" && (
//                 <div className="mt-4">
//                   <button
//                     onClick={() => handleCancel(appointment.id)}
//                     className="px-3 py-1 text-sm rounded bg-red-100 text-red-800 hover:bg-red-200"
//                   >
//                     Cancel Appointment
//                   </button>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
        
//         {selectedAppointment && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white rounded-xl p-6 w-full max-w-md">
//               <div className="flex justify-between items-center mb-4">
//                 <h2 className="text-xl font-bold">Appointment Details</h2>
//                 <button
//                   onClick={() => setSelectedAppointment(null)}
//                   className="text-gray-500 hover:text-gray-700"
//                 >
//                   ✕
//                 </button>
//               </div>
              
//               <div className="space-y-3">
//                 <div>
//                   <p className="text-sm text-gray-500">Doctor</p>
//                   <p className="font-medium">{selectedAppointment.doctor}</p>
//                 </div>
                
//                 <div>
//                   <p className="text-sm text-gray-500">Date & Time</p>
//                   <p className="font-medium">
//                     {formatDate(selectedAppointment.date)} at {selectedAppointment.time}
//                   </p>
//                 </div>
                
//                 <div>
//                   <p className="text-sm text-gray-500">Complaint</p>
//                   <p className="font-medium">{selectedAppointment.complaint}</p>
//                 </div>
                
//                 <div>
//                   <p className="text-sm text-gray-500">Status</p>
//                   <p className={`font-medium px-2 py-1 inline-block rounded ${
//                     selectedAppointment.status === "confirmed" ? "bg-blue-100 text-blue-800" :
//                     selectedAppointment.status === "completed" ? "bg-green-100 text-green-800" :
//                     "bg-gray-100 text-gray-800"
//                   }`}>
//                     {selectedAppointment.status}
//                   </p>
//                 </div>
                
//                 <div className="pt-4">
//                   <button
//                     onClick={() => setSelectedAppointment(null)}
//                     className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//                   >
//                     Close
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   };

//   const PaymentHistory = () => {
//     const totalSpent = payments.reduce((sum, payment) => sum + payment.amount, 0);

//     return (
//       <div className="space-y-6">
//         <h1 className="text-2xl font-bold">Payment History</h1>
        
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <div className="bg-white p-6 rounded-xl shadow-sm">
//             <p className="text-gray-500">Total Spent</p>
//             <p className="text-2xl font-bold">{formatRupiah(totalSpent)}</p>
//           </div>
//           <div className="bg-white p-6 rounded-xl shadow-sm">
//             <p className="text-gray-500">Completed Payments</p>
//             <p className="text-2xl font-bold">
//               {payments.filter(p => p.status === "completed").length}
//             </p>
//           </div>
//           <div className="bg-white p-6 rounded-xl shadow-sm">
//             <p className="text-gray-500">Pending Payments</p>
//             <p className="text-2xl font-bold">
//               {payments.filter(p => p.status === "pending").length}
//             </p>
//           </div>
//         </div>
        
//         <div className="bg-white rounded-xl shadow-sm overflow-hidden">
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointment</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {payments.map((payment) => (
//                 <tr key={payment.id} className="hover:bg-gray-50">
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="font-medium">{payment.id}</div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">{payment.appointment}</td>
//                   <td className="px-6 py-4 whitespace-nowrap">{formatRupiah(payment.amount)}</td>
//                   <td className="px-6 py-4 whitespace-nowrap">{formatDate(payment.date)}</td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
//                       payment.status === "completed" ? "bg-green-100 text-green-800" :
//                       "bg-yellow-100 text-yellow-800"
//                     }`}>
//                       {payment.status}
//                     </span>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     );
//   };

//   const AccountSettings = () => {
//     const [isEditing, setIsEditing] = useState(false);
//     const [editData, setEditData] = useState({ ...accountData });
  
//     const [currentPassword, setCurrentPassword] = useState("");
//     const [newPassword, setNewPassword] = useState("");
//     const [confirmPassword, setConfirmPassword] = useState("");
  
//     const handleSave = () => {
//       setAccountData(editData);
//       setIsEditing(false);
//     };
  
//     const handleChangePassword = () => {
//       if (!currentPassword || !newPassword || !confirmPassword) {
//         alert("Please fill in all password fields.");
//         return;
//       }
  
//       if (newPassword !== confirmPassword) {
//         alert("New passwords do not match.");
//         return;
//       }
  
//       alert("Password changed successfully!");
//       setCurrentPassword("");
//       setNewPassword("");
//       setConfirmPassword("");
//     };
  
//     return (
//       <div className="space-y-6">
//         <h1 className="text-2xl font-bold">Account Settings</h1>
  
//         {!isEditing ? (
//           <div className="bg-white p-6 rounded-xl shadow-sm">
//             <div className="space-y-4">
//               <div>
//                 <p className="text-sm text-gray-500">Full Name</p>
//                 <p className="font-medium">{accountData.name}</p>
//               </div>
  
//               <div>
//                 <p className="text-sm text-gray-500">Email</p>
//                 <p className="font-medium">{accountData.email}</p>
//               </div>
  
//               <div>
//                 <p className="text-sm text-gray-500">Phone Number</p>
//                 <p className="font-medium">{accountData.phone}</p>
//               </div>
  
//               <div>
//                 <p className="text-sm text-gray-500">Date of Birth</p>
//                 <p className="font-medium">{formatDate(accountData.birthDate)}</p>
//               </div>
  
//               <div className="pt-4">
//                 <button
//                   onClick={() => {
//                     setEditData({ ...accountData });
//                     setIsEditing(true);
//                   }}
//                   className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//                 >
//                   Edit Profile
//                 </button>
//               </div>
//             </div>
//           </div>
//         ) : (
//           <div className="bg-white p-6 rounded-xl shadow-sm">
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium mb-1">Full Name</label>
//                 <input
//                   type="text"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.name}
//                   onChange={(e) => setEditData({ ...editData, name: e.target.value })}
//                 />
//               </div>
  
//               <div>
//                 <label className="block text-sm font-medium mb-1">Email</label>
//                 <input
//                   type="email"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.email}
//                   onChange={(e) => setEditData({ ...editData, email: e.target.value })}
//                 />
//               </div>
  
//               <div>
//                 <label className="block text-sm font-medium mb-1">Phone Number</label>
//                 <input
//                   type="tel"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.phone}
//                   onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
//                 />
//               </div>
  
//               <div>
//                 <label className="block text-sm font-medium mb-1">Date of Birth</label>
//                 <input
//                   type="date"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.birthDate}
//                   onChange={(e) => setEditData({ ...editData, birthDate: e.target.value })}
//                 />
//               </div>
  
//               <div className="flex justify-end space-x-3 pt-4">
//                 <button
//                   onClick={() => setIsEditing(false)}
//                   className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSave}
//                   className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//                 >
//                   Save Changes
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
  
//         <div className="bg-white rounded-xl shadow-sm p-6">
//           <h2 className="text-xl font-semibold mb-4">Change Password</h2>
//           <div className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium mb-1">Current Password</label>
//               <input
//                 type="password"
//                 className="w-full p-2 border border-gray-300 hover:bg-blue-50/50 transition-all duration-200 outline-none focus:border-blue-500 rounded"
//                 value={currentPassword}
//                 onChange={(e) => setCurrentPassword(e.target.value)}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-1">New Password</label>
//               <input
//                 type="password"
//                 className="w-full p-2 border border-gray-300 hover:bg-blue-50/50 transition-all duration-200 outline-none focus:border-blue-500 rounded"
//                 value={newPassword}
//                 onChange={(e) => setNewPassword(e.target.value)}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-1">Confirm New Password</label>
//               <input
//                 type="password"
//                 className="w-full p-2 border border-gray-300 hover:bg-blue-50/50 transition-all duration-200 outline-none focus:border-blue-500 rounded"
//                 value={confirmPassword}
//                 onChange={(e) => setConfirmPassword(e.target.value)}
//               />
//             </div>
//             <div className="flex justify-end pt-4">
//               <button
//                 onClick={handleChangePassword}
//                 className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//               >
//                 Update Password
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };
  

//   const renderActiveView = () => {
//     switch(activeView) {
//       case "appointments": return <AppointmentManagement />;
//       case "payments": return <PaymentHistory />;
//       case "account": return <AccountSettings />;
//       default: return <AppointmentManagement />;
//     }
//   };

//   return (
//     <div className="w-full min-h-screen bg-blue-50 text-black">
//       <div className="flex w-full relative">
//         <div className="bg-white shadow-md p-6 w-[25%] min-h-screen fixed top-0 left-0 z-10">
//           <div className="flex items-center mb-8 flex-col">
//             <img src="/assets/patient_1.jpg" className="rounded-full aspect-square w-[35%] mb-3" alt="" />
//             <div className="w-full text-center">
//               <h2 className="text-xl font-semibold">{accountData.name}</h2>
//               <p className="text-gray-600">Patient</p>
//             </div>
//           </div>
//           <div className="nav flex flex-col">
//             <nav className="space-y-2">
//                 <button
//                 onClick={() => setActiveView("appointments")}
//                 className={`flex items-center w-full text-left p-3 rounded-lg transition ${
//                     activeView === "appointments" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
//                 }`}
//                 >
//                 <Calendar size={20} className="mr-3" />
//                 My Appointments
//                 </button>
//                 <button
//                 onClick={() => setActiveView("payments")}
//                 className={`flex items-center w-full text-left p-3 rounded-lg transition ${
//                     activeView === "payments" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
//                 }`}
//                 >
//                 <CurrencyDollar size={20} className="mr-3" />
//                 Payment History
//                 </button>
//                 <button
//                 onClick={() => setActiveView("account")}
//                 className={`flex items-center w-full text-left p-3 rounded-lg transition ${
//                     activeView === "account" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
//                 }`}
//                 >
//                 <User size={20} className="mr-3" />
//                 Account Settings
//                 </button>
//             </nav>
//             <Link href="/" className="w-full mt-16 text-white p-3 font-medium rounded-lg bg-blue-500 hover:bg-blue-700 transition-all duration-100 flex items-center">
//                 <House size={20} className="mr-3"/>
//                 <h1>
//                     Home
//                 </h1>
//             </Link>
//           </div>
//         </div>

//         <div className="w-[25%]"></div>

//         <div className="w-[75%] p-8">
//           {renderActiveView()}
//         </div>
//       </div>
//     </div>
//   );
// }







// "use client";

// import { useState, useEffect } from "react";
// import { User, Calendar, CurrencyDollar, House} from "@phosphor-icons/react/dist/ssr";
// import Link from "next/link";
// import { auth, db } from "../../../lib/firebase";
// import { onAuthStateChanged, signOut } from "firebase/auth";
// import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
// import { useRouter } from "next/navigation";

// export default function PatientDashboard() {
//   const [activeView, setActiveView] = useState("appointments");
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [appointments, setAppointments] = useState([]);
//   const [payments, setPayments] = useState([]);
//   const [accountData, setAccountData] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     birthDate: "",
//     gender: ""
//   });
  
//   const router = useRouter();

//   // Check authentication status and fetch user data
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
//       if (currentUser) {
//         setUser(currentUser);
//         await fetchUserData(currentUser.uid);
//         await fetchAppointments(currentUser.uid);
//         await fetchPayments(currentUser.uid);
//       } else {
//         // Redirect to sign-in if not authenticated
//         router.push("/sign-in");
//       }
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, [router]);

//   // Fetch user data from Firestore
//   const fetchUserData = async (uid) => {
//     try {
//       const userDocRef = doc(db, "users", uid);
//       const userDoc = await getDoc(userDocRef);
      
//       if (userDoc.exists()) {
//         const userData = userDoc.data();
//         setAccountData({
//           name: userData.name || userData.email.split("@")[0], // Use email as fallback if name is not set
//           email: userData.email,
//           phone: userData.phone || "",
//           birthDate: userData.birthDate || new Date().toISOString().split("T")[0],
//           gender: userData.gender || ""
//         });
//       }
//     } catch (error) {
//       console.error("Error fetching user data:", error);
//     }
//   };

//   // Fetch appointments from Firestore
//   const fetchAppointments = async (uid) => {
//     try {
//       const appointmentsRef = collection(db, "appointments");
//       const q = query(
//         appointmentsRef,
//         where("patientId", "==", uid),
//         orderBy("date", "desc")
//       );
      
//       const querySnapshot = await getDocs(q);
//       const appointmentsData = [];
      
//       querySnapshot.forEach((doc) => {
//         appointmentsData.push({
//           id: doc.id,
//           ...doc.data()
//         });
//       });
      
//       setAppointments(appointmentsData);
//     } catch (error) {
//       console.error("Error fetching appointments:", error);
//     }
//   };

//   // Fetch payment history from Firestore
//   const fetchPayments = async (uid) => {
//     try {
//       const paymentsRef = collection(db, "payments");
//       const q = query(
//         paymentsRef,
//         where("patientId", "==", uid),
//         orderBy("date", "desc")
//       );
      
//       const querySnapshot = await getDocs(q);
//       const paymentsData = [];
      
//       querySnapshot.forEach((doc) => {
//         paymentsData.push({
//           id: doc.id,
//           ...doc.data()
//         });
//       });
      
//       setPayments(paymentsData);
//     } catch (error) {
//       console.error("Error fetching payments:", error);
//     }
//   };

//   const handleSignOut = async () => {
//     try {
//       await signOut(auth);
//       router.push("/sign-in");
//     } catch (error) {
//       console.error("Error signing out:", error);
//     }
//   };

//   const formatDate = (dateStr) => {
//     if (!dateStr) return "Not specified";
//     const date = new Date(dateStr);
//     return date.toLocaleDateString("id-ID", {
//       weekday: 'long',
//       day: 'numeric',
//       month: 'long',
//       year: 'numeric'
//     });
//   };

//   const formatRupiah = (value) =>
//     new Intl.NumberFormat("id-ID", {
//       style: "currency",
//       currency: "IDR",
//       minimumFractionDigits: 0,
//     }).format(value);

//   const AppointmentManagement = () => {
//     const [selectedAppointment, setSelectedAppointment] = useState(null);

//     const handleCancel = async (appointmentId) => {
//       if (window.confirm("Are you sure you want to cancel this appointment?")) {
//         try {
//           // Update the appointment status in Firestore
//           const appointmentRef = doc(db, "appointments", appointmentId);
//           await updateDoc(appointmentRef, {
//             status: "cancelled"
//           });
          
//           // Update local state
//           const updated = appointments.map(a => 
//             a.id === appointmentId ? { ...a, status: "cancelled" } : a
//           );
//           setAppointments(updated);
//         } catch (error) {
//           console.error("Error cancelling appointment:", error);
//           alert("Failed to cancel appointment. Please try again.");
//         }
//       }
//     };

//     return (
//       <div className="space-y-6">
//         <h1 className="text-2xl font-bold">My Appointments</h1>
        
//         {appointments.length === 0 ? (
//           <div className="bg-white p-6 rounded-xl shadow-sm text-center">
//             <p>You don't have any appointments yet.</p>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {appointments.map((appointment) => (
//               <div key={appointment.id} className="bg-white p-6 rounded-xl shadow-sm">
//                 <div className="flex justify-between items-start">
//                   <div>
//                     <h3 className="font-semibold text-lg">With {appointment.doctorName}</h3>
//                     <p className="text-gray-600">{formatDate(appointment.date)} at {appointment.time}</p>
//                     <p className="mt-2 text-gray-700">Complaint: {appointment.complaint}</p>
//                   </div>
//                   <div className="flex items-center space-x-3">
//                     <span className={`px-3 py-1 rounded-full text-sm font-medium ${
//                       appointment.status === "confirmed" ? "bg-blue-100 text-blue-800" :
//                       appointment.status === "completed" ? "bg-green-100 text-green-800" :
//                       "bg-gray-100 text-gray-800"
//                     }`}>
//                       {appointment.status}
//                     </span>
//                     <button
//                       onClick={() => setSelectedAppointment(appointment)}
//                       className="text-blue-600 hover:text-blue-800"
//                     >
//                       Details
//                     </button>
//                   </div>
//                 </div>
                
//                 {appointment.status === "confirmed" && (
//                   <div className="mt-4">
//                     <button
//                       onClick={() => handleCancel(appointment.id)}
//                       className="px-3 py-1 text-sm rounded bg-red-100 text-red-800 hover:bg-red-200"
//                     >
//                       Cancel Appointment
//                     </button>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         )}
        
//         {selectedAppointment && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white rounded-xl p-6 w-full max-w-md">
//               <div className="flex justify-between items-center mb-4">
//                 <h2 className="text-xl font-bold">Appointment Details</h2>
//                 <button
//                   onClick={() => setSelectedAppointment(null)}
//                   className="text-gray-500 hover:text-gray-700"
//                 >
//                   ✕
//                 </button>
//               </div>
              
//               <div className="space-y-3">
//                 <div>
//                   <p className="text-sm text-gray-500">Doctor</p>
//                   <p className="font-medium">{selectedAppointment.doctorName}</p>
//                 </div>
                
//                 <div>
//                   <p className="text-sm text-gray-500">Date & Time</p>
//                   <p className="font-medium">
//                     {formatDate(selectedAppointment.date)} at {selectedAppointment.time}
//                   </p>
//                 </div>
                
//                 <div>
//                   <p className="text-sm text-gray-500">Complaint</p>
//                   <p className="font-medium">{selectedAppointment.complaint}</p>
//                 </div>
                
//                 <div>
//                   <p className="text-sm text-gray-500">Status</p>
//                   <p className={`font-medium px-2 py-1 inline-block rounded ${
//                     selectedAppointment.status === "confirmed" ? "bg-blue-100 text-blue-800" :
//                     selectedAppointment.status === "completed" ? "bg-green-100 text-green-800" :
//                     "bg-gray-100 text-gray-800"
//                   }`}>
//                     {selectedAppointment.status}
//                   </p>
//                 </div>
                
//                 <div className="pt-4">
//                   <button
//                     onClick={() => setSelectedAppointment(null)}
//                     className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//                   >
//                     Close
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   };

//   const PaymentHistory = () => {
//     const totalSpent = payments.reduce((sum, payment) => sum + payment.amount, 0);

//     return (
//       <div className="space-y-6">
//         <h1 className="text-2xl font-bold">Payment History</h1>
        
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <div className="bg-white p-6 rounded-xl shadow-sm">
//             <p className="text-gray-500">Total Spent</p>
//             <p className="text-2xl font-bold">{formatRupiah(totalSpent)}</p>
//           </div>
//           <div className="bg-white p-6 rounded-xl shadow-sm">
//             <p className="text-gray-500">Completed Payments</p>
//             <p className="text-2xl font-bold">
//               {payments.filter(p => p.status === "completed").length}
//             </p>
//           </div>
//           <div className="bg-white p-6 rounded-xl shadow-sm">
//             <p className="text-gray-500">Pending Payments</p>
//             <p className="text-2xl font-bold">
//               {payments.filter(p => p.status === "pending").length}
//             </p>
//           </div>
//         </div>
        
//         {payments.length === 0 ? (
//           <div className="bg-white p-6 rounded-xl shadow-sm text-center">
//             <p>You don't have any payment records yet.</p>
//           </div>
//         ) : (
//           <div className="bg-white rounded-xl shadow-sm overflow-hidden">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointment</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {payments.map((payment) => (
//                   <tr key={payment.id} className="hover:bg-gray-50">
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="font-medium">{payment.id.substring(0, 8).toUpperCase()}</div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">{payment.description}</td>
//                     <td className="px-6 py-4 whitespace-nowrap">{formatRupiah(payment.amount)}</td>
//                     <td className="px-6 py-4 whitespace-nowrap">{formatDate(payment.date)}</td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
//                         payment.status === "completed" ? "bg-green-100 text-green-800" :
//                         "bg-yellow-100 text-yellow-800"
//                       }`}>
//                         {payment.status}
//                       </span>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     );
//   };

//   const AccountSettings = () => {
//     const [isEditing, setIsEditing] = useState(false);
//     const [editData, setEditData] = useState({ ...accountData });
  
//     const [currentPassword, setCurrentPassword] = useState("");
//     const [newPassword, setNewPassword] = useState("");
//     const [confirmPassword, setConfirmPassword] = useState("");
//     const [passwordError, setPasswordError] = useState("");
  
//     const handleSave = async () => {
//       try {
//         if (!user) return;
        
//         // Update the user document in Firestore
//         const userDocRef = doc(db, "users", user.uid);
//         await updateDoc(userDocRef, {
//           name: editData.name,
//           email: editData.email,
//           phone: editData.phone,
//           birthDate: editData.birthDate
//         });
        
//         // Update local state
//         setAccountData(editData);
//         setIsEditing(false);
//         alert("Profile updated successfully!");
//       } catch (error) {
//         console.error("Error updating profile:", error);
//         alert("Failed to update profile. Please try again.");
//       }
//     };
  
//     const handleChangePassword = async () => {
//       setPasswordError("");
      
//       if (!currentPassword || !newPassword || !confirmPassword) {
//         setPasswordError("Please fill in all password fields.");
//         return;
//       }
  
//       if (newPassword !== confirmPassword) {
//         setPasswordError("New passwords do not match.");
//         return;
//       }
      
//       if (newPassword.length < 6) {
//         setPasswordError("Password must be at least 6 characters long.");
//         return;
//       }
      
//       // Note: In a real app, you would use Firebase's updatePassword method
//       // However, this requires recent authentication
//       alert("Password changed successfully!");
//       setCurrentPassword("");
//       setNewPassword("");
//       setConfirmPassword("");
//     };
  
//     return (
//       <div className="space-y-6">
//         <h1 className="text-2xl font-bold">Account Settings</h1>
  
//         {!isEditing ? (
//           <div className="bg-white p-6 rounded-xl shadow-sm">
//             <div className="space-y-4">
//               <div>
//                 <p className="text-sm text-gray-500">Full Name</p>
//                 <p className="font-medium">{accountData.name}</p>
//               </div>
  
//               <div>
//                 <p className="text-sm text-gray-500">Email</p>
//                 <p className="font-medium">{accountData.email}</p>
//               </div>
  
//               <div>
//                 <p className="text-sm text-gray-500">Phone Number</p>
//                 <p className="font-medium">{accountData.phone}</p>
//               </div>
  
//               <div>
//                 <p className="text-sm text-gray-500">Date of Birth</p>
//                 <p className="font-medium">{formatDate(accountData.birthDate)}</p>
//               </div>
              
//               <div>
//                 <p className="text-sm text-gray-500">Gender</p>
//                 <p className="font-medium capitalize">{accountData.gender || "Not specified"}</p>
//               </div>
  
//               <div className="pt-4">
//                 <button
//                   onClick={() => {
//                     setEditData({ ...accountData });
//                     setIsEditing(true);
//                   }}
//                   className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//                 >
//                   Edit Profile
//                 </button>
//               </div>
//             </div>
//           </div>
//         ) : (
//           <div className="bg-white p-6 rounded-xl shadow-sm">
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium mb-1">Full Name</label>
//                 <input
//                   type="text"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.name}
//                   onChange={(e) => setEditData({ ...editData, name: e.target.value })}
//                 />
//               </div>
  
//               <div>
//                 <label className="block text-sm font-medium mb-1">Email</label>
//                 <input
//                   type="email"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.email}
//                   onChange={(e) => setEditData({ ...editData, email: e.target.value })}
//                   disabled // Email should not be editable as it's the auth identifier
//                 />
//                 <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
//               </div>
  
//               <div>
//                 <label className="block text-sm font-medium mb-1">Phone Number</label>
//                 <input
//                   type="tel"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.phone}
//                   onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
//                 />
//               </div>
  
//               <div>
//                 <label className="block text-sm font-medium mb-1">Date of Birth</label>
//                 <input
//                   type="date"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.birthDate}
//                   onChange={(e) => setEditData({ ...editData, birthDate: e.target.value })}
//                 />
//               </div>
  
//               <div className="flex justify-end space-x-3 pt-4">
//                 <button
//                   onClick={() => setIsEditing(false)}
//                   className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSave}
//                   className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//                 >
//                   Save Changes
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
  
//         <div className="bg-white rounded-xl shadow-sm p-6">
//           <h2 className="text-xl font-semibold mb-4">Change Password</h2>
//           <div className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium mb-1">Current Password</label>
//               <input
//                 type="password"
//                 className="w-full p-2 border border-gray-300 hover:bg-blue-50/50 transition-all duration-200 outline-none focus:border-blue-500 rounded"
//                 value={currentPassword}
//                 onChange={(e) => setCurrentPassword(e.target.value)}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-1">New Password</label>
//               <input
//                 type="password"
//                 className="w-full p-2 border border-gray-300 hover:bg-blue-50/50 transition-all duration-200 outline-none focus:border-blue-500 rounded"
//                 value={newPassword}
//                 onChange={(e) => setNewPassword(e.target.value)}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-1">Confirm New Password</label>
//               <input
//                 type="password"
//                 className="w-full p-2 border border-gray-300 hover:bg-blue-50/50 transition-all duration-200 outline-none focus:border-blue-500 rounded"
//                 value={confirmPassword}
//                 onChange={(e) => setConfirmPassword(e.target.value)}
//               />
//             </div>
//             {passwordError && (
//               <div className="text-red-500 text-sm">{passwordError}</div>
//             )}
//             <div className="flex justify-end pt-4">
//               <button
//                 onClick={handleChangePassword}
//                 className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//               >
//                 Update Password
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };
  
//   const renderActiveView = () => {
//     switch(activeView) {
//       case "appointments": return <AppointmentManagement />;
//       case "payments": return <PaymentHistory />;
//       case "account": return <AccountSettings />;
//       default: return <AppointmentManagement />;
//     }
//   };

//   if (loading) {
//     return (
//       <div className="w-full min-h-screen bg-blue-50 flex items-center justify-center">
//         <div className="text-center">
//           <p className="text-xl">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full min-h-screen bg-blue-50 text-black">
//       <div className="flex w-full relative">
//         <div className="bg-white shadow-md p-6 w-[25%] min-h-screen fixed top-0 left-0 z-10">
//           <div className="flex items-center mb-8 flex-col">
//             <img 
//               src={`/assets/${accountData.gender === 'female' ? 'patient_female.jpg' : 'patient_1.jpg'}`} 
//               className="rounded-full aspect-square w-[35%] mb-3" 
//               alt="Patient profile" 
//             />
//             <div className="w-full text-center">
//               <h2 className="text-xl font-semibold">{accountData.name}</h2>
//               <p className="text-gray-600">Patient</p>
//             </div>
//           </div>
//           <div className="nav flex flex-col h-full">
//             <nav className="space-y-2">
//               <button
//                 onClick={() => setActiveView("appointments")}
//                 className={`flex items-center w-full text-left p-3 rounded-lg transition ${
//                   activeView === "appointments" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
//                 }`}
//               >
//                 <Calendar size={20} className="mr-3" />
//                 My Appointments
//               </button>
//               <button
//                 onClick={() => setActiveView("payments")}
//                 className={`flex items-center w-full text-left p-3 rounded-lg transition ${
//                   activeView === "payments" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
//                 }`}
//               >
//                 <CurrencyDollar size={20} className="mr-3" />
//                 Payment History
//               </button>
//               <button
//                 onClick={() => setActiveView("account")}
//                 className={`flex items-center w-full text-left p-3 rounded-lg transition ${
//                   activeView === "account" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
//                 }`}
//               >
//                 <User size={20} className="mr-3" />
//                 Account Settings
//               </button>
//             </nav>
//             <div className="mt-auto space-y-2">
//               <Link href="/" className="w-full p-3 font-medium rounded-lg bg-blue-500 hover:bg-blue-700 transition-all duration-100 flex items-center text-white">
//                 <House size={20} className="mr-3"/>
//                 <h1>Home</h1>
//               </Link>
//               <button 
//                 onClick={handleSignOut}
//                 className="w-full p-3 font-medium rounded-lg bg-red-100 text-red-800 hover:bg-red-200 transition-all duration-100 flex items-center"
//               >
//                 Sign Out
//               </button>
//             </div>
//           </div>
//         </div>

//         <div className="w-[25%]"></div>

//         <div className="w-[75%] p-8">
//           {renderActiveView()}
//         </div>
//       </div>
//     </div>
//   );
// }
























// "use client";

// import { useState, useEffect } from "react";
// import { User, Calendar, CurrencyDollar, House} from "@phosphor-icons/react/dist/ssr";
// import Link from "next/link";
// import { auth, db } from "../../../lib/firebase";
// import { onAuthStateChanged, signOut } from "firebase/auth";
// import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
// import { useRouter } from "next/navigation";

// export default function PatientDashboard() {
//   const [activeView, setActiveView] = useState("appointments");
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [appointments, setAppointments] = useState([]);
//   const [payments, setPayments] = useState([]);
//   const [accountData, setAccountData] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     birthDate: "",
//     gender: ""
//   });
  
//   const router = useRouter();

//   // Check authentication status and fetch user data
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
//       if (currentUser) {
//         setUser(currentUser);
        
//         try {
//           await fetchUserData(currentUser.uid);
//           await fetchAppointments(currentUser.uid);
//           await fetchPayments(currentUser.uid);
//         } catch (error) {
//           console.error("Error fetching data:", error);
//         }
//       } else {
//         // Redirect to sign-in if not authenticated
//         router.push("/sign-in");
//       }
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, [router]);

//   // Fetch user data from Firestore
//   const fetchUserData = async (uid) => {
//     try {
//       const userDocRef = doc(db, "users", uid);
//       const userDoc = await getDoc(userDocRef);
      
//       if (userDoc.exists()) {
//         const userData = userDoc.data();
//         setAccountData({
//           name: userData.name || userData.email.split("@")[0], // Use email as fallback if name is not set
//           email: userData.email,
//           phone: userData.phone || "",
//           birthDate: userData.birthDate || new Date().toISOString().split("T")[0],
//           gender: userData.gender || ""
//         });
//       }
//     } catch (error) {
//       console.error("Error fetching user data:", error);
//     }
//   };

//   // Fetch appointments from Firestore
//   const fetchAppointments = async (uid) => {
//     try {
//       const appointmentsRef = collection(db, "appointments");
      
//       // First fetch by patient ID without ordering to avoid index errors
//       const q = query(
//         appointmentsRef,
//         where("patientId", "==", uid)
//       );
      
//       const querySnapshot = await getDocs(q);
//       const appointmentsData = [];
      
//       querySnapshot.forEach((doc) => {
//         appointmentsData.push({
//           id: doc.id,
//           ...doc.data()
//         });
//       });
      
//       // Sort the results client-side to avoid Firestore index requirements
//       appointmentsData.sort((a, b) => new Date(b.date) - new Date(a.date));
      
//       setAppointments(appointmentsData);
//     } catch (error) {
//       console.error("Error fetching appointments:", error);
//     }
//   };

//   // Fetch payment history from Firestore
//   const fetchPayments = async (uid) => {
//     try {
//       const paymentsRef = collection(db, "payments");
      
//       // Query only by patientId without ordering to avoid index requirements
//       const q = query(
//         paymentsRef,
//         where("patientId", "==", uid)
//       );
      
//       const querySnapshot = await getDocs(q);
//       const paymentsData = [];
      
//       querySnapshot.forEach((doc) => {
//         paymentsData.push({
//           id: doc.id,
//           ...doc.data()
//         });
//       });
      
//       // Sort client-side instead of using Firestore's orderBy
//       paymentsData.sort((a, b) => new Date(b.date) - new Date(a.date));
      
//       setPayments(paymentsData);
//     } catch (error) {
//       console.error("Error fetching payments:", error);
//     }
//   };

//   const handleSignOut = async () => {
//     try {
//       await signOut(auth);
//       router.push("/sign-in");
//     } catch (error) {
//       console.error("Error signing out:", error);
//     }
//   };

//   const formatDate = (dateStr) => {
//     if (!dateStr) return "Not specified";
//     const date = new Date(dateStr);
//     return date.toLocaleDateString("id-ID", {
//       weekday: 'long',
//       day: 'numeric',
//       month: 'long',
//       year: 'numeric'
//     });
//   };

//   const formatRupiah = (value) =>
//     new Intl.NumberFormat("id-ID", {
//       style: "currency",
//       currency: "IDR",
//       minimumFractionDigits: 0,
//     }).format(value);

//   const AppointmentManagement = () => {
//     const [selectedAppointment, setSelectedAppointment] = useState(null);

//     const handleCancel = async (appointmentId) => {
//       if (window.confirm("Are you sure you want to cancel this appointment?")) {
//         try {
//           // Update the appointment status in Firestore
//           const appointmentRef = doc(db, "appointments", appointmentId);
//           await updateDoc(appointmentRef, {
//             status: "cancelled"
//           });
          
//           // Update local state
//           const updated = appointments.map(a => 
//             a.id === appointmentId ? { ...a, status: "cancelled" } : a
//           );
//           setAppointments(updated);
//         } catch (error) {
//           console.error("Error cancelling appointment:", error);
//           alert("Failed to cancel appointment. Please try again.");
//         }
//       }
//     };

//     return (
//       <div className="space-y-6">
//         <h1 className="text-2xl font-bold">My Appointments</h1>
        
//         {appointments.length === 0 ? (
//           <div className="bg-white p-6 rounded-xl shadow-sm text-center">
//             <p>You don't have any appointments yet.</p>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {appointments.map((appointment) => (
//               <div key={appointment.id} className="bg-white p-6 rounded-xl shadow-sm">
//                 <div className="flex justify-between items-start">
//                   <div>
//                     <h3 className="font-semibold text-lg">With {appointment.doctorName}</h3>
//                     <p className="text-gray-600">{formatDate(appointment.date)} at {appointment.time}</p>
//                     <p className="mt-2 text-gray-700">Complaint: {appointment.complaint}</p>
//                   </div>
//                   <div className="flex items-center space-x-3">
//                     <span className={`px-3 py-1 rounded-full text-sm font-medium ${
//                       appointment.status === "confirmed" ? "bg-blue-100 text-blue-800" :
//                       appointment.status === "completed" ? "bg-green-100 text-green-800" :
//                       "bg-gray-100 text-gray-800"
//                     }`}>
//                       {appointment.status}
//                     </span>
//                     <button
//                       onClick={() => setSelectedAppointment(appointment)}
//                       className="text-blue-600 hover:text-blue-800"
//                     >
//                       Details
//                     </button>
//                   </div>
//                 </div>
                
//                 {appointment.status === "confirmed" && (
//                   <div className="mt-4">
//                     <button
//                       onClick={() => handleCancel(appointment.id)}
//                       className="px-3 py-1 text-sm rounded bg-red-100 text-red-800 hover:bg-red-200"
//                     >
//                       Cancel Appointment
//                     </button>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//         )}
        
//         {selectedAppointment && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white rounded-xl p-6 w-full max-w-md">
//               <div className="flex justify-between items-center mb-4">
//                 <h2 className="text-xl font-bold">Appointment Details</h2>
//                 <button
//                   onClick={() => setSelectedAppointment(null)}
//                   className="text-gray-500 hover:text-gray-700"
//                 >
//                   ✕
//                 </button>
//               </div>
              
//               <div className="space-y-3">
//                 <div>
//                   <p className="text-sm text-gray-500">Doctor</p>
//                   <p className="font-medium">{selectedAppointment.doctorName}</p>
//                 </div>
                
//                 <div>
//                   <p className="text-sm text-gray-500">Date & Time</p>
//                   <p className="font-medium">
//                     {formatDate(selectedAppointment.date)} at {selectedAppointment.time}
//                   </p>
//                 </div>
                
//                 <div>
//                   <p className="text-sm text-gray-500">Complaint</p>
//                   <p className="font-medium">{selectedAppointment.complaint}</p>
//                 </div>
                
//                 <div>
//                   <p className="text-sm text-gray-500">Status</p>
//                   <p className={`font-medium px-2 py-1 inline-block rounded ${
//                     selectedAppointment.status === "confirmed" ? "bg-blue-100 text-blue-800" :
//                     selectedAppointment.status === "completed" ? "bg-green-100 text-green-800" :
//                     "bg-gray-100 text-gray-800"
//                   }`}>
//                     {selectedAppointment.status}
//                   </p>
//                 </div>
                
//                 <div className="pt-4">
//                   <button
//                     onClick={() => setSelectedAppointment(null)}
//                     className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//                   >
//                     Close
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   };

//   const PaymentHistory = () => {
//     const totalSpent = payments.reduce((sum, payment) => sum + payment.amount, 0);

//     return (
//       <div className="space-y-6">
//         <h1 className="text-2xl font-bold">Payment History</h1>
        
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <div className="bg-white p-6 rounded-xl shadow-sm">
//             <p className="text-gray-500">Total Spent</p>
//             <p className="text-2xl font-bold">{formatRupiah(totalSpent)}</p>
//           </div>
//           <div className="bg-white p-6 rounded-xl shadow-sm">
//             <p className="text-gray-500">Completed Payments</p>
//             <p className="text-2xl font-bold">
//               {payments.filter(p => p.status === "completed").length}
//             </p>
//           </div>
//           <div className="bg-white p-6 rounded-xl shadow-sm">
//             <p className="text-gray-500">Pending Payments</p>
//             <p className="text-2xl font-bold">
//               {payments.filter(p => p.status === "pending").length}
//             </p>
//           </div>
//         </div>
        
//         {payments.length === 0 ? (
//           <div className="bg-white p-6 rounded-xl shadow-sm text-center">
//             <p>You don't have any payment records yet.</p>
//           </div>
//         ) : (
//           <div className="bg-white rounded-xl shadow-sm overflow-hidden">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointment</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {payments.map((payment) => (
//                   <tr key={payment.id} className="hover:bg-gray-50">
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="font-medium">{payment.id.substring(0, 8).toUpperCase()}</div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">{payment.description}</td>
//                     <td className="px-6 py-4 whitespace-nowrap">{formatRupiah(payment.amount)}</td>
//                     <td className="px-6 py-4 whitespace-nowrap">{formatDate(payment.date)}</td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
//                         payment.status === "completed" ? "bg-green-100 text-green-800" :
//                         "bg-yellow-100 text-yellow-800"
//                       }`}>
//                         {payment.status}
//                       </span>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     );
//   };

//   const AccountSettings = () => {
//     const [isEditing, setIsEditing] = useState(false);
//     const [editData, setEditData] = useState({ ...accountData });
  
//     const [currentPassword, setCurrentPassword] = useState("");
//     const [newPassword, setNewPassword] = useState("");
//     const [confirmPassword, setConfirmPassword] = useState("");
//     const [passwordError, setPasswordError] = useState("");
  
//     const handleSave = async () => {
//       try {
//         if (!user) return;
        
//         // Update the user document in Firestore
//         const userDocRef = doc(db, "users", user.uid);
//         await updateDoc(userDocRef, {
//           name: editData.name,
//           email: editData.email,
//           phone: editData.phone,
//           birthDate: editData.birthDate
//         });
        
//         // Update local state
//         setAccountData(editData);
//         setIsEditing(false);
//         alert("Profile updated successfully!");
//       } catch (error) {
//         console.error("Error updating profile:", error);
//         alert("Failed to update profile. Please try again.");
//       }
//     };
  
//     const handleChangePassword = async () => {
//       setPasswordError("");
      
//       if (!currentPassword || !newPassword || !confirmPassword) {
//         setPasswordError("Please fill in all password fields.");
//         return;
//       }
  
//       if (newPassword !== confirmPassword) {
//         setPasswordError("New passwords do not match.");
//         return;
//       }
      
//       if (newPassword.length < 6) {
//         setPasswordError("Password must be at least 6 characters long.");
//         return;
//       }
      
//       // Note: In a real app, you would use Firebase's updatePassword method
//       // However, this requires recent authentication
//       alert("Password changed successfully!");
//       setCurrentPassword("");
//       setNewPassword("");
//       setConfirmPassword("");
//     };
  
//     return (
//       <div className="space-y-6">
//         <h1 className="text-2xl font-bold">Account Settings</h1>
  
//         {!isEditing ? (
//           <div className="bg-white p-6 rounded-xl shadow-sm">
//             <div className="space-y-4">
//               <div>
//                 <p className="text-sm text-gray-500">Full Name</p>
//                 <p className="font-medium">{accountData.name}</p>
//               </div>
  
//               <div>
//                 <p className="text-sm text-gray-500">Email</p>
//                 <p className="font-medium">{accountData.email}</p>
//               </div>
  
//               <div>
//                 <p className="text-sm text-gray-500">Phone Number</p>
//                 <p className="font-medium">{accountData.phone}</p>
//               </div>
  
//               <div>
//                 <p className="text-sm text-gray-500">Date of Birth</p>
//                 <p className="font-medium">{formatDate(accountData.birthDate)}</p>
//               </div>
              
//               <div>
//                 <p className="text-sm text-gray-500">Gender</p>
//                 <p className="font-medium capitalize">{accountData.gender || "Not specified"}</p>
//               </div>
  
//               <div className="pt-4">
//                 <button
//                   onClick={() => {
//                     setEditData({ ...accountData });
//                     setIsEditing(true);
//                   }}
//                   className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//                 >
//                   Edit Profile
//                 </button>
//               </div>
//             </div>
//           </div>
//         ) : (
//           <div className="bg-white p-6 rounded-xl shadow-sm">
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium mb-1">Full Name</label>
//                 <input
//                   type="text"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.name}
//                   onChange={(e) => setEditData({ ...editData, name: e.target.value })}
//                 />
//               </div>
  
//               <div>
//                 <label className="block text-sm font-medium mb-1">Email</label>
//                 <input
//                   type="email"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.email}
//                   onChange={(e) => setEditData({ ...editData, email: e.target.value })}
//                   disabled // Email should not be editable as it's the auth identifier
//                 />
//                 <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
//               </div>
  
//               <div>
//                 <label className="block text-sm font-medium mb-1">Phone Number</label>
//                 <input
//                   type="tel"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.phone}
//                   onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
//                 />
//               </div>
  
//               <div>
//                 <label className="block text-sm font-medium mb-1">Date of Birth</label>
//                 <input
//                   type="date"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.birthDate}
//                   onChange={(e) => setEditData({ ...editData, birthDate: e.target.value })}
//                 />
//               </div>
  
//               <div className="flex justify-end space-x-3 pt-4">
//                 <button
//                   onClick={() => setIsEditing(false)}
//                   className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={handleSave}
//                   className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//                 >
//                   Save Changes
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
  
//         <div className="bg-white rounded-xl shadow-sm p-6">
//           <h2 className="text-xl font-semibold mb-4">Change Password</h2>
//           <div className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium mb-1">Current Password</label>
//               <input
//                 type="password"
//                 className="w-full p-2 border border-gray-300 hover:bg-blue-50/50 transition-all duration-200 outline-none focus:border-blue-500 rounded"
//                 value={currentPassword}
//                 onChange={(e) => setCurrentPassword(e.target.value)}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-1">New Password</label>
//               <input
//                 type="password"
//                 className="w-full p-2 border border-gray-300 hover:bg-blue-50/50 transition-all duration-200 outline-none focus:border-blue-500 rounded"
//                 value={newPassword}
//                 onChange={(e) => setNewPassword(e.target.value)}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-1">Confirm New Password</label>
//               <input
//                 type="password"
//                 className="w-full p-2 border border-gray-300 hover:bg-blue-50/50 transition-all duration-200 outline-none focus:border-blue-500 rounded"
//                 value={confirmPassword}
//                 onChange={(e) => setConfirmPassword(e.target.value)}
//               />
//             </div>
//             {passwordError && (
//               <div className="text-red-500 text-sm">{passwordError}</div>
//             )}
//             <div className="flex justify-end pt-4">
//               <button
//                 onClick={handleChangePassword}
//                 className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//               >
//                 Update Password
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };
  
//   const renderActiveView = () => {
//     switch(activeView) {
//       case "appointments": return <AppointmentManagement />;
//       case "payments": return <PaymentHistory />;
//       case "account": return <AccountSettings />;
//       default: return <AppointmentManagement />;
//     }
//   };

//   if (loading) {
//     return (
//       <div className="w-full min-h-screen bg-blue-50 flex items-center justify-center">
//         <div className="text-center">
//           <p className="text-xl">Loading...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full min-h-screen bg-blue-50 text-black">
//       <div className="flex w-full relative">
//         <div className="bg-white shadow-md p-6 w-[25%] min-h-screen fixed top-0 left-0 z-10">
//           <div className="flex items-center mb-8 flex-col">
//             <img 
//               src={`/assets/${accountData.gender === 'female' ? 'patient_female.jpg' : 'patient_1.jpg'}`} 
//               className="rounded-full aspect-square w-[35%] mb-3" 
//               alt="Patient profile" 
//             />
//             <div className="w-full text-center">
//               <h2 className="text-xl font-semibold">{accountData.name}</h2>
//               <p className="text-gray-600">Patient</p>
//             </div>
//           </div>
//           <div className="nav flex flex-col h-full">
//             <nav className="space-y-2">
//               <button
//                 onClick={() => setActiveView("appointments")}
//                 className={`flex items-center w-full text-left p-3 rounded-lg transition ${
//                   activeView === "appointments" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
//                 }`}
//               >
//                 <Calendar size={20} className="mr-3" />
//                 My Appointments
//               </button>
//               <button
//                 onClick={() => setActiveView("payments")}
//                 className={`flex items-center w-full text-left p-3 rounded-lg transition ${
//                   activeView === "payments" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
//                 }`}
//               >
//                 <CurrencyDollar size={20} className="mr-3" />
//                 Payment History
//               </button>
//               <button
//                 onClick={() => setActiveView("account")}
//                 className={`flex items-center w-full text-left p-3 rounded-lg transition ${
//                   activeView === "account" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
//                 }`}
//               >
//                 <User size={20} className="mr-3" />
//                 Account Settings
//               </button>
//             </nav>
//             <div className="mt-auto space-y-2">
//               <Link href="/" className="w-full p-3 font-medium rounded-lg bg-blue-500 hover:bg-blue-700 transition-all duration-100 flex items-center text-white">
//                 <House size={20} className="mr-3"/>
//                 <h1>Home</h1>
//               </Link>
//               <button 
//                 onClick={handleSignOut}
//                 className="w-full p-3 font-medium rounded-lg bg-red-100 text-red-800 hover:bg-red-200 transition-all duration-100 flex items-center"
//               >
//                 Sign Out
//               </button>
//             </div>
//           </div>
//         </div>

//         <div className="w-[25%]"></div>

//         <div className="w-[75%] p-8">
//           {renderActiveView()}
//         </div>
//       </div>
//     </div>
//   );
// }
