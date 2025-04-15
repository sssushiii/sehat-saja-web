// "use client";
// import { useParams } from "next/navigation";
// import { Doctors } from "@/data/doctors";
// import { useState } from "react";
// import NavbarWhite from "@/components/navbar-white";
// import Footer from "@/components/footer/page";
// import Link from "next/link";

// export default function AppointmentPage() {
//   const { id } = useParams();
//   const doctor = Doctors.find(d => d.id === Number(id));
//   const [selectedDate, setSelectedDate] = useState(null);
//   const [selectedTime, setSelectedTime] = useState(null);
//   const [selectedPayment, setSelectedPayment] = useState("");
//   const [showConfirmation, setShowConfirmation] = useState(false);

//   const generateDates = () => {
//     const dates = [];
//     const today = new Date();
//     for (let i = 0; i < 30; i++) {
//       const date = new Date();
//       date.setDate(today.getDate() + i);
//       dates.push(date);
//     }
//     return dates;
//   };

//   const availableDates = generateDates().filter(date => {
//     const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
//     return doctor.schedules.some(s => s.day === dayName);
//   });

//   const availableTimes = selectedDate
//     ? doctor.schedules.find(s =>
//         s.day === selectedDate.toLocaleDateString('en-US', { weekday: 'long' })
//       )?.times || []
//     : [];

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     setShowConfirmation(true);
//   };

//   return (
//     <>
//       <div className="all relative">
//         <NavbarWhite />

//         <div className="appointment-container bg-blue-50 text-black w-full min-h-screen pt-20 pb-20 px-[18rem]">
//           <div className="appointment-content bg-white p-10 rounded-md shadow-lg">
//             <div className="doctor flex items-center mb-10">
//                 <img 
//                   src={`${doctor.image}`} 
//                   alt={`${doctor.title}`} 
//                   className="rounded-full mr-5 h-32 object-cover aspect-square object-top" 
//                 />
//                 <div className="">
//                     <h1 className="text-3xl font-bold mb-2">{doctor.title}</h1>
//                     <p className="text-gray-600">{doctor.specialization.join(", ")}</p>
//                 </div>
//             </div>

//             <form onSubmit={handleSubmit}>
//               <div className="mb-10">
//                 <h2 className="text-xl font-semibold mb-4">Select Date</h2>
//                 <div className="grid grid-cols-7 gap-3">
//                   {availableDates.map((date, idx) => {
//                     const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
//                     const dateNum = date.getDate();
//                     const month = date.toLocaleDateString('en-US', { month: 'short' });

//                     return (
//                       <button
//                         key={idx}
//                         type="button"
//                         onClick={() => setSelectedDate(date)}
//                         className={`p-3 rounded-lg border text-center ${
//                           selectedDate?.getDate() === date.getDate()
//                             ? 'border-blue-500 bg-blue-50'
//                             : 'border-gray-200 hover:border-blue-300'
//                         }`}
//                       >
//                         <div className="text-sm">{dayName}</div>
//                         <div className="font-semibold text-lg">{dateNum}</div>
//                         <div className="text-xs text-gray-500">{month}</div>
//                       </button>
//                     );
//                   })}
//                 </div>
//               </div>

//               {selectedDate && (
//                 <div className="mb-10">
//                   <h2 className="text-xl font-semibold mb-4">Select Time</h2>
//                   <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//                     {availableTimes.map((time, idx) => (
//                       <button
//                         key={idx}
//                         type="button"
//                         onClick={() => setSelectedTime(time)}
//                         className={`p-3 rounded-lg border text-center ${
//                           selectedTime === time
//                             ? 'border-blue-500 bg-blue-50'
//                             : 'border-gray-200 hover:border-blue-300'
//                         }`}
//                       >
//                         {time}
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {selectedDate && selectedTime && (
//                 <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-100">
//                   <h3 className="font-semibold text-lg mb-3">Appointment Summary</h3>
//                   <div className="space-y-2 mb-5 text-gray-700">
//                     <p><span className="font-medium">Doctor:</span> {doctor.title}</p>
//                     <p><span className="font-medium">Date:</span> {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
//                     <p><span className="font-medium">Time:</span> {selectedTime}</p>
                    
//                     <div className="mt-4">
//                       <h4 className="font-medium mb-2">Payment Method:</h4>
//                       <div className="grid grid-cols-3 gap-3">
//                         <button
//                           type="button"
//                           onClick={() => setSelectedPayment("mandiri")}
//                           className={`p-2 rounded-lg border text-center ${
//                             selectedPayment === "mandiri"
//                               ? 'border-blue-500 bg-blue-50'
//                               : 'border-gray-200 hover:border-blue-300'
//                           }`}
//                         >
//                           Mandiri
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => setSelectedPayment("bca")}
//                           className={`p-2 rounded-lg border text-center ${
//                             selectedPayment === "bca"
//                               ? 'border-blue-500 bg-blue-50'
//                               : 'border-gray-200 hover:border-blue-300'
//                           }`}
//                         >
//                           BCA
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => setSelectedPayment("bri")}
//                           className={`p-2 rounded-lg border text-center ${
//                             selectedPayment === "bri"
//                               ? 'border-blue-500 bg-blue-50'
//                               : 'border-gray-200 hover:border-blue-300'
//                           }`}
//                         >
//                           BRI
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                   <button
//                     type="submit"
//                     disabled={!selectedPayment}
//                     className={`w-full text-white py-3 rounded-md transition ${
//                       selectedPayment
//                         ? 'bg-blue-500 hover:bg-blue-600'
//                         : 'bg-gray-400 cursor-not-allowed'
//                     }`}
//                   >
//                     Confirm Appointment
//                   </button>
//                 </div>
//               )}
//             </form>
//           </div>
//         </div>

//         <Footer />
//       </div>

//       {/* Confirmation Popup */}
//       {showConfirmation && (
//         <div className="fixed inset-0 text-black z-50 flex items-center justify-center bg-black/60">
//           <div className="bg-white w-[25rem] md:w-[30rem] rounded-xl p-6 shadow-lg relative">
//             <div className="flex flex-col items-center text-center">
//               <h2 className="text-2xl font-semibold mb-4">All done!</h2>
//               <p className="mb-6">Thank you for trusting us</p>
              
//               <div className="w-full space-y-2 mb-6 text-left">
//                 <p><span className="font-medium">Doctor:</span> {doctor.title}</p>
//                 <p><span className="font-medium">Date:</span> {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
//                 <p><span className="font-medium">Time:</span> {selectedTime}</p>
//                 <p><span className="font-medium">Payment Method:</span> {selectedPayment.toUpperCase()}</p>
//               </div>

//               <Link 
//                 href="/"
//                 className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
//               >
//                 Go back
//               </Link>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }


"use client";
import { useParams } from "next/navigation";
import { Doctors } from "@/data/doctors";
import { useState } from "react";
import NavbarWhite from "@/components/navbar-white";
import Footer from "@/components/footer/page";
import Link from "next/link";

export default function AppointmentPage() {
  const { id } = useParams();
  const doctor = Doctors.find(d => d.id === Number(id));
  const [complaint, setComplaint] = useState(""); // State untuk complaint
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simpan data appointment termasuk complaint
    const appointmentData = {
      doctor: doctor.title,
      complaint,
      date: selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      time: selectedTime,
      payment: selectedPayment
    };
    console.log(appointmentData); // Untuk debugging
    setShowConfirmation(true);
  };

  return (
    <>
      <div className="all relative">
        <NavbarWhite />

        <div className="appointment-container bg-blue-50 text-black w-full min-h-screen pt-20 pb-20 px-[18rem]">
          <div className="appointment-content bg-white p-10 rounded-md shadow-lg">
            <div className="doctor flex items-center mb-10">
                <img 
                  src={`${doctor.image}`} 
                  alt={`${doctor.title}`} 
                  className="rounded-full mr-5 h-32 object-cover aspect-square object-top" 
                />
                <div className="">
                    <h1 className="text-3xl font-bold mb-2">{doctor.title}</h1>
                    <p className="text-gray-600">{doctor.specialization.join(", ")}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Tambahkan input complaint sebelum select date */}
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
                <div className="grid grid-cols-7 gap-3">
                  {availableDates.map((date, idx) => {
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const dateNum = date.getDate();
                    const month = date.toLocaleDateString('en-US', { month: 'short' });

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedDate(date)}
                        className={`p-3 rounded-lg border text-center ${
                          selectedDate?.getDate() === date.getDate()
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                        disabled={!complaint} // Disable jika complaint belum diisi
                      >
                        <div className="text-sm">{dayName}</div>
                        <div className="font-semibold text-lg">{dateNum}</div>
                        <div className="text-xs text-gray-500">{month}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedDate && (
                <div className="mb-10">
                  <h2 className="text-xl font-semibold mb-4">Select Time</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {availableTimes.map((time, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`p-3 rounded-lg border text-center ${
                          selectedTime === time
                            ? 'border-blue-500 bg-blue-50'
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
                  <div className="space-y-2 mb-5 text-gray-700">
                    <p><span className="font-medium">Doctor:</span> {doctor.title}</p>
                    <p><span className="font-medium">Complaint:</span> {complaint}</p>
                    <p><span className="font-medium">Date:</span> {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                    <p><span className="font-medium">Time:</span> {selectedTime}</p>
                    
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Payment Method:</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedPayment("mandiri")}
                          className={`p-2 rounded-lg border text-center ${
                            selectedPayment === "mandiri"
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          Mandiri
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPayment("bca")}
                          className={`p-2 rounded-lg border text-center ${
                            selectedPayment === "bca"
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          BCA
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPayment("bri")}
                          className={`p-2 rounded-lg border text-center ${
                            selectedPayment === "bri"
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          BRI
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!selectedPayment}
                    className={`w-full text-white py-3 rounded-md transition ${
                      selectedPayment
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Confirm Appointment
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        <Footer />
      </div>

      {/* Confirmation Popup */}
      {showConfirmation && (
        <div className="fixed inset-0 text-black z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white w-[25rem] md:w-[30rem] rounded-xl p-6 shadow-lg relative">
            <div className="flex flex-col items-center text-center">
              <h2 className="text-2xl font-semibold mb-4">All done!</h2>
              <p className="mb-6">Thank you for trusting us</p>
              
              <div className="w-full space-y-2 mb-6 text-left">
                <p><span className="font-medium">Doctor:</span> {doctor.title}</p>
                <p><span className="font-medium">Complaint:</span> {complaint}</p>
                <p><span className="font-medium">Date:</span> {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                <p><span className="font-medium">Time:</span> {selectedTime}</p>
                <p><span className="font-medium">Payment Method:</span> {selectedPayment.toUpperCase()}</p>
              </div>

              <Link 
                href="/"
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
              >
                Go back
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}