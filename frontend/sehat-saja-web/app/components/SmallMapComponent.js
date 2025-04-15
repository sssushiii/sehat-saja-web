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
