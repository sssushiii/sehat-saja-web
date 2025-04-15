// "use client";

// import { useEffect, useState, useRef, useCallback } from "react";
// import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
// import L from "leaflet";
// import "leaflet/dist/leaflet.css";

// import markerIcon from "leaflet/dist/images/marker-icon.png";
// import markerShadow from "leaflet/dist/images/marker-shadow.png";

// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconUrl: markerIcon.src,
//   shadowUrl: markerShadow.src,
// });

// const position = [-7.250445, 112.768845]; // Pusat Surabaya

// const createCustomIcon = (iconUrl) =>
//   new L.Icon({
//     iconUrl,
//     iconSize: [30, 30],
//   });

//   const hospitalIcon = createCustomIcon("/hospital-icon.png");
//   const clinicIcon = createCustomIcon("/clinic-icon.png");
//   const pharmacyIcon = createCustomIcon("/pharmacy-icon.png");
//   const doctorIcon = createCustomIcon("/hospital-icon.png");
//   const dentistIcon = createCustomIcon("/hospital-icon.png");
//   const veterinaryIcon = createCustomIcon("/hospital-icon.png");
//   const nursingHomeIcon = createCustomIcon("/hospital-icon.png");
//   const socialFacilityIcon = createCustomIcon("/hospital-icon.png");
//   const bloodDonationIcon = createCustomIcon("/hospital-icon.png");


// const SmallMapComponent = () => {
//   const [places, setPlaces] = useState([]);
//   const lastBoundsRef = useRef(null);
//   const fetchTimeout = useRef(null);

//   const fetchPlaces = useCallback(async (bounds) => {
//     const { _southWest, _northEast } = bounds;
//     const bbox = `${_southWest.lat},${_southWest.lng},${_northEast.lat},${_northEast.lng}`;

//     if (lastBoundsRef.current === bbox) return;
//     lastBoundsRef.current = bbox;

//     if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
//     fetchTimeout.current = setTimeout(async () => {
//       const query = `
//         [out:json][timeout:25];
//         (
//           node["amenity"="hospital"]["name"](${bbox});
//           node["amenity"="clinic"]["name"](${bbox});
//           node["amenity"="pharmacy"]["name"](${bbox});
//           node["amenity"="doctors"]["name"](${bbox});
//           node["amenity"="dentist"]["name"](${bbox});
//           node["amenity"="veterinary"]["name"](${bbox});
//           node["amenity"="nursing_home"]["name"](${bbox});
//           node["amenity"="social_facility"]["name"](${bbox});
//           node["amenity"="blood_donation"]["name"](${bbox});
          
          // node["building"="hospital"]["name"](${bbox});
          // node["building"="clinic"]["name"](${bbox});
          // node["building"="pharmacy"]["name"](${bbox});
          // node["building"="doctors"]["name"](${bbox});
          // node["building"="dentist"]["name"](${bbox});
          // node["building"="veterinary"]["name"](${bbox});
          // node["building"="nursing_home"]["name"](${bbox});
          // node["building"="social_facility"]["name"](${bbox});
          // node["building"="blood_donation"]["name"](${bbox});
//         );
//         out center;`;

//       const url = `https://overpass.kumi.systems/api/interpreter?data=${encodeURIComponent(query)}`;

//       try {
//         const response = await fetch(url);
//         if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
//         const data = await response.json();
//         setPlaces(data.elements || []);
//       } catch (error) {
//         console.error("Error fetching data:", error);
//       }
//     }, 1000); // Debounce 1 detik
//   }, []);

//   const MapEventHandler = () => {
//     const map = useMapEvents({
//       moveend: () => {
//         fetchPlaces(map.getBounds());
//       },
//     });

//     useEffect(() => {
//       fetchPlaces(map.getBounds());
//     }, []);

//     return null;
//   };

//   return (
//     <MapContainer
//       center={position}
//       zoom={13}
//       style={{ height: "500px", width: "100%" }}
//       attributionControl={false}
//     >
//       <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//       <MapEventHandler />

//       {places.map((place, index) => {
//         const amenity = place.tags?.amenity || "unknown";
//         const name = place.tags?.name || "Unknown";
//         const icon =
//           amenity === "hospital" ? hospitalIcon : amenity === "clinic" ? clinicIcon : pharmacyIcon;

//         return (
//           <Marker key={index} position={[place.lat, place.lon]} icon={icon}>
//             <Popup>
//               <b>{name}</b>
//               <br />
//               {amenity}
//             </Popup>
//           </Marker>
//         );
//       })}
//     </MapContainer>
//   );
// };

// export default SmallMapComponent;











// "use client";

// import { useEffect, useState, useRef, useCallback } from "react";
// import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
// import L from "leaflet";
// import "leaflet/dist/leaflet.css";

// // Fix untuk masalah default icon Leaflet
// import markerIcon from "leaflet/dist/images/marker-icon.png";
// import markerShadow from "leaflet/dist/images/marker-shadow.png";

// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconUrl: markerIcon.src,
//   shadowUrl: markerShadow.src,
// });

// // Posisi default (Surabaya)
// const position = [-7.250445, 112.768845];

// // Fungsi untuk membuat custom icon
// const createCustomIcon = (iconUrl) =>
//   new L.Icon({
//     iconUrl,
//     iconSize: [30, 30],
//     iconAnchor: [15, 30],
//     popupAnchor: [0, -30],
//   });

// // Pemetaan amenity ke ikon khusus
// const iconMapping = {
//   hospital: createCustomIcon("/logo-sehatsaja-white.png"),
//   clinic: createCustomIcon("/clinic-icon.png"),
//   pharmacy: createCustomIcon("/pharmacy-icon.png"),
//   doctors: createCustomIcon("/hospital-icon.png"),
//   dentist: createCustomIcon("/hospital-icon.png"),
//   veterinary: createCustomIcon("/hospital-icon.png"),
//   nursing_home: createCustomIcon("/hospital-icon.png"),
//   social_facility: createCustomIcon("/hospital-icon.png"),
//   blood_donation: createCustomIcon("/hospital-icon.png"),
// };

// const SmallMapComponent = () => {
//   const [places, setPlaces] = useState([]);
//   const lastBoundsRef = useRef(null);
//   const fetchTimeout = useRef(null);

//   // Fungsi untuk mengambil data dari Overpass API berdasarkan bounding box peta
//   const fetchPlaces = useCallback(async (bounds) => {
//     const { _southWest, _northEast } = bounds;
//     const bbox = `${_southWest.lat},${_southWest.lng},${_northEast.lat},${_northEast.lng}`;

//     if (lastBoundsRef.current === bbox) return;
//     lastBoundsRef.current = bbox;

//     // Debounce request agar tidak terlalu sering memanggil API
//     if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
//     fetchTimeout.current = setTimeout(async () => {
//       const query = `
//         [out:json][timeout:25];
//         (
//           node["amenity"="hospital"]["name"](${bbox});
//           node["amenity"="clinic"]["name"](${bbox});
//           node["amenity"="pharmacy"]["name"](${bbox});
//           node["amenity"="doctors"]["name"](${bbox});
//           node["amenity"="dentist"]["name"](${bbox});
//           node["amenity"="veterinary"]["name"](${bbox});
//           node["amenity"="nursing_home"]["name"](${bbox});
//           node["amenity"="social_facility"]["name"](${bbox});
//           node["amenity"="blood_donation"]["name"](${bbox});
//         );
//         out geom;`;

//       const url = `https://overpass.kumi.systems/api/interpreter?data=${encodeURIComponent(query)}`;

//       try {
//         const response = await fetch(url);
//         if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
//         const data = await response.json();
//         setPlaces(data.elements || []);
//       } catch (error) {
//         console.error("Error fetching data:", error);
//       }
//     }, 1000); // Debounce 1 detik
//   }, []);

//   // Komponen event handler untuk menangani perubahan batas peta
//   const MapEventHandler = () => {
//     const map = useMapEvents({
//       moveend: () => {
//         fetchPlaces(map.getBounds());
//       },
//     });

//     // Fetch data pertama kali saat peta dimuat
//     useEffect(() => {
//       fetchPlaces(map.getBounds());
//     }, []);

//     return null;
//   };

//   return (
//     <MapContainer
//       center={position}
//       zoom={13}
//       style={{ height: "500px", width: "100%" }}
//       attributionControl={false}
//     >
//       <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//       <MapEventHandler />

//       {places.map((place, index) => {
//         const amenity = place.tags?.amenity || "unknown";
//         const name = place.tags?.name || "Unknown";
//         const icon = iconMapping[amenity] || iconMapping.hospital; // Default ke hospital jika tidak ditemukan

//         return (
//           <Marker key={index} position={[place.lat, place.lon]} icon={icon}>
//             <Popup>
//               <b>{name}</b>
//               <br />
//               {amenity}
//             </Popup>
//           </Marker>
//         );
//       })}
//     </MapContainer>
//   );
// };

// export default SmallMapComponent;





// UDAH BENERRRRR


// "use client";

// import { useEffect, useState, useRef, useCallback } from "react";
// import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
// import L from "leaflet";
// import "leaflet/dist/leaflet.css";

// // Fix default icon Leaflet
// import markerIcon from "leaflet/dist/images/marker-icon.png";
// import markerShadow from "leaflet/dist/images/marker-shadow.png";

// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconUrl: markerIcon.src,
//   shadowUrl: markerShadow.src,
// });

// // Posisi default (Surabaya)
// const position = [-7.250445, 112.768845];

// // Fungsi untuk membuat custom icon
// const createCustomIcon = (iconUrl) =>
//   new L.Icon({
//     iconUrl,
//     iconSize: [30, 30],
//     iconAnchor: [15, 30],
//     popupAnchor: [0, -30],
//   });

// // Pemetaan amenity ke ikon khusus
// const iconMapping = {
//   hospital: createCustomIcon("/hospital-icon.png"),
//   clinic: createCustomIcon("/clinic-icon.png"),
//   pharmacy: createCustomIcon("/pharmacy-icon.png"),
//   doctors: createCustomIcon("/hospital-icon.png"),
//   dentist: createCustomIcon("/hospital-icon.png"),
//   veterinary: createCustomIcon("/hospital-icon.png"),
//   nursing_home: createCustomIcon("/hospital-icon.png"),
//   social_facility: createCustomIcon("/hospital-icon.png"),
//   blood_donation: createCustomIcon("/hospital-icon.png"),
// };

// const SmallMapComponent = () => {
//   const [places, setPlaces] = useState([]);
//   const lastBoundsRef = useRef(null);
//   const fetchTimeout = useRef(null);

//   // Fungsi untuk mengambil data dari Overpass API berdasarkan bounding box peta
//   const fetchPlaces = useCallback(async (bounds) => {
//     const { _southWest, _northEast } = bounds;
//     const bbox = `${_southWest.lat},${_southWest.lng},${_northEast.lat},${_northEast.lng}`;

//     if (lastBoundsRef.current === bbox) return;
//     lastBoundsRef.current = bbox;

//     // Debounce request agar tidak terlalu sering memanggil API
//     if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
//     fetchTimeout.current = setTimeout(async () => {
//       const query = `
//         [out:json][timeout:25];
//         (
//           node["amenity"="hospital"]["name"](${bbox});
//           way["amenity"="hospital"]["name"](${bbox});
//           relation["amenity"="hospital"]["name"](${bbox});
          
//           node["amenity"="clinic"]["name"](${bbox});
//           node["amenity"="pharmacy"]["name"](${bbox});
//           node["amenity"="doctors"]["name"](${bbox});
//           node["amenity"="dentist"]["name"](${bbox});
//           node["amenity"="veterinary"]["name"](${bbox});
//           node["amenity"="nursing_home"]["name"](${bbox});
//           node["amenity"="social_facility"]["name"](${bbox});
//           node["amenity"="blood_donation"]["name"](${bbox});
//         );
//         out geom;`;

//       const url = `https://overpass.kumi.systems/api/interpreter?data=${encodeURIComponent(query)}`;

//       try {
//         const response = await fetch(url);
//         if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
//         const data = await response.json();

//         // Memproses data dari Overpass API
//         const formattedPlaces = data.elements
//           .map((place) => {
//             if (place.type === "node") {
//               return { lat: place.lat, lon: place.lon, tags: place.tags };
//             } else if (place.geometry) {
//               // Hitung titik tengah dari semua koordinat (untuk way & relation)
//               const avgLat =
//                 place.geometry.reduce((sum, p) => sum + p.lat, 0) / place.geometry.length;
//               const avgLon =
//                 place.geometry.reduce((sum, p) => sum + p.lon, 0) / place.geometry.length;
//               return { lat: avgLat, lon: avgLon, tags: place.tags };
//             }
//             return null;
//           })
//           .filter(Boolean);

//         setPlaces(formattedPlaces);
//       } catch (error) {
//         console.error("Error fetching data:", error);
//       }
//     }, 1000); // Debounce 1 detik
//   }, []);

//   // Komponen event handler untuk menangani perubahan batas peta
//   const MapEventHandler = () => {
//     const map = useMapEvents({
//       moveend: () => {
//         fetchPlaces(map.getBounds());
//       },
//     });

//     // Fetch data pertama kali saat peta dimuat
//     useEffect(() => {
//       fetchPlaces(map.getBounds());
//     }, []);

//     return null;
//   };

//   return (
//     <MapContainer
//       center={position}
//       zoom={13}
//       style={{ height: "50rem", width: "100%" }}
//       attributionControl={false}
//       zoomControl={false} 
//     >
//       <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//       <MapEventHandler />

//       {places.map((place, index) => {
//         const amenity = place.tags?.amenity || "unknown";
//         const name = place.tags?.name || "Unknown";
//         const icon = iconMapping[amenity] || iconMapping.hospital; // Default ke hospital jika tidak ditemukan

//         return (
//           <Marker key={index} position={[place.lat, place.lon]} icon={icon}>
//             <Popup>
//               <b>{name}</b>
//               <br />
//               {amenity}
//             </Popup>
//           </Marker>
//         );
//       })}
//     </MapContainer>
//   );
// };

// export default SmallMapComponent;










"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default icon Leaflet
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

// Posisi default (Surabaya)
const position = [-7.250445, 112.768845];

// Fungsi untuk membuat custom icon
const createCustomIcon = (iconUrl) =>
  new L.Icon({
    iconUrl,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });

// Pemetaan amenity ke ikon khusus
const iconMapping = {
  hospital: createCustomIcon("/assets/hospital-icon.png"),
  clinic: createCustomIcon("/assets/clinic-icon.png"),
  pharmacy: createCustomIcon("/assets/pharmacy-icon.png"),
  doctors: createCustomIcon("/assets/doctors-icon.png"),
  dentist: createCustomIcon("/assets/dentist-icon.png"),
  veterinary: createCustomIcon("/assets/veterinary-icon.png"),
  nursing_home: createCustomIcon("/assets/nursing-home-icon.png"),
  social_facility: createCustomIcon("/assets/social-facility-icon.png"),
  blood_donation: createCustomIcon("/assets/blood-donation-icon.png"),
};

// Komponen utama
const SmallMapComponent = () => {
  const [places, setPlaces] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("");
  const lastBoundsRef = useRef(null);
  const fetchTimeout = useRef(null);

  // Fungsi untuk mengambil data dari Overpass API
  const fetchPlaces = useCallback(async (bounds) => {
    const { _southWest, _northEast } = bounds;
    const bbox = `${_southWest.lat},${_southWest.lng},${_northEast.lat},${_northEast.lng}`;

    if (lastBoundsRef.current === bbox) return;
    lastBoundsRef.current = bbox;

    if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
    fetchTimeout.current = setTimeout(async () => {
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="hospital"]["name"](${bbox});
          way["amenity"="hospital"]["name"](${bbox});
          relation["amenity"="hospital"]["name"](${bbox});
          
          node["amenity"="clinic"]["name"](${bbox});
          node["amenity"="pharmacy"]["name"](${bbox});
          node["amenity"="doctors"]["name"](${bbox});
          node["amenity"="dentist"]["name"](${bbox});
          node["amenity"="veterinary"]["name"](${bbox});
          node["amenity"="nursing_home"]["name"](${bbox});
          node["amenity"="social_facility"]["name"](${bbox});
          node["amenity"="blood_donation"]["name"](${bbox});
        );
        out geom;`;

      const url = `https://overpass.kumi.systems/api/interpreter?data=${encodeURIComponent(query)}`;

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data = await response.json();

        // Memproses data dari Overpass API
        const formattedPlaces = data.elements
          .map((place) => {
            if (place.type === "node") {
              return { lat: place.lat, lon: place.lon, tags: place.tags };
            } else if (place.geometry) {
              const avgLat =
                place.geometry.reduce((sum, p) => sum + p.lat, 0) / place.geometry.length;
              const avgLon =
                place.geometry.reduce((sum, p) => sum + p.lon, 0) / place.geometry.length;
              return { lat: avgLat, lon: avgLon, tags: place.tags };
            }
            return null;
          })
          .filter(Boolean);

        setPlaces(formattedPlaces);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }, 1000); // Debounce 1 detik
  }, []);

  // Komponen event handler untuk menangani perubahan batas peta
  const MapEventHandler = () => {
    const map = useMapEvents({
      moveend: () => {
        fetchPlaces(map.getBounds());
      },
    });

    useEffect(() => {
      fetchPlaces(map.getBounds());
    }, []);

    return null;
  };

  // Filter tempat berdasarkan search input dan kategori
  const filteredPlaces = places.filter((place) => {
    const name = place.tags.name?.toLowerCase() || "";
    const amenity = place.tags.amenity?.toLowerCase() || "";
    return (
      (searchQuery === "" || name.includes(searchQuery.toLowerCase())) &&
      (category === "" || amenity === category)
    );
  });

  return (
    <div className="relative w-full flex justify-center">
      <MapContainer
        center={position}
        zoom={13}
        style={{width: "100%", position: "relative", zIndex: 1 }}
        attributionControl={false}
        zoomControl= {false}   
        dragging= {false}     
        doubleClickZoom= {false}
        scrollWheelZoom= {false}
        touchZoom= {false}    
        boxZoom= {false}    
        keyboard= {false}
        minZoom={13}
        className="h-[30rem]"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <MapEventHandler />

        {filteredPlaces.map((place, index) => {
          const amenity = place.tags?.amenity || "unknown";
          const name = place.tags?.name || "Unknown";
          const icon = iconMapping[amenity] || iconMapping.hospital; 

          return (
            <Marker key={index} position={[place.lat, place.lon]} icon={icon}>
              <Popup>
                <b>{name}</b>
                <br />
                {amenity}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default SmallMapComponent;
