"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  User,
  Calendar,
  CurrencyDollar,
  House,
  Clock,
  FirstAid,
  Receipt,
  Camera,
  UsersThree,
  CaretRight,
  ChatCircleDots,
  Images,
  Archive,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../lib/firebase";
import {
  onAuthStateChanged,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  Timestamp,
  onSnapshot,
  arrayUnion,
  serverTimestamp,
  limit,
  orderBy,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

export default function DoctorDashboard() {
  const [activeView, setActiveView] = useState("schedule");
  const [doctorData, setDoctorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [payments, setPayments] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [newTime, setNewTime] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeChats, setActiveChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [imageUpload, setImageUpload] = useState(null);
  const chatFileInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState(null);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

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

  // PERBAIKAN USEEFFECT - Ganti kedua useEffect yang ada dengan yang ini

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();

            // Cek role dan redirect sesuai
            if (userData.role === "doctor") {
              setUser(currentUser);

              // Fetch data doctor dan semua data terkait
              await fetchDoctorData(currentUser.uid);
              await fetchAllData(currentUser.uid);
            } else if (userData.role === "user") {
              router.push("/dashboard/patient");
              return; // Penting: return agar tidak lanjut eksekusi
            } else if (userData.role === "admin") {
              router.push("/dashboard/admin");
              return; // Penting: return agar tidak lanjut eksekusi
            } else {
              // Role tidak dikenal, redirect ke home
              router.push("/");
              return;
            }
          } else {
            // User document tidak ada, redirect ke home
            router.push("/");
            return;
          }
        } catch (err) {
          console.error("Error checking user role:", err);
          router.push("/sign-in-doctor");
          return;
        }
      } else {
        // User tidak login, redirect ke sign-in
        router.push("/sign-in-doctor");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]); // Hapus fetchAllData dari dependency

  // PERBAIKAN FETCHALLDATA - Tambahkan validasi uid
  const fetchAllData = async (uid) => {
    // Validasi uid terlebih dahulu
    if (!uid) {
      console.error("fetchAllData called without uid");
      return;
    }

    try {
      const [appointmentsData, schedulesData, paymentsData] = await Promise.all(
        [fetchAppointments(uid), fetchSchedules(uid), fetchPayments(uid)]
      );

      // PERBAIKAN: Hilangkan setUsers(usersData) karena usersData tidak terdefinisi
      setAppointments(appointmentsData);
      setSchedules(schedulesData);
      setPayments(paymentsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // PERBAIKAN UNTUK SEMUA FUNGSI FETCH - Tambahkan validasi uid
  const fetchAppointments = async (uid) => {
    // Validasi uid
    if (!uid) {
      console.error("fetchAppointments called without uid");
      return [];
    }

    try {
      const q = query(
        collection(db, "appointments"),
        where("doctorId", "==", uid)
      );
      const snapshot = await getDocs(q);

      const appointmentPromises = snapshot.docs.map(async (docSnap) => {
        const appointmentData = docSnap.data();

        let patientName = appointmentData.patientName || "Unknown";
        let patientAge = appointmentData.patientAge || "N/A";

        if (appointmentData.patientId) {
          try {
            const patientRef = doc(db, "users", appointmentData.patientId);
            const patientDoc = await getDoc(patientRef);

            if (patientDoc.exists()) {
              const patientData = patientDoc.data();
              patientName = patientData.name || "Unknown";

              // Hitung umur dari birthDate
              if (patientData.birthDate) {
                const birthDate = new Date(patientData.birthDate);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (
                  m < 0 ||
                  (m === 0 && today.getDate() < birthDate.getDate())
                ) {
                  age--;
                }
                patientAge = age;
              }
            }
          } catch (error) {
            console.error("Error fetching patient data:", error);
          }
        }

        return {
          id: docSnap.id,
          patientId: appointmentData.patientId || "",
          patientName,
          patientAge,
          date:
            appointmentData.date?.toDate?.() ||
            new Date(
              appointmentData.appointmentDate ||
                appointmentData.date ||
                Date.now()
            ),
          time:
            appointmentData.appointmentTime || appointmentData.time || "N/A",
          complaint: appointmentData.complaint || "",
          status: appointmentData.status || "pending",
          createdAt:
            appointmentData.createdAt?.toDate?.() ||
            new Date(appointmentData.createdAt || Date.now()),
        };
      });

      const resolvedAppointments = await Promise.all(appointmentPromises);
      return resolvedAppointments.sort((a, b) => b.date - a.date);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      return [];
    }
  };

  const fetchSchedules = async (uid) => {
    // Validasi uid
    if (!uid) {
      console.error("fetchSchedules called without uid");
      return [];
    }

    try {
      const q = query(
        collection(db, "schedules"),
        where("doctorId", "==", uid)
      );
      const snapshot = await getDocs(q);
      const schedulesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        date: doc.data().date?.toDate?.() || new Date(doc.data().date),
        time: doc.data().time || "",
        status: doc.data().status || "available",
      }));

      return schedulesData;
    } catch (error) {
      console.error("Error fetching schedules:", error);
      return [];
    }
  };

  const fetchPayments = async (uid) => {
    // Validasi uid
    if (!uid) {
      console.error("fetchPayments called without uid");
      return [];
    }

    try {
      // Cari payments berdasarkan appointmentId yang terkait dengan doctor
      const appointmentsQuery = query(
        collection(db, "appointments"),
        where("doctorId", "==", uid)
      );
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      const appointmentIds = appointmentsSnapshot.docs.map((doc) => doc.id);

      if (appointmentIds.length === 0) {
        return [];
      }

      // Fetch payments yang appointmentId nya ada di list appointmentIds
      const paymentsQuery = query(collection(db, "payments"));
      const paymentsSnapshot = await getDocs(paymentsQuery);

      const paymentsData = paymentsSnapshot.docs
        .map((doc) => {
          const paymentData = doc.data();

          // Filter hanya payment yang appointmentId nya sesuai dengan appointments doctor ini
          if (appointmentIds.includes(paymentData.appointmentId)) {
            return {
              id: doc.id,
              appointmentId: paymentData.appointmentId || "",
              patientId: paymentData.patientId || "",
              patientName: paymentData.patientName || "",
              amount: paymentData.amount || 0,
              paymentMethod: paymentData.paymentMethod || "",
              status: paymentData.status || "pending",
              description: paymentData.description || "",
              paymentDate:
                paymentData.paymentDate?.toDate?.() ||
                new Date(paymentData.paymentDate),
              paidAt: paymentData.paidAt?.toDate?.() || null,
              createdAt:
                paymentData.createdAt?.toDate?.() ||
                new Date(paymentData.createdAt),
            };
          }
          return null;
        })
        .filter((payment) => payment !== null)
        .sort((a, b) => b.paymentDate - a.paymentDate);

      return paymentsData;
    } catch (error) {
      console.error("Error fetching payments:", error);
      return [];
    }
  };

  const fetchDoctorData = async (uid) => {
    // Validasi uid
    if (!uid) {
      console.error("fetchDoctorData called without uid");
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setDoctorData({
          uid: uid,
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          specialization: data.specialization || "",
          gender: data.gender || "",
          birthDate: data.birthDate || "",
          licenseNumber: data.licenseNumber || "",
          photoUrl: data.photoUrl || "",
          role: data.role || "doctor",
          price: data.price || 0,
          description: data.description || "",
          status: data.status || "pending",
          createdAt: data.createdAt || "",
          lastLogin: data.lastLogin || "",
          dailySchedules: data.dailySchedules || {},
        });
      }
    } catch (error) {
      console.error("Error fetching doctor data:", error);
    }
  };

  // PERBAIKAN FETCHCHATSFORDOCTOR - Tambahkan validasi doctorId
  const fetchChatsForDoctor = async (doctorId) => {
    // Validasi doctorId
    if (!doctorId) {
      console.error("fetchChatsForDoctor called without doctorId");
      return [];
    }

    try {
      console.log("🔥 Fetching chats for doctor:", doctorId);

      // Query appointments - sama seperti patient tapi ganti doctorId
      const appointmentsQuery = query(
        collection(db, "appointments"),
        where("doctorId", "==", doctorId)
      );

      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      console.log("📋 Found appointments:", appointmentsSnapshot.docs.length);

      const chats = await Promise.all(
        appointmentsSnapshot.docs.map(async (appointmentDoc) => {
          const appointmentData = appointmentDoc.data();
          console.log(
            "📝 Processing appointment:",
            appointmentDoc.id,
            appointmentData
          );

          // Hanya tampilkan confirmed appointments atau yang sudah ada chat
          if (appointmentData.status !== "confirmed") {
            const chatQuery = query(
              collection(db, "chats"),
              where("appointmentId", "==", appointmentDoc.id),
              limit(1)
            );
            const chatSnapshot = await getDocs(chatQuery);
            if (chatSnapshot.empty) {
              console.log(
                "⏭️ Skipping non-confirmed appointment:",
                appointmentDoc.id
              );
              return null;
            }
          }

          // Check atau buat chat document
          const chatQuery = query(
            collection(db, "chats"),
            where("appointmentId", "==", appointmentDoc.id),
            limit(1)
          );

          const chatSnapshot = await getDocs(chatQuery);
          let chatData = null;
          let chatId = null;

          if (!chatSnapshot.empty) {
            chatData = chatSnapshot.docs[0].data();
            chatId = chatSnapshot.docs[0].id;
            console.log("💬 Found existing chat:", chatId);
          } else {
            // Buat chat baru jika appointment confirmed
            if (appointmentData.status === "confirmed") {
              console.log(
                "➕ Creating new chat for appointment:",
                appointmentDoc.id
              );
              const newChatRef = await addDoc(collection(db, "chats"), {
                appointmentId: appointmentDoc.id,
                patientId: appointmentData.patientId,
                doctorId: appointmentData.doctorId,
                status: "pending",
                messages: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                appointmentDate: appointmentData.appointmentDate,
                appointmentTime: appointmentData.appointmentTime,
                paymentStatus: appointmentData.paymentStatus || "pending",
                price: appointmentData.price || 0,
              });

              chatId = newChatRef.id;
              chatData = {
                appointmentId: appointmentDoc.id,
                patientId: appointmentData.patientId,
                doctorId: appointmentData.doctorId,
                status: "pending",
                messages: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                appointmentDate: appointmentData.appointmentDate,
                appointmentTime: appointmentData.appointmentTime,
                paymentStatus: appointmentData.paymentStatus || "pending",
                price: appointmentData.price || 0,
              };
            } else {
              console.log(
                "⏭️ Skipping non-confirmed appointment:",
                appointmentDoc.id
              );
              return null;
            }
          }

          // Format appointment date
          let formattedAppointmentDate = "N/A";
          if (appointmentData.appointmentDate) {
            try {
              const dateObj = new Date(appointmentData.appointmentDate);
              formattedAppointmentDate = dateObj.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              });
            } catch (error) {
              console.error("Error formatting date:", error);
              formattedAppointmentDate = appointmentData.appointmentDate;
            }
          }

          const result = {
            id: chatId,
            ...chatData,
            appointmentId: appointmentDoc.id,
            appointmentDate: appointmentData.appointmentDate,
            appointmentTime: appointmentData.appointmentTime,
            patientName: appointmentData.patientName || "Unknown Patient",
            patientEmail: appointmentData.patientEmail,
            patientPhone: appointmentData.patientPhone,
            formattedAppointmentDate,
            formattedAppointmentTime: appointmentData.appointmentTime,
            complaint: appointmentData.complaint,
            appointmentStatus: appointmentData.status,
            paymentStatus: appointmentData.paymentStatus || "pending",
            price: appointmentData.price || 0,
            priceDisplay: appointmentData.priceDisplay || "Rp 0",
            paymentMethod: appointmentData.paymentMethod,
          };

          console.log("✅ Created chat object for:", result.patientName);
          return result;
        })
      );

      // Filter dan sort
      const validChats = chats.filter((chat) => chat !== null);
      console.log("🎯 Valid chats:", validChats.length);

      validChats.sort((a, b) => {
        try {
          const dateA = new Date(
            `${a.appointmentDate}T${a.appointmentTime}:00`
          );
          const dateB = new Date(
            `${b.appointmentDate}T${b.appointmentTime}:00`
          );
          return dateB - dateA;
        } catch (error) {
          console.error("Error sorting chats:", error);
          return 0;
        }
      });

      console.log("🎉 Fetch completed successfully!");
      return validChats;
    } catch (error) {
      console.error("❌ Error fetching chats:", error);
      throw error;
    }
  };

  // Initial data loading
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          await fetchDoctorData(currentUser.uid);
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

  // Schedule Management
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const availableDates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleDateSelect = (date) => setSelectedDate(date);

  const handleMonthChange = (increment) => {
    let newMonth = currentMonth + increment;
    let newYear = currentYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    setSelectedDate(null);
  };

  const handleAddTimeSlot = async () => {
    if (!selectedDate || !newTime) return;

    try {
      // FORMAT TANGGAL YANG SEDERHANA - HINDARI TIMEZONE ISSUES
      const year = currentYear;
      const month = String(currentMonth + 1).padStart(2, "0"); // +1 karena getMonth() mulai dari 0
      const day = String(selectedDate).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      console.log("=== ADDING SCHEDULE DEBUG ===");
      console.log("Current Year:", year);
      console.log("Current Month (0-based):", currentMonth);
      console.log("Current Month (1-based):", currentMonth + 1);
      console.log("Selected Date:", selectedDate);
      console.log("Final Date String:", dateString);
      console.log("Time:", newTime);

      const doctorDocRef = doc(db, "users", auth.currentUser?.uid);
      const doctorDoc = await getDoc(doctorDocRef);

      if (doctorDoc.exists()) {
        const currentData = doctorDoc.data();
        const currentSchedules = currentData.dailySchedules || {};

        console.log("Current schedules before adding:", currentSchedules);

        // Add new time slot to the specific date
        if (!currentSchedules[dateString]) {
          currentSchedules[dateString] = [];
        }

        // Check if time slot already exists
        if (!currentSchedules[dateString].includes(newTime)) {
          currentSchedules[dateString].push(newTime);

          // Sort time slots for the day
          currentSchedules[dateString].sort();

          console.log("New schedules after adding:", currentSchedules);

          // Update the document
          await updateDoc(doctorDocRef, {
            dailySchedules: currentSchedules,
            updatedAt: new Date(),
          });

          await fetchDoctorData(auth.currentUser?.uid);
          setNewTime("");
          alert(
            `✅ Schedule added successfully for ${dateString} at ${newTime}`
          );
        } else {
          alert("Time slot already exists for this date");
        }
      }
    } catch (error) {
      console.error("Error adding time slot:", error);
      alert("Failed to add time slot: " + error.message);
    }
  };

  // Perbaiki function handleDeleteTimeSlot
  const handleDeleteTimeSlot = async (scheduleId) => {
    try {
      console.log("Deleting schedule ID:", scheduleId);

      // scheduleId format: "YYYY-MM-DD-HH:MM"
      // Tapi karena waktu bisa punya format seperti "14:30", kita perlu hati-hati dengan split
      const lastDashIndex = scheduleId.lastIndexOf("-");

      if (lastDashIndex === -1) {
        console.error("Invalid schedule ID format:", scheduleId);
        return;
      }

      // Split menjadi dateString dan timeSlot
      const dateString = scheduleId.substring(0, lastDashIndex);
      const timeSlot = scheduleId.substring(lastDashIndex + 1);

      console.log("Parsed - Date:", dateString, "Time:", timeSlot);

      const doctorDocRef = doc(db, "users", auth.currentUser?.uid);
      const doctorDoc = await getDoc(doctorDocRef);

      if (doctorDoc.exists()) {
        const currentData = doctorDoc.data();
        const currentSchedules = currentData.dailySchedules || {};

        console.log(
          "Current schedules for date:",
          currentSchedules[dateString]
        );
        console.log("Looking for time slot:", timeSlot);
        console.log("Available time slots:", currentSchedules[dateString]);

        if (currentSchedules[dateString]) {
          // Remove the specific time slot
          const originalLength = currentSchedules[dateString].length;
          currentSchedules[dateString] = currentSchedules[dateString].filter(
            (time) => time !== timeSlot
          );

          console.log(
            "Original length:",
            originalLength,
            "New length:",
            currentSchedules[dateString].length
          );
          console.log("After removal:", currentSchedules[dateString]);

          if (originalLength === currentSchedules[dateString].length) {
            console.error(
              "Time slot not found! Expected:",
              timeSlot,
              "Available:",
              currentSchedules[dateString]
            );
            alert("Time slot not found. Please refresh and try again.");
            return;
          }

          // If no time slots left for this date, remove the date entry
          if (currentSchedules[dateString].length === 0) {
            delete currentSchedules[dateString];
          }

          // Update the document
          await updateDoc(doctorDocRef, {
            dailySchedules: currentSchedules,
            updatedAt: new Date(),
          });

          await fetchDoctorData(auth.currentUser?.uid);
          console.log("Time slot deleted successfully!");
        } else {
          console.log("No schedules found for this date");
          alert(
            "No schedules found for this date. Please refresh and try again."
          );
        }
      }
    } catch (error) {
      console.error("Error deleting time slot:", error);
      alert("Failed to delete time slot: " + error.message);
    }
  };
  // Appointment Management
  const handleAppointmentStatusChange = async (appointmentId, status) => {
    try {
      await updateDoc(doc(db, "appointments", appointmentId), { status });
      await fetchAllData(auth.currentUser?.uid);
    } catch (error) {
      console.error("Error updating appointment status:", error);
    }
  };

  // Account Management
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: doctorData?.name || "",
    email: doctorData?.email || "",
    phone: doctorData?.phone || "",
    specialization: doctorData?.specialization || "",
    photoUrl: doctorData?.photoUrl || "",
    price: doctorData?.price || 0,
    description: doctorData?.description || "",
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [tempPhotoUrl, setTempPhotoUrl] = useState("");

  useEffect(() => {
    if (doctorData) {
      setEditData({
        name: doctorData.name || "",
        email: doctorData.email || "",
        phone: doctorData.phone || "",
        specialization: doctorData.specialization || "",
        photoUrl: doctorData.photoUrl || "",
        price: doctorData.price || 0,
        description: doctorData.description || "", // TAMBAH INI
      });
    }
  }, [doctorData]);

  const handleImageChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (!file.type.match("image.*")) {
        setPasswordError("File must be an image");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setPasswordError("Image size too large (max 2MB)");
        return;
      }

      setIsUploading(true);
      setPasswordError("");

      try {
        const reader = new FileReader();
        reader.onload = (e) => setTempPhotoUrl(e.target.result);
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Error creating preview:", error);
        setPasswordError("Failed to process image");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const uploadProfileImage = async (file) => {
    if (!file || !doctorData) return null;

    try {
      // Delete old image if exists
      if (doctorData.photoUrl && doctorData.photoUrl.startsWith("https://")) {
        const oldImageRef = ref(storage, doctorData.photoUrl);
        await deleteObject(oldImageRef).catch(() => {});
      }

      // Upload new image
      const storageRef = ref(
        storage,
        `profile_images/${doctorData.uid}/${Date.now()}`
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
      if (!doctorData) return;

      setIsPasswordLoading(true);
      setPasswordError("");
      setPasswordSuccess("");

      let photoUrl = doctorData.photoUrl;

      // Upload new image if exists
      if (tempPhotoUrl && fileInputRef.current.files[0]) {
        photoUrl = await uploadProfileImage(fileInputRef.current.files[0]);

        // Update photoURL in Firebase Auth
        await updateProfile(auth.currentUser, {
          displayName: editData.name,
          photoURL: photoUrl,
        });
      }

      // Update user document in Firestore
      const userDocRef = doc(db, "users", doctorData.uid);
      await updateDoc(userDocRef, {
        name: editData.name,
        phone: editData.phone,
        specialization: editData.specialization,
        price: Number(editData.price),
        description: editData.description, // TAMBAH INI
        photoUrl: photoUrl,
        updatedAt: new Date(),
      });

      // Update local state
      setDoctorData({
        ...doctorData,
        name: editData.name,
        phone: editData.phone,
        specialization: editData.specialization,
        price: Number(editData.price),
        description: editData.description, // TAMBAH INI
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

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }

    try {
      setIsPasswordLoading(true);

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        doctorData.email, // Ganti dari user.email
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential); // Ganti dari reauthenticateWithCredential(user, credential)

      // Update password
      await updatePassword(auth.currentUser, newPassword); // Ganti dari updatePassword(user, newPassword)

      // Update Firestore with password change timestamp
      const userDocRef = doc(db, "users", auth.currentUser.uid); // Ganti dari doc(db, "users", user.uid)
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

  const canStartChat = (chat) => {
    if (!chat.appointmentId) return false;

    const appointmentDate = chat.appointmentDate;
    const appointmentTime = chat.appointmentTime;

    if (!appointmentDate || !appointmentTime) return false;

    const appointmentDateTime = new Date(
      `${appointmentDate}T${appointmentTime}:00`
    );
    const now = new Date();

    return now >= appointmentDateTime;
  };

  const isChatExpired = (chat) => {
    if (!chat.appointmentId) return false;

    const appointmentDate = chat.appointmentDate;
    const appointmentTime = chat.appointmentTime;

    if (!appointmentDate || !appointmentTime) return true;

    const appointmentDateTime = new Date(
      `${appointmentDate}T${appointmentTime}:00`
    );

    const expiryTime = new Date(appointmentDateTime.getTime() + 30 * 60 * 1000);
    const now = new Date();

    return now > expiryTime;
  };

  const getChatStatus = (chat) => {
    if (!canStartChat(chat)) {
      return "not_started";
    } else if (isChatExpired(chat)) {
      return "expired";
    } else {
      return "active";
    }
  };

  const getTimeRemaining = (chat) => {
    if (!chat.appointmentDate || !chat.appointmentTime) return null;

    const appointmentDateTime = new Date(
      `${chat.appointmentDate}T${chat.appointmentTime}:00`
    );
    const expiryTime = new Date(appointmentDateTime.getTime() + 30 * 60 * 1000);
    const now = new Date();

    if (now < appointmentDateTime) {
      const timeDiff = appointmentDateTime - now;
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      return `Starts in ${hours}h ${minutes}m`;
    } else if (now < expiryTime) {
      const timeDiff = expiryTime - now;
      const minutes = Math.floor(timeDiff / (1000 * 60));
      return `${minutes} minutes left`;
    } else {
      return "Session ended";
    }
  };

  const getChatStatusDescription = (chat) => {
    const status = getChatStatus(chat);
    switch (status) {
      case "not_started":
        return "Chat will be available at appointment time";
      case "active":
        return "Chat is active - you can send messages";
      case "expired":
        return "Chat session has ended. You can view message history below.";
      default:
        return "";
    }
  };

  // 4. TAMBAHKAN FUNCTION UNTUK FETCH CHATS
  const fetchChats = async (uid) => {
    try {
      const appointmentsQuery = query(
        collection(db, "appointments"),
        where("doctorId", "==", uid)
      );

      const appointmentsSnapshot = await getDocs(appointmentsQuery);

      const chats = await Promise.all(
        appointmentsSnapshot.docs.map(async (appointmentDoc) => {
          const appointmentData = appointmentDoc.data();

          // Only show appointments that are confirmed or have existing chat history
          if (appointmentData.status !== "confirmed") {
            const chatQuery = query(
              collection(db, "chats"),
              where("appointmentId", "==", appointmentDoc.id),
              limit(1)
            );

            const chatSnapshot = await getDocs(chatQuery);
            if (chatSnapshot.empty) {
              return null;
            }
          }

          const chatQuery = query(
            collection(db, "chats"),
            where("appointmentId", "==", appointmentDoc.id),
            limit(1)
          );

          const chatSnapshot = await getDocs(chatQuery);
          let chatData = null;
          let chatId = null;

          if (!chatSnapshot.empty) {
            chatData = chatSnapshot.docs[0].data();
            chatId = chatSnapshot.docs[0].id;
          } else {
            if (appointmentData.status === "confirmed") {
              const newChatRef = await addDoc(collection(db, "chats"), {
                appointmentId: appointmentDoc.id,
                patientId: appointmentData.patientId,
                doctorId: uid,
                status: "pending",
                messages: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                appointmentDate: appointmentData.appointmentDate,
                appointmentTime: appointmentData.appointmentTime,
              });

              chatId = newChatRef.id;
              chatData = {
                appointmentId: appointmentDoc.id,
                patientId: appointmentData.patientId,
                doctorId: uid,
                status: "pending",
                messages: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                appointmentDate: appointmentData.appointmentDate,
                appointmentTime: appointmentData.appointmentTime,
              };
            } else {
              return null;
            }
          }

          // Fetch patient name
          let patientName = "Patient";
          if (appointmentData.patientId) {
            const patientDocSnap = await getDoc(
              doc(db, "users", appointmentData.patientId)
            );
            if (patientDocSnap.exists()) {
              patientName =
                patientDocSnap.data().name ||
                appointmentData.patientName ||
                patientName;
            }
          }

          // Format appointment date
          let formattedAppointmentDate = "N/A";
          if (appointmentData.appointmentDate) {
            const dateObj = new Date(appointmentData.appointmentDate);
            formattedAppointmentDate = dateObj.toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            });
          }

          return {
            id: chatId,
            ...chatData,
            appointmentId: appointmentDoc.id,
            appointmentDate: appointmentData.appointmentDate,
            appointmentTime: appointmentData.appointmentTime,
            patientName: appointmentData.patientName,
            formattedAppointmentDate,
            formattedAppointmentTime: appointmentData.appointmentTime,
            complaint: appointmentData.complaint,
            appointmentStatus: appointmentData.status,
          };
        })
      );

      const validChats = chats.filter((chat) => chat !== null);

      validChats.sort((a, b) => {
        const dateA = new Date(`${a.appointmentDate}T${a.appointmentTime}:00`);
        const dateB = new Date(`${b.appointmentDate}T${b.appointmentTime}:00`);
        return dateB - dateA;
      });

      return validChats;
    } catch (error) {
      console.error("Error fetching chats:", error);
      return [];
    }
  };

  // 5. TAMBAHKAN CHAT FUNCTIONS
  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !imageUpload) || !selectedChat) return;

    const chatStatus = getChatStatus(selectedChat);
    if (chatStatus !== "active") {
      alert("Chat is not available at this time.");
      return;
    }

    setIsSending(true);
    try {
      const chatRef = doc(db, "chats", selectedChat.id);
      const newMessageObj = {
        senderId: doctorData.uid,
        senderName: doctorData.name || "Doctor",
        content: newMessage,
        type: imageUpload ? "image" : "text",
        timestamp: Timestamp.now(),
        createdAt: new Date(),
      };

      if (imageUpload) {
        try {
          const reader = new FileReader();
          const base64Promise = new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(imageUpload);
          });
          const base64Image = await base64Promise;
          newMessageObj.imageUrl = base64Image;
        } catch (uploadError) {
          console.error("Error processing image:", uploadError);
          alert("Failed to process image. Sending text message only.");
          newMessageObj.type = "text";
        }
      }

      const updateData = {
        messages: arrayUnion(newMessageObj),
        updatedAt: serverTimestamp(),
      };

      if (selectedChat.status === "pending") {
        updateData.status = "active";
      }

      await updateDoc(chatRef, updateData);

      setNewMessage("");
      setImageUpload(null);
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message: " + error.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match("image.*")) {
        alert("File must be an image");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert("Image size too large (max 2MB)");
        return;
      }
      setImageUpload(file);
      setNewMessage("");
    }
  };

  const triggerChatFileInput = () => {
    chatFileInputRef.current.click();
  };

  const getStatusBadge = (chat) => {
    const status = getChatStatus(chat);
    switch (status) {
      case "not_started":
        return (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
            Scheduled
          </span>
        );
      case "active":
        return (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
            Active
          </span>
        );
      case "expired":
        return (
          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  // 6. TAMBAHKAN USEEFFECT UNTUK CHAT
  useEffect(() => {
    if (!doctorData?.uid) return;

    const loadChats = async () => {
      const chatsData = await fetchChats(doctorData.uid);
      setActiveChats(chatsData);
      if (chatsData.length > 0 && !selectedChat) {
        setSelectedChat(chatsData[0]);
      }
    };

    loadChats();

    const interval = setInterval(loadChats, 60000);
    return () => clearInterval(interval);
  }, [doctorData?.uid]);

  useEffect(() => {
    if (!selectedChat) return;

    const unsubscribe = onSnapshot(
      doc(db, "chats", selectedChat.id),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setMessages(data.messages || []);
        }
      },
      (err) => {
        console.error("Error listening to chat updates:", err);
      }
    );

    return () => unsubscribe();
  }, [selectedChat]);

  const ChatsView = () => {
    const [activeChats, setActiveChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [imageUpload, setImageUpload] = useState(null);
    const [loadingChats, setLoadingChats] = useState(true);
    const [error, setError] = useState(null);
    const [chatExpiryTimer, setChatExpiryTimer] = useState(null);
    const chatFileInputRef = useRef(null);

    // Fungsi untuk mengecek apakah chat bisa dimulai
    const canStartChat = (chat) => {
      // Cek status pembayaran pertama kali - TAMBAHAN UNTUK DOKTER
      if (chat.paymentStatus !== "completed") {
        return false;
      }

      if (!chat.appointmentId) return false;
      const appointmentDate = chat.appointmentDate;
      const appointmentTime = chat.appointmentTime;
      if (!appointmentDate || !appointmentTime) return false;

      const appointmentDateTime = new Date(
        `${appointmentDate}T${appointmentTime}:00`
      );
      const now = new Date();
      return now >= appointmentDateTime;
    };

    // Fungsi untuk mengecek apakah chat sudah expired
    const isChatExpired = (chat) => {
      if (!chat.appointmentId) return false;
      const appointmentDate = chat.appointmentDate;
      const appointmentTime = chat.appointmentTime;
      if (!appointmentDate || !appointmentTime) return true;

      const appointmentDateTime = new Date(
        `${appointmentDate}T${appointmentTime}:00`
      );
      const expiryTime = new Date(
        appointmentDateTime.getTime() + 30 * 60 * 1000
      );
      const now = new Date();
      return now > expiryTime;
    };

    // Fungsi untuk mendapatkan status chat - DIPERBAHARUI
    const getChatStatus = (chat) => {
      // Prioritas pertama: cek pembayaran
      if (chat.paymentStatus !== "completed") {
        return "unpaid";
      }

      if (!canStartChat(chat)) return "not_started";
      if (isChatExpired(chat)) return "expired";
      return "active";
    };

    // Fungsi untuk menghitung waktu tersisa - DIPERBAHARUI
    const getTimeRemaining = (chat) => {
      // Jika belum bayar, tampilkan info pembayaran
      if (chat.paymentStatus !== "completed") {
        return "Waiting for payment";
      }

      if (!chat.appointmentDate || !chat.appointmentTime) return null;
      const appointmentDateTime = new Date(
        `${chat.appointmentDate}T${chat.appointmentTime}:00`
      );
      const expiryTime = new Date(
        appointmentDateTime.getTime() + 30 * 60 * 1000
      );
      const now = new Date();

      if (now < appointmentDateTime) {
        const timeDiff = appointmentDateTime - now;
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        return `Starts in ${hours}h ${minutes}m`;
      } else if (now < expiryTime) {
        const timeDiff = expiryTime - now;
        const minutes = Math.floor(timeDiff / (1000 * 60));
        return `${minutes} minutes left`;
      } else {
        return "Session ended";
      }
    };

    // Fungsi untuk mendapatkan deskripsi status chat - DIPERBAHARUI
    const getChatStatusDescription = (chat) => {
      const status = getChatStatus(chat);
      switch (status) {
        case "unpaid":
          return "Waiting for patient to complete payment before chat can begin";
        case "not_started":
          return "Chat will be available at appointment time";
        case "active":
          return "Chat is active - you can send messages";
        case "expired":
          return "Chat session has ended. You can view message history below.";
        default:
          return "";
      }
    };

    const formatTime = (timeString) => {
      if (!timeString) return "N/A";
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    };

    // Fungsi untuk menampilkan badge status - DIPERBAHARUI
    const getStatusBadge = (chat) => {
      const status = getChatStatus(chat);
      switch (status) {
        case "unpaid":
          return (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
              Unpaid
            </span>
          );
        case "not_started":
          return (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
              Scheduled
            </span>
          );
        case "active":
          return (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Active
            </span>
          );
        case "expired":
          return (
            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
              Completed
            </span>
          );
        default:
          return null;
      }
    };

    // Fungsi fetch chats untuk dokter - DIPERBAHARUI dengan payment status
    const fetchChatsForDoctor = async (doctorId) => {
      try {
        console.log("🔥 Fetching chats for doctor:", doctorId);

        // Query appointments - sama seperti patient tapi ganti doctorId
        const appointmentsQuery = query(
          collection(db, "appointments"),
          where("doctorId", "==", doctorId)
        );

        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        console.log("📋 Found appointments:", appointmentsSnapshot.docs.length);

        const chats = await Promise.all(
          appointmentsSnapshot.docs.map(async (appointmentDoc) => {
            const appointmentData = appointmentDoc.data();
            console.log(
              "📝 Processing appointment:",
              appointmentDoc.id,
              appointmentData
            );

            // Hanya tampilkan confirmed appointments atau yang sudah ada chat
            if (appointmentData.status !== "confirmed") {
              const chatQuery = query(
                collection(db, "chats"),
                where("appointmentId", "==", appointmentDoc.id),
                limit(1)
              );
              const chatSnapshot = await getDocs(chatQuery);
              if (chatSnapshot.empty) {
                console.log(
                  "⏭️ Skipping non-confirmed appointment:",
                  appointmentDoc.id
                );
                return null;
              }
            }

            // Check atau buat chat document
            const chatQuery = query(
              collection(db, "chats"),
              where("appointmentId", "==", appointmentDoc.id),
              limit(1)
            );

            const chatSnapshot = await getDocs(chatQuery);
            let chatData = null;
            let chatId = null;

            if (!chatSnapshot.empty) {
              chatData = chatSnapshot.docs[0].data();
              chatId = chatSnapshot.docs[0].id;
              console.log("💬 Found existing chat:", chatId);
            } else {
              // Buat chat baru jika appointment confirmed
              if (appointmentData.status === "confirmed") {
                console.log(
                  "➕ Creating new chat for appointment:",
                  appointmentDoc.id
                );
                const newChatRef = await addDoc(collection(db, "chats"), {
                  appointmentId: appointmentDoc.id,
                  patientId: appointmentData.patientId,
                  doctorId: appointmentData.doctorId,
                  status: "pending",
                  messages: [],
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  appointmentDate: appointmentData.appointmentDate,
                  appointmentTime: appointmentData.appointmentTime,
                  paymentStatus: appointmentData.paymentStatus || "pending", // TAMBAHAN
                  price: appointmentData.price || 0, // TAMBAHAN
                });

                chatId = newChatRef.id;
                chatData = {
                  appointmentId: appointmentDoc.id,
                  patientId: appointmentData.patientId,
                  doctorId: appointmentData.doctorId,
                  status: "pending",
                  messages: [],
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  appointmentDate: appointmentData.appointmentDate,
                  appointmentTime: appointmentData.appointmentTime,
                  paymentStatus: appointmentData.paymentStatus || "pending", // TAMBAHAN
                  price: appointmentData.price || 0, // TAMBAHAN
                };
              } else {
                console.log(
                  "⏭️ Skipping non-confirmed appointment:",
                  appointmentDoc.id
                );
                return null;
              }
            }

            // Format appointment date
            let formattedAppointmentDate = "N/A";
            if (appointmentData.appointmentDate) {
              const dateObj = new Date(appointmentData.appointmentDate);
              formattedAppointmentDate = dateObj.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              });
            }

            const result = {
              id: chatId,
              ...chatData,
              appointmentId: appointmentDoc.id,
              appointmentDate: appointmentData.appointmentDate,
              appointmentTime: appointmentData.appointmentTime,
              patientName: appointmentData.patientName || "Unknown Patient",
              patientEmail: appointmentData.patientEmail,
              patientPhone: appointmentData.patientPhone,
              formattedAppointmentDate,
              formattedAppointmentTime: appointmentData.appointmentTime,
              complaint: appointmentData.complaint,
              appointmentStatus: appointmentData.status,
              paymentStatus: appointmentData.paymentStatus || "pending", // TAMBAHAN
              price: appointmentData.price || 0, // TAMBAHAN
              priceDisplay: appointmentData.priceDisplay || "Rp 0", // TAMBAHAN
              paymentMethod: appointmentData.paymentMethod, // TAMBAHAN
            };

            console.log("✅ Created chat object for:", result.patientName);
            return result;
          })
        );

        // Filter dan sort
        const validChats = chats.filter((chat) => chat !== null);
        console.log("🎯 Valid chats:", validChats.length);

        validChats.sort((a, b) => {
          const dateA = new Date(
            `${a.appointmentDate}T${a.appointmentTime}:00`
          );
          const dateB = new Date(
            `${b.appointmentDate}T${b.appointmentTime}:00`
          );
          return dateB - dateA;
        });

        console.log("🎉 Fetch completed successfully!");
        return validChats;
      } catch (error) {
        console.error("❌ Error fetching chats:", error);
        throw error;
      }
    };

    const setupChatExpiryTimer = useCallback((chat) => {
      if (!chat?.appointmentDate || !chat?.appointmentTime) return;

      const appointmentDateTime = new Date(
        `${chat.appointmentDate}T${chat.appointmentTime}:00`
      );
      const expiryTime = new Date(
        appointmentDateTime.getTime() + 30 * 60 * 1000
      );
      const now = new Date();

      // Set timer jika chat belum expired
      if (now < expiryTime) {
        const timeUntilExpiry = expiryTime - now;
        console.log(`⏰ Setting expiry timer for ${timeUntilExpiry}ms`);

        const timerId = setTimeout(() => {
          console.log("⏰ Chat expired! Forcing UI update");
          // Force re-render dengan timestamp baru untuk trigger update
          setSelectedChat((prevChat) =>
            prevChat ? { ...prevChat, _lastUpdate: Date.now() } : prevChat
          );
        }, timeUntilExpiry);

        setChatExpiryTimer(timerId);
        return timerId;
      }
      return null;
    }, []);

    // Fetch function yang stable
    const fetchChats = useCallback(async () => {
      if (!doctorData?.uid) return;

      setLoadingChats(true);
      setError(null);
      try {
        const chatsData = await fetchChatsForDoctor(doctorData.uid);
        setActiveChats(chatsData);

        // Auto-select first chat if none selected
        if (chatsData.length > 0 && !selectedChat) {
          setSelectedChat(chatsData[0]);
        }
      } catch (err) {
        console.error("Error fetching chats:", err);
        setError("Failed to load chats. Please try again.");
      } finally {
        setLoadingChats(false);
      }
    }, [doctorData?.uid]);

    // Initial fetch
    useEffect(() => {
      fetchChats();
    }, [fetchChats]);

    // Setup timer saat selectedChat berubah
    useEffect(() => {
      // Clear existing timer first
      if (chatExpiryTimer) {
        clearTimeout(chatExpiryTimer);
        setChatExpiryTimer(null);
      }

      if (selectedChat) {
        const timerId = setupChatExpiryTimer(selectedChat);
        if (timerId) {
          setChatExpiryTimer(timerId);
        }
      }

      return () => {
        if (chatExpiryTimer) {
          clearTimeout(chatExpiryTimer);
        }
      };
    }, [selectedChat?.id, setupChatExpiryTimer]);

    // Listen to selected chat messages
    useEffect(() => {
      if (!selectedChat?.id) {
        setMessages([]);
        return;
      }

      const unsubscribe = onSnapshot(
        doc(db, "chats", selectedChat.id),
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setMessages(data.messages || []);
            // Update selectedChat dengan data terbaru termasuk paymentStatus
            setSelectedChat((prev) => (prev ? { ...prev, ...data } : null));
          }
        },
        (err) => {
          console.error("Error listening to chat updates:", err);
        }
      );

      return () => unsubscribe();
    }, [selectedChat?.id]);

    // Handle send message - DIPERBAHARUI dengan payment check
    const handleSendMessage = useCallback(async () => {
      if ((!newMessage.trim() && !imageUpload) || !selectedChat) return;

      const chatStatus = getChatStatus(selectedChat);
      if (chatStatus !== "active") {
        if (chatStatus === "unpaid") {
          alert("Chat is not available until patient completes payment.");
        } else {
          alert("Chat is not available at this time.");
        }
        return;
      }

      setIsSending(true);
      try {
        const chatRef = doc(db, "chats", selectedChat.id);
        const newMessageObj = {
          senderId: doctorData.uid,
          senderName: doctorData.name || "Doctor",
          content: newMessage,
          type: imageUpload ? "image" : "text",
          timestamp: Timestamp.now(),
          createdAt: new Date(),
        };

        if (imageUpload) {
          try {
            const reader = new FileReader();
            const base64Promise = new Promise((resolve, reject) => {
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(imageUpload);
            });
            const base64Image = await base64Promise;
            newMessageObj.imageUrl = base64Image;
          } catch (uploadError) {
            console.error("Error processing image:", uploadError);
            alert("Failed to process image. Sending text message only.");
            newMessageObj.type = "text";
          }
        }

        const updateData = {
          messages: arrayUnion(newMessageObj),
          updatedAt: serverTimestamp(),
        };

        if (selectedChat.status === "pending") {
          updateData.status = "active";
        }

        await updateDoc(chatRef, updateData);

        // Clear input setelah berhasil kirim
        setNewMessage("");
        setImageUpload(null);
      } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message: " + error.message);
      } finally {
        setIsSending(false);
      }
    }, [newMessage, imageUpload, selectedChat, doctorData]);

    // Handle image upload
    const handleImageUpload = useCallback((e) => {
      const file = e.target.files[0];
      if (file) {
        if (!file.type.match("image.*")) {
          alert("File must be an image");
          return;
        }
        if (file.size > 2 * 1024 * 1024) {
          alert("Image size too large (max 2MB)");
          return;
        }
        setImageUpload(file);
        setNewMessage("");
      }
    }, []);

    const triggerChatFileInput = useCallback(() => {
      chatFileInputRef.current?.click();
    }, []);

    // Handle chat selection
    const handleChatSelect = useCallback((chat) => {
      setSelectedChat(chat);
    }, []);

    // Handle key press
    const handleKeyPress = useCallback(
      (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSendMessage();
        }
      },
      [handleSendMessage]
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ChatCircleDots size={24} /> Patient Consultations
          </h1>
          <button
            onClick={fetchChats}
            className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
          >
            Refresh
          </button>
        </div>

        {loadingChats ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="ml-4 text-gray-600">Loading your consultations...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-200px)]">
            {/* Chat list sidebar */}
            <div className="w-full md:w-1/3 bg-white rounded-xl shadow border border-gray-100 p-4 overflow-y-auto">
              <h2 className="font-semibold mb-4">Active Consultations</h2>
              {activeChats.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No consultations found</p>
                  <p className="text-gray-400 text-sm">
                    Consultations will appear here when patients book
                    appointments
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeChats.map((chat) => {
                    const status = getChatStatus(chat);
                    const hasMessages =
                      chat.messages && chat.messages.length > 0;

                    return (
                      <div
                        key={`chat-${chat.id}`}
                        onClick={() => handleChatSelect(chat)}
                        className={`p-3 rounded-lg cursor-pointer border ${
                          selectedChat?.id === chat.id
                            ? "bg-blue-50 border-blue-200"
                            : "hover:bg-gray-50 border-transparent"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">{chat.patientName}</h3>
                            <p className="text-xs text-gray-500">Patient</p>
                          </div>
                          {getStatusBadge(chat)}
                        </div>

                        <p className="text-sm text-gray-600 truncate mb-2">
                          {chat.complaint || "General consultation"}
                        </p>

                        <div className="text-xs text-gray-400">
                          <p>{chat.formattedAppointmentDate}</p>
                          <p>at {formatTime(chat.formattedAppointmentTime)}</p>
                          <p className="font-medium mt-1">
                            {getTimeRemaining(chat)}
                          </p>
                        </div>

                        {/* TAMBAHAN: Info pembayaran di sidebar */}
                        <div className="mt-2 text-xs">
                          {chat.paymentStatus === "completed" ? (
                            <span className="text-green-600">
                              ✓ Paid ({chat.priceDisplay})
                            </span>
                          ) : (
                            <span className="text-red-600">
                              ⚠ Payment pending ({chat.priceDisplay})
                            </span>
                          )}
                        </div>

                        {hasMessages && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="text-sm text-gray-500 truncate">
                              Last:{" "}
                              {chat.messages[chat.messages.length - 1]
                                ?.content || "Image"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {status === "expired"
                                ? "Chat history available"
                                : ""}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chat area */}
            <div className="flex-1 flex flex-col bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
              {selectedChat ? (
                <>
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="font-semibold">
                          Consultation with {selectedChat.patientName}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {selectedChat.formattedAppointmentDate} at{" "}
                          {formatTime(selectedChat.formattedAppointmentTime)}
                        </p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(selectedChat)}
                        <p className="text-xs text-gray-500 mt-1">
                          {getTimeRemaining(selectedChat)}
                        </p>
                      </div>
                    </div>

                    {selectedChat.complaint && (
                      <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">
                            Patient Complaint:
                          </span>{" "}
                          {selectedChat.complaint}
                        </p>
                      </div>
                    )}

                    {/* TAMBAHAN: Info pembayaran detail */}
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Payment Status:</span>{" "}
                        {selectedChat.paymentStatus === "completed" ? (
                          <span className="text-green-600">
                            Completed ({selectedChat.priceDisplay})
                          </span>
                        ) : (
                          <span className="text-red-600">
                            Pending ({selectedChat.priceDisplay})
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Info status chat - DIPERBAHARUI */}
                    <div
                      className={`mt-3 p-2 rounded-lg ${
                        getChatStatus(selectedChat) === "unpaid"
                          ? "bg-red-50 text-red-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      <p className="text-sm">
                        {getChatStatusDescription(selectedChat)}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto">
                    {/* TAMBAHAN: Tampilan khusus jika belum bayar */}
                    {getChatStatus(selectedChat) === "unpaid" ? (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <div className="mb-4">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12 text-red-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-800 mb-2">
                          Payment Pending
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Patient has not completed payment yet. Chat will be
                          available once payment is confirmed.
                        </p>
                        <div className="bg-gray-100 p-3 rounded-lg">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Amount:</span>{" "}
                            {selectedChat.priceDisplay}
                          </p>
                          {selectedChat.paymentMethod && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Method:</span>{" "}
                              {selectedChat.paymentMethod}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : getChatStatus(selectedChat) === "not_started" ? (
                      <div className="h-full flex items-center justify-center text-center">
                        <div>
                          <div className="mb-4">
                            <Clock
                              size={48}
                              className="mx-auto text-gray-400"
                            />
                          </div>
                          <p className="text-gray-500 mb-2">
                            Chat will be available at appointment time
                          </p>
                          <p className="text-sm text-gray-400">
                            {formatTime(selectedChat.formattedAppointmentTime)}{" "}
                            on {selectedChat.formattedAppointmentDate}
                          </p>
                        </div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        {getChatStatus(selectedChat) === "expired"
                          ? "No messages were exchanged during this consultation."
                          : "No messages yet. Start the conversation!"}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg, index) => (
                          <div
                            key={`msg-${index}-${
                              msg.timestamp?.seconds || index
                            }`}
                            className={`flex ${
                              msg.senderId === doctorData.uid
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                                msg.senderId === doctorData.uid
                                  ? "bg-blue-100"
                                  : "bg-gray-100"
                              }`}
                            >
                              <div className="mb-1">
                                <span className="text-xs font-medium text-gray-600">
                                  {msg.senderId === doctorData.uid
                                    ? "You"
                                    : selectedChat.patientName}
                                </span>
                              </div>
                              {msg.type === "image" && msg.imageUrl && (
                                <div className="mb-2">
                                  <img
                                    src={msg.imageUrl}
                                    alt="Chat image"
                                    className="max-w-full h-auto rounded"
                                  />
                                </div>
                              )}
                              {msg.content && (
                                <p className="text-sm">{msg.content}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {msg.timestamp
                                  ?.toDate?.()
                                  ?.toLocaleTimeString?.() ||
                                  (msg.createdAt
                                    ? new Date(
                                        msg.createdAt
                                      ).toLocaleTimeString()
                                    : "Just now")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Input area - hanya tampil jika chat aktif */}
                  {getChatStatus(selectedChat) === "active" && (
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1 p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          onKeyPress={handleKeyPress}
                          autoComplete="off"
                        />
                        <input
                          type="file"
                          ref={chatFileInputRef}
                          onChange={handleImageUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={triggerChatFileInput}
                          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          title="Upload image"
                        >
                          <Images size={24} />
                        </button>
                        <button
                          type="button"
                          onClick={handleSendMessage}
                          disabled={
                            isSending || (!newMessage.trim() && !imageUpload)
                          }
                          className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                            isSending || (!newMessage.trim() && !imageUpload)
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {isSending ? "Sending..." : "Send"}
                        </button>
                      </div>
                      {imageUpload && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-sm">
                            Image ready: {imageUpload.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => setImageUpload(null)}
                            className="text-red-500 text-sm hover:text-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer untuk chat yang sudah expired */}
                  {getChatStatus(selectedChat) === "expired" && (
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-center gap-2">
                        <Archive size={16} className="text-gray-500" />
                        <p className="text-sm text-gray-600 text-center">
                          This consultation has ended. Chat history is preserved
                          for your records.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  {activeChats.length === 0
                    ? "No consultations available."
                    : "Select a consultation to view messages"}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const ScheduleView = () => {
    const displayCurrentSchedules = () => {
      if (!doctorData?.dailySchedules) return [];

      const schedules = [];
      const currentMonthSchedules = Object.entries(
        doctorData.dailySchedules
      ).filter(([dateString]) => {
        const date = new Date(dateString);
        return (
          date.getMonth() === currentMonth && date.getFullYear() === currentYear
        );
      });

      currentMonthSchedules.forEach(([dateString, timeSlots]) => {
        const date = new Date(dateString);
        timeSlots.forEach((timeSlot) => {
          // Pastikan ID dibuat dengan format yang konsisten
          const scheduleId = `${dateString}-${timeSlot}`;
          console.log("Creating schedule with ID:", scheduleId); // Debug log

          schedules.push({
            id: scheduleId,
            date: date,
            time: timeSlot,
            dateString: dateString,
          });
        });
      });

      return schedules.sort((a, b) => a.date - b.date);
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar size={24} /> Schedule Management
          </h1>
          <button
            onClick={() => fetchDoctorData(doctorData.uid)}
            className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* BAGIAN MENAMPILKAN SCHEDULES YANG SUDAH ADA */}
        <div className="mb-8 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-6">Available Time Slots</h2>
          {(() => {
            const currentSchedules = displayCurrentSchedules();

            if (currentSchedules.length === 0) {
              return (
                <div className="text-center py-8 text-gray-500">
                  No schedules created yet for {monthNames[currentMonth]}{" "}
                  {currentYear}
                </div>
              );
            }

            // Group schedules by date
            const groupedSchedules = currentSchedules.reduce(
              (acc, schedule) => {
                const dateKey = schedule.date.toDateString();
                if (!acc[dateKey]) {
                  acc[dateKey] = [];
                }
                acc[dateKey].push(schedule);
                return acc;
              },
              {}
            );

            return (
              <div className="space-y-4">
                {Object.entries(groupedSchedules).map(
                  ([dateKey, schedules]) => (
                    <div key={dateKey} className="pb-4">
                      <h3 className="font-medium text-lg mb-3">
                        {schedules[0].date.getDate()}{" "}
                        {monthNames[schedules[0].date.getMonth()]}{" "}
                        {schedules[0].date.getFullYear()}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {schedules.map((schedule) => (
                          <div
                            key={schedule.id}
                            className="flex justify-between items-center p-3 bg-blue-50 rounded-lg"
                          >
                            <span className="font-medium">{schedule.time}</span>
                            <button
                              onClick={() => handleDeleteTimeSlot(schedule.id)}
                              className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                              title="Delete time slot"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            );
          })()}
        </div>

        {/* BAGIAN UNTUK MENAMBAH SCHEDULE BARU */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-6">Add New Schedule</h2>

          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => handleMonthChange(-1)}
              className="p-2 rounded-full hover:bg-blue-50"
            >
              <CaretRight className="rotate-180" size={20} />
            </button>
            <div className="text-center">
              <span className="text-xl font-medium">
                {monthNames[currentMonth]} {currentYear}
              </span>
            </div>
            <button
              onClick={() => handleMonthChange(1)}
              className="p-2 rounded-full hover:bg-blue-50"
            >
              <CaretRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-8">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-medium py-2">
                {day}
              </div>
            ))}

            {Array.from({
              length: new Date(currentYear, currentMonth, 1).getDay(),
            }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10"></div>
            ))}

            {availableDates.map((date) => (
              <button
                key={date}
                onClick={() => handleDateSelect(date)}
                className={`h-10 rounded-lg transition flex items-center justify-center ${
                  selectedDate === date
                    ? "bg-blue-600 text-white font-medium"
                    : "hover:bg-blue-50"
                }`}
              >
                {date}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">
                Selected Date:{" "}
                {selectedDate
                  ? `${selectedDate} ${monthNames[currentMonth]} ${currentYear}`
                  : "None"}
              </label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <button
              onClick={handleAddTimeSlot}
              disabled={!selectedDate || !newTime}
              className={`mt-6 px-6 py-3 rounded-lg transition font-medium ${
                selectedDate && newTime
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              Add Time Slot
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
          <UsersThree size={24} /> Patient Appointments
        </h1>
        <button
          onClick={() => fetchAllData(doctorData.uid)}
          className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
        >
          Refresh
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow text-center border border-gray-100">
          <UsersThree size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">No appointments found</p>
          <p className="text-gray-400 text-sm mt-2">
            Appointments will appear here when patients book with you
          </p>
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
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">
                    {appointment.patientName}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Age: {appointment.patientAge} years old
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    appointment.status === "confirmed"
                      ? "bg-blue-100 text-blue-800"
                      : appointment.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : appointment.status === "cancelled"
                      ? "bg-red-100 text-red-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {appointment.status.charAt(0).toUpperCase() +
                    appointment.status.slice(1)}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={16} />
                  <span>{formatDate(appointment.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={16} />
                  <span>{formatTime(appointment.time)}</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <p className="font-medium text-gray-700 mb-1">Complaint:</p>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {appointment.complaint || "No specific complaint mentioned"}
                  </p>
                </div>
              </div>

              {appointment.status === "confirmed" && (
                <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAppointmentStatusChange(
                        appointment.id,
                        "completed"
                      );
                    }}
                    className="flex-1 px-3 py-2 text-xs text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 rounded-lg transition-colors font-medium"
                  >
                    Mark Completed
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAppointmentStatusChange(
                        appointment.id,
                        "cancelled"
                      );
                    }}
                    className="flex-1 px-3 py-2 text-xs text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const PaymentsView = () => {
    // State for withdrawals
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [selectedBank, setSelectedBank] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountName, setAccountName] = useState("");
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [withdrawError, setWithdrawError] = useState("");
    const [withdrawSuccess, setWithdrawSuccess] = useState("");
    const [withdrawalHistory, setWithdrawalHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Calculate stats
    const completedPayments = payments.filter((p) => p.status === "completed");
    const pendingPayments = payments.filter((p) => p.status === "pending");

    // Calculate withdrawal amounts by status
    const completedWithdrawals = withdrawalHistory.filter(
      (w) => w.status === "completed"
    );
    const pendingWithdrawals = withdrawalHistory.filter(
      (w) => w.status === "pending"
    );
    const rejectedWithdrawals = withdrawalHistory.filter(
      (w) => w.status === "rejected"
    );

    // Calculate total amounts
    const totalEarnings = completedPayments.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );
    const totalCompletedWithdrawals = completedWithdrawals.reduce(
      (sum, w) => sum + (w.amount || 0),
      0
    );
    const totalPendingWithdrawals = pendingWithdrawals.reduce(
      (sum, w) => sum + (w.amount || 0),
      0
    );

    // Calculate balances
    const actualBalance = totalEarnings - totalCompletedWithdrawals; // Money actually in account
    const availableForWithdrawal =
      totalEarnings - totalCompletedWithdrawals - totalPendingWithdrawals; // Can be withdrawn
    const reservedBalance = totalPendingWithdrawals; // Reserved for pending withdrawals

    // Format currency
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(amount || 0);
    };

    // Format date
    const formatDate = (date) => {
      if (!date) return "N/A";
      const d = date?.toDate?.() || new Date(date);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };

    // Handle withdrawal submission
    const handleWithdraw = async () => {
      // Clear previous messages
      setWithdrawError("");
      setWithdrawSuccess("");

      // Validation
      if (!withdrawAmount || !selectedBank || !accountNumber || !accountName) {
        setWithdrawError("Harap isi semua field");
        return;
      }

      const amount = Number(withdrawAmount);
      if (isNaN(amount) || amount <= 0) {
        setWithdrawError("Jumlah tidak valid");
        return;
      }

      if (amount < 100000) {
        setWithdrawError("Minimal penarikan Rp 100.000");
        return;
      }

      if (amount > availableForWithdrawal) {
        setWithdrawError(
          `Saldo tidak mencukupi. Saldo tersedia: ${formatCurrency(
            availableForWithdrawal
          )}`
        );
        return;
      }

      setIsWithdrawing(true);

      try {
        // Add withdrawal record
        await addDoc(collection(db, "withdrawals"), {
          doctorId: doctorData.uid,
          doctorName: doctorData.name,
          amount: amount,
          bank: selectedBank,
          accountNumber: accountNumber,
          accountName: accountName,
          status: "pending",
          createdAt: new Date(),
        });

        setWithdrawSuccess(
          `Penarikan sebesar ${formatCurrency(
            amount
          )} berhasil diajukan! Saldo tersedia berkurang menjadi ${formatCurrency(
            availableForWithdrawal - amount
          )}`
        );

        // Clear form
        setWithdrawAmount("");
        setSelectedBank("");
        setAccountNumber("");
        setAccountName("");

        // Refresh withdrawal history
        await fetchWithdrawalHistory();
      } catch (error) {
        console.error("Gagal melakukan penarikan:", error);
        setWithdrawError("Gagal melakukan penarikan. Silakan coba lagi.");
      } finally {
        setIsWithdrawing(false);
      }
    };

    // Fetch withdrawal history
    const fetchWithdrawalHistory = useCallback(async () => {
      if (!doctorData?.uid) return;

      setIsLoadingHistory(true);
      try {
        // Query tanpa orderBy untuk menghindari composite index requirement
        const q = query(
          collection(db, "withdrawals"),
          where("doctorId", "==", doctorData.uid)
        );
        const snapshot = await getDocs(q);

        const history = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
          }))
          // Sort di client side instead of server side
          .sort((a, b) => {
            const dateA = a.createdAt || new Date(0);
            const dateB = b.createdAt || new Date(0);
            return dateB - dateA; // Descending order
          });

        setWithdrawalHistory(history);
      } catch (error) {
        console.error("Gagal mengambil riwayat penarikan:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    }, [doctorData?.uid]);

    // Load withdrawal history on mount
    useEffect(() => {
      fetchWithdrawalHistory();
    }, [fetchWithdrawalHistory]);

    // Get bank name
    const getBankName = (bankCode) => {
      const bankNames = {
        bca: "BCA",
        mandiri: "Mandiri",
        bri: "BRI",
        bni: "BNI",
        cimb: "CIMB Niaga",
        danamon: "Danamon",
      };
      return bankNames[bankCode] || bankCode.toUpperCase();
    };

    // Get withdrawal status info
    const getWithdrawalStatus = (status) => {
      const statusMap = {
        pending: { text: "Diproses", color: "bg-yellow-100 text-yellow-800" },
        completed: { text: "Berhasil", color: "bg-green-100 text-green-800" },
        rejected: { text: "Ditolak", color: "bg-red-100 text-red-800" },
        cancelled: { text: "Dibatalkan", color: "bg-gray-100 text-gray-800" },
      };
      return (
        statusMap[status] || {
          text: status,
          color: "bg-gray-100 text-gray-800",
        }
      );
    };

    // Get payment status display
    const getPaymentStatus = (status) => {
      const statusMap = {
        completed: "Selesai",
        pending: "Pending",
        failed: "Gagal",
        cancelled: "Dibatalkan",
      };
      return statusMap[status] || status;
    };

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Earnings */}
          <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Total Pendapatan
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalEarnings)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {completedPayments.length} pembayaran selesai
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CurrencyDollar size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          {/* Available Balance for Withdrawal */}
          <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Dapat Ditarik
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(availableForWithdrawal)}
                </p>
                {reservedBalance > 0 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    {formatCurrency(reservedBalance)} sedang diproses
                  </p>
                )}
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CurrencyDollar size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          {/* Actual Balance (Money in account) */}
          <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Saldo Aktual
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(actualBalance)}
                </p>
                <p className="text-xs text-gray-400 mt-1">Uang di akun Anda</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Receipt size={24} className="text-purple-600" />
              </div>
            </div>
          </div>

          {/* Pending Payments */}
          <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Pembayaran Pending
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {pendingPayments.length}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatCurrency(
                    pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
                  )}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock size={24} className="text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Balance Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Ringkasan Saldo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Pendapatan</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(totalEarnings)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Sudah Ditarik</p>
              <p className="text-xl font-bold text-red-600">
                -{formatCurrency(totalCompletedWithdrawals)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Sedang Diproses</p>
              <p className="text-xl font-bold text-yellow-600">
                -{formatCurrency(totalPendingWithdrawals)}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200 text-center">
            <p className="text-sm text-gray-600">
              Saldo Tersedia untuk Penarikan
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(availableForWithdrawal)}
            </p>
          </div>
        </div>

        {/* Withdrawal Section */}
        <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
          <h2 className="text-xl font-semibold mb-6">Penarikan Dana</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Withdrawal Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Jumlah (IDR) *
                </label>
                <input
                  type="number"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Minimum 100.000"
                  min="100000"
                  max={availableForWithdrawal}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maksimal: {formatCurrency(availableForWithdrawal)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Bank Tujuan *
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                >
                  <option value="">Pilih Bank</option>
                  <option value="bca">BCA</option>
                  <option value="mandiri">Mandiri</option>
                  <option value="bri">BRI</option>
                  <option value="bni">BNI</option>
                  <option value="cimb">CIMB Niaga</option>
                  <option value="danamon">Danamon</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Nomor Rekening *
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={accountNumber}
                  onChange={(e) =>
                    setAccountNumber(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  placeholder="Contoh: 1234567890"
                  maxLength="20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Nama Pemilik Rekening *
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                  placeholder="Sesuai buku tabungan"
                  maxLength="50"
                />
              </div>

              <button
                onClick={handleWithdraw}
                disabled={
                  isWithdrawing ||
                  !withdrawAmount ||
                  !selectedBank ||
                  !accountNumber ||
                  !accountName ||
                  availableForWithdrawal <= 0
                }
                className={`w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium ${
                  isWithdrawing ||
                  !withdrawAmount ||
                  !selectedBank ||
                  !accountNumber ||
                  !accountName ||
                  availableForWithdrawal <= 0
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {isWithdrawing ? "Memproses..." : "Ajukan Penarikan"}
              </button>

              {withdrawError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {withdrawError}
                  </div>
                </div>
              )}

              {withdrawSuccess && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {withdrawSuccess}
                  </div>
                </div>
              )}
            </div>

            {/* Withdrawal Information */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-medium text-lg mb-4">Informasi Penarikan</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-blue-500">•</span>
                  <span>Minimal penarikan Rp 100.000</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-blue-500">•</span>
                  <span>Proses penarikan 1-2 hari kerja</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-blue-500">•</span>
                  <span>Pastikan data rekening benar</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-blue-500">•</span>
                  <span>
                    Bank yang didukung: BCA, Mandiri, BRI, BNI, CIMB, Danamon
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 text-blue-500">•</span>
                  <span>
                    Penarikan yang sedang diproses akan mengurangi saldo
                    tersedia
                  </span>
                </li>
              </ul>

              <div className="mt-6 pt-4 border-t border-blue-200">
                <h4 className="font-medium mb-3">Detail Saldo</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Pendapatan:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(totalEarnings)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sudah Ditarik:</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(totalCompletedWithdrawals)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sedang Diproses:</span>
                    <span className="font-medium text-yellow-600">
                      -{formatCurrency(totalPendingWithdrawals)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-blue-200 flex justify-between">
                    <span className="font-medium text-gray-800">
                      Dapat Ditarik:
                    </span>
                    <span className="font-bold text-blue-600">
                      {formatCurrency(availableForWithdrawal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-white rounded-xl shadow border border-gray-100">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 rounded-t-xl">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Riwayat Pembayaran
              </h2>
              <span className="text-sm text-gray-500">
                {payments.length} total pembayaran
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pasien
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center">
                        <svg
                          className="w-12 h-12 text-gray-300 mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p>Belum ada riwayat pembayaran</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  payments
                    .sort((a, b) => {
                      const dateA =
                        a.paymentDate?.toDate?.() ||
                        a.createdAt?.toDate?.() ||
                        new Date(a.paymentDate || a.createdAt);
                      const dateB =
                        b.paymentDate?.toDate?.() ||
                        b.createdAt?.toDate?.() ||
                        new Date(b.paymentDate || b.createdAt);
                      return dateB - dateA;
                    })
                    .map((payment) => (
                      <tr
                        key={payment.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(payment.paymentDate || payment.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {payment.patientName || "Pasien Tidak Dikenal"}
                          </div>
                          <div className="text-xs text-gray-500">
                            ID: {payment.patientId?.slice(-8) || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              payment.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : payment.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : payment.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {getPaymentStatus(payment.status)}
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Withdrawal History */}
        <div className="bg-white rounded-xl shadow border border-gray-100">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 rounded-t-xl">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Riwayat Penarikan
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  {withdrawalHistory.length} total penarikan
                </span>
                <button
                  onClick={fetchWithdrawalHistory}
                  disabled={isLoadingHistory}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                >
                  {isLoadingHistory ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                      Memuat...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Segarkan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jumlah
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bank Tujuan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoadingHistory ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center">
                      <div className="flex justify-center">
                        <svg
                          className="animate-spin h-6 w-6 text-blue-500"
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
                      </div>
                    </td>
                  </tr>
                ) : withdrawalHistory.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center">
                        <svg
                          className="w-12 h-12 text-gray-300 mb-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <p>Belum ada riwayat penarikan</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Penarikan yang Anda ajukan akan muncul di sini
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  withdrawalHistory.map((withdrawal) => {
                    const status = getWithdrawalStatus(withdrawal.status);
                    return (
                      <tr
                        key={withdrawal.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(withdrawal.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(withdrawal.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="font-medium">
                            {getBankName(withdrawal.bank)} -{" "}
                            {withdrawal.accountNumber}
                          </div>
                          <div className="text-xs text-gray-500">
                            a.n. {withdrawal.accountName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}
                          >
                            {status.text}
                          </span>
                          {withdrawal.status === "rejected" &&
                            withdrawal.rejectionReason && (
                              <div className="text-xs text-red-500 mt-1">
                                {withdrawal.rejectionReason}
                              </div>
                            )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Withdrawal Statistics */}
        {withdrawalHistory.length > 0 && (
          <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
            <h3 className="text-lg font-semibold mb-4">Statistik Penarikan</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Berhasil</p>
                <p className="text-xl font-bold text-green-600">
                  {completedWithdrawals.length}
                </p>
                <p className="text-xs text-green-600">
                  {formatCurrency(totalCompletedWithdrawals)}
                </p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600">Diproses</p>
                <p className="text-xl font-bold text-yellow-600">
                  {pendingWithdrawals.length}
                </p>
                <p className="text-xs text-yellow-600">
                  {formatCurrency(totalPendingWithdrawals)}
                </p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600">Ditolak</p>
                <p className="text-xl font-bold text-red-600">
                  {rejectedWithdrawals.length}
                </p>
                <p className="text-xs text-red-600">
                  {formatCurrency(
                    rejectedWithdrawals.reduce(
                      (sum, w) => sum + (w.amount || 0),
                      0
                    )
                  )}
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Pengajuan</p>
                <p className="text-xl font-bold text-blue-600">
                  {withdrawalHistory.length}
                </p>
                <p className="text-xs text-blue-600">
                  {formatCurrency(
                    withdrawalHistory.reduce(
                      (sum, w) => sum + (w.amount || 0),
                      0
                    )
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const AccountView = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
      name: doctorData?.name || "",
      email: doctorData?.email || "",
      phone: doctorData?.phone || "",
      specialization: doctorData?.specialization || "",
      photoUrl: doctorData?.photoUrl || "",
      price: doctorData?.price || 0,
      description: doctorData?.description || "",
    });
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [profileImage, setProfileImage] = useState("");
    const fileInputRef = useRef(null);

    const handleImageChange = (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];

        if (!file.type.match("image.*")) {
          setPasswordError("File must be an image");
          return;
        }
        if (file.size > 2 * 1024 * 1024) {
          setPasswordError("Image size too large (max 2MB)");
          return;
        }

        setIsUploading(true);
        setPasswordError("");

        const reader = new FileReader();
        reader.onloadend = () => {
          setProfileImage(reader.result);
          setIsUploading(false);
        };
        reader.onerror = () => {
          console.error("Error creating preview");
          setPasswordError("Failed to process image");
          setIsUploading(false);
        };
        reader.readAsDataURL(file);
      }
    };

    const triggerFileInput = () => {
      fileInputRef.current.click();
    };

    const handleSave = async () => {
      try {
        if (!auth.currentUser) return;

        setIsPasswordLoading(true);
        setPasswordError("");
        setPasswordSuccess("");

        let photoUrl = doctorData.photoUrl;

        if (profileImage && profileImage.startsWith("data:")) {
          photoUrl = profileImage;
        }

        // Ganti dari const doctorDocRef = doc(db, "doctors", user.uid)
        const userDocRef = doc(db, "users", auth.currentUser.uid);

        await updateDoc(userDocRef, {
          name: editData.name,
          phone: editData.phone,
          specialization: editData.specialization,
          price: Number(editData.price),
          description: editData.description,
          photoUrl: photoUrl,
          updatedAt: new Date(),
        });

        await updateProfile(auth.currentUser, {
          // Ganti dari updateProfile(user, ...)
          displayName: editData.name,
        });

        setDoctorData({
          ...editData,
          photoUrl: photoUrl,
        });

        setProfileImage("");
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

      if (newPassword.length < 8) {
        setPasswordError("Password must be at least 8 characters long.");
        return;
      }

      try {
        setIsPasswordLoading(true);

        // Reauthenticate user
        const credential = EmailAuthProvider.credential(
          doctorData.email, // Ganti dari user.email
          currentPassword
        );
        await reauthenticateWithCredential(auth.currentUser, credential); // Ganti dari reauthenticateWithCredential(user, credential)

        // Update password
        await updatePassword(auth.currentUser, newPassword); // Ganti dari updatePassword(user, newPassword)

        // Update Firestore with password change timestamp
        const userDocRef = doc(db, "users", auth.currentUser.uid); // Ganti dari doc(db, "users", user.uid)
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
                  setEditData({
                    name: doctorData.name || "",
                    email: doctorData.email || "",
                    phone: doctorData.phone || "",
                    specialization: doctorData.specialization || "",
                    photoUrl: doctorData.photoUrl || "",
                    price: doctorData.price || 0,
                  });
                  setIsEditing(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setProfileImage("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
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
                  src={doctorData?.photoUrl || "/assets/default-profile.jpg"}
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
                  <p className="font-medium">
                    {doctorData?.name || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">
                    {doctorData?.email || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="font-medium">
                    {doctorData?.description || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-medium">
                    {doctorData?.phone || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Specialization</p>
                  <p className="font-medium">
                    {doctorData?.specialization || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">License Number</p>
                  <p className="font-medium">
                    {doctorData?.licenseNumber || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium capitalize">
                    {doctorData?.status || "pending"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="font-medium">
                    {formatCurrency(doctorData?.price || 0)}
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
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : doctorData?.photoUrl ? (
                    <img
                      src={doctorData.photoUrl}
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
                  Click to change photo (max 2MB, JPG/PNG)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Full Name *
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    rows="3"
                    value={editData.description}
                    onChange={(e) =>
                      setEditData({ ...editData, description: e.target.value })
                    }
                    placeholder="Describe your experience, qualifications, and approach to patient care"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tell patients about your background and expertise
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
                    placeholder="e.g. +1 234 567 8900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Specialization *
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={editData.specialization}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        specialization: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Consultation Price (IDR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={editData.price}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        price:
                          e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    placeholder="e.g. 150000"
                  />
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
                Current Password *
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
                New Password *
              </label>
              <input
                type="password"
                className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Confirm New Password *
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
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 ${
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

        {/* Account Actions Section */}
        {/* <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Account Actions</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Delete Account</h3>
                <p className="text-sm text-gray-500">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <button
                className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                onClick={() => {
                  if (
                    confirm(
                      "Are you sure you want to delete your account? This action cannot be undone."
                    )
                  ) {
                    // Handle account deletion
                  }
                }}
              >
                Delete Account
              </button>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Logout</h3>
                <p className="text-sm text-gray-500">
                  Sign out of your account on this device
                </p>
              </div>
              <button
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => {
                  // Handle logout logic
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div> */}
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
                    <p className="text-sm text-gray-500">Patient</p>
                    <p className="font-medium text-lg">{data.patientName}</p>
                    <p className="text-gray-600">
                      Age: {data.patientAge || "N/A"}
                    </p>
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

                  <div className="pb-4 border-b border-gray-100">
                    <p className="text-sm text-gray-500">Status</p>
                    <select
                      value={data.status}
                      onChange={(e) => {
                        handleAppointmentStatusChange(data.id, e.target.value);
                        setSelectedItem(null);
                      }}
                      className={`mt-1 w-full p-2 border rounded ${
                        data.status === "confirmed"
                          ? "bg-blue-100 text-blue-800"
                          : data.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : data.status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
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
                    <p className="text-sm text-gray-500">Patient</p>
                    <p className="font-medium">{data.patientName || "N/A"}</p>
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
                src={doctorData?.photoUrl || "/assets/default-profile.jpg"}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border border-gray-300"
                onError={(e) => {
                  e.target.src = "/assets/default-profile.jpg";
                }}
              />
            </div>
            <div>
              <h2 className="font-semibold">{doctorData?.name || "Doctor"}</h2>
              <p className="text-xs text-gray-500">
                {doctorData?.specialization || "Specialty"}
              </p>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <button
              onClick={() => setActiveView("schedule")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
                activeView === "schedule"
                  ? "bg-blue-100 text-blue-600"
                  : "hover:bg-gray-100"
              } transition-colors`}
            >
              <Calendar size={20} />
              Schedule Management
            </button>
            <button
              onClick={() => setActiveView("appointments")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
                activeView === "appointments"
                  ? "bg-blue-100 text-blue-600"
                  : "hover:bg-gray-100"
              } transition-colors`}
            >
              <UsersThree size={20} />
              Patient Appointments
            </button>
            <button
              onClick={() => setActiveView("chats")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
                activeView === "chats"
                  ? "bg-blue-100 text-blue-600"
                  : "hover:bg-gray-100"
              } transition-colors`}
            >
              <ChatCircleDots size={20} />
              Patient Chats
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
              Payment Records
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
              Account Settings
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
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {activeView === "schedule" && <ScheduleView />}
            {activeView === "appointments" && <AppointmentsView />}
            {activeView === "chats" && <ChatsView />}
            {activeView === "payments" && <PaymentsView />}
            {activeView === "account" && <AccountView />}
          </>
        )}
      </div>

      <DetailModal />
    </div>
  );
}
