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
      <div className="Doctor-bottom w-full h-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 justify-between gap-4">
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