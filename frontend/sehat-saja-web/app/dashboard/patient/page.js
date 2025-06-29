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
  ChatCircleTextIcon,
  ChatCircleDots,
  Images,
  Archive,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "../../../lib/firebase";
import {
  onAuthStateChanged,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  updateDoc,
  limit,
  arrayUnion,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  orderBy,
  addDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

export default function PatientDashboard() {
  const [activeView, setActiveView] = useState("appointments");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [accountData, setAccountData] = useState({
    name: "",
    email: "",
    phone: "",
    birthDate: "",
    gender: "",
    photoUrl: "",
  });
  const [selectedItem, setSelectedItem] = useState(null);
  const fileInputRef = useRef(null);
  const router = useRouter();

  const ChatView = () => {
    // State untuk manajemen chat
    const [activeChats, setActiveChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [imageUpload, setImageUpload] = useState(null);
    const [loadingChats, setLoadingChats] = useState(true);
    const [error, setError] = useState(null);
    const [chatExpiryTimer, setChatExpiryTimer] = useState(null);
    const fileInputRef = useRef(null);

    // State untuk sistem rating
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [rating, setRating] = useState(0);
    const [ratingComment, setRatingComment] = useState("");
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);
    const [hasRated, setHasRated] = useState(false);

    // Fungsi untuk mengecek apakah chat bisa dimulai
    const canStartChat = (chat) => {
      // Cek status pembayaran pertama kali
      if (chat.paymentStatus !== "completed") {
        return false;
      }

      // Cek data janji temu
      if (!chat.appointmentId) return false;
      const appointmentDate = chat.appointmentDate;
      const appointmentTime = chat.appointmentTime;
      if (!appointmentDate || !appointmentTime) return false;

      // Cek waktu sekarang vs waktu janji temu
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

    // Fungsi untuk mendapatkan status chat
    const getChatStatus = (chat) => {
      // Prioritas pertama: cek pembayaran
      if (chat.paymentStatus !== "completed") {
        return "unpaid";
      }

      if (!canStartChat(chat)) return "not_started";
      if (isChatExpired(chat)) return "expired";
      return "active";
    };

    // Fungsi untuk menghitung waktu tersisa
    const getTimeRemaining = (chat) => {
      // Jika belum bayar, tampilkan info pembayaran
      if (chat.paymentStatus !== "completed") {
        return "Menunggu pembayaran";
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
        return `Dimulai dalam ${hours}j ${minutes}m`;
      } else if (now < expiryTime) {
        const timeDiff = expiryTime - now;
        const minutes = Math.floor(timeDiff / (1000 * 60));
        return `${minutes} menit tersisa`;
      } else {
        return "Sesi telah berakhir";
      }
    };

    // Fungsi untuk mendapatkan deskripsi status chat
    const getChatStatusDescription = (chat) => {
      const status = getChatStatus(chat);
      switch (status) {
        case "unpaid":
          return "Silakan selesaikan pembayaran untuk memulai chat";
        case "not_started":
          return "Chat akan tersedia pada waktu janji temu";
        case "active":
          return "Chat aktif - Anda dapat mengirim pesan";
        case "expired":
          return "Sesi chat telah berakhir. Anda dapat melihat riwayat pesan di bawah.";
        default:
          return "";
      }
    };

    // Fungsi untuk mengecek apakah sudah memberi rating
    const checkIfRated = useCallback(
      async (chatId) => {
        if (!user?.uid || !chatId) return false;

        const ratingQuery = query(
          collection(db, "ratings"),
          where("chatId", "==", chatId),
          where("patientId", "==", user.uid),
          limit(1)
        );

        const snapshot = await getDocs(ratingQuery);
        return !snapshot.empty;
      },
      [user?.uid]
    );

    // Fungsi untuk submit rating
    const submitRating = async () => {
      if (!selectedChat || rating === 0 || isSubmittingRating) return;

      setIsSubmittingRating(true);
      try {
        await addDoc(collection(db, "ratings"), {
          chatId: selectedChat.id,
          appointmentId: selectedChat.appointmentId,
          doctorId: selectedChat.doctorId,
          patientId: user.uid,
          rating,
          comment: ratingComment,
          createdAt: serverTimestamp(),
        });

        // Update rating dokter
        const doctorRef = doc(db, "users", selectedChat.doctorId);
        const doctorSnap = await getDoc(doctorRef);

        if (doctorSnap.exists()) {
          const doctorData = doctorSnap.data();
          const currentRatings = doctorData.ratings || [];
          const newRatings = [...currentRatings, rating];
          const avgRating =
            newRatings.reduce((a, b) => a + b, 0) / newRatings.length;

          await updateDoc(doctorRef, {
            ratings: newRatings,
            averageRating: avgRating,
            ratingCount: newRatings.length,
          });
        }

        setHasRated(true);
        setShowRatingModal(false);
        alert("Terima kasih atas penilaian Anda!");
      } catch (error) {
        console.error("Error submitting rating:", error);
        alert("Gagal mengirim penilaian. Silakan coba lagi.");
      } finally {
        setIsSubmittingRating(false);
      }
    };

    // Fungsi untuk setup timer expiry chat
    const setupChatExpiryTimer = useCallback((chat) => {
      if (!chat?.appointmentDate || !chat?.appointmentTime) return;

      const appointmentDateTime = new Date(
        `${chat.appointmentDate}T${chat.appointmentTime}:00`
      );
      const expiryTime = new Date(
        appointmentDateTime.getTime() + 30 * 60 * 1000
      );
      const now = new Date();

      if (now < expiryTime) {
        const timeUntilExpiry = expiryTime - now;
        const timerId = setTimeout(() => {
          setSelectedChat((prevChat) =>
            prevChat ? { ...prevChat, _lastUpdate: Date.now() } : prevChat
          );
        }, timeUntilExpiry);

        setChatExpiryTimer(timerId);
        return timerId;
      }
      return null;
    }, []);

    // Fungsi untuk mengambil data chat
    const fetchChats = useCallback(async () => {
      if (!user) return;

      setLoadingChats(true);
      setError(null);
      try {
        const appointmentsQuery = query(
          collection(db, "appointments"),
          where("patientId", "==", user.uid)
        );

        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        const chats = await Promise.all(
          appointmentsSnapshot.docs.map(async (appointmentDoc) => {
            const appointmentData = appointmentDoc.data();

            // Cek jika status appointment bukan confirmed
            if (appointmentData.status !== "confirmed") {
              const chatQuery = query(
                collection(db, "chats"),
                where("appointmentId", "==", appointmentDoc.id),
                limit(1)
              );
              const chatSnapshot = await getDocs(chatQuery);
              if (chatSnapshot.empty) return null;
            }

            // Query untuk chat
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
            } else if (appointmentData.status === "confirmed") {
              // Buat chat baru jika appointment confirmed
              const newChatRef = await addDoc(collection(db, "chats"), {
                appointmentId: appointmentDoc.id,
                patientId: user.uid,
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
                patientId: user.uid,
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
              return null;
            }

            // Ambil data dokter
            let doctorName = "Dokter";
            if (appointmentData.doctorId) {
              const doctorDocSnap = await getDoc(
                doc(db, "users", appointmentData.doctorId)
              );
              if (doctorDocSnap.exists()) {
                doctorName =
                  doctorDocSnap.data().name ||
                  appointmentData.doctorName ||
                  doctorName;
              }
            }

            // Format tanggal appointment
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
              doctorName,
              doctorSpecialization: appointmentData.doctorSpecialization,
              formattedAppointmentDate,
              formattedAppointmentTime: appointmentData.appointmentTime,
              complaint: appointmentData.complaint,
              appointmentStatus: appointmentData.status,
              paymentStatus: appointmentData.paymentStatus || "pending",
              price: appointmentData.price || 0,
              priceDisplay: appointmentData.priceDisplay || "Rp 0",
            };
          })
        );

        // Filter chat yang valid dan urutkan
        const validChats = chats.filter((chat) => chat !== null);
        validChats.sort((a, b) => {
          const dateA = new Date(
            `${a.appointmentDate}T${a.appointmentTime}:00`
          );
          const dateB = new Date(
            `${b.appointmentDate}T${b.appointmentTime}:00`
          );
          return dateB - dateA;
        });

        setActiveChats(validChats);
        if (validChats.length > 0 && !selectedChat) {
          setSelectedChat(validChats[0]);
        }
      } catch (err) {
        console.error("Error fetching chats:", err);
        setError("Gagal memuat chat. Silakan coba lagi.");
      } finally {
        setLoadingChats(false);
      }
    }, [user.uid]);

    // Effect untuk fetch chat saat component mount
    useEffect(() => {
      if (user?.uid) {
        fetchChats();
      }
    }, [user?.uid, fetchChats]);

    // Effect untuk setup timer expiry
    useEffect(() => {
      if (chatExpiryTimer) {
        clearTimeout(chatExpiryTimer);
        setChatExpiryTimer(null);
      }

      if (selectedChat) {
        const timerId = setupChatExpiryTimer(selectedChat);
        if (timerId) {
          setChatExpiryTimer(timerId);
        }

        // Cek rating jika chat sudah expired
        if (getChatStatus(selectedChat) === "expired") {
          checkIfRated(selectedChat.id).then((rated) => {
            setHasRated(rated);
            if (!rated) {
              setShowRatingModal(true);
            }
          });
        }
      }

      return () => {
        if (chatExpiryTimer) {
          clearTimeout(chatExpiryTimer);
        }
      };
    }, [selectedChat?.id, setupChatExpiryTimer, checkIfRated]);

    // Effect untuk listen perubahan chat
    useEffect(() => {
      if (!selectedChat) return;

      const unsubscribe = onSnapshot(
        doc(db, "chats", selectedChat.id),
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setMessages(data.messages || []);
            setSelectedChat((prev) => (prev ? { ...prev, ...data } : null));
          }
        },
        (err) => {
          console.error("Error listening to chat updates:", err);
        }
      );

      return () => unsubscribe();
    }, [selectedChat?.id]);

    // Fungsi untuk mengirim pesan
    const handleSendMessage = async (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      if ((!newMessage.trim() && !imageUpload) || !selectedChat) return;

      const chatStatus = getChatStatus(selectedChat);
      if (chatStatus !== "active") {
        alert("Chat tidak tersedia saat ini.");
        return;
      }

      setIsSending(true);
      try {
        const chatRef = doc(db, "chats", selectedChat.id);
        const newMessageObj = {
          senderId: user.uid,
          senderName: user.displayName || user.name || "Pasien",
          content: newMessage,
          type: imageUpload ? "image" : "text",
          timestamp: Timestamp.now(),
          createdAt: new Date(),
        };

        // Handle image upload
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
            alert("Gagal memproses gambar. Hanya mengirim pesan teks.");
            newMessageObj.type = "text";
          }
        }

        // Update data chat
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
        alert("Gagal mengirim pesan: " + error.message);
      } finally {
        setIsSending(false);
      }
    };

    // Fungsi untuk handle upload gambar
    const handleImageUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (!file.type.match("image.*")) {
          alert("File harus berupa gambar");
          return;
        }
        if (file.size > 2 * 1024 * 1024) {
          alert("Ukuran gambar terlalu besar (maks 2MB)");
          return;
        }
        setImageUpload(file);
        setNewMessage("");
      }
    };

    // Fungsi untuk trigger file input
    const triggerFileInput = () => {
      fileInputRef.current.click();
    };

    // Fungsi untuk format waktu
    const formatTime = (timeString) => {
      if (!timeString) return "N/A";
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    };

    // Fungsi untuk menampilkan badge status
    const getStatusBadge = (chat) => {
      const status = getChatStatus(chat);
      switch (status) {
        case "unpaid":
          return (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
              Belum Bayar
            </span>
          );
        case "not_started":
          return (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
              Dijadwalkan
            </span>
          );
        case "active":
          return (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Aktif
            </span>
          );
        case "expired":
          return (
            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
              Selesai
            </span>
          );
        default:
          return null;
      }
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ChatCircleDots size={24} /> Konsultasi Chat
          </h1>
          <button
            onClick={fetchChats}
            className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
          >
            Segarkan
          </button>
        </div>

        {/* Loading state */}
        {loadingChats ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p className="ml-4 text-gray-600">Memuat konsultasi Anda...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-200px)]">
            {/* Sidebar daftar chat */}
            <div className="w-full md:w-1/3 bg-white rounded-xl shadow border border-gray-100 p-4 overflow-y-auto">
              <h2 className="font-semibold mb-4">Konsultasi Anda</h2>
              {activeChats.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    Tidak ada konsultasi ditemukan
                  </p>
                  <Link
                    href="/appointment"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Buat Janji Temu
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeChats.map((chat) => {
                    const status = getChatStatus(chat);
                    const hasMessages =
                      chat.messages && chat.messages.length > 0;

                    return (
                      <div
                        key={chat.id}
                        onClick={() => setSelectedChat(chat)}
                        className={`p-3 rounded-lg cursor-pointer border ${
                          selectedChat?.id === chat.id
                            ? "bg-blue-50 border-blue-200"
                            : "hover:bg-gray-50 border-transparent"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium">{chat.doctorName}</h3>
                            <p className="text-xs text-gray-500">
                              {chat.doctorSpecialization}
                            </p>
                          </div>
                          {getStatusBadge(chat)}
                        </div>

                        <p className="text-sm text-gray-600 truncate mb-2">
                          {chat.complaint || "Konsultasi umum"}
                        </p>

                        <div className="text-xs text-gray-400">
                          <p>{chat.formattedAppointmentDate}</p>
                          <p>
                            pada {formatTime(chat.formattedAppointmentTime)}
                          </p>
                          <p className="font-medium mt-1">
                            {getTimeRemaining(chat)}
                          </p>
                        </div>

                        {hasMessages && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="text-sm text-gray-500 truncate">
                              Terakhir:{" "}
                              {chat.messages[chat.messages.length - 1]
                                ?.content || "Gambar"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {status === "expired"
                                ? "Riwayat chat tersedia"
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

            {/* Area chat utama */}
            <div className="flex-1 flex flex-col bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
              {selectedChat ? (
                <>
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="font-semibold">
                          Konsultasi dengan {selectedChat.doctorName}
                        </h2>
                        <p className="text-sm text-gray-500">
                          {selectedChat.doctorSpecialization}
                        </p>
                        <p className="text-sm text-gray-500">
                          {selectedChat.formattedAppointmentDate} pada{" "}
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

                    {/* Info keluhan */}
                    {selectedChat.complaint && (
                      <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Keluhan:</span>{" "}
                          {selectedChat.complaint}
                        </p>
                      </div>
                    )}

                    {/* Info pembayaran */}
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Status Pembayaran:</span>{" "}
                        {selectedChat.paymentStatus === "completed" ? (
                          <span className="text-green-600">
                            Lunas (Rp {selectedChat.priceDisplay})
                          </span>
                        ) : (
                          <span className="text-red-600">
                            Belum dibayar (Rp {selectedChat.priceDisplay})
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Info status chat */}
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

                  {/* Area pesan */}
                  <div className="flex-1 p-4 overflow-y-auto">
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
                          Pembayaran Belum Lunas
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Silakan selesaikan pembayaran untuk memulai konsultasi
                          chat dengan dokter.
                        </p>
                        <button
                          onClick={() => {
                            // Arahkan ke halaman pembayaran
                            // Contoh: router.push(`/payment/${selectedChat.appointmentId}`);
                            alert("Redirect ke halaman pembayaran");
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Bayar Sekarang
                        </button>
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
                            Chat akan tersedia pada waktu janji temu
                          </p>
                          <p className="text-sm text-gray-400">
                            {formatTime(selectedChat.formattedAppointmentTime)}{" "}
                            pada {selectedChat.formattedAppointmentDate}
                          </p>
                        </div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        {getChatStatus(selectedChat) === "expired"
                          ? "Tidak ada pesan yang dipertukarkan selama konsultasi ini."
                          : "Belum ada pesan. Mulai percakapan!"}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((msg, index) => (
                          <div
                            key={`msg-${index}-${
                              msg.timestamp?.seconds || index
                            }`}
                            className={`flex ${
                              msg.senderId === user.uid
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                                msg.senderId === user.uid
                                  ? "bg-blue-100"
                                  : "bg-gray-100"
                              }`}
                            >
                              <div className="mb-1">
                                <span className="text-xs font-medium text-gray-600">
                                  {msg.senderId === user.uid
                                    ? "Anda"
                                    : selectedChat.doctorName}
                                </span>
                              </div>
                              {msg.type === "image" && msg.imageUrl && (
                                <div className="mb-2">
                                  <img
                                    src={msg.imageUrl}
                                    alt="Gambar chat"
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
                                    : "Baru saja")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Area input pesan - hanya tampil jika chat aktif */}
                  {getChatStatus(selectedChat) === "active" && (
                    <form
                      onSubmit={handleSendMessage}
                      className="p-4 border-t border-gray-200"
                    >
                      <div className="p-4 border-t border-gray-200">
                        <div className="flex gap-2">
                          {/* Input text */}
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Ketik pesan Anda..."
                            className="flex-1 p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                            onKeyPress={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            autoComplete="off"
                          />
                          {/* Input file */}
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                            id="file-input"
                          />
                          {/* Tombol upload gambar */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              triggerFileInput();
                            }}
                            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            title="Unggah gambar"
                          >
                            <Images size={24} />
                          </button>
                          {/* Tombol kirim */}
                          <button
                            type="submit"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSendMessage();
                            }}
                            disabled={
                              isSending || (!newMessage.trim() && !imageUpload)
                            }
                            className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
                              isSending || (!newMessage.trim() && !imageUpload)
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            {isSending ? "Mengirim..." : "Kirim"}
                          </button>
                        </div>
                        {imageUpload && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-sm">
                              Gambar siap: {imageUpload.name}
                            </span>
                            <button
                              onClick={() => setImageUpload(null)}
                              className="text-red-500 text-sm hover:text-red-700"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </form>
                  )}

                  {/* Pesan footer untuk chat yang sudah expired */}
                  {getChatStatus(selectedChat) === "expired" && (
                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-center gap-2">
                        <Archive size={16} className="text-gray-500" />
                        <p className="text-sm text-gray-600 text-center">
                          Konsultasi ini telah berakhir. Riwayat chat disimpan
                          untuk catatan Anda.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  {activeChats.length === 0
                    ? "Tidak ada konsultasi tersedia. Buat janji temu untuk mulai chatting."
                    : "Pilih konsultasi untuk melihat pesan"}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Rating */}
        {showRatingModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Beri Nilai Konsultasi</h2>
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="text-center mb-6">
                <p className="mb-4">
                  Bagaimana pengalaman konsultasi Anda dengan Dr.{" "}
                  {selectedChat?.doctorName}?
                </p>

                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-3xl ${
                        rating >= star ? "text-yellow-400" : "text-gray-300"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <p className="text-sm text-gray-500 mb-2">
                  {rating === 1 && "Buruk"}
                  {rating === 2 && "Cukup"}
                  {rating === 3 && "Baik"}
                  {rating === 4 && "Sangat Baik"}
                  {rating === 5 && "Luar Biasa"}
                </p>

                <textarea
                  placeholder="Masukan tambahan (maks 200 karakter)"
                  className="w-full p-3 border border-gray-300 rounded-lg mt-4"
                  rows={3}
                  maxLength={200}
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Lewati
                </button>
                <button
                  onClick={submitRating}
                  disabled={rating === 0 || isSubmittingRating}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${
                    rating === 0 || isSubmittingRating
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {isSubmittingRating ? "Mengirim..." : "Kirim Penilaian"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    if (typeof date === "string") {
      // Jika date dalam format "2025-06-05"
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time) => {
    if (!time) return "N/A";
    if (typeof time === "string") {
      // Jika time dalam format "01:23"
      return time;
    }
    return time;
  };

  const formatCurrency = (amount) => {
    if (!amount) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Data fetching
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          // Check user role first
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();

            // Redirect based on role
            if (userData.role === "doctor") {
              router.push("/dashboard/doctor");
              return;
            } else if (userData.role === "admin") {
              router.push("/dashboard/admin");
              return;
            }

            // If role is "user", set account data and continue with normal flow
            setAccountData({
              name: userData.name || "",
              email: userData.email || "",
              phone: userData.phone || "",
              birthDate: userData.birthDate || "",
              gender: userData.gender || "",
              photoUrl: userData.photoUrl || "",
            });

            // Fetch appointments and payments
            await fetchAllData(currentUser.uid);
          } else {
            // If user document doesn't exist, redirect to sign-in
            router.push("/sign-in");
          }
        } catch (error) {
          console.error("Error loading data:", error);
          router.push("/sign-in");
        }
      } else {
        router.push("/sign-in");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchAllData = async (uid) => {
    try {
      const [appointmentsData, paymentsData] = await Promise.all([
        fetchAppointments(uid),
        fetchPayments(uid),
      ]);

      const paymentsWithAppointments = await Promise.all(
        paymentsData.map(async (payment) => {
          if (payment.appointmentId) {
            const appointmentDoc = await getDoc(
              doc(db, "appointments", payment.appointmentId)
            );
            if (appointmentDoc.exists()) {
              payment.appointment = {
                id: appointmentDoc.id,
                ...appointmentDoc.data(),
                date:
                  appointmentDoc.data().date?.toDate?.() ||
                  new Date(appointmentDoc.data().date),
              };
            }
          }
          return payment;
        })
      );

      setAppointments(appointmentsData);
      setPayments(paymentsWithAppointments);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const fetchAppointments = async (uid) => {
    try {
      const q = query(
        collection(db, "appointments"),
        where("patientId", "==", uid)
      );
      const snapshot = await getDocs(q);
      const appointments = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();

          // Cek apakah ada chat terkait
          const chatQuery = query(
            collection(db, "chats"),
            where("appointmentId", "==", doc.id),
            limit(1)
          );
          const chatSnapshot = await getDocs(chatQuery);
          const chatData = chatSnapshot.docs[0]?.data();

          return {
            id: doc.id,
            ...data,
            chatId: chatSnapshot.docs[0]?.id,
            chatStatus: chatData?.status,
            // Perbaiki handling tanggal - gunakan appointmentDate dari data
            date: data.appointmentDate
              ? new Date(data.appointmentDate)
              : new Date(),
            // Gunakan appointmentTime dari data
            time: data.appointmentTime || data.time,
            // Map field yang berbeda
            doctorName: data.doctorName,
            specialization: data.doctorSpecialization,
            price: data.price,
            complaint: data.complaint,
            status: data.status,
            paymentStatus: data.paymentStatus,
            paymentMethod: data.paymentMethod,
          };
        })
      );

      return appointments.sort((a, b) => b.date - a.date);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      return [];
    }
  };

  const fetchPayments = async (uid) => {
    try {
      // Jika payments disimpan terpisah, gunakan query ini
      // Jika tidak, return empty array karena payment info sudah ada di appointments
      const q = query(
        collection(db, "payments"),
        where("patientId", "==", uid)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return []; // Tidak ada collection payments terpisah
      }

      const payments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return payments;
    } catch (error) {
      console.error("Error fetching payments:", error);
      return [];
    }
  };

  // Actions
  const handleCancelAppointment = async (appointmentId) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      const batch = writeBatch(db);

      // Update appointment status
      const appointmentRef = doc(db, "appointments", appointmentId);
      batch.update(appointmentRef, {
        status: "cancelled",
        paymentStatus: "cancelled", // Update payment status juga
        updatedAt: new Date(),
      });

      // Update chat status jika ada
      const chatQuery = query(
        collection(db, "chats"),
        where("appointmentId", "==", appointmentId),
        limit(1)
      );
      const chatSnapshot = await getDocs(chatQuery);

      if (!chatSnapshot.empty) {
        const chatRef = doc(db, "chats", chatSnapshot.docs[0].id);
        batch.update(chatRef, {
          status: "cancelled",
          updatedAt: new Date(),
        });
      }

      // Jika ada collection payments terpisah
      const paymentQuery = query(
        collection(db, "payments"),
        where("appointmentId", "==", appointmentId),
        limit(1)
      );
      const paymentSnapshot = await getDocs(paymentQuery);

      if (!paymentSnapshot.empty) {
        const paymentRef = doc(db, "payments", paymentSnapshot.docs[0].id);
        batch.update(paymentRef, {
          status: "cancelled",
          updatedAt: new Date(),
        });
      }

      await batch.commit();
      await fetchAllData(user.uid);
      alert("Appointment cancelled successfully");
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      alert("Failed to cancel appointment");
    }
  };

  const handlePayNow = async (paymentId) => {
    try {
      await updateDoc(doc(db, "payments", paymentId), {
        status: "completed",
        paidAt: new Date(),
      });

      const paymentDoc = await getDoc(doc(db, "payments", paymentId));
      if (paymentDoc.exists() && paymentDoc.data().appointmentId) {
        await updateDoc(
          doc(db, "appointments", paymentDoc.data().appointmentId),
          {
            paymentStatus: "completed",
          }
        );
      }

      await fetchAllData(user.uid);
      alert(
        "Payment completed successfully! You will receive payment instructions via email."
      );
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Failed to process payment");
    }
  };

  const AppointmentsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FirstAid size={24} /> My Appointments
        </h1>
        <button
          onClick={() => fetchAllData(user.uid)}
          className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
        >
          Refresh
        </button>
      </div>

      {appointments.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow text-center">
          <p className="text-gray-500">No appointments found</p>
          <Link
            href="/appointment"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Book an Appointment
          </Link>
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
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">
                    {appointment.doctorName}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {appointment.specialization}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      appointment.status === "confirmed"
                        ? "bg-blue-100 text-blue-800"
                        : appointment.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : appointment.status === "cancelled"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {appointment.status}
                  </span>
                  {appointment.paymentStatus && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        appointment.paymentStatus === "paid"
                          ? "bg-green-100 text-green-800"
                          : appointment.paymentStatus === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {appointment.paymentStatus}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={16} />
                  <span>{formatDate(appointment.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={16} />
                  <span>{formatTime(appointment.time)}</span>
                </div>
                <div className="pt-2">
                  <p className="font-medium text-gray-700">Complaint:</p>
                  <p className="text-gray-600">
                    {appointment.complaint || "Not specified"}
                  </p>
                </div>
                {appointment.paymentMethod && (
                  <div className="pt-2">
                    <p className="font-medium text-gray-700">Payment Method:</p>
                    <p className="text-gray-600 uppercase">
                      {appointment.paymentMethod}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="font-semibold text-blue-600">
                  {appointment.priceDisplay ||
                    formatCurrency(appointment.price)}
                </span>
                <div className="flex gap-2">
                  {appointment.status === "confirmed" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelAppointment(appointment.id);
                      }}
                      className="px-3 py-1 text-xs text-red-600 hover:text-red-800 bg-red-50 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  {appointment.chatId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveView("chats");
                      }}
                      className="px-3 py-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 rounded-lg transition-colors"
                    >
                      Open Chat
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Status Indicator */}
              {appointment.chatStatus && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Chat Status:
                    <span
                      className={`ml-1 ${
                        appointment.chatStatus === "active"
                          ? "text-green-600"
                          : appointment.chatStatus === "pending"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {appointment.chatStatus}
                    </span>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const PaymentsView = () => {
    const [loadingPayments, setLoadingPayments] = useState(false);
    const [paymentError, setPaymentError] = useState(null);
    const [stats, setStats] = useState({
      total: 0,
      completed: 0,
      pending: 0,
      cancelled: 0,
    });

    const [payments, setPayments] = useState([]); // <-- tambahkan ini
    const [selectedItem, setSelectedItem] = useState(null); // <-- tambahkan ini

    useEffect(() => {
      if (!user?.uid) return; // <- cegah efek looping

      const fetchPaymentsData = async () => {
        setLoadingPayments(true);
        setPaymentError(null);

        try {
          const q = query(
            collection(db, "payments"),
            where("patientId", "==", user.uid)
          );
          const snapshot = await getDocs(q);

          let total = 0;
          let completed = 0;
          let pending = 0;
          let cancelled = 0;

          const paymentsData = await Promise.all(
            snapshot.docs.map(async (paymentDocSnap) => {
              const paymentData = paymentDocSnap.data();

              total += paymentData.amount || 0;
              if (paymentData.status === "completed") completed++;
              else if (paymentData.status === "pending") pending++;
              else if (paymentData.status === "cancelled") cancelled++;

              let appointmentInfo = null;
              if (paymentData.appointmentId) {
                const appointmentDoc = await getDoc(
                  doc(db, "appointments", paymentData.appointmentId)
                );
                if (appointmentDoc.exists()) {
                  appointmentInfo = {
                    id: appointmentDoc.id,
                    ...appointmentDoc.data(),
                    date: appointmentDoc.data().appointmentDate || "N/A",
                    time: appointmentDoc.data().appointmentTime || "N/A",
                  };
                }
              }

              return {
                id: paymentDocSnap.id,
                ...paymentData,
                date: paymentData.paymentDate?.toDate?.() || new Date(),
                appointment: appointmentInfo,
              };
            })
          );

          setStats({ total, completed, pending, cancelled });
          setPayments(paymentsData.sort((a, b) => b.date - a.date));
        } catch (error) {
          console.error("Error fetching payments:", error);
          setPaymentError("Failed to load payment history");
        } finally {
          setLoadingPayments(false);
        }
      };

      fetchPaymentsData();
    }, [user?.uid]); // <- spesifik ke user.uid agar tidak looping

    const formatDate = (date) => {
      if (!date) return "N/A";
      const d = date?.toDate?.() || new Date(date);
      return d.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };

    const formatTime = (time) => {
      if (!time) return "N/A";
      if (typeof time === "string") {
        const [hours, minutes] = time.split(":");
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
      }
      return time;
    };

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(amount || 0);
    };

    const handlePayNow = async (paymentId) => {
      if (!confirm("Are you sure you want to process this payment?")) return;

      try {
        await updateDoc(doc(db, "payments", paymentId), {
          status: "completed",
          paidAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        const paymentDocSnap = await getDoc(doc(db, "payments", paymentId));
        if (paymentDocSnap.exists() && paymentDocSnap.data().appointmentId) {
          await updateDoc(
            doc(db, "appointments", paymentDocSnap.data().appointmentId),
            {
              paymentStatus: "completed",
              updatedAt: serverTimestamp(),
            }
          );
        }

        // Pastikan fungsi fetchAllData ada, atau ganti dengan location.reload atau pemanggilan ulang fetchPaymentsData
        if (typeof fetchAllData === "function") {
          await fetchAllData(user.uid);
        }

        alert("Payment processed successfully!");
      } catch (error) {
        console.error("Error processing payment:", error);
        alert("Failed to process payment");
      }
    };

    return (
      <div className="space-y-6 text-black">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Receipt size={24} /> Payment History
          </h1>
          <button
            onClick={() => {
              if (typeof fetchAllData === "function") {
                fetchAllData(user.uid);
              } else {
                location.reload(); // fallback kalau fetchAllData tidak tersedia
              }
            }}
            className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
          >
            Refresh
          </button>
        </div>

        {loadingPayments ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : paymentError ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">
            {paymentError}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
                <p className="text-gray-500 text-sm">Total Spent</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.total)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
                <p className="text-gray-500 text-sm">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
                <p className="text-gray-500 text-sm">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
                <p className="text-gray-500 text-sm">Cancelled</p>
                <p className="text-2xl font-bold">{stats.cancelled}</p>
              </div>
            </div>

            {payments.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow text-center border border-gray-100">
                <p className="text-gray-500">No payment records found</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
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
                      {payments.map((payment) => (
                        <tr
                          key={payment.id}
                          className="hover:bg-blue-50 cursor-pointer"
                          onClick={() =>
                            setSelectedItem({ type: "payment", data: payment })
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(payment.date)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {payment.description}
                            </div>
                            {payment.appointment && (
                              <div className="text-xs text-gray-500 mt-1">
                                {formatDate(payment.appointment.date)} at{" "}
                                {formatTime(payment.appointment.time)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                            {payment.paymentMethod || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                payment.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : payment.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : payment.status === "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {payment.status === "pending" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePayNow(payment.id);
                                }}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                Pay Now
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const AccountView = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ ...accountData });
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [profileImage, setProfileImage] = useState(""); // Store base64 string directly
    const fileInputRef = useRef(null);

    const handleImageChange = (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];

        // Validate image type and size
        if (!file.type.match("image.*")) {
          setPasswordError("File must be an image");
          return;
        }
        if (file.size > 2 * 1024 * 1024) {
          // 2MB
          setPasswordError("Image size too large (maximum 2MB)");
          return;
        }

        setIsUploading(true);
        setPasswordError("");

        const reader = new FileReader();
        reader.onloadend = () => {
          setProfileImage(reader.result); // Store base64 string
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

    const triggerFileInput = useCallback(() => {
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset value setiap kali dipanggil
        fileInputRef.current.click();
      }
    }, []);

    const handleSave = async () => {
      try {
        if (!user) return;

        setIsPasswordLoading(true);
        setPasswordError("");
        setPasswordSuccess("");

        let photoUrl = accountData.photoUrl;

        if (profileImage && profileImage.startsWith("data:")) {
          photoUrl = profileImage;
        }

        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          name: editData.name,
          phone: editData.phone,
          birthDate: editData.birthDate,
          gender: editData.gender,
          photoUrl: photoUrl,
          updatedAt: new Date(),
        });

        await updateProfile(user, {
          displayName: editData.name,
        });

        setAccountData({
          ...editData,
          photoUrl: photoUrl,
        });

        setProfileImage("");
        setIsEditing(false);
        setPasswordSuccess("Profile updated successfully!");
      } catch (error) {
        console.error("Error updating profile:", error);

        if (error.code === "auth/invalid-profile-attribute") {
          setPasswordError("Invalid profile data. Please check your input.");
        } else {
          setPasswordError("Failed to update profile. Please try again.");
        }
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

      if (newPassword.length < 6) {
        setPasswordError("Password must be at least 6 characters long.");
        return;
      }

      try {
        setIsPasswordLoading(true);

        // Reauthenticate user
        const credential = EmailAuthProvider.credential(
          user.email,
          currentPassword
        );
        await reauthenticateWithCredential(user, credential);

        // Update password
        await updatePassword(user, newPassword);

        // Update Firestore with password change timestamp
        const userDocRef = doc(db, "users", user.uid);
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
                  setEditData({ ...accountData });
                  setIsEditing(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-blue-50 transition-colors"
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
                  src={accountData.photoUrl || "/assets/default-profile.jpg"}
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
                  <p className="font-medium">{accountData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{accountData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-medium">
                    {accountData.phone || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium">
                    {accountData.birthDate
                      ? formatDate(accountData.birthDate)
                      : "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium capitalize">
                    {accountData.gender || "Not specified"}
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
                  ) : accountData.photoUrl ? (
                    <img
                      src={accountData.photoUrl}
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
                  Click to change photo (max 2MB)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Full Name
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
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={editData.birthDate}
                    onChange={(e) =>
                      setEditData({ ...editData, birthDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Gender
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={editData.gender}
                    onChange={(e) =>
                      setEditData({ ...editData, gender: e.target.value })
                    }
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
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
                Current Password
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
                New Password
              </label>
              <input
                type="password"
                className="w-full p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Confirm New Password
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
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${
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
                    <p className="text-sm text-gray-500">Doctor</p>
                    <p className="font-medium text-lg">{data.doctorName}</p>
                    <p className="text-gray-600">{data.specialization}</p>
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

                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="font-medium text-blue-600">
                        {formatCurrency(data.price)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          data.status === "confirmed"
                            ? "bg-blue-100 text-blue-800"
                            : data.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : data.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {data.status}
                      </span>
                    </div>
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
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="font-medium">{data.description}</p>
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

                  {data.appointment && (
                    <div className="pt-2">
                      <p className="font-medium text-gray-700 mb-2">
                        Associated Appointment
                      </p>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <FirstAid size={16} className="text-gray-500" />
                          <span className="font-medium">
                            {data.appointment.doctorName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm mt-1 text-gray-600">
                          <Calendar size={16} />
                          <span>{formatDate(data.appointment.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm mt-1 text-gray-600">
                          <Clock size={16} />
                          <span>{data.appointment.time}</span>
                        </div>
                      </div>
                    </div>
                  )}
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
                src={accountData.photoUrl || "/assets/default-profile.jpg"}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border border-gray-300"
                onError={(e) => {
                  e.target.src = "/assets/default-profile.jpg";
                }}
              />
            </div>
            <div>
              <h2 className="font-semibold">{accountData.name}</h2>
              <p className="text-xs text-gray-500">Patient</p>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <button
              onClick={() => setActiveView("appointments")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
                activeView === "appointments"
                  ? "bg-blue-100 text-blue-600"
                  : "hover:bg-gray-100"
              } transition-colors`}
            >
              <FirstAid size={20} />
              Appointments
            </button>
            <button
              onClick={() => setActiveView("chats")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
                activeView === "chats"
                  ? "bg-blue-100 text-blue-600"
                  : "hover:bg-gray-100"
              } transition-colors`}
            >
              <ChatCircleDots size={24} />
              Consultation Chats
            </button>
            <button
              onClick={() => setActiveView("payments")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left ${
                activeView === "payments"
                  ? "bg-blue-100 text-blue-600"
                  : "hover:bg-gray-100"
              } transition-colors`}
            >
              <Receipt size={20} />
              Payments
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
              Account
            </button>
          </nav>

          <div className="p-4 border-t border-gray-200 flex flex-col gap-2">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-500 hover:text-white bg-blue-100 text-blue-600 transition-colors"
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

      <div className="ml-64 p-8">
        {activeView === "appointments" && <AppointmentsView />}
        {activeView === "chats" && <ChatView />}
        {activeView === "payments" && <PaymentsView />}
        {activeView === "account" && <AccountView />}
      </div>

      <DetailModal />
    </div>
  );
}
