"use client";

import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const SmallMapComponent = dynamic(() => import("@/components/SmallMapComponent"), {
    ssr: false,
});

export default function SmallClientWrapper() {
    return <SmallMapComponent />;
}
