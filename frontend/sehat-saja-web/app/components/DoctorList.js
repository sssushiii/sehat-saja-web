// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import Image from "next/image";
// import { Doctors } from "@/data/doctors";

// const DoctorList = ({
//   DoctorCount,
//   filterSpecialization = "all",
//   searchName = "",
// }) => {
//   const [selectedDoctor, setSelectedDoctor] = useState(null);

//   // Penanganan ketika data kosong atau tidak valid
//   if (!Array.isArray(Doctors) || Doctors.length === 0) {
//     return <p className="text-center w-full">No doctor data available.</p>;
//   }

//   const repeatedDoctor = Array.from({ length: DoctorCount }, (_, i) => {
//     const doctor = Doctors[i % Doctors.length];
//     return doctor;
//   });

//   const filteredDoctors = repeatedDoctor.filter((doc) => {
//     const matchesSpecialization =
//       filterSpecialization === "all" ||
//       (Array.isArray(doc.specialization) &&
//         doc.specialization.some((s) =>
//           s.toLowerCase().includes(filterSpecialization.toLowerCase())
//         ));

//     const matchesName =
//       doc.title &&
//       doc.title.toLowerCase().includes(searchName.toLowerCase());

//     return matchesSpecialization && matchesName;
//   });

//   return (
//     <>
//       <div className="Doctor-bottom w-full h-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 justify-between gap-5">
//         {filteredDoctors.map((DoctorItem, index) => (
//           <div key={index} onClick={() => setSelectedDoctor(DoctorItem)}>
//             <DoctorCard {...DoctorItem} />
//           </div>
//         ))}
//       </div>

//       {selectedDoctor && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
//           <div className="bg-white w-[25rem] md:w-[30rem] rounded-xl p-6 shadow-lg relative">
//             <button
//               className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-lg"
//               onClick={() => setSelectedDoctor(null)}
//             >
//               ✕
//             </button>
//             <div className="flex flex-col items-center text-center">
//               <Image
//                 src={selectedDoctor.image}
//                 alt={selectedDoctor.title}
//                 width={100}
//                 height={100}
//                 className="rounded-full object-cover aspect-square object-top"
//               />
//               <h2 className="mt-4 text-xl font-semibold">
//                 {selectedDoctor.title}
//               </h2>
//               <p className="text-gray-600">
//                 {Array.isArray(selectedDoctor.specialization)
//                   ? selectedDoctor.specialization.join(", ")
//                   : selectedDoctor.specialization}
//               </p>

//               <div className="flex justify-around w-full my-5">
//                 <div className="text-center">
//                   <p className="text-lg font-bold">{selectedDoctor.patient}+</p>
//                   <p className="text-sm text-gray-500">Patient</p>
//                 </div>
//                 <div className="text-center">
//                   <p className="text-lg font-bold">{selectedDoctor.years}</p>
//                   <p className="text-sm text-gray-500">Experience</p>
//                 </div>
//                 <div className="text-center">
//                   <p className="text-lg font-bold">{selectedDoctor.rating}</p>
//                   <p className="text-sm text-gray-500">Rating</p>
//                 </div>
//               </div>

//               <p className="text-sm text-gray-700">
//                 {selectedDoctor.description}
//               </p>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// const DoctorCard = ({
//   title,
//   image,
//   specialization,
//   price,
//   patient,
//   rating,
// }) => {
//   return (
//     <div className="col-span-1 w-auto h-[13.5rem] shadow-md outline outline-gray-300 flex flex-col rounded-md hover:outline-blue-500 transition-all duration-100 bg-white">
//       <Link href="#" className="h-full flex">
//         <div className="w-2/5 h-full relative">
//           <Image
//             src={image}
//             alt={title}
//             layout="fill"
//             objectFit="cover"
//             className="rounded-l-md object-top"
//           />
//         </div>
//         <div className="px-7 py-5 h-full w-3/5 flex justify-between flex-col text-center">
//           <h2 className="font-semibold text-lg">{title}</h2>
//           <p className="text-normal font-light">
//             {Array.isArray(specialization)
//               ? specialization.join(", ")
//               : specialization}
//           </p>
//           <div className="details flex w-full justify-center">
//             <div className="patient flex flex-col w-1/2">
//               <h1 className="text-lg font-semibold">{patient}</h1>
//               <h1 className="font-light">Patient</h1>
//             </div>
//             <div className="rating flex flex-col w-1/2 justify-center items-center">
//               <h1 className="text-lg font-semibold">{rating}</h1>
//               <h1 className="font-light">Rating</h1>
//             </div>
//           </div>
//           <div className="into text-left flex items-center w-full gap-2">
//             <div className="price flex flex-col w-1/2">
//               <h1 className="font-semibold">{price}</h1>
//             </div>
//             <div className="rating flex flex-col w-1/2 h-9 rounded-sm bg-blue-500 hover:bg-blue-600 ease-in-out duration-100 justify-center text-center items-center">
//               <Link href={`/appointment/${doctor.id}`} className="w-full text-white">Chat</Link>
//             </div>
//           </div>
//         </div>
//       </Link>
//     </div>
//   );
// };

// export default DoctorList;










// "use client";
// import { useState } from "react";
// import Link from "next/link";
// import Image from "next/image";
// import { Doctors } from "@/data/doctors";

// const DoctorList = ({ DoctorCount, filterSpecialization = "all", searchName = "" }) => {
//   const [selectedDoctor, setSelectedDoctor] = useState(null);

//   const filteredDoctors = Doctors.filter((doc) => {
//     const matchesSpecialization =
//       filterSpecialization === "all" ||
//       doc.specialization.some(s => 
//         s.toLowerCase().includes(filterSpecialization.toLowerCase())
//       );

//     const matchesName = 
//       doc.title.toLowerCase().includes(searchName.toLowerCase());

//     return matchesSpecialization && matchesName;
//   }).slice(0, DoctorCount);

//   return (
//     <>
//       <div className="Doctor-bottom w-full h-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
//         {filteredDoctors.map((doctor) => (
//           <div key={doctor.id}>
//             <DoctorCard {...doctor} />
//           </div>
//         ))}
//       </div>

//       {selectedDoctor && (
//         <DoctorDetailModal 
//           doctor={selectedDoctor}
//           onClose={() => setSelectedDoctor(null)}
//         />
//       )}
//     </>
//   );
// };

// const DoctorCard = ({ id, title, image, specialization, price, patient, rating }) => {
//   return (
//     <div className="w-full h-[13.5rem] shadow-md border border-gray-200 rounded-md hover:border-blue-500 transition-all bg-white">
//       <Link href={`/appointment/${id}`} className="h-full flex">
//         <div className="w-2/5 h-full relative">
//           <Image
//             src={image}
//             alt={title}
//             fill
//             className="rounded-l-md object-cover object-top"
//           />
//         </div>
//         <div className="w-3/5 p-4 flex flex-col justify-between">
//           <div>
//             <h2 className="font-semibold text-lg">{title}</h2>
//             <p className="text-gray-600 text-sm">{specialization.join(", ")}</p>
//           </div>
//           <div className="flex justify-between items-center">
//             <div>
//               <p className="font-semibold">{price}</p>
//               <p className="text-xs text-gray-500">{patient} pasien</p>
//             </div>
//             <div className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm">
//               Buat Janji
//             </div>
//           </div>
//         </div>
//       </Link>
//     </div>
//   );
// };

// const DoctorDetailModal = ({ doctor, onClose }) => {
//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg w-full max-w-md p-6">
//         <div className="flex justify-between items-start mb-4">
//           <h2 className="text-xl font-bold">{doctor.title}</h2>
//           <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
//             ✕
//           </button>
//         </div>
//         <Image
//           src={doctor.image}
//           alt={doctor.title}
//           width={120}
//           height={120}
//           className="rounded-full mx-auto my-4"
//         />
//         <p className="text-gray-700 mb-4">{doctor.description}</p>
//         <Link 
//           href={`/appointment/${doctor.id}`}
//           className="block w-full bg-blue-500 text-white py-2 px-4 rounded-md text-center hover:bg-blue-600"
//         >
//           Buat Janji
//         </Link>
//       </div>
//     </div>
//   );
// };

// export default DoctorList;
















"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Doctors } from "@/data/doctors";

const DoctorList = ({
  DoctorCount,
  filterSpecialization = "all",
  searchName = "",
}) => {
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  if (!Array.isArray(Doctors) || Doctors.length === 0) {
    return <p className="text-center w-full">No doctor data available.</p>;
  }

  const repeatedDoctor = Array.from({ length: DoctorCount }, (_, i) => {
    return Doctors[i % Doctors.length];
  });

  const filteredDoctors = repeatedDoctor.filter((doc) => {
    const matchesSpecialization =
      filterSpecialization === "all" ||
      (Array.isArray(doc.specialization) &&
      doc.specialization.some((s) =>
        s.toLowerCase().includes(filterSpecialization.toLowerCase())
      ))

    const matchesName =
      doc.title &&
      doc.title.toLowerCase().includes(searchName.toLowerCase());

    return matchesSpecialization && matchesName;
  });

  return (
    <>
      <div className="Doctor-bottom w-full h-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 justify-between gap-5">
        {filteredDoctors.map((DoctorItem, index) => (
          <div key={index} onClick={() => setSelectedDoctor(DoctorItem)}>
            <DoctorCard {...DoctorItem} />
          </div>
        ))}
      </div>

      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white w-[25rem] md:w-[30rem] rounded-xl p-6 shadow-lg relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-lg"
              onClick={() => setSelectedDoctor(null)}
            >
              ✕
            </button>
            <div className="flex flex-col items-center text-center">
              <Image
                src={selectedDoctor.image}
                alt={selectedDoctor.title}
                width={100}
                height={100}
                className="rounded-full object-cover aspect-square object-top"
              />
              <h2 className="mt-4 text-xl font-semibold">
                {selectedDoctor.title}
              </h2>
              <p className="text-gray-600">
                {Array.isArray(selectedDoctor.specialization)
                  ? selectedDoctor.specialization.join(", ")
                  : selectedDoctor.specialization}
              </p>

              <div className="flex justify-around w-full my-5">
                <div className="text-center">
                  <p className="text-lg font-bold">{selectedDoctor.patient}+</p>
                  <p className="text-sm text-gray-500">Patient</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{selectedDoctor.years}</p>
                  <p className="text-sm text-gray-500">Experience</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold">{selectedDoctor.rating}</p>
                  <p className="text-sm text-gray-500">Rating</p>
                </div>
              </div>

              <p className="text-sm text-gray-700">
                {selectedDoctor.description}
              </p>
              
              <Link 
                href={`/appointment/${selectedDoctor.id}`}
                className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
              >
                Chat
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const DoctorCard = ({
  id,
  title,
  image,
  specialization,
  price,
  patient,
  rating,
}) => {
  return (
    <div className="col-span-1 w-auto h-[13.5rem] shadow-md outline outline-gray-300 flex flex-col rounded-md hover:outline-blue-500 transition-all duration-100 bg-white">
      <div className="h-full flex">
        <div className="w-2/5 h-full relative">
          <Image
            src={image}
            alt={title}
            fill
            className="rounded-l-md object-cover object-top"
          />
        </div>
        <div className="px-7 py-5 h-full w-3/5 flex justify-between flex-col text-center">
          <h2 className="font-semibold text-lg">{title}</h2>
          <p className="text-normal font-light">
            {Array.isArray(specialization)
              ? specialization.join(", ")
              : specialization}
          </p>
          <div className="details flex w-full justify-center">
            <div className="patient flex flex-col w-1/2">
              <h1 className="text-lg font-semibold">{patient}</h1>
              <h1 className="font-light">Patient</h1>
            </div>
            <div className="rating flex flex-col w-1/2 justify-center items-center">
              <h1 className="text-lg font-semibold">{rating}</h1>
              <h1 className="font-light">Rating</h1>
            </div>
          </div>
          <div className="into text-left flex items-center w-full gap-2">
            <div className="price flex flex-col w-1/2">
              <h1 className="font-semibold">{price}</h1>
            </div>
            <Link 
              href={`/appointment/${id}`}
              className="w-1/2 h-9 rounded-sm bg-blue-500 hover:bg-blue-600 ease-in-out duration-100 flex justify-center items-center"
            >
              <span className="text-white">Chat</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorList;