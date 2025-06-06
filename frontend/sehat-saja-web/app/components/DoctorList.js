"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase"; // Sesuaikan dengan path firebase config Anda

const DoctorList = ({
  DoctorCount = 10,
  filterSpecialization = "all",
  searchName = "",
  showOnlyApproved = true, // Filter hanya dokter yang sudah approved
}) => {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch doctors from Firebase
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const doctorsCollection = collection(db, "users");
        
        // Query untuk mendapatkan hanya users dengan role "doctor"
        const q = showOnlyApproved 
          ? query(
              doctorsCollection, 
              where("role", "==", "doctor"),
              where("status", "==", "active") // Hanya dokter yang sudah approved
            )
          : query(doctorsCollection, where("role", "==", "doctor"));
        
        const querySnapshot = await getDocs(q);
        const doctorsData = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          doctorsData.push({
            id: doc.id,
            uid: data.uid || "",
            name: data.name || "Unknown Doctor",
            email: data.email || "",
            phone: data.phone || "",
            specialization: data.specialization || "General Practitioner",
            price: data.price || 0,
            description: data.description || "",
            photoUrl: data.photoUrl || "/assets/default-doctor.jpg",
            gender: data.gender || "",
            birthDate: data.birthDate || "",
            licenseNumber: data.licenseNumber || "",
            dailySchedules: data.dailySchedules || {},
            status: data.status || "pending",
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            lastLogin: data.lastLogin?.toDate ? data.lastLogin.toDate() : null,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
          });
        });
        
        setDoctors(doctorsData);
      } catch (err) {
        console.error("Error fetching doctors:", err);
        setError("Failed to load doctors");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [showOnlyApproved]);

  // Filter doctors based on specialization and name
  const filteredDoctors = doctors.filter((doc) => {
    const matchesSpecialization =
      filterSpecialization === "all" ||
      (doc.specialization && 
       doc.specialization.toLowerCase().includes(filterSpecialization.toLowerCase()));

    const matchesName =
      doc.name &&
      doc.name.toLowerCase().includes(searchName.toLowerCase());

    return matchesSpecialization && matchesName;
  });

  // Limit the number of doctors shown
  const displayedDoctors = filteredDoctors.slice(0, DoctorCount);

  if (loading) {
    return <DoctorListSkeleton count={DoctorCount} />;
  }

  if (error) {
    return (
      <div className="text-center w-full py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (displayedDoctors.length === 0) {
    return (
      <div className="text-center w-full py-8">
        <p className="text-gray-500">
          {searchName || filterSpecialization !== "all" 
            ? "No doctors found matching your criteria." 
            : "No doctors available at the moment."
          }
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="Doctor-bottom w-full h-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 justify-between gap-4">
        {displayedDoctors.map((DoctorItem, index) => (
          <div key={DoctorItem.id || index} onClick={() => setSelectedDoctor(DoctorItem)}>
            <DoctorCard {...DoctorItem} />
          </div>
        ))}
      </div>

      {selectedDoctor && (
        <DoctorModal 
          doctor={selectedDoctor} 
          onClose={() => setSelectedDoctor(null)} 
        />
      )}
    </>
  );
};

const DoctorCard = ({
  id,
  name,
  photoUrl,
  specialization,
  price,
  description,
  status,
}) => {
  const formatPrice = (price) => {
    if (!price) return "Contact for price";
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="col-span-1 w-auto h-[13.5rem] shadow-md outline outline-gray-300 flex flex-col rounded-md hover:outline-blue-500 transition-all duration-100 bg-white cursor-pointer">
      <div className="h-full flex">
        <div className="w-2/5 h-full relative">
          <Image
            src={photoUrl}
            alt={name}
            fill
            className="rounded-l-md object-cover object-top"
            onError={(e) => {
              e.target.src = "/assets/default-doctor.jpg";
            }}
          />
        </div>
        <div className="px-4 py-4 h-full w-3/5 flex justify-between flex-col">
          <div className="doctor-info">
            <h2 className="font-semibold text-lg line-clamp-1">{name}</h2>
            <p className="text-sm font-light text-gray-600 line-clamp-1">
              {specialization}
            </p>
            {status && (
              <span className={`inline-block px-2 py-1 rounded-full text-xs mt-1 ${
                status === 'approved' ? 'bg-green-100 text-green-800' : 
                status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-green-100 text-green-600'
              }`}>
                {status}
              </span>
            )}
          </div>
          
          <div className="description flex-grow my-2">
            <p className="text-xs text-gray-500 line-clamp-2">
              {description || "Professional healthcare provider ready to help you."}
            </p>
          </div>
          
          <div className="bottom-section">
            <div className="price-info mb-2">
              <p className="font-semibold text-sm text-blue-600">
                {formatPrice(price)}
              </p>
            </div>
            
            <Link 
              href={`/appointment/${id}`}
              className="w-full h-8 rounded-sm bg-blue-500 hover:bg-blue-600 ease-in-out duration-100 flex justify-center items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-white text-sm">Book Appointment</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const DoctorModal = ({ doctor, onClose }) => {
  const formatPrice = (price) => {
    if (!price) return "Contact for price";
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return "Not specified";
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} years old`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-lg relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-xl z-10"
          onClick={onClose}
        >
          ✕
        </button>
        
        <div className="flex flex-col items-center text-center">
          <div className="relative w-24 h-24 mb-4">
            <Image
              src={doctor.photoUrl}
              alt={doctor.name}
              fill
              className="rounded-full object-cover"
              onError={(e) => {
                e.target.src = "/assets/default-doctor.jpg";
              }}
            />
          </div>
          
          <h2 className="text-xl font-semibold mb-1">{doctor.name}</h2>
          <p className="text-blue-600 font-medium mb-1">{doctor.specialization}</p>
          
          {doctor.status && (
            <span className={`inline-block px-3 py-1 rounded-full text-sm mb-3 ${
              doctor.status === 'approved' ? 'bg-green-100 text-green-800' : 
              doctor.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
              'bg-red-100 text-red-800'
            }`}>
              {doctor.status}
            </span>
          )}

          <div className="w-full bg-gray-50 rounded-lg p-4 mb-4 text-left">
            <h3 className="font-semibold mb-2 text-center">Doctor Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Age:</span>
                <span>{calculateAge(doctor.birthDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Gender:</span>
                <span className="capitalize">{doctor.gender || "Not specified"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">License:</span>
                <span>{doctor.licenseNumber || "Not specified"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="text-blue-600">{doctor.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span>{doctor.phone || "Not available"}</span>
              </div>
            </div>
          </div>

          <div className="w-full mb-4">
            <h3 className="font-semibold mb-2">Consultation Fee</h3>
            <p className="text-2xl font-bold text-blue-600">{formatPrice(doctor.price)}</p>
          </div>

          {doctor.description && (
            <div className="w-full mb-4 text-left">
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-sm text-gray-700">{doctor.description}</p>
            </div>
          )}
          
          <Link 
            href={`/appointment/${doctor.id}`}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 transition-colors font-medium"
          >
            Book Appointment
          </Link>
        </div>
      </div>
    </div>
  );
};

// Loading Skeleton Component
const DoctorListSkeleton = ({ count }) => {
  const skeletons = Array.from({ length: count });
  
  return (
    <div className="Doctor-bottom w-full h-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 justify-between gap-4">
      {skeletons.map((_, index) => (
        <div key={index} className="col-span-1 w-auto h-[13.5rem] shadow-md outline outline-gray-300 flex flex-col rounded-md bg-white animate-pulse">
          <div className="h-full flex">
            <div className="w-2/5 h-full bg-gray-200 rounded-l-md"></div>
            <div className="px-4 py-4 h-full w-3/5 flex justify-between flex-col">
              <div className="doctor-info">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              
              <div className="description flex-grow my-2">
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-4/5"></div>
              </div>
              
              <div className="bottom-section">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DoctorList;


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

//   if (!Array.isArray(Doctors) || Doctors.length === 0) {
//     return <p className="text-center w-full">No doctor data available.</p>;
//   }

//   const repeatedDoctor = Array.from({ length: DoctorCount }, (_, i) => {
//     return Doctors[i % Doctors.length];
//   });

//   const filteredDoctors = repeatedDoctor.filter((doc) => {
//     const matchesSpecialization =
//       filterSpecialization === "all" ||
//       (Array.isArray(doc.specialization) &&
//       doc.specialization.some((s) =>
//         s.toLowerCase().includes(filterSpecialization.toLowerCase())
//       ))

//     const matchesName =
//       doc.title &&
//       doc.title.toLowerCase().includes(searchName.toLowerCase());

//     return matchesSpecialization && matchesName;
//   });

//   return (
//     <>
//       <div className="Doctor-bottom w-full h-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 justify-between gap-4">
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
              
//               <Link 
//                 href={`/appointment/${selectedDoctor.id}`}
//                 className="mt-4 w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
//               >
//                 Chat
//               </Link>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// const DoctorCard = ({
//   id,
//   title,
//   image,
//   specialization,
//   price,
//   patient,
//   rating,
// }) => {
//   return (
//     <div className="col-span-1 w-auto h-[13.5rem] shadow-md outline outline-gray-300 flex flex-col rounded-md hover:outline-blue-500 transition-all duration-100 bg-white">
//       <div className="h-full flex">
//         <div className="w-2/5 h-full relative">
//           <Image
//             src={image}
//             alt={title}
//             fill
//             className="rounded-l-md object-cover object-top"
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
//             <Link 
//               href={`/appointment/${id}`}
//               className="w-1/2 h-9 rounded-sm bg-blue-500 hover:bg-blue-600 ease-in-out duration-100 flex justify-center items-center"
//             >
//               <span className="text-white">Chat</span>
//             </Link>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DoctorList;