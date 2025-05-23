// "use client";
// import { useState, useEffect } from "react";
// import { User, Calendar, CurrencyDollar, House, Clock, FirstAid, Receipt } from "@phosphor-icons/react";
// import Link from "next/link";
// import { auth, db } from "../../../lib/firebase";
// import { onAuthStateChanged, signOut } from "firebase/auth";
// import { doc, getDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
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
//   const [selectedItem, setSelectedItem] = useState(null);
//   const router = useRouter();

//   // Formatting functions
//   const formatDate = (date) => {
//     if (!date) return "N/A";
//     const d = date?.toDate?.() || new Date(date);
//     return d.toLocaleDateString("en-US", {
//       weekday: 'short',
//       month: 'short',
//       day: 'numeric',
//       year: 'numeric'
//     });
//   };

//   const formatTime = (time) => time || "N/A";

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat("id-ID", {
//       style: "currency",
//       currency: "IDR",
//       minimumFractionDigits: 0
//     }).format(amount || 0);
//   };

//   // Data fetching
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
//       if (currentUser) {
//         setUser(currentUser);
//         try {
//           await fetchUserData(currentUser.uid);
//           await fetchAllData(currentUser.uid);
//         } catch (error) {
//           console.error("Error loading data:", error);
//         }
//       } else {
//         router.push("/sign-in");
//       }
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, [router]);

//   const fetchUserData = async (uid) => {
//     try {
//       const userDoc = await getDoc(doc(db, "users", uid));
//       if (userDoc.exists()) {
//         setAccountData(userDoc.data());
//       }
//     } catch (error) {
//       console.error("Error fetching user data:", error);
//     }
//   };

//   const fetchAllData = async (uid) => {
//     try {
//       const [appointmentsData, paymentsData] = await Promise.all([
//         fetchAppointments(uid),
//         fetchPayments(uid)
//       ]);
      
//       // Link payments to appointments
//       const paymentsWithAppointments = await Promise.all(
//         paymentsData.map(async payment => {
//           if (payment.appointmentId) {
//             const appointmentDoc = await getDoc(doc(db, "appointments", payment.appointmentId));
//             if (appointmentDoc.exists()) {
//               payment.appointment = {
//                 id: appointmentDoc.id,
//                 ...appointmentDoc.data(),
//                 date: appointmentDoc.data().date?.toDate?.() || new Date(appointmentDoc.data().date)
//               };
//             }
//           }
//           return payment;
//         })
//       );

//       setAppointments(appointmentsData);
//       setPayments(paymentsWithAppointments);
//     } catch (error) {
//       console.error("Error fetching data:", error);
//     }
//   };

//   const fetchAppointments = async (uid) => {
//     try {
//       const q = query(
//         collection(db, "appointments"),
//         where("patientId", "==", uid)
//       );
//       const snapshot = await getDocs(q);
//       return snapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data(),
//         date: doc.data().date?.toDate?.() || new Date(doc.data().date)
//       })).sort((a, b) => b.date - a.date);
//     } catch (error) {
//       console.error("Error fetching appointments:", error);
//       return [];
//     }
//   };

//   const fetchPayments = async (uid) => {
//     try {
//       const q = query(
//         collection(db, "payments"),
//         where("patientId", "==", uid)
//       );
//       const snapshot = await getDocs(q);
//       return snapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data(),
//         date: doc.data().date?.toDate?.() || new Date(doc.data().date)
//       })).sort((a, b) => b.date - a.date);
//     } catch (error) {
//       console.error("Error fetching payments:", error);
//       return [];
//     }
//   };

//   // Actions
//   const handleCancelAppointment = async (appointmentId) => {
//     if (!confirm("Are you sure you want to cancel this appointment?")) return;
    
//     try {
//       const batch = writeBatch(db);
      
//       // Update appointment
//       const appointmentRef = doc(db, "appointments", appointmentId);
//       batch.update(appointmentRef, {
//         status: "cancelled",
//         updatedAt: new Date()
//       });

//       // Update associated payment if exists
//       const paymentQuery = query(
//         collection(db, "payments"),
//         where("appointmentId", "==", appointmentId),
//         limit(1)
//       );
//       const paymentSnapshot = await getDocs(paymentQuery);
      
//       if (!paymentSnapshot.empty) {
//         const paymentRef = doc(db, "payments", paymentSnapshot.docs[0].id);
//         batch.update(paymentRef, {
//           status: "cancelled",
//           updatedAt: new Date()
//         });
//       }

//       await batch.commit();
//       await fetchAllData(user.uid);
//       alert("Appointment cancelled successfully");
//     } catch (error) {
//       console.error("Error cancelling appointment:", error);
//       alert("Failed to cancel appointment");
//     }
//   };

//   const handlePayNow = async (paymentId) => {
//     try {
//       // In a real app, this would integrate with a payment gateway
//       // For demo purposes, we'll just mark as paid
//       await updateDoc(doc(db, "payments", paymentId), {
//         status: "completed",
//         paidAt: new Date()
//       });
      
//       await fetchAllData(user.uid);
//       alert("Payment marked as completed");
//     } catch (error) {
//       console.error("Error processing payment:", error);
//       alert("Failed to process payment");
//     }
//   };

//   // View Components
//   const AppointmentsView = () => (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <h1 className="text-2xl font-bold flex items-center gap-2">
//           <FirstAid size={24} /> My Appointments
//         </h1>
//         <button 
//           onClick={() => fetchAllData(user.uid)}
//           className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
//         >
//           Refresh
//         </button>
//       </div>

//       {appointments.length === 0 ? (
//         <div className="bg-white p-8 rounded-xl shadow text-center">
//           <p className="text-gray-500">No appointments found</p>
//           <Link href="/doctors" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
//             Book an Appointment
//           </Link>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           {appointments.map(appointment => (
//             <div 
//               key={appointment.id} 
//               className="bg-white p-5 rounded-xl shadow hover:shadow-md transition-shadow cursor-pointer"
//               onClick={() => setSelectedItem({ type: 'appointment', data: appointment })}
//             >
//               <div className="flex justify-between">
//                 <div>
//                   <h3 className="font-bold text-lg">{appointment.doctorName}</h3>
//                   <p className="text-gray-600">{appointment.specialization}</p>
//                 </div>
//                 <span className={`px-3 py-1 h-1/2 flex justify-center text-center items-center rounded-full text-sm ${
//                   appointment.status === "confirmed" ? "bg-blue-100 text-blue-800" :
//                   appointment.status === "completed" ? "bg-green-100 text-green-800" :
//                   appointment.status === "cancelled" ? "bg-red-100 text-red-800" :
//                   "bg-gray-100 text-gray-800"
//                 }`}>
//                   {appointment.status}
//                 </span>
//               </div>

//               <div className="mt-4 space-y-2">
//                 <div className="flex items-center gap-2 text-gray-600">
//                   <Calendar size={18} />
//                   <span>{formatDate(appointment.date)}</span>
//                 </div>
//                 <div className="flex items-center gap-2 text-gray-600">
//                   <Clock size={18} />
//                   <span>{formatTime(appointment.time)}</span>
//                 </div>
//                 <div className="pt-2">
//                   <span className="font-medium">Complaint:</span> {appointment.complaint || "Not specified"}
//                 </div>
//               </div>

//               <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
//                 <span className="font-semibold text-blue-600">
//                   {formatCurrency(appointment.price)}
//                 </span>
//                 {appointment.status === "confirmed" && (
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleCancelAppointment(appointment.id);
//                     }}
//                     className="px-3 py-1 text-sm text-red-600 hover:text-red-800 bg-red-50 rounded-lg"
//                   >
//                     Cancel
//                   </button>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );

//   const PaymentsView = () => {
//     const stats = {
//       total: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
//       completed: payments.filter(p => p.status === "completed").length,
//       pending: payments.filter(p => p.status === "pending").length
//     };

//     return (
//       <div className="space-y-6 text-black">
//         <div className="flex justify-between items-center">
//           <h1 className="text-2xl font-bold flex items-center gap-2">
//             <Receipt size={24} /> Payment History
//           </h1>
//           <button 
//             onClick={() => fetchAllData(user.uid)}
//             className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
//           >
//             Refresh
//           </button>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <div className="bg-white p-4 rounded-xl shadow">
//             <p className="text-gray-500">Total Spent</p>
//             <p className="text-2xl font-bold">{formatCurrency(stats.total)}</p>
//           </div>
//           <div className="bg-white p-4 rounded-xl shadow">
//             <p className="text-gray-500">Completed Payments</p>
//             <p className="text-2xl font-bold">{stats.completed}</p>
//           </div>
//           <div className="bg-white p-4 rounded-xl shadow">
//             <p className="text-gray-500">Pending Payments</p>
//             <p className="text-2xl font-bold">{stats.pending}</p>
//           </div>
//         </div>

//         {payments.length === 0 ? (
//           <div className="bg-white p-8 rounded-xl shadow text-center">
//             <p className="text-gray-500">No payment records found</p>
//           </div>
//         ) : (
//           <div className="bg-white rounded-xl shadow overflow-hidden">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {payments.map(payment => (
//                   <tr 
//                     key={payment.id} 
//                     className="hover:bg-gray-50 cursor-pointer"
//                     onClick={() => setSelectedItem({ type: 'payment', data: payment })}
//                   >
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       {formatDate(payment.date)}
//                     </td>
//                     <td className="px-6 py-4">
//                       <div className="font-medium">{payment.description}</div>
//                       {payment.appointment && (
//                         <div className="text-sm text-gray-500 mt-1">
//                           {formatDate(payment.appointment.date)} at {payment.appointment.time}
//                         </div>
//                       )}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       {formatCurrency(payment.amount)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span className={`px-2 py-1 rounded-full text-xs ${
//                         payment.status === "completed" ? "bg-green-100 text-green-800" :
//                         payment.status === "pending" ? "bg-yellow-100 text-yellow-800" :
//                         "bg-gray-100 text-gray-800"
//                       }`}>
//                         {payment.status}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       {payment.status === "pending" && (
//                         <button
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             handlePayNow(payment.id);
//                           }}
//                           className="text-sm text-blue-600 hover:text-blue-800"
//                         >
//                           Pay Now
//                         </button>
//                       )}
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

//   const AccountView = () => (
//     <div className="space-y-6">
//       <h1 className="text-2xl font-bold flex items-center gap-2">
//         <User size={24} /> Account Settings
//       </h1>
      
//       <div className="bg-white p-6 rounded-xl shadow">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div>
//             <h2 className="font-semibold text-lg mb-4">Personal Information</h2>
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-500">Full Name</label>
//                 <p className="mt-1 font-medium">{accountData.name}</p>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-500">Email</label>
//                 <p className="mt-1 font-medium">{accountData.email}</p>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium text-gray-500">Phone</label>
//                 <p className="mt-1 font-medium">{accountData.phone || "Not provided"}</p>
//               </div>
//             </div>
//           </div>
          
//           <div>
//             <h2 className="font-semibold text-lg mb-4">Account Security</h2>
//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-500">Last Login</label>
//                 <p className="mt-1 font-medium">{formatDate(new Date())}</p>
//               </div>
//               <div>
//                 <button
//                   onClick={() => signOut(auth)}
//                   className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
//                 >
//                   Sign Out
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );

//   const DetailModal = () => {
//     if (!selectedItem) return null;
    
//     const { type, data } = selectedItem;
//     const isAppointment = type === 'appointment';
//     const isPayment = type === 'payment';

//     return (
//       <div className="fixed inset-0 text-black bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//         <div className="bg-white rounded-xl w-full max-w-md">
//           <div className="p-6">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-bold">
//                 {isAppointment ? 'Appointment Details' : 'Payment Details'}
//               </h2>
//               <button 
//                 onClick={() => setSelectedItem(null)}
//                 className="text-gray-500 hover:text-gray-700"
//               >
//                 ✕
//               </button>
//             </div>

//             <div className="space-y-4">
//               {isAppointment && (
//                 <>
//                   <div>
//                     <p className="text-sm text-gray-500">Doctor</p>
//                     <p className="font-medium">{data.doctorName}</p>
//                     <p className="text-gray-600">{data.specialization}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500">Date & Time</p>
//                     <p className="font-medium">
//                       {formatDate(data.date)} at {formatTime(data.time)}
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500">Complaint</p>
//                     <p className="font-medium">{data.complaint || "Not specified"}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500">Price</p>
//                     <p className="font-medium text-blue-600">{formatCurrency(data.price)}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500">Status</p>
//                     <span className={`px-2 py-1 rounded-full text-xs ${
//                       data.status === "confirmed" ? "bg-blue-100 text-blue-800" :
//                       data.status === "completed" ? "bg-green-100 text-green-800" :
//                       data.status === "cancelled" ? "bg-red-100 text-red-800" :
//                       "bg-gray-100 text-gray-800"
//                     }`}>
//                       {data.status}
//                     </span>
//                   </div>
//                 </>
//               )}

//               {isPayment && (
//                 <>
//                   <div>
//                     <p className="text-sm text-gray-500">Payment ID</p>
//                     <p className="font-medium">{data.id.substring(0, 8).toUpperCase()}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500">Description</p>
//                     <p className="font-medium">{data.description}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500">Amount</p>
//                     <p className="font-medium text-blue-600">{formatCurrency(data.amount)}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500">Payment Method</p>
//                     <p className="font-medium capitalize">{data.paymentMethod || "Not specified"}</p>
//                   </div>
//                   <div>
//                     <p className="text-sm text-gray-500">Status</p>
//                     <span className={`px-2 py-1 rounded-full text-xs ${
//                       data.status === "completed" ? "bg-green-100 text-green-800" :
//                       data.status === "pending" ? "bg-yellow-100 text-yellow-800" :
//                       "bg-gray-100 text-gray-800"
//                     }`}>
//                       {data.status}
//                     </span>
//                   </div>
//                   {data.appointment && (
//                     <div className="pt-4 border-t border-gray-200">
//                       <p className="font-medium text-gray-700 mb-2">Associated Appointment</p>
//                       <div className="text-sm space-y-1">
//                         <p>
//                           <span className="text-gray-500">Doctor:</span> {data.appointment.doctorName}
//                         </p>
//                         <p>
//                           <span className="text-gray-500">Date:</span> {formatDate(data.appointment.date)}
//                         </p>
//                         <p>
//                           <span className="text-gray-500">Time:</span> {data.appointment.time}
//                         </p>
//                       </div>
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>

//             <div className="mt-6 pt-4 border-t border-gray-200">
//               <button
//                 onClick={() => setSelectedItem(null)}
//                 className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center text-black justify-center min-h-screen">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
//           <p className="mt-4">Loading your dashboard...</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen text-black bg-gray-50">
//       {/* Sidebar */}
//       <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
//         <div className="flex flex-col h-full">
//           <div className="p-4 flex items-center gap-3 border-b border-gray-200">
//             <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
//               <User size={20} className="text-blue-600" />
//             </div>
//             <div>
//               <h2 className="font-semibold">{accountData.name}</h2>
//               <p className="text-xs text-gray-500">Patient</p>
//             </div>
//           </div>

//           <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
//             <button
//               onClick={() => setActiveView("appointments")}
//               className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
//                 activeView === "appointments" ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100"
//               }`}
//             >
//               <FirstAid size={20} />
//               Appointments
//             </button>
//             <button
//               onClick={() => setActiveView("payments")}
//               className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
//                 activeView === "payments" ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100"
//               }`}
//             >
//               <Receipt size={20} />
//               Payments
//             </button>
//             <button
//               onClick={() => setActiveView("account")}
//               className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
//                 activeView === "account" ? "bg-blue-50 text-blue-600" : "hover:bg-gray-100"
//               }`}
//             >
//               <User size={20} />
//               Account
//             </button>
//           </nav>

//           <div className="p-4 border-t border-gray-200">
//             <Link
//               href="/"
//               className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100"
//             >
//               <House size={20} />
//               Back to Home
//             </Link>
//             <button
//               onClick={() => signOut(auth)}
//               className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left hover:bg-gray-100 text-red-600"
//             >
//               Sign Out
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="ml-64 p-8">
//         {activeView === "appointments" && <AppointmentsView />}
//         {activeView === "payments" && <PaymentsView />}
//         {activeView === "account" && <AccountView />}
//       </div>

//       <DetailModal />
//     </div>
//   );
// }