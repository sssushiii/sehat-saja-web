"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const position = [-7.250445, 112.768845]; // Pusat Surabaya

// Custom icon untuk marker
const hospitalIcon = new L.Icon({
  iconUrl: "/hospital-icon.png", // Simpan di /public/
  iconSize: [30, 30],
});

const clinicIcon = new L.Icon({
  iconUrl: "/clinic-icon.png",
  iconSize: [30, 30],
});

const pharmacyIcon = new L.Icon({
  iconUrl: "/pharmacy-icon.png",
  iconSize: [30, 30],
});

const MapLeaflet = () => {
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const query = `
        [out:json];
        (
          node["amenity"="hospital"](-7.4,112.6,-7.2,112.9);
          node["amenity"="clinic"](-7.4,112.6,-7.2,112.9);
          node["amenity"="pharmacy"](-7.4,112.6,-7.2,112.9);
        );
        out;`;
      
      const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
      
      try {
        const response = await fetch(url);
        const data = await response.json();
        setPlaces(data.elements);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <MapContainer center={position} zoom={13} style={{ height: "500px", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {places.map((place, index) => (
        <Marker
          key={index}
          position={[place.lat, place.lon]}
          icon={
            place.tags.amenity === "hospital"
              ? hospitalIcon
              : place.tags.amenity === "clinic"
              ? clinicIcon
              : pharmacyIcon
          }
        >
          <Popup>
            <b>{place.tags.name || "Unknown"}</b>
            <br />
            {place.tags.amenity}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapLeaflet;
