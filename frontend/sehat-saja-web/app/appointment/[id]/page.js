"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import NavbarWhite from "@/components/navbar-white";
import Footer from "@/components/footer/page";
import Link from "next/link";
import Image from "next/image";
import { auth, db } from "../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { EnvelopeSimple, Phone } from "@phosphor-icons/react";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  writeBatch,
  updateDoc,
} from "firebase/firestore";

export default function AppointmentPage() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));

          if (userDoc.exists()) {
            const userData = userDoc.data();

            // Cek role dan redirect jika bukan "user"
            if (userData.role === "admin") {
              router.push("/dashboard/admin");
              return;
            } else if (userData.role === "doctor") {
              router.push("/dashboard/doctor");
              return;
            } else if (userData.role !== "user") {
              // Role tidak dikenal, redirect ke home
              router.push("/");
              return;
            }

            // Jika role adalah "user", biarkan akses halaman
            // Set user state jika diperlukan
            setUser(currentUser);
            setLoading(false);
          } else {
            // User document tidak ada, redirect ke home
            router.push("/");
          }
        } catch (error) {
          console.error("Error checking user role:", error);
          router.push("/sign-in");
        }
      } else {
        // User tidak login, redirect ke sign-in
        router.push("/sign-in");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Doctor data state
  const [doctor, setDoctor] = useState(null);
  const [doctorLoading, setDoctorLoading] = useState(true);
  const [doctorError, setDoctorError] = useState(null);

  // Form states
  const [complaint, setComplaint] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available dates and times state
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);

  // User data state
  const [accountData, setAccountData] = useState({
    name: "",
    email: "",
    phone: "",
    birthDate: "",
    gender: "",
  });

  // ✅ FORMAT DATE DENGAN CARA YANG SAMA PERSIS DENGAN DOCTOR DASHBOARD
  const formatDateForDatabase = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 0-based ke 1-based
    const day = date.getDate();

    const monthStr = String(month).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const result = `${year}-${monthStr}-${dayStr}`;

    return result;
  };

  // ✅ GENERATE DATES DENGAN LOGIKA SEDERHANA
  const generateDates = () => {
    const dates = [];
    const today = new Date();

    // Include today (i=0) sampai 30 hari ke depan (i=30)
    for (let i = 0; i <= 30; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + i);
      dates.push(targetDate);
    }

    return dates;
  };

  // ✅ FUNCTION UNTUK CALCULATE AVAILABLE DATES
  const calculateAvailableDates = (doctorData) => {
    if (!doctorData?.dailySchedules) {
      console.log("No doctor schedules available");
      setAvailableDates([]);
      return;
    }

    const generatedDates = generateDates();
    const validDates = [];

    console.log("=== CALCULATING AVAILABLE DATES ===");
    console.log("Doctor schedules:", Object.keys(doctorData.dailySchedules));

    generatedDates.forEach((date, index) => {
      if (index > 15) return;

      const formatted = formatDateForDatabase(date);
      const schedule = doctorData.dailySchedules[formatted];
      const validTimes = schedule ? schedule.filter((t) => t !== "00:00") : [];
      const isValid = validTimes.length > 0;

      console.log(`Day +${index}: ${date.toDateString()} → ${formatted}`);
      console.log(`  Schedule:`, schedule || "None");
      console.log(`  Valid times:`, validTimes);
      console.log(`  Is valid:`, isValid);

      if (isValid) {
        validDates.push(date);
        console.log(`  ✅ ADDED to available dates`);
      }
    });

    console.log("=== SETTING AVAILABLE DATES ===");
    console.log("Valid dates count:", validDates.length);
    console.log(
      "Valid dates:",
      validDates.map((d) => formatDateForDatabase(d))
    );

    setAvailableDates(validDates);
  };

  // ✅ FUNCTION UNTUK CALCULATE AVAILABLE TIMES WHEN DATE SELECTED
  const calculateAvailableTimes = (selectedDateObj) => {
    if (!selectedDateObj || !doctor?.dailySchedules) {
      setAvailableTimes([]);
      return;
    }

    const formatted = formatDateForDatabase(selectedDateObj);
    const schedule = doctor.dailySchedules[formatted] || [];
    const validTimes = schedule.filter((t) => t !== "00:00");

    console.log("Calculating times for:", formatted);
    console.log("Available times:", validTimes);

    setAvailableTimes(validTimes);
  };

  // ✅ FUNCTION UNTUK MENGHAPUS JADWAL DARI DOCTOR SETELAH APPOINTMENT DIBUAT
  const removeScheduleFromDoctor = async (
    doctorId,
    selectedDateFormatted,
    selectedTime
  ) => {
    try {
      console.log("🗑️ Removing schedule:", {
        doctorId,
        selectedDateFormatted,
        selectedTime,
      });

      // Get current doctor data
      const doctorRef = doc(db, "users", doctorId);
      const doctorDoc = await getDoc(doctorRef);

      if (!doctorDoc.exists()) {
        console.error("Doctor document not found");
        return;
      }

      const doctorData = doctorDoc.data();
      const currentSchedules = doctorData.dailySchedules || {};

      console.log(
        "Current schedules for date:",
        currentSchedules[selectedDateFormatted]
      );

      // Remove the specific time slot from the date
      if (currentSchedules[selectedDateFormatted]) {
        const updatedTimeSlots = currentSchedules[selectedDateFormatted].filter(
          (time) => time !== selectedTime
        );

        console.log("Updated time slots after removal:", updatedTimeSlots);

        // If no time slots left for this date, remove the date entry completely
        if (updatedTimeSlots.length === 0) {
          delete currentSchedules[selectedDateFormatted];
          console.log("🗑️ Removed entire date as no time slots left");
        } else {
          currentSchedules[selectedDateFormatted] = updatedTimeSlots;
          console.log("📝 Updated time slots for date");
        }

        // Update doctor document
        await updateDoc(doctorRef, {
          dailySchedules: currentSchedules,
          updatedAt: new Date(),
        });

        console.log("✅ Successfully removed schedule from doctor");
      } else {
        console.log("⚠️ No schedule found for the selected date");
      }
    } catch (error) {
      console.error("❌ Error removing schedule from doctor:", error);
      // Don't throw error - appointment should still be created even if schedule removal fails
    }
  };

  // ✅ FETCH DOCTOR AND USER DATA
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!id) return;

      try {
        setDoctorLoading(true);

        // Fetch doctor data
        const doctorDoc = await getDoc(doc(db, "users", id));
        if (!doctorDoc.exists() || doctorDoc.data().role !== "doctor") {
          setDoctorError("Doctor not found");
          return;
        }

        const doctorData = doctorDoc.data();
        const doctorWithDefaults = {
          id: doctorDoc.id,
          ...doctorData,
          photoUrl: doctorData.photoUrl || "/assets/default-doctor.jpg",
        };

        setDoctor(doctorWithDefaults);

        // DEBUG: Log doctor schedule setelah di-set
        console.log("=== DOCTOR SCHEDULE DEBUG ===");
        console.log("Doctor ID:", doctorWithDefaults.id);
        console.log("Doctor Name:", doctorWithDefaults.name);
        console.log(
          "Full dailySchedules object:",
          doctorWithDefaults.dailySchedules
        );

        if (doctorWithDefaults.dailySchedules) {
          Object.keys(doctorWithDefaults.dailySchedules).forEach((dateKey) => {
            console.log(
              `Date: ${dateKey}, Times:`,
              doctorWithDefaults.dailySchedules[dateKey]
            );
          });
        } else {
          console.log("No dailySchedules found for this doctor");
        }
        console.log("=== END DEBUG ===");

        // CALCULATE available dates setelah doctor data di-set
        calculateAvailableDates(doctorWithDefaults);

        // Fetch user data if logged in
        if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setAccountData(userDoc.data());
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setDoctorError("Failed to load data");
      } finally {
        setDoctorLoading(false);
      }
    });

    return () => unsubscribe();
  }, [id]);

  // ✅ UPDATE AVAILABLE TIMES WHEN SELECTED DATE CHANGES
  useEffect(() => {
    calculateAvailableTimes(selectedDate);
  }, [selectedDate, doctor?.dailySchedules]);

  // ✅ DEBUG USEEFFECT
  useEffect(() => {
    if (doctor?.dailySchedules) {
      console.log("=== APPOINTMENT PAGE DEBUG ===");
      console.log("Doctor Schedule:", doctor.dailySchedules);

      // Test next 7 days
      const today = new Date();
      for (let i = 1; i <= 7; i++) {
        const testDate = new Date();
        testDate.setDate(today.getDate() + i);
        const formatted = formatDateForDatabase(testDate);
        console.log(
          `Day +${i}: ${formatted}`,
          doctor.dailySchedules[formatted] || "NO SCHEDULE"
        );
      }

      console.log("=== END APPOINTMENT DEBUG ===");
    }
  }, [doctor]);

  // ✅ FORMAT PRICE FUNCTION
  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  // ✅ HANDLE SUBMIT DENGAN AUTO REMOVE SCHEDULE
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate inputs
    if (
      !selectedDate ||
      !selectedTime ||
      !selectedPayment ||
      !complaint.trim()
    ) {
      alert("Please complete all required fields");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("You need to be logged in to make an appointment");
      return router.push("/login");
    }

    setIsSubmitting(true);

    try {
      const batch = writeBatch(db);
      const appointmentDateFormatted = formatDateForDatabase(selectedDate);

      // Calculate chat expiry (30 minutes after appointment time)
      const [hours, minutes] = selectedTime.split(":");
      const appointmentDateTime = new Date(selectedDate);
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));
      const chatExpiry = new Date(appointmentDateTime.getTime() + 30 * 60000);

      console.log("🚀 Creating appointment with schedule removal");
      console.log("Selected date formatted:", appointmentDateFormatted);
      console.log("Selected time:", selectedTime);

      // 1. Create appointment
      const appointmentsRef = collection(db, "appointments");
      const newAppointmentRef = doc(appointmentsRef);

      const appointmentData = {
        patientId: user.uid,
        patientName: accountData.name || "Unknown",
        patientEmail: accountData.email || "",
        patientPhone: accountData.phone || "",
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpecialization: doctor.specialization,
        complaint: complaint.trim(),
        date: selectedDate, // Keep original date object for compatibility
        appointmentDate: appointmentDateFormatted, // Add formatted date
        appointmentTime: selectedTime,
        price: doctor.price || 0,
        priceDisplay: formatPrice(doctor.price),
        paymentMethod: selectedPayment,
        status: "confirmed",
        paymentStatus: "pending",
        chatStatus: "pending",
        chatExpiry: chatExpiry,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      batch.set(newAppointmentRef, appointmentData);

      // 2. Create payment record
      const paymentsRef = collection(db, "payments");
      const newPaymentRef = doc(paymentsRef);

      const paymentData = {
        patientId: user.uid,
        patientName: accountData.name || "Unknown",
        appointmentId: newAppointmentRef.id,
        description: `Appointment with ${doctor.name} (${doctor.specialization})`,
        amount: doctor.price || 0,
        paymentMethod: selectedPayment,
        paymentDate: serverTimestamp(),
        status: "pending",
        createdAt: serverTimestamp(),
      };

      batch.set(newPaymentRef, paymentData);

      // 3. Create initial chat document
      const chatsRef = collection(db, "chats");
      const newChatRef = doc(chatsRef);

      const chatData = {
        appointmentId: newAppointmentRef.id,
        patientId: user.uid,
        doctorId: doctor.id,
        status: "pending",
        expiry: chatExpiry,
        appointmentDate: appointmentDateFormatted,
        appointmentTime: selectedTime,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        messages: [],
      };

      batch.set(newChatRef, chatData);

      // ✅ 4. COMMIT BATCH TRANSACTION DULU
      await batch.commit();
      console.log("✅ Appointment, payment, and chat created successfully");

      // ✅ 5. HAPUS JADWAL DARI DOCTOR SETELAH APPOINTMENT BERHASIL DIBUAT
      await removeScheduleFromDoctor(
        doctor.id,
        appointmentDateFormatted,
        selectedTime
      );

      // ✅ 6. UPDATE LOCAL STATE UNTUK REFLECT PERUBAHAN
      // Remove the selected time from local availableTimes
      const updatedTimes = availableTimes.filter(
        (time) => time !== selectedTime
      );
      setAvailableTimes(updatedTimes);

      // Update local doctor data
      if (
        doctor.dailySchedules &&
        doctor.dailySchedules[appointmentDateFormatted]
      ) {
        const updatedSchedule = doctor.dailySchedules[
          appointmentDateFormatted
        ].filter((time) => time !== selectedTime);

        const updatedDoctor = {
          ...doctor,
          dailySchedules: {
            ...doctor.dailySchedules,
            [appointmentDateFormatted]:
              updatedSchedule.length > 0 ? updatedSchedule : undefined,
          },
        };

        // Remove the date key if no times left
        if (updatedSchedule.length === 0) {
          delete updatedDoctor.dailySchedules[appointmentDateFormatted];
        }

        setDoctor(updatedDoctor);

        // Recalculate available dates
        calculateAvailableDates(updatedDoctor);
      }

      console.log("🎉 Appointment created and schedule removed successfully!");

      // ✅ SHOW CONFIRMATION DENGAN DATA YANG MASIH ADA
      setShowConfirmation(true);

      // ✅ CLEAR SELECTIONS SETELAH MODAL SHOWN (JANGAN SEBELUM)
      // setSelectedDate(null);
      // setSelectedTime(null);
    } catch (error) {
      console.error("Error creating appointment:", error);
      alert("Failed to create appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (doctorLoading) return <AppointmentPageSkeleton />;
  if (doctorError || !doctor)
    return <AppointmentPageError error={doctorError} />;

  return (
    <>
      <div className="all relative">
        <NavbarWhite />
        <div className="appointment-container bg-blue-50 text-black w-full min-h-screen pt-20 pb-20 px-4 sm:px-[14rem]">
          <div className="appointment-content bg-white p-6 sm:p-10 rounded-md shadow-lg">
            {/* Back Button */}
            <div className="mb-6">
              <Link
                href="/appointment"
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
              >
                ← Back to Doctors
              </Link>
            </div>

            {/* Doctor Profile */}
            <div className="doctor-profile flex flex-col sm:flex-row items-center mb-10 p-6 bg-blue-50 rounded-lg">
              <div className="relative w-32 h-32 mb-4 sm:mb-0 sm:mr-6">
                <Image
                  src={doctor.photoUrl}
                  alt={doctor.name}
                  fill
                  className="rounded-full object-top object-cover"
                  onError={(e) => {
                    e.target.src = "/assets/default-doctor.jpg";
                  }}
                />
              </div>
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                  {doctor.name}
                </h1>
                <p className="text-gray-600 mb-1">{doctor.specialization}</p>
                <p className="text-lg font-semibold text-blue-600 mb-2">
                  {formatPrice(doctor.price)}
                </p>
                {doctor.description && (
                  <p className="text-sm text-gray-600">{doctor.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                  <div className="flex">
                    <EnvelopeSimple className="mr-2" size={20} />
                    {doctor.email}
                  </div>
                  {doctor.phone && (
                    <div className="flex">
                      {" "}
                      <Phone size={20} className="mr-2" />
                      {doctor.phone}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Complaint Section */}
              <div className="mb-10">
                <h2 className="text-xl font-semibold mb-4">Your Complaint</h2>
                <textarea
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  placeholder="Describe your symptoms or health concerns in detail..."
                  className="w-full p-4 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[120px]"
                  required
                  minLength={10}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Please be as detailed as possible (minimum 10 characters)
                </p>
              </div>

              {/* Date Selection */}
              <div className="mb-10">
                <h2 className="text-xl font-semibold mb-4">
                  Select Available Date ({availableDates.length} available)
                </h2>
                {availableDates.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
                    {availableDates.map((date, idx) => {
                      const dayName = date.toLocaleDateString("en-US", {
                        weekday: "short",
                      });
                      const dateNum = date.getDate();
                      const month = date.toLocaleDateString("en-US", {
                        month: "short",
                      });

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            console.log(
                              "Selected date:",
                              date,
                              "formatted:",
                              formatDateForDatabase(date)
                            );
                            setSelectedDate(date);
                            setSelectedTime(null);
                            calculateAvailableTimes(date);
                          }}
                          className={`p-2 sm:p-3 rounded-lg border text-center transition-colors ${
                            selectedDate?.getTime() === date.getTime()
                              ? "border-blue-500 bg-blue-50 text-blue-600"
                              : "border-gray-200 hover:border-blue-300"
                          }`}
                        >
                          <div className="text-xs sm:text-sm">{dayName}</div>
                          <div className="font-semibold text-base sm:text-lg">
                            {dateNum}
                          </div>
                          <div className="text-xs text-gray-500">{month}</div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No available dates found for this doctor.</p>
                    <p className="text-sm mt-2">
                      Doctor hasn`t set up their schedule yet. Please contact
                      the doctor directly or try again later.
                    </p>
                  </div>
                )}
              </div>

              {/* Time Selection */}
              {selectedDate && availableTimes.length > 0 && (
                <div className="mb-10">
                  <h2 className="text-xl font-semibold mb-4">
                    Select Available Time ({availableTimes.length} available)
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {availableTimes.map((time, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          console.log("Selected time:", time);
                          setSelectedTime(time);
                        }}
                        className={`p-3 rounded-lg border text-center transition-colors ${
                          selectedTime === time
                            ? "border-blue-500 bg-blue-50 text-blue-600"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Show message if date selected but no times */}
              {selectedDate && availableTimes.length === 0 && (
                <div className="mb-10">
                  <div className="text-center py-8 text-gray-500">
                    <p>No available times for this date.</p>
                    <p className="text-sm mt-2">Please select another date.</p>
                  </div>
                </div>
              )}

              {/* Appointment Summary */}
              {selectedDate && selectedTime && (
                <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-100">
                  <h3 className="font-semibold text-lg mb-3">
                    Appointment Summary
                  </h3>
                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Doctor:</span>
                      <span className="font-medium">{doctor.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Specialization:</span>
                      <span>{doctor.specialization}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Consultation Fee:</span>
                      <span className="font-semibold text-blue-600">
                        {formatPrice(doctor.price)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span>
                        {selectedDate.toLocaleDateString("id-ID", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium">{selectedTime}</span>
                    </div>

                    {/* Payment Method */}
                    <div className="pt-3 border-t border-blue-200">
                      <h4 className="font-medium mb-3">Payment Method</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { id: "mandiri", name: "Bank Mandiri", icon: "" },
                          { id: "bca", name: "Bank BCA", icon: "" },
                          { id: "bri", name: "Bank BRI", icon: "" },
                        ].map((method) => (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setSelectedPayment(method.id)}
                            className={`p-3 rounded-lg border text-center transition-colors ${
                              selectedPayment === method.id
                                ? "border-blue-500 bg-blue-50 text-blue-600"
                                : "border-gray-200 hover:border-blue-300"
                            }`}
                          >
                            <div className="text-xl mb-1">{method.icon}</div>
                            <div className="text-sm font-medium">
                              {method.name}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!selectedPayment || isSubmitting}
                    className={`w-full py-3 text-white rounded-md transition font-medium ${
                      selectedPayment && !isSubmitting
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {isSubmitting
                      ? "Processing..."
                      : "Confirm & Book Appointment"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
        <Footer />
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <ConfirmationModal
          doctor={doctor}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          selectedPayment={selectedPayment}
          onClose={() => {
            setShowConfirmation(false);
            // ✅ CLEAR SELECTIONS SETELAH MODAL DITUTUP
            setSelectedDate(null);
            setSelectedTime(null);
            setSelectedPayment("");
            setComplaint("");
          }}
        />
      )}
    </>
  );
}

// ✅ CONFIRMATION MODAL COMPONENT - FIXED NULL DATE ERROR
const ConfirmationModal = ({
  doctor,
  selectedDate,
  selectedTime,
  selectedPayment,
  onClose,
}) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // ✅ GUARD AGAINST NULL VALUES
  if (!selectedDate || !selectedTime || !selectedPayment || !doctor) {
    return (
      <div className="fixed inset-0 text-black bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 w-full max-w-md text-center">
          <p className="text-gray-600 mb-4">Loading confirmation...</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 text-black bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3">Appointment Confirmed!</h2>
          <p className="mb-5 text-gray-600">
            Your appointment has been successfully booked and the time slot has
            been removed from the doctor`s schedule.
          </p>

          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Doctor:</span>
                <span className="font-medium">{doctor.name || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-semibold">
                  {formatPrice(doctor.price || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment:</span>
                <span className="font-medium">
                  {selectedPayment?.toString().toUpperCase() || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span>
                  {selectedDate.toLocaleDateString("id-ID", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium">{selectedTime || "N/A"}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/dashboard/patient"
              className="block w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              View in Dashboard
            </Link>
            <Link
              href="/appointment"
              className="block w-full border border-gray-300 py-3 px-4 rounded-md hover:bg-gray-50 transition-colors"
            >
              Book Another Appointment
            </Link>
            <Link
              href="/"
              className="block w-full text-blue-600 py-2 px-4 hover:text-blue-800 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ LOADING SKELETON
const AppointmentPageSkeleton = () => {
  return (
    <div className="all relative">
      <NavbarWhite />
      <div className="appointment-container bg-blue-50 text-black w-full min-h-screen pt-20 pb-20 px-4 sm:px-[14rem]">
        <div className="appointment-content bg-white p-6 sm:p-10 rounded-md shadow-lg animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-32 mb-6"></div>
          <div className="doctor-profile flex flex-col sm:flex-row items-center mb-10 p-6 bg-blue-50 rounded-lg">
            <div className="w-32 h-32 bg-gray-200 rounded-full mb-4 sm:mb-0 sm:mr-6"></div>
            <div className="flex-1">
              <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
          <div className="space-y-8">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

// ✅ ERROR COMPONENT
const AppointmentPageError = ({ error }) => {
  return (
    <div className="all relative">
      <NavbarWhite />
      <div className="appointment-container bg-blue-50 text-black w-full min-h-screen pt-20 pb-20 px-4 sm:px-[14rem]">
        <div className="appointment-content bg-white p-6 sm:p-10 rounded-md shadow-lg">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">👩‍⚕️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Doctor Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              {error || "The doctor you`re looking for is not available."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/appointment"
                className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Browse Other Doctors
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
