"use client";
import { useParams } from "next/navigation";
import { Doctors } from "@/data/doctors";
import { useState, useEffect } from "react";
import NavbarWhite from "@/components/navbar-white";
import Footer from "@/components/footer/page";
import Link from "next/link";
import { auth, db } from "../../../lib/firebase"; 
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, addDoc, serverTimestamp, writeBatch } from "firebase/firestore";

export default function AppointmentPage() {
  const { id } = useParams();
  const doctor = Doctors.find(d => d.id === Number(id));
  const [complaint, setComplaint] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [accountData, setAccountData] = useState({
    name: "",
    email: "",
    phone: "",
    birthDate: "",
    gender: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setAccountData(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  if (!doctor) {
    return <div>Doctor not found</div>;
  }

  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const availableDates = generateDates().filter(date => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    return doctor.schedules.some(s => s.day === dayName);
  });

  const availableTimes = selectedDate
    ? doctor.schedules.find(s =>
        s.day === selectedDate.toLocaleDateString('en-US', { weekday: 'long' })
      )?.times || []
    : [];

  const parsePrice = (priceStr) => {
    return parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!selectedDate || !selectedTime || !selectedPayment || !complaint) {
      alert("Please complete all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        alert("You need to be logged in to make an appointment");
        return;
      }

      const batch = writeBatch(db);
      
      // 1. Create appointment
      const appointmentsRef = collection(db, "appointments");
      const newAppointmentRef = doc(appointmentsRef);
      
      const appointmentData = {
        patientId: user.uid,
        patientName: accountData.name || "Unknown",
        doctorId: doctor.id,
        doctorName: doctor.title,
        specialization: doctor.specialization.join(", "),
        complaint,
        date: selectedDate.toISOString(),
        time: selectedTime,
        price: parsePrice(doctor.price),
        priceDisplay: doctor.price,
        paymentMethod: selectedPayment,
        status: "confirmed",
        paymentStatus: "pending",
        createdAt: serverTimestamp()
      };

      batch.set(newAppointmentRef, appointmentData);
      
      // 2. Create payment record
      const paymentsRef = collection(db, "payments");
      const newPaymentRef = doc(paymentsRef);
      
      const paymentData = {
        patientId: user.uid,
        patientName: accountData.name || "Unknown",
        appointmentId: newAppointmentRef.id,
        description: `Appointment with ${doctor.title} (${doctor.specialization.join(", ")})`,
        amount: parsePrice(doctor.price),
        paymentMethod: selectedPayment,
        date: serverTimestamp(),
        status: "pending",
        createdAt: serverTimestamp()
      };

      batch.set(newPaymentRef, paymentData);
      
      // Commit both operations as a single transaction
      await batch.commit();
      
      setShowConfirmation(true);
    } catch (error) {
      console.error("Error creating appointment:", error);
      alert("Failed to create appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="all relative">
        <NavbarWhite />

        <div className="appointment-container bg-blue-50 text-black w-full min-h-screen pt-20 pb-20 px-4 sm:px-[14rem]">
          <div className="appointment-content bg-white p-6 sm:p-10 rounded-md shadow-lg">
            <div className="doctor-profile flex flex-col sm:flex-row items-center mb-10">
              <img 
                src={`${doctor.image}`} 
                alt={`${doctor.title}`} 
                className="rounded-full mb-4 object-top sm:mb-0 sm:mr-5 h-32 w-32 object-cover"
              />
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">{doctor.title}</h1>
                <p className="text-gray-600">{doctor.specialization.join(", ")}</p>
                <p className="text-lg font-semibold text-blue-600 mt-2">{doctor.price}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-10">
                <h2 className="text-xl font-semibold mb-4">Your Complaint</h2>
                <div className="relative">
                  <textarea
                    value={complaint}
                    onChange={(e) => setComplaint(e.target.value)}
                    placeholder="Describe your symptoms or health concerns..."
                    className="w-full p-4 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[120px]"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">Please describe your condition in detail</p>
                </div>
              </div>

              <div className="mb-10">
                <h2 className="text-xl font-semibold mb-4">Select Date</h2>
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 sm:gap-3">
                  {availableDates.map((date, idx) => {
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const dateNum = date.getDate();
                    const month = date.toLocaleDateString('en-US', { month: 'short' });

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedDate(date);
                          setSelectedTime(null); // Reset waktu saat tanggal berubah
                        }}
                        className={`p-2 sm:p-3 rounded-lg border text-center transition-colors ${
                          selectedDate?.getDate() === date.getDate()
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="text-xs sm:text-sm">{dayName}</div>
                        <div className="font-semibold text-base sm:text-lg">{dateNum}</div>
                        <div className="text-xs text-gray-500">{month}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDate && (
                <div className="mb-10">
                  <h2 className="text-xl font-semibold mb-4">Select Time</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableTimes.map((time, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`p-3 rounded-lg border text-center transition-colors ${
                          selectedTime === time
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedDate && selectedTime && (
                <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-100">
                  <h3 className="font-semibold text-lg mb-3">Appointment Summary</h3>
                  <div className="space-y-3 mb-5">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Doctor:</span>
                      <span className="font-medium">{doctor.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-semibold text-blue-600">{doctor.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span>{selectedTime}</span>
                    </div>
                    
                    <div className="pt-3 border-t border-blue-200">
                      <h4 className="font-medium mb-3">Payment Method</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {["mandiri", "bca", "bri"].map((method) => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setSelectedPayment(method)}
                            className={`p-3 rounded-lg border text-center capitalize transition-colors ${
                              selectedPayment === method
                                ? 'border-blue-500 bg-blue-50 text-blue-600'
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            {method.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!selectedPayment || isSubmitting}
                    className={`w-full py-3 text-white rounded-md transition ${
                      selectedPayment && !isSubmitting
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? 'Processing...' : 'Confirm & Pay'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        <Footer />
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 text-black bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-3">Payment Successful!</h2>
              <p className="mb-5 text-gray-600">Your appointment has been confirmed</p>
              
              <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-semibold">{doctor.price}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">{selectedPayment.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Appointment Date:</span>
                  <span>{selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </div>
              </div>

              <Link 
                href="/dashboard/patient"
                className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors mb-3"
              >
                View in Dashboard
              </Link>
              <Link 
                href="/"
                className="block w-full border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
