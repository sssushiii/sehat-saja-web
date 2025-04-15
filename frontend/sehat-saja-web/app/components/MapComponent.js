"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
});

const position = [-7.250445, 112.768845];

const createCustomIcon = (iconUrl) =>
  new L.Icon({
    iconUrl,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });

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

const MapComponent = () => {
  const [places, setPlaces] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("");
  const lastBoundsRef = useRef(null);
  const fetchTimeout = useRef(null);

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
    }, 1000);
  }, []);

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
      <div
        className="absolute top-20 z-50 w-1/2 bg-white p-7 rounded-md border border-gray-300 
                  shadow-[0px_0px_10px_rgba(0,0,0,0.15)] mb-10"
      >
        <h1 className="text-center text-2xl font-semibold mb-5 text-blue-500">
          Find The Nearest Healthcare Service
        </h1>

        <div className="flex flex-row gap-2">
          <input
            type="text"
            placeholder="Find a Place"
            className="w-full h-[3.5rem] px-5 py-4 border border-gray-300 rounded-md bg-blue-50 
                      outline-none hover:border-blue-500"
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="w-full h-[3.5rem] px-5 py-4 border border-gray-300 bg-blue-50 rounded-md outline-none"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Category</option>
            <option value="hospital">Hospital</option>
            <option value="clinic">Clinic</option>
            <option value="pharmacy">Pharmacy</option>
            <option value="doctors">Doctor</option>
            <option value="dentist">Dentist</option>
            <option value="veterinary">Veterinary</option>
            <option value="social_facility">Social Facility</option>
            <option value="blood_donation">Blood Donation</option>
            <option value="nursing_home">Nursing Home</option>
          </select>
        </div>
      </div>

      <MapContainer
        center={position}
        zoom={13}
        style={{width: "100%", position: "relative", zIndex: 1 }}
        attributionControl={false}
        zoomControl={false}
        minZoom={13}
        className="h-screen"
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

export default MapComponent;
