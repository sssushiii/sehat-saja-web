// "use client";

// import { useState, useEffect } from "react";
// import {
//   User,
//   Calendar,
//   CurrencyDollar,
//   House,
// } from "@phosphor-icons/react/dist/ssr";
// import Link from "next/link";
// import { auth, db } from "../../../lib/firebase";
// import {
//   onAuthStateChanged,
//   signOut,
//   EmailAuthProvider,
//   reauthenticateWithCredential,
//   updatePassword,
// } from "firebase/auth";
// import {
//   doc,
//   getDoc,
//   updateDoc,
//   collection,
//   query,
//   where,
//   getDocs,
//   orderBy,
// } from "firebase/firestore";
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
//     gender: "",
//   });

//   const router = useRouter();

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
//           birthDate:
//             userData.birthDate || new Date().toISOString().split("T")[0],
//           gender: userData.gender || "",
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

//       // Use only where clause without orderBy to avoid index requirements
//       const q = query(appointmentsRef, where("patientId", "==", uid));

//       const querySnapshot = await getDocs(q);
//       const appointmentsData = [];

//       querySnapshot.forEach((doc) => {
//         appointmentsData.push({
//           id: doc.id,
//           ...doc.data(),
//         });
//       });

//       // Sort appointments by date client-side instead of using orderBy
//       appointmentsData.sort((a, b) => {
//         // First try sorting by createdAt if available
//         if (a.createdAt && b.createdAt) {
//           return new Date(b.createdAt) - new Date(a.createdAt);
//         }
//         // Fall back to appointment date
//         return new Date(b.date) - new Date(a.date);
//       });

//       setAppointments(appointmentsData);
//     } catch (error) {
//       console.error("Error fetching appointments:", error);
//     }
//   };

//   // Fetch payment history from Firestore
//   // Updates for fetchPayments function in the patient dashboard

//   const fetchPayments = async (uid) => {
//     try {
//       const paymentsRef = collection(db, "payments");

//       const q = query(paymentsRef, where("patientId", "==", uid));

//       const querySnapshot = await getDocs(q);
//       const paymentsData = [];

//       querySnapshot.forEach((doc) => {
//         paymentsData.push({
//           id: doc.id,
//           ...doc.data(),
//         });
//       });

//       // Sort payments by date client-side
//       paymentsData.sort((a, b) => {
//         // First try sorting by createdAt if available
//         if (a.createdAt && b.createdAt) {
//           return new Date(b.createdAt) - new Date(a.createdAt);
//         }
//         // Fall back to payment date
//         return new Date(b.date) - new Date(a.date);
//       });

//       // For each payment, check if there's an associated appointment
//       for (const payment of paymentsData) {
//         if (payment.appointmentId) {
//           try {
//             const appointmentRef = doc(
//               db,
//               "appointments",
//               payment.appointmentId
//             );
//             const appointmentDoc = await getDoc(appointmentRef);

//             if (appointmentDoc.exists()) {
//               payment.appointmentData = appointmentDoc.data();
//             }
//           } catch (error) {
//             console.error("Error fetching appointment for payment:", error);
//           }
//         }
//       }

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

//     try {
//       // Handle both string dates and Firestore timestamps
//       const date =
//         typeof dateStr === "object" && "toDate" in dateStr
//           ? dateStr.toDate()
//           : new Date(dateStr);

//       return date.toLocaleDateString("id-ID", {
//         weekday: "long",
//         day: "numeric",
//         month: "long",
//         year: "numeric",
//       });
//     } catch (error) {
//       console.error("Error formatting date:", error);
//       return dateStr.toString();
//     }
//   };

//   const formatRupiah = (value) =>
//     new Intl.NumberFormat("id-ID", {
//       style: "currency",
//       currency: "IDR",
//       minimumFractionDigits: 0,
//     }).format(value);

//   const AppointmentManagement = () => {
//     const [selectedAppointment, setSelectedAppointment] = useState(null);
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState("");

//     const handleCancel = async (appointmentId) => {
//       if (window.confirm("Are you sure you want to cancel this appointment?")) {
//         try {
//           setIsLoading(true);
//           setError("");

//           // Update the appointment status in Firestore
//           const appointmentRef = doc(db, "appointments", appointmentId);
//           await updateDoc(appointmentRef, {
//             status: "cancelled",
//             updatedAt: new Date(),
//           });

//           // Update local state
//           const updated = appointments.map((a) =>
//             a.id === appointmentId ? { ...a, status: "cancelled" } : a
//           );
//           setAppointments(updated);

//           alert("Appointment cancelled successfully.");
//         } catch (error) {
//           console.error("Error cancelling appointment:", error);
//           setError("Failed to cancel appointment. Please try again.");
//         } finally {
//           setIsLoading(false);
//         }
//       }
//     };

//     const refreshAppointments = async () => {
//       if (!user) return;
//       setIsLoading(true);
//       try {
//         await fetchAppointments(user.uid);
//       } catch (error) {
//         setError("Failed to refresh appointments. Please try again.");
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     return (
//       <div className="space-y-6">
//         <div className="flex justify-between items-center">
//           <h1 className="text-2xl font-bold">My Appointments</h1>
//           <button
//             onClick={refreshAppointments}
//             className="px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
//             disabled={isLoading}
//           >
//             {isLoading ? "Refreshing..." : "Refresh"}
//           </button>
//         </div>

//         {error && (
//           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
//             {error}
//           </div>
//         )}

//         {appointments.length === 0 ? (
//           <div className="bg-white p-6 rounded-xl shadow-sm text-center">
//             <p>You don't have any appointments yet.</p>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {appointments.map((appointment) => (
//               <div
//                 key={appointment.id}
//                 className="bg-white p-6 rounded-xl shadow-sm"
//               >
//                 <div className="flex justify-between items-start">
//                   <div>
//                     <h3 className="font-semibold text-lg">
//                       With {appointment.doctorName}
//                     </h3>
//                     <p className="text-gray-600">
//                       {formatDate(appointment.date)} at {appointment.time}
//                     </p>
//                     <p className="mt-2 text-gray-700">
//                       Complaint: {appointment.complaint}
//                     </p>
//                   </div>
//                   <div className="flex items-center space-x-3">
//                     <span
//                       className={`px-3 py-1 rounded-full text-sm font-medium ${
//                         appointment.status === "confirmed"
//                           ? "bg-blue-100 text-blue-800"
//                           : appointment.status === "completed"
//                           ? "bg-green-100 text-green-800"
//                           : appointment.status === "cancelled"
//                           ? "bg-red-100 text-red-800"
//                           : "bg-gray-100 text-gray-800"
//                       }`}
//                     >
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
//                       disabled={isLoading}
//                     >
//                       {isLoading ? "Processing..." : "Cancel Appointment"}
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
//                   <p className="font-medium">
//                     {selectedAppointment.doctorName}
//                   </p>
//                 </div>

//                 <div>
//                   <p className="text-sm text-gray-500">Date & Time</p>
//                   <p className="font-medium">
//                     {formatDate(selectedAppointment.date)} at{" "}
//                     {selectedAppointment.time}
//                   </p>
//                 </div>

//                 <div>
//                   <p className="text-sm text-gray-500">Complaint</p>
//                   <p className="font-medium">{selectedAppointment.complaint}</p>
//                 </div>

//                 <div>
//                   <p className="text-sm text-gray-500">Status</p>
//                   <p
//                     className={`font-medium px-2 py-1 inline-block rounded ${
//                       selectedAppointment.status === "confirmed"
//                         ? "bg-blue-100 text-blue-800"
//                         : selectedAppointment.status === "completed"
//                         ? "bg-green-100 text-green-800"
//                         : selectedAppointment.status === "cancelled"
//                         ? "bg-red-100 text-red-800"
//                         : "bg-gray-100 text-gray-800"
//                     }`}
//                   >
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

//   // Updates for the PaymentHistory component in the patient dashboard

//   const PaymentHistory = () => {
//     const [isLoading, setIsLoading] = useState(false);
//     const [error, setError] = useState("");
//     const [selectedPayment, setSelectedPayment] = useState(null);

//     const totalSpent = payments.reduce(
//       (sum, payment) => sum + (parseFloat(payment.amount) || 0),
//       0
//     );

//     const refreshPayments = async () => {
//       if (!user) return;
//       setIsLoading(true);
//       try {
//         await fetchPayments(user.uid);
//         setError("");
//       } catch (error) {
//         setError("Failed to refresh payment history. Please try again.");
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     const getPaymentStatusBadge = (status) => {
//       switch (status) {
//         case "completed":
//           return (
//             <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
//               Completed
//             </span>
//           );
//         case "pending":
//           return (
//             <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
//               Pending
//             </span>
//           );
//         case "cancelled":
//           return (
//             <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
//               Cancelled
//             </span>
//           );
//         default:
//           return (
//             <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
//               {status}
//             </span>
//           );
//       }
//     };

//     const handlePayNow = async (paymentId) => {
//       if (!user) return;

//       try {
//         setIsLoading(true);

//         // Mock payment process - in a real app this would connect to a payment gateway
//         // For now, we'll just update the payment status to completed

//         const paymentRef = doc(db, "payments", paymentId);
//         await updateDoc(paymentRef, {
//           status: "completed",
//           completedAt: new Date().toISOString(),
//         });

//         // If the payment is associated with an appointment, you might want to update that too
//         const paymentToUpdate = payments.find((p) => p.id === paymentId);
//         if (paymentToUpdate && paymentToUpdate.appointmentId) {
//           const appointmentRef = doc(
//             db,
//             "appointments",
//             paymentToUpdate.appointmentId
//           );
//           await updateDoc(appointmentRef, {
//             paymentStatus: "completed",
//           });
//         }

//         // Refresh the payments list
//         await fetchPayments(user.uid);

//         // Show success message
//         alert("Payment completed successfully!");
//       } catch (error) {
//         console.error("Error processing payment:", error);
//         setError("Failed to process payment. Please try again.");
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     const handleViewDetails = (payment) => {
//       setSelectedPayment(payment);
//     };

//     return (
//       <div className="space-y-6">
//         <div className="flex justify-between items-center">
//           <h1 className="text-2xl font-bold">Payment History</h1>
//           <button
//             onClick={refreshPayments}
//             className="px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
//             disabled={isLoading}
//           >
//             {isLoading ? "Refreshing..." : "Refresh"}
//           </button>
//         </div>

//         {error && (
//           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
//             {error}
//           </div>
//         )}

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//           <div className="bg-white p-6 rounded-xl shadow-sm">
//             <p className="text-gray-500">Total Spent</p>
//             <p className="text-2xl font-bold">{formatRupiah(totalSpent)}</p>
//           </div>
//           <div className="bg-white p-6 rounded-xl shadow-sm">
//             <p className="text-gray-500">Completed Payments</p>
//             <p className="text-2xl font-bold">
//               {payments.filter((p) => p.status === "completed").length}
//             </p>
//           </div>
//           <div className="bg-white p-6 rounded-xl shadow-sm">
//             <p className="text-gray-500">Pending Payments</p>
//             <p className="text-2xl font-bold">
//               {payments.filter((p) => p.status === "pending").length}
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
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Payment ID
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Appointment
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Amount
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Date
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {payments.map((payment) => (
//                   <tr key={payment.id} className="hover:bg-gray-50">
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="font-medium">
//                         {(payment.id || "").substring(0, 8).toUpperCase()}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       {payment.description || "N/A"}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       {formatRupiah(payment.amount || 0)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       {formatDate(payment.date)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       {getPaymentStatusBadge(payment.status)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <button
//                         onClick={() => handleViewDetails(payment)}
//                         className="text-blue-600 hover:text-blue-800"
//                       >
//                         Details
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}

//         {/* Payment Details Modal */}
//         {selectedPayment && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white rounded-xl p-6 w-full max-w-md">
//               <div className="flex justify-between items-center mb-4">
//                 <h2 className="text-xl font-bold">Payment Details</h2>
//                 <button
//                   onClick={() => setSelectedPayment(null)}
//                   className="text-gray-500 hover:text-gray-700"
//                 >
//                   ✕
//                 </button>
//               </div>

//               <div className="space-y-3">
//                 <div>
//                   <p className="text-sm text-gray-500">Payment ID</p>
//                   <p className="font-medium">
//                     {selectedPayment.id.substring(0, 8).toUpperCase()}
//                   </p>
//                 </div>

//                 <div>
//                   <p className="text-sm text-gray-500">Description</p>
//                   <p className="font-medium">{selectedPayment.description}</p>
//                 </div>

//                 <div>
//                   <p className="text-sm text-gray-500">Amount</p>
//                   <p className="font-medium">
//                     {formatRupiah(selectedPayment.amount || 0)}
//                   </p>
//                 </div>

//                 <div>
//                   <p className="text-sm text-gray-500">Payment Method</p>
//                   <p className="font-medium capitalize">
//                     {selectedPayment.paymentMethod || "Not specified"}
//                   </p>
//                 </div>

//                 <div>
//                   <p className="text-sm text-gray-500">Date</p>
//                   <p className="font-medium">
//                     {formatDate(selectedPayment.date)}
//                   </p>
//                 </div>

//                 <div>
//                   <p className="text-sm text-gray-500">Status</p>
//                   <div>{getPaymentStatusBadge(selectedPayment.status)}</div>
//                 </div>

//                 {selectedPayment.appointmentData && (
//                   <div className="mt-2 pt-2 border-t border-gray-200">
//                     <p className="font-medium text-gray-700 mb-2">
//                       Associated Appointment
//                     </p>

//                     <div className="text-sm space-y-1">
//                       <p>
//                         <span className="text-gray-500">Doctor:</span>{" "}
//                         {selectedPayment.appointmentData.doctorName}
//                       </p>
//                       <p>
//                         <span className="text-gray-500">Date:</span>{" "}
//                         {formatDate(selectedPayment.appointmentData.date)}
//                       </p>
//                       <p>
//                         <span className="text-gray-500">Time:</span>{" "}
//                         {selectedPayment.appointmentData.time}
//                       </p>
//                       <p>
//                         <span className="text-gray-500">Status:</span>{" "}
//                         <span
//                           className={`px-2 py-0.5 rounded-full text-xs ${
//                             selectedPayment.appointmentData.status ===
//                             "confirmed"
//                               ? "bg-blue-100 text-blue-800"
//                               : selectedPayment.appointmentData.status ===
//                                 "completed"
//                               ? "bg-green-100 text-green-800"
//                               : selectedPayment.appointmentData.status ===
//                                 "cancelled"
//                               ? "bg-red-100 text-red-800"
//                               : "bg-gray-100 text-gray-800"
//                           }`}
//                         >
//                           {selectedPayment.appointmentData.status}
//                         </span>
//                       </p>
//                     </div>
//                   </div>
//                 )}

//                 {selectedPayment && selectedPayment.status === "pending" && (
//                   <button
//                     onClick={() => handlePayNow(selectedPayment.id)}
//                     className="w-full mt-2 py-2 bg-green-600 text-white rounded hover:bg-green-700"
//                     disabled={isLoading}
//                   >
//                     {isLoading ? "Processing..." : "Pay Now"}
//                   </button>
//                 )}

//                 <div className="pt-4">
//                   <button
//                     onClick={() => setSelectedPayment(null)}
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

//   const AccountSettings = () => {
//     const [isEditing, setIsEditing] = useState(false);
//     const [editData, setEditData] = useState({ ...accountData });

//     const [currentPassword, setCurrentPassword] = useState("");
//     const [newPassword, setNewPassword] = useState("");
//     const [confirmPassword, setConfirmPassword] = useState("");
//     const [passwordError, setPasswordError] = useState("");
//     const [passwordSuccess, setPasswordSuccess] = useState("");
//     const [isPasswordLoading, setIsPasswordLoading] = useState(false);

//     const handleSave = async () => {
//       try {
//         if (!user) return;

//         // Update the user document in Firestore
//         const userDocRef = doc(db, "users", user.uid);
//         await updateDoc(userDocRef, {
//           name: editData.name,
//           email: editData.email,
//           phone: editData.phone,
//           birthDate: editData.birthDate,
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
//       setPasswordSuccess("");

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

//       try {
//         setIsPasswordLoading(true);

//         const credential = EmailAuthProvider.credential(
//           user.email,
//           currentPassword
//         );

//         await reauthenticateWithCredential(user, credential);
//         await updatePassword(user, newPassword);

//         const userDocRef = doc(db, "users", user.uid);
//         await updateDoc(userDocRef, {
//           lastPasswordChange: new Date().toISOString(),
//         });

//         setCurrentPassword("");
//         setNewPassword("");
//         setConfirmPassword("");
//         setPasswordSuccess("Password changed successfully!");
//       } catch (error) {
//         console.error("Error changing password:", error);

//         if (error.code === "auth/wrong-password") {
//           setPasswordError("Current password is incorrect.");
//         } else if (error.code === "auth/too-many-requests") {
//           setPasswordError(
//             "Too many unsuccessful attempts. Please try again later."
//           );
//         } else {
//           setPasswordError("Failed to change password. " + error.message);
//         }
//       } finally {
//         setIsPasswordLoading(false);
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
//                 <p className="text-sm text-gray-500">Date of Birth</p>
//                 <p className="font-medium">
//                   {formatDate(accountData.birthDate)}
//                 </p>
//               </div>

//               <div>
//                 <p className="text-sm text-gray-500">Gender</p>
//                 <p className="font-medium capitalize">
//                   {accountData.gender || "Not specified"}
//                 </p>
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
//                 <label className="block text-sm font-medium mb-1">
//                   Full Name
//                 </label>
//                 <input
//                   type="text"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.name}
//                   onChange={(e) =>
//                     setEditData({ ...editData, name: e.target.value })
//                   }
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
//                   disabled // Email should not be editable as it's the auth identifier
//                 />
//                 <p className="text-xs text-gray-500 mt-1">
//                   Email cannot be changed
//                 </p>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Phone Number
//                 </label>
//                 <input
//                   type="tel"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.phone}
//                   onChange={(e) =>
//                     setEditData({ ...editData, phone: e.target.value })
//                   }
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium mb-1">
//                   Date of Birth
//                 </label>
//                 <input
//                   type="date"
//                   className="w-full p-2 border border-gray-300 rounded"
//                   value={editData.birthDate}
//                   onChange={(e) =>
//                     setEditData({ ...editData, birthDate: e.target.value })
//                   }
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
//               <label className="block text-sm font-medium mb-1">
//                 Current Password
//               </label>
//               <input
//                 type="password"
//                 className="w-full p-2 border border-gray-300 hover:bg-blue-50/50 transition-all duration-200 outline-none focus:border-blue-500 rounded"
//                 value={currentPassword}
//                 onChange={(e) => setCurrentPassword(e.target.value)}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-1">
//                 New Password
//               </label>
//               <input
//                 type="password"
//                 className="w-full p-2 border border-gray-300 hover:bg-blue-50/50 transition-all duration-200 outline-none focus:border-blue-500 rounded"
//                 value={newPassword}
//                 onChange={(e) => setNewPassword(e.target.value)}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-1">
//                 Confirm New Password
//               </label>
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
//             {passwordSuccess && (
//               <div className="text-green-500 text-sm">{passwordSuccess}</div>
//             )}
//             <div className="flex justify-end pt-4">
//               <button
//                 onClick={handleChangePassword}
//                 disabled={isPasswordLoading}
//                 className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${
//                   isPasswordLoading ? "opacity-50 cursor-not-allowed" : ""
//                 }`}
//               >
//                 {isPasswordLoading ? "Updating..." : "Update Password"}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const renderActiveView = () => {
//     switch (activeView) {
//       case "appointments":
//         return <AppointmentManagement />;
//       case "payments":
//         return <PaymentHistory />;
//       case "account":
//         return <AccountSettings />;
//       default:
//         return <AppointmentManagement />;
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
//               src={`/assets/${
//                 accountData.gender === "female"
//                   ? "patient_female.jpg"
//                   : "patient_1.jpg"
//               }`}
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
//                   activeView === "appointments"
//                     ? "bg-blue-50 text-blue-600 font-medium"
//                     : "hover:bg-gray-100"
//                 }`}
//               >
//                 <Calendar size={20} className="mr-3" />
//                 My Appointments
//               </button>
//               <button
//                 onClick={() => setActiveView("payments")}
//                 className={`flex items-center w-full text-left p-3 rounded-lg transition ${
//                   activeView === "payments"
//                     ? "bg-blue-50 text-blue-600 font-medium"
//                     : "hover:bg-gray-100"
//                 }`}
//               >
//                 <CurrencyDollar size={20} className="mr-3" />
//                 Payment History
//               </button>
//               <button
//                 onClick={() => setActiveView("account")}
//                 className={`flex items-center w-full text-left p-3 rounded-lg transition ${
//                   activeView === "account"
//                     ? "bg-blue-50 text-blue-600 font-medium"
//                     : "hover:bg-gray-100"
//                 }`}
//               >
//                 <User size={20} className="mr-3" />
//                 Account Settings
//               </button>
//             </nav>
//             <div className="mt-auto space-y-2">
//               <Link
//                 href="/"
//                 className="w-full p-3 font-medium rounded-lg bg-blue-500 hover:bg-blue-700 transition-all duration-100 flex items-center text-white"
//               >
//                 <House size={20} className="mr-3" />
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

//         <div className="w-[75%] p-8">{renderActiveView()}</div>
//       </div>
//     </div>
//   );
// }



