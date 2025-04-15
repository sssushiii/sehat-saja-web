"use client";

import { useState } from "react";
import Link from "next/link";
import Footer from "@/components/footer/page";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { Doctors } from "@/data/doctors";

export default function DoctorDashboard() {
  // State for available dates
  const availableDates = Array.from({ length: 31 }, (_, i) => i + 1);
  
  // State for time slots grouped by date
  const [schedules, setSchedules] = useState([
    {
      date: 15,
      times: ["8:00 AM", "10:00 AM", "1:00 PM"]
    },
    {
      date: 16, 
      times: ["9:00 AM", "3:30 PM"]
    },
    {
      date: 17,
      times: ["7:00 PM"]
    }
  ]);

  // State for form inputs
  const [selectedDate, setSelectedDate] = useState(null);
  const [newTime, setNewTime] = useState("");

  // Handle date selection
  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  // Handle adding a new time slot
  const handleAddTimeSlot = () => {
    if (!selectedDate || !newTime) {
      alert("Please select both a date and time");
      return;
    }

    // Check if date already exists in schedules
    const dateIndex = schedules.findIndex(s => s.date === selectedDate);
    
    if (dateIndex >= 0) {
      // Add time to existing date
      const updatedSchedules = [...schedules];
      updatedSchedules[dateIndex].times.push(newTime);
      setSchedules(updatedSchedules);
    } else {
      // Create new date with time
      setSchedules([...schedules, {
        date: selectedDate,
        times: [newTime]
      }]);
    }

    setNewTime("");
  };

  // Handle deleting a time slot
  const handleDeleteTimeSlot = (date, timeIndex) => {
    const dateIndex = schedules.findIndex(s => s.date === date);
    if (dateIndex >= 0) {
      const updatedSchedules = [...schedules];
      updatedSchedules[dateIndex].times.splice(timeIndex, 1);
      
      // Remove date if no more times
      if (updatedSchedules[dateIndex].times.length === 0) {
        updatedSchedules.splice(dateIndex, 1);
      }
      
      setSchedules(updatedSchedules);
    }
  };

  return (
    <>
      <div className="bg-blue-50 min-h-screen text-black">
        <div className="container mx-auto px-4 py-8">
          {/* Doctor Profile Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center">
              <div className="bg-blue-100 p-4 rounded-full mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold">Dr. Mulyadi Akbar</h2>
                <p className="text-gray-600">General Practitioner</p>
              </div>
            </div>
          </div>

          {/* Schedule Management Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Navigation Links */}
            <div className="bg-white rounded-lg shadow-md p-6 order-2 lg:order-1">
              <h2 className="text-xl font-semibold text-blue-600 mb-6">Quick Actions</h2>
              
              <div className="space-y-4">
                <Link
                  href="/doctor-dashboard/patients"
                  className="block p-3 hover:bg-blue-50 rounded-md transition border border-transparent hover:border-blue-200"
                >
                  Manage Patients
                </Link>
                <Link
                  href="/doctor-dashboard/payments"
                  className="block p-3 hover:bg-blue-50 rounded-md transition border border-transparent hover:border-blue-200"
                >
                  Payment Records
                </Link>
                <Link
                  href="/doctor-dashboard/chat"
                  className="block p-3 hover:bg-blue-50 rounded-md transition border border-transparent hover:border-blue-200"
                >
                  Chat Room
                </Link>
                <Link
                  href="/doctor-dashboard/account"
                  className="block p-3 hover:bg-blue-50 rounded-md transition border border-transparent hover:border-blue-200"
                >
                  Account Settings
                </Link>
              </div>
            </div>

            {/* Right Column - Combined Date and Time Management */}
            <div className="bg-white rounded-lg shadow-md p-6 order-1 lg:order-2">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-blue-600">Schedule Management</h2>
              </div>

              {/* Current Schedules */}
              <div className="mb-8">
                <h3 className="font-medium mb-4">Scheduled Times</h3>
                
                {schedules.length > 0 ? (
                  <div className="space-y-4">
                    {schedules.map((schedule) => (
                      <div key={schedule.date} className="border rounded-md p-4">
                        <div className="font-medium mb-2">Date: {schedule.date}</div>
                        <div className="grid grid-cols-2 gap-2">
                          {schedule.times.map((time, index) => (
                            <div
                              key={`${schedule.date}-${time}`}
                              className="flex justify-between items-center p-2 border rounded-md hover:bg-blue-50 transition"
                            >
                              <span>{time}</span>
                              <button
                                onClick={() => handleDeleteTimeSlot(schedule.date, index)}
                                className="text-red-500 hover:text-red-700"
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
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No schedules created yet</p>
                )}
              </div>

              {/* Calendar Grid */}
              <div className="mb-8">
                <h3 className="font-medium mb-4">Select Date</h3>
                <div className="grid grid-cols-7 gap-2">
                  {availableDates.map((date) => (
                    <button
                      key={date}
                      onClick={() => handleDateSelect(date)}
                      className={`p-2 border rounded-md text-center transition ${
                        selectedDate === date
                          ? "bg-blue-100 border-blue-400 font-medium"
                          : "hover:bg-blue-50 hover:border-blue-300"
                      }`}
                    >
                      {date}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add New Time Slot */}
              <div className="p-4 bg-blue-50 rounded-md">
                <h3 className="font-medium mb-3">Add New Time Slot</h3>
                <div className="flex flex-col sm:flex-row gap-4 mb-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selected Date: {selectedDate || "None"}
                    </label>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddTimeSlot}
                  disabled={!selectedDate || !newTime}
                  className={`w-full px-4 py-2 rounded-md transition ${
                    selectedDate && newTime
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Add Time Slot
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  );
}