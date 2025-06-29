"use client";

import { useState } from "react";
import { useEffect } from "react";
import ClientWrapper from "@/components/ClientWrapper";
import NavbarWhite from "@/components/navbar-white";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  onAuthStateChanged,
} from "firebase/auth";

export default function Home() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Cek role dan redirect jika bukan "user"
            if (userData.role === "admin") {
              router.push("/dashboard/admin");
              return;
            } else if (userData.role === "doctor") {
              router.push("/dashboard/doctor");
              return;
            } else if (userData.role !== "user") {
              // Role tidak dikenal, redirect ke home
              router.push("/");
              return;
            }
            
            // Jika role adalah "user", biarkan akses halaman
            // Set user state jika diperlukan
            setUser(currentUser);
            setLoading(false);
          } else {
            // User document tidak ada, redirect ke home
            router.push("/");
          }
        } catch (error) {
          console.error("Error checking user role:", error);
          router.push("/sign-in");
        }
      } else {
        // User tidak login, redirect ke sign-in
        router.push("/sign-in");
      }
    });
  
    return () => unsubscribe();
  }, [router]);
  return (
    <>
    <NavbarWhite />
    <div className="map bg-white text-black p-0 flex justify-center items-center w-full h-full">
      <ClientWrapper />
    </div>
    </>
  );
}
