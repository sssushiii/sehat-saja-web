"use client";
import { useState, useEffect } from "react";
import Footer from "@/components/footer/page";
import NavbarWhite from "@/components/navbar-white";
import DoctorList from "@/components/DoctorList";
import { collection, getDocs, query, where, doc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import {
  onAuthStateChanged,
} from "firebase/auth";

export default function Appointment() {
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
  const [specialization, setSpecialization] = useState("all");
  const [searchName, setSearchName] = useState("");

  // State untuk form inputs sementara
  const [tempSpecialization, setTempSpecialization] = useState("all");
  const [tempSearchName, setTempSearchName] = useState("");

  // Dynamic specializations dari database
  const [specializations, setSpecializations] = useState([]);
  const [specializationsLoading, setSpecializationsLoading] = useState(true);

  // Fetch unique specializations dari database
  useEffect(() => {
    const fetchSpecializations = async () => {
      try {
        setSpecializationsLoading(true);
        const doctorsCollection = collection(db, "users");
        const q = query(doctorsCollection, where("role", "==", "doctor"));
        const querySnapshot = await getDocs(q);

        const allSpecializations = new Set();
        allSpecializations.add("all");

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.specialization && typeof data.specialization === "string") {
            allSpecializations.add(data.specialization);
          }
        });

        // Convert Set to Array dan sort
        const sortedSpecializations = Array.from(allSpecializations).sort(
          (a, b) => {
            if (a === "all") return -1;
            if (b === "all") return 1;
            return a.localeCompare(b);
          }
        );

        setSpecializations(sortedSpecializations);
      } catch (error) {
        console.error("Error fetching specializations:", error);
        // Fallback ke specializations statis jika Firebase gagal
        setSpecializations([
          "all",
          "Dokter Umum",
          "Dokter Gigi",
          "Dokter Tulang",
          "Dokter THT",
          "Dokter Kulit",
          "Dokter Anak",
          "Dokter Kandungan",
          "Dokter Saraf",
          "Dokter Mata",
          "Dokter Penyakit Dalam",
        ]);
      } finally {
        setSpecializationsLoading(false);
      }
    };

    fetchSpecializations();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSpecialization(tempSpecialization);
    setSearchName(tempSearchName);
  };

  const handleClearFilters = () => {
    setTempSpecialization("all");
    setTempSearchName("");
    setSpecialization("all");
    setSearchName("");
  };

  const capitalizeWords = (str) => {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <>
      <div className="all relative">
        <NavbarWhite />

        {/* Header Section */}
        <div className="bg-blue-50 text-black w-full pt-[8rem] pb-10 px-4 md:px-[14rem]">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Book an Appointment
            </h1>
            <p className="text-gray-600 text-lg">
              Find and connect with professional healthcare providers
            </p>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-blue-50 text-black justify-center flex flex-col items-center w-full h-auto pb-20 px-4 md:px-[14rem]">
          {/* Search Form */}
          <form
            onSubmit={handleSubmit}
            className="w-full bg-white p-6 md:p-7 rounded-md border-gray-300 border-[0.1rem] mb-10 shadow-[0px_0px_10px_rgba(0,0,0,0.15)]"
          >
            {/* Search Input */}
            <div className="w-full h-[3.5rem] mb-4">
              <input
                type="text"
                name="searchName"
                placeholder="Search doctor by name..."
                className="w-full h-full px-5 py-4 outline-none border-gray-300 border-[0.1rem] rounded-md bg-blue-50 hover:border-blue-500 focus:border-blue-500 transition-colors"
                value={tempSearchName}
                onChange={(e) => setTempSearchName(e.target.value)}
              />
            </div>

            {/* Specialization and Buttons */}
            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* Specialization Select */}
              <div className="flex flex-col w-full md:w-2/3">
                <label className="text-sm text-gray-600 mb-1">
                  Specialization
                </label>
                <select
                  name="specialization"
                  className="w-full h-[3.5rem] px-4 py-3 border-gray-300 border-[0.1rem] rounded-md outline-none hover:border-blue-500 focus:border-blue-500 transition-colors"
                  value={tempSpecialization}
                  onChange={(e) => setTempSpecialization(e.target.value)}
                  disabled={specializationsLoading}
                >
                  {specializationsLoading ? (
                    <option value="all">Loading specializations...</option>
                  ) : (
                    specializations.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec === "all"
                          ? "All Specializations"
                          : capitalizeWords(spec)}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 w-full md:w-1/3 h-[3.5rem] mt-5 md:mt-0">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="flex-1 h-full px-4 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  className="flex-1 h-full px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchName || specialization !== "all") && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-gray-600 mb-2">Active filters:</p>
                <div className="flex flex-wrap gap-2">
                  {searchName && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      Name: `{searchName}`
                    </span>
                  )}
                  {specialization !== "all" && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Specialization: {capitalizeWords(specialization)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </form>

          {/* Results Header */}
          <div className="w-full flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">
                {searchName || specialization !== "all"
                  ? "Search Results"
                  : "Available Doctors"}
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {searchName || specialization !== "all"
                  ? "Showing doctors matching your criteria"
                  : "Browse all available healthcare providers"}
              </p>
            </div>
            {(searchName || specialization !== "all") && (
              <button
                onClick={handleClearFilters}
                className="text-blue-600 hover:text-blue-800 text-sm underline hidden md:block"
              >
                Show all doctors
              </button>
            )}
          </div>

          {/* Doctor List */}
          <DoctorList
            DoctorCount={20}
            filterSpecialization={specialization}
            searchName={searchName}
            showOnlyApproved={true}
          />
        </div>

        <Footer />
      </div>
    </>
  );
}

// "use client";
// import { useState } from "react";
// import Footer from "@/components/footer/page";
// import NavbarWhite from "@/components/navbar-white";
// import DoctorList from "@/components/DoctorList";

// export default function Appointment() {
//   const [specialization, setSpecialization] = useState("all");
//   const [searchName, setSearchName] = useState("");

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     const formData = new FormData(e.target);
//     const selectedSpec = formData.get("specialization");
//     const inputName = formData.get("searchName");

//     setSpecialization(selectedSpec);
//     setSearchName(inputName);
//   };

//   return (
//     <>
//       <div className="all relative">
//         <NavbarWhite />
//         <div className="bottom-news bg-blue-50 text-black justify-center flex flex-col items-center w-full h-auto mt-16 py-20 px-[14rem]">
//           <form onSubmit={handleSubmit} className="w-full bg-white p-7 rounded-md border-gray-300 border-[0.1rem] mb-10 shadow-[0px_0px_10px_rgba(0,0,0,0.15)]">
//             <div className="w-full h-[3.5rem] mb-4">
//               <input
//                 type="text"
//                 name="searchName"
//                 placeholder="Search Doctor"
//                 className="w-full h-full px-5 py-4 outline-none border-gray-300 border-[0.1rem] rounded-md bg-blue-50 hover:border-blue-500"
//               />
//             </div>

//             <div className="flex flex-row items-center gap-4 h-[4.5rem]">
//               <div className="flex flex-col w-full">
//                 <label className="text-sm text-gray-600">Specialization</label>
//                 <select
//                   name="specialization"
//                   className="w-full h-full px-4 py-3 border-gray-300 border-[0.1rem] rounded-md outline-none"
//                   defaultValue="all"
//                 >
//                   <option value="all">All</option>
//                   <option value="Dokter Umum">Dokter Umum</option>
//                   <option value="Dokter Gigi">Dokter Gigi</option>
//                   <option value="Dokter Tulang">Dokter Tulang</option>
//                   <option value="Dokter THT">Dokter THT</option>
//                   <option value="Dokter Kulit">Dokter Kulit</option>
//                   <option value="Dokter Anak">Dokter Anak</option>
//                   <option value="Dokter Kandungan">Dokter Kandungan</option>
//                   <option value="Dokter Saraf">Dokter Saraf</option>
//                   <option value="Dokter Mata">Dokter Mata</option>
//                   <option value="Dokter Penyakit Dalam">Dokter Penyakit Dalam</option>
//                 </select>
//               </div>

//               <div className="w-full h-full flex justify-end">
//                 <button
//                   type="submit"
//                   className="w-full h-full px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
//                 >
//                   Search
//                 </button>
//               </div>
//             </div>
//           </form>

//           <DoctorList
//             DoctorCount={20}
//             filterSpecialization={specialization}
//             searchName={searchName}
//           />
//         </div>
//         <Footer />
//       </div>
//     </>
//   );
// }
