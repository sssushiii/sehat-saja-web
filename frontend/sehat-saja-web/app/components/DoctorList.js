"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";

// Rating Stars Component
const RatingStars = ({ rating, size = "sm", showCount = false }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const starClasses = size === "md" ? "text-lg" : "text-sm";
  const countClasses = size === "md" ? "text-sm" : "text-xs";

  return (
    <div className={`flex items-center ${starClasses}`}>
      {[...Array(fullStars)].map((_, i) => (
        <span key={`full-${i}`} className="text-yellow-400">★</span>
      ))}
      {hasHalfStar && <span className="text-yellow-400">★</span>}
      {[...Array(emptyStars)].map((_, i) => (
        <span key={`empty-${i}`} className="text-gray-300">★</span>
      ))}
      {showCount && (
        <span className={`ml-1 text-gray-600 ${countClasses}`}>
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  );
};

// Skeleton Loader
const DoctorListSkeleton = ({ count }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-lg shadow-md border border-gray-200 bg-white animate-pulse overflow-hidden">
          <div className="flex flex-col sm:flex-row h-full">
            <div className="w-full sm:w-2/5 h-48 sm:h-auto bg-gray-200"></div>
            <div className="p-4 w-full sm:w-3/5 flex flex-col justify-between">
              <div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-20 mb-4"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-4/5"></div>
              </div>
              <div className="mt-4">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Doctor Card Component
const DoctorCard = ({
  id,
  name,
  photoUrl,
  specialization,
  price,
  description,
  status,
  averageRating,
  ratingCount
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
    <div className="rounded-lg shadow-md border border-gray-200 hover:border-blue-500 transition-all duration-200 bg-white overflow-hidden h-full flex flex-col">
      <div className="flex flex-col sm:flex-row h-full">
        <div className="w-full sm:w-2/5 h-48 sm:h-auto relative">
          <Image
            src={photoUrl || "/assets/default-doctor.jpg"}
            alt={name}
            fill
            className="object-cover object-top"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
            onError={(e) => {
              e.target.src = "/assets/default-doctor.jpg";
            }}
          />
        </div>
        <div className="p-4 w-full sm:w-3/5 flex flex-col justify-between">
          <div>
            <h2 className="font-semibold text-lg line-clamp-1">{name}</h2>
            <p className="text-sm text-gray-600 line-clamp-1">
              {specialization}
            </p>
            {averageRating > 0 && (
              <div className="mt-1 flex items-center gap-1">
                <RatingStars rating={averageRating} />
                <span className="text-xs text-gray-500">({ratingCount})</span>
              </div>
            )}
            {status && (
              <span className={`inline-block px-2 py-1 rounded-full text-xs mt-2 ${
                status === 'active' ? 'bg-green-100 text-green-800' : 
                status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-green-100 text-green-600'
              }`}>
                {status}
              </span>
            )}
          </div>
          
          <div className="my-3">
            <p className="text-xs text-gray-500 line-clamp-2">
              {description || "Professional healthcare provider ready to help you."}
            </p>
          </div>
          
          <div>
            <div className="mb-2">
              <p className="font-semibold text-sm text-blue-600">
                {formatPrice(price)}
              </p>
            </div>
            
            <Link 
              href={`/appointment/${id}`}
              className="block w-full py-2 rounded-md bg-blue-500 hover:bg-blue-600 transition-colors text-center"
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

// Doctor Modal Component
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
              src={doctor.photoUrl || "/assets/default-doctor.jpg"}
              alt={doctor.name}
              fill
              className="rounded-full object-cover object-top"
              onError={(e) => {
                e.target.src = "/assets/default-doctor.jpg";
              }}
            />
          </div>
          
          <h2 className="text-xl font-semibold mb-1">{doctor.name}</h2>
          <p className="text-blue-600 font-medium mb-1">{doctor.specialization}</p>
          
          {doctor.averageRating > 0 && (
            <div className="mb-2 flex items-center justify-center gap-1">
              <RatingStars rating={doctor.averageRating} size="md" />
              <span className="text-sm text-gray-600">
                ({doctor.ratingCount} review{doctor.ratingCount !== 1 ? 's' : ''})
              </span>
            </div>
          )}
          
          {doctor.status && (
            <span className={`inline-block px-3 py-1 rounded-full text-sm mb-3 ${
              doctor.status === 'active' ? 'bg-green-100 text-green-800' : 
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
                <span className="text-blue-600 break-all">{doctor.email}</span>
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

// Main DoctorList Component
const DoctorList = ({
  DoctorCount = 10,
  filterSpecialization = "all",
  searchName = "",
  showOnlyApproved = true,
}) => {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const doctorsCollection = collection(db, "users");
        const q = showOnlyApproved 
          ? query(
              doctorsCollection, 
              where("role", "==", "doctor"),
              where("status", "==", "active")
            )
          : query(doctorsCollection, where("role", "==", "doctor"));
        
        const querySnapshot = await getDocs(q);
        const doctorsData = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          doctorsData.push({
            id: doc.id,
            ...data,
            name: data.name || "Unknown Doctor",
            specialization: data.specialization || "General Practitioner",
            photoUrl: data.photoUrl || "/assets/default-doctor.jpg",
            averageRating: data.averageRating || 0,
            ratingCount: data.ratingCount || 0,
          });
        });
        
        setDoctors(doctorsData);
      } catch (err) {
        console.error("Error fetching doctors:", err);
        setError("Failed to load doctors. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [showOnlyApproved]);

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
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedDoctors.map((doctor) => (
          <div 
            key={doctor.id} 
            onClick={() => setSelectedDoctor(doctor)}
            className="cursor-pointer"
          >
            <DoctorCard {...doctor} />
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

export default DoctorList;
