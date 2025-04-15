"use client";
import { useState } from "react";
import Footer from "@/components/footer/page";
import NavbarWhite from "@/components/navbar-white";
import DoctorList from "@/components/DoctorList";

export default function Appointment() {
  const [specialization, setSpecialization] = useState("all");
  const [searchName, setSearchName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const selectedSpec = formData.get("specialization");
    const inputName = formData.get("searchName");

    setSpecialization(selectedSpec);
    setSearchName(inputName);
  };

  return (
    <>
      <div className="all relative">
        <NavbarWhite />
        <div className="bottom-news bg-blue-50 text-black justify-center flex flex-col items-center w-full h-auto mt-16 py-20 px-[18rem]">
          <form onSubmit={handleSubmit} className="w-full bg-white p-7 rounded-md border-gray-300 border-[0.1rem] mb-10 shadow-[0px_0px_10px_rgba(0,0,0,0.15)]">
            <div className="w-full h-[3.5rem] mb-4">
              <input
                type="text"
                name="searchName"
                placeholder="Search Doctor"
                className="w-full h-full px-5 py-4 outline-none border-gray-300 border-[0.1rem] rounded-md bg-blue-50 hover:border-blue-500"
              />
            </div>

            <div className="flex flex-row items-center gap-4 h-[4.5rem]">
              <div className="flex flex-col w-full">
                <label className="text-sm text-gray-600">Specialization</label>
                <select
                  name="specialization"
                  className="w-full h-full px-4 py-3 border-gray-300 border-[0.1rem] rounded-md outline-none"
                  defaultValue="all"
                >
                  <option value="all">All</option>
                  <option value="Dokter Umum">Dokter Umum</option>
                  <option value="Dokter Gigi">Dokter Gigi</option>
                  <option value="Dokter Tulang">Dokter Tulang</option>
                  <option value="Dokter THT">Dokter THT</option>
                  <option value="Dokter Kulit">Dokter Kulit</option>
                  <option value="Dokter Anak">Dokter Anak</option>
                  <option value="Dokter Kandungan">Dokter Kandungan</option>
                  <option value="Dokter Saraf">Dokter Saraf</option>
                  <option value="Dokter Mata">Dokter Mata</option>
                  <option value="Dokter Penyakit Dalam">Dokter Penyakit Dalam</option>
                </select>
              </div>

              <div className="w-full h-full flex justify-end">
                <button
                  type="submit"
                  className="w-full h-full px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                >
                  Search
                </button>
              </div>
            </div>
          </form>

          <DoctorList
            DoctorCount={60}
            filterSpecialization={specialization}
            searchName={searchName}
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
//     setSpecialization(formData.get("specialization"));
//     setSearchName(formData.get("searchName"));
//   };

//   return (
//     <>
//       <div className="all relative">
//         <NavbarWhite />
//         <div className="bg-blue-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
//           <div className="max-w-7xl mx-auto">
//             <form 
//               onSubmit={handleSubmit} 
//               className="bg-white p-6 rounded-lg shadow-md mb-8"
//             >
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Cari Dokter
//                   </label>
//                   <input
//                     type="text"
//                     name="searchName"
//                     placeholder="Nama dokter..."
//                     className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Spesialisasi
//                   </label>
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
//                 </div>
//                 <div className="flex items-end">
//                   <button
//                     type="submit"
//                     className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
//                   >
//                     Cari
//                   </button>
//                 </div>
//               </div>
//             </form>

//             <DoctorList
//               DoctorCount={12}
//               filterSpecialization={specialization}
//               searchName={searchName}
//             />
//           </div>
//         </div>
//         <Footer />
//       </div>
//     </>
//   );
// }