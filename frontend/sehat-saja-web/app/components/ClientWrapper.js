"use client";

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
    ssr: false,
});

export default function ClientWrapper() {
    return <MapComponent />;
}
