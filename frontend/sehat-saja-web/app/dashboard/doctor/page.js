"use client";

import { useState } from "react";
import { CaretRight, User, Calendar, CurrencyDollar, UsersThree} from "@phosphor-icons/react/dist/ssr";

export default function DoctorDashboard() {
  // State untuk menentukan tampilan aktif
  const [activeView, setActiveView] = useState("schedule");
  
  // State untuk manajemen jadwal (sama seperti sebelumnya)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const availableDates = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  const [schedules, setSchedules] = useState([
    {
      date: 15,
      month: currentMonth,
      year: currentYear,
      times: ["8:00", "10:00", "1:00"]
    },
    {
      date: 16,
      month: currentMonth,
      year: currentYear,
      times: ["9:00", "3:30"]
    }
  ]);

  const [selectedDate, setSelectedDate] = useState(null);
  const [newTime, setNewTime] = useState("");

  // State untuk fitur lainnya
  const [patients, setPatients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [accountData, setAccountData] = useState({
    name: "Dr. Hakim Ismail",
    specialty: "Dokter Umum",
    email: "hakimismail123@gmail.com"
  });

  const monthNames = ["January", "February", "March", "April", "May", "June", 
                     "July", "August", "September", "October", "November", "December"];

  const handleDateSelect = (date) => setSelectedDate(date);
  
  const handleMonthChange = (increment) => {
    let newMonth = currentMonth + increment;
    let newYear = currentYear;
    if (newMonth > 11) { newMonth = 0; newYear++; } 
    else if (newMonth < 0) { newMonth = 11; newYear--; }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    setSelectedDate(null);
  };

  const handleAddTimeSlot = () => {
    if (!selectedDate || !newTime) return;
    
    const dateIndex = schedules.findIndex(s => 
      s.date === selectedDate && s.month === currentMonth && s.year === currentYear
    );
    
    if (dateIndex >= 0) {
      const updated = [...schedules];
      updated[dateIndex].times.push(newTime);
      setSchedules(updated);
    } else {
      setSchedules([...schedules, {
        date: selectedDate,
        month: currentMonth,
        year: currentYear,
        times: [newTime]
      }]);
    }
    setNewTime("");
  };

  const handleDeleteTimeSlot = (date, month, year, timeIndex) => {
    const dateIndex = schedules.findIndex(s => 
      s.date === date && s.month === month && s.year === year
    );
    if (dateIndex >= 0) {
      const updated = [...schedules];
      updated[dateIndex].times.splice(timeIndex, 1);
      if (updated[dateIndex].times.length === 0) {
        updated.splice(dateIndex, 1);
      }
      setSchedules(updated);
    }
  };

  const formatDateDisplay = (date, month, year) => {
    return `${date} ${monthNames[month]} ${year}`;
  };

  const ScheduleManagement = () => (
    <>
      <h1 className="text-2xl font-bold mb-6">Doctor Schedule Management</h1>
      
      <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6">Scheduled Appointments</h2>
        {schedules.length > 0 ? (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div key={`${schedule.date}-${schedule.month}-${schedule.year}`} className="pb-4">
                <h3 className="font-medium text-lg mb-3">
                  {formatDateDisplay(schedule.date, schedule.month, schedule.year)}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {schedule.times.map((time, index) => (
                    <div key={`${schedule.date}-${time}`} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium">{time}</span>
                      <button
                        onClick={() => handleDeleteTimeSlot(schedule.date, schedule.month, schedule.year, index)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                        title="Delete time slot"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No schedules created yet</div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-6">Add New Schedule</h2>
        
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => handleMonthChange(-1)} className="p-2 rounded-full hover:bg-blue-50">
            <CaretRight className="rotate-180" size={20} />
          </button>
          <div className="text-center">
            <span className="text-xl font-medium">{monthNames[currentMonth]} {currentYear}</span>
          </div>
          <button onClick={() => handleMonthChange(1)} className="p-2 rounded-full hover:bg-blue-50">
            <CaretRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-8">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium py-2">{day}</div>
          ))}
          
          {Array.from({ length: new Date(currentYear, currentMonth, 1).getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10"></div>
          ))}
          
          {availableDates.map((date) => (
            <button
              key={date}
              onClick={() => handleDateSelect(date)}
              className={`h-10 rounded-lg transition flex items-center justify-center ${
                selectedDate === date ? "bg-blue-600 text-white font-medium" : "hover:bg-blue-50"
              }`}
            >
              {date}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">
              Selected Date: {selectedDate ? formatDateDisplay(selectedDate, currentMonth, currentYear) : "None"}
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
              selectedDate && newTime ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            Add Time Slot
          </button>
        </div>
      </div>
    </>
  );

  const ManagePatients = () => {
    const [selectedPatient, setSelectedPatient] = useState(null);
  
    const formatDateWithDay = (dateStr) => {
      const date = new Date(dateStr);
      const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
      return date.toLocaleDateString("id-ID", options);
    };
  
    const Patients = [
      {
        id: 1,
        name: "Ahmad Fauzi",
        age: 34,
        complaint: "Demam tinggi dan batuk kering",
        date: "2025-04-15",
        time: "08.30",
        status: "Done",
      },
      {
        id: 2,
        name: "Nadia Salsabila",
        age: 27,
        complaint: "Sakit kepala berkelanjutan",
        date: "2025-04-17",
        time: "10.00",
        status: "Waiting",
      },
      {
        id: 3,
        name: "Reza Dwi Pratama",
        age: 45,
        complaint: "Nyeri dada dan kelelahan",
        date: "2025-04-18",
        time: "12.30",
        status: "Waiting",
      },
    ];
  
    const handleDetailClick = (patient) => {
      setSelectedPatient(patient);
    };
  
    const closeModal = () => setSelectedPatient(null);
  
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Manage Patients</h1>
  
        <div className="bg-white rounded-xl shadow-sm p-6">
          {Patients.length === 0 ? (
            <p className="text-center text-gray-500">No patient records available.</p>
          ) : (
            <div className="space-y-4">
              {Patients.map((patient) => (
                <div
                  key={patient.id}
                  className="p-4 rounded-lg border border-gray-200 flex items-center justify-between hover:shadow-sm"
                >
                  <div>
                    <h3 className="text-lg font-semibold">{patient.name}</h3>
                    <p className="text-sm text-gray-600">Age: {patient.age}</p>
                    <p className="text-sm text-gray-600">Complaint: {patient.complaint}</p>
                    <p className="text-sm text-gray-600">Date: {formatDateWithDay(patient.date)}</p>
                    <p className="text-sm text-gray-600">Time: {patient.time}</p>
                  </div>
                  <div className="text-center flex flex-col justify-between gap-3">
                    <div
                      className={`text-sm px-2 py-1 rounded ${
                        patient.status === "Done"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      <h1>
                        {patient.status}
                      </h1>
                    </div>
                    <button
                      onClick={() => handleDetailClick(patient)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      Open Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
  
        {/* Modal untuk detail pasien */}
        {selectedPatient && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white w-full max-w-md p-6 rounded-xl shadow-lg relative">
              <button
                onClick={closeModal}
                className="absolute top-2 right-3 text-gray-500 hover:text-red-500"
              >
                ✕
              </button>
              <h2 className="text-xl font-bold mb-4">Patient Details</h2>
              <p><span className="font-medium">Name:</span> {selectedPatient.name}</p>
              <p><span className="font-medium">Age:</span> {selectedPatient.age}</p>
              <p><span className="font-medium">Complaint:</span> {selectedPatient.complaint}</p>
              <p><span className="font-medium">Date:</span> {formatDateWithDay(selectedPatient.date)}</p>
              <p><span className="font-medium">Time:</span> {selectedPatient.time}</p>
              <p>
                <span className="font-medium">Status:</span>{" "}
                <span
                  className={`font-medium px-2 py-1 rounded ${
                    selectedPatient.status === "Selesai"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {selectedPatient.status}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };  
  

  const PaymentRecords = () => {
    const payments = [
      {
        id: "001-aaa",
        status: "Pending",
        amount: 10000,
        method: "BCA E-Money",
        date: "2025-04-10",
      },
      {
        id: "001-aab",
        status: "Success",
        amount: 10000,
        method: "Mandiri E-Money",
        date: "2025-04-08",
      },
    ];
  
    const formatRupiah = (value) =>
      new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(value);
  
    const totalBalance = payments.reduce(
      (total, p) => total + p.amount,
      0
    );
  
    return (
      <div className="bg-white p-6 rounded-xl shadow-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Total Balance</h1>
            <p className="text-xl font-semibold text-blue-600">{formatRupiah(totalBalance)}</p>
          </div>
          <button className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition">
            Withdraw
          </button>
        </div>
  
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Payment ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payment Method</th>
                <th className="px-4 py-3">Creation Date</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3">{payment.id}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payment.status === "Success"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatRupiah(payment.amount)}</td>
                  <td className="px-4 py-3">{payment.method}</td>
                  <td className="px-4 py-3">{payment.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };


  const AccountSettings = () => (
    <div>
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input 
              type="text" 
              value={accountData.name} 
              onChange={(e) => setAccountData({...accountData, name: e.target.value})}
              className="mt-1 p-2 w-full border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Specialty</label>
            <input 
              type="text" 
              value={accountData.specialty} 
              onChange={(e) => setAccountData({...accountData, specialty: e.target.value})}
              className="mt-1 p-2 w-full border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input 
              type="email" 
              value={accountData.email} 
              onChange={(e) => setAccountData({...accountData, email: e.target.value})}
              className="mt-1 p-2 w-full border rounded-md"
            />
          </div>
          <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );

  // Render komponen berdasarkan activeView
  const renderActiveView = () => {
    switch(activeView) {
      case "schedule": return <ScheduleManagement />;
      case "patients": return <ManagePatients />;
      case "payments": return <PaymentRecords />;
      case "account": return <AccountSettings />;
      default: return <ScheduleManagement />;
    }
  };

  return (
    <div className="w-full min-h-screen bg-blue-50 text-black">
      <div className="flex w-full relative">
        {/* Sticky Sidebar */}
        <div className="bg-white shadow-md p-6 w-[25%] min-h-screen fixed top-0 left-0 z-10">
          <div className="flex items-center mb-8 flex-col">
            <img src="/assets/doctor_1.webp" className="rounded-full aspect-square w-[35%] mb-3" alt="" />
            <div className="w-full text-center">
              <h2 className="text-xl font-semibold">{accountData.name}</h2>
              <p>{accountData.specialty}</p>
            </div>
          </div>
          
          <nav className="space-y-2">
            <button
              onClick={() => setActiveView("schedule")}
              className={`flex items-center w-full text-left p-3 rounded-lg transition ${
                activeView === "schedule" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
              }`}
            > 
            <Calendar size={20} className="mr-3"/>
              Schedule Management
            </button>
            <button
              onClick={() => setActiveView("patients")}
              className={`flex items-center w-full text-left p-3 rounded-lg transition ${
                activeView === "patients" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
              }`}
            >
              <UsersThree size={20} className="mr-3"/>
              Manage Patients
            </button>
            <button
              onClick={() => setActiveView("payments")}
              className={`flex items-center w-full text-left p-3 rounded-lg transition ${
                activeView === "payments" ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-100"
              }`}
            >
              <CurrencyDollar size={20} className="mr-3"/>
              Payment Records
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
        </div>

        <div className="w-[25%]"></div>

        <div className="w-[75%] p-8">
          {renderActiveView()}
        </div>
      </div>
    </div>
  );
}