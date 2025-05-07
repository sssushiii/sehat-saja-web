"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const db = getFirestore();

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Ambil data dari Firestore berdasarkan uid
        const userDocRef = doc(db, "users", currentUser.uid);
        const docSnapshot = await getDoc(userDocRef);

        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          setUser({
            email: currentUser.email,
            displayName: currentUser.displayName,
            fullName: userData.fullName || "", // Ambil fullName dari Firestore
            photoURL: currentUser.photoURL || "",
          });
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Appointment", href: "/appointment" },
    { name: "Article", href: "/article" },
    { name: "Maps", href: "/maps" },
  ];

  return (
    <div
      className={`fixed top-0 left-0 w-full px-15 flex items-center justify-between h-16 z-50 transition-all duration-200 
      ${scrolled ? "bg-white shadow-sm" : "bg-transparent"}`}
    >
      <Link href="/">
        <img
          src={scrolled ? "/assets/logo-sehatsaja-blue.png" : "/assets/logo-sehatsaja-white.png"}
          className="h-10"
          alt="Logo"
        />
      </Link>

      <div className="bar flex flex-row justify-evenly w-1/2 h-full">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="h-full flex flex-col items-center justify-center w-3/4 group"
          >
            <h1
              className={`group-hover:font-semibold duration-200 transition-all
              ${pathname === item.href ? "font-bold" : ""} 
              ${pathname === item.href ? (scrolled ? "text-blue-500" : "text-white") : scrolled ? "text-blue-500" : "text-white"}`}
            >
              {item.name}
            </h1>
          </Link>
        ))}
      </div>

      {/* Bagian Login / Profil */}
      <div className="logreg flex flex-row h-full items-center justify-end gap-2 font-medium">
        {user ? (
          <div className="flex items-center gap-3">
            <img
              src={user.photoURL || "/assets/default-profile.jpg"}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover border border-gray-300"
            />
            <div className="text-sm text-right hidden md:block">
              <p className={`${scrolled ? "text-black" : "text-white"} font-semibold`}>
                {user.displayName || user.fullName || "User"}
              </p>
              <p className={`${scrolled ? "text-gray-600" : "text-gray-200"} text-xs`}>
                {user.email}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className={`px-4 py-2 rounded-md text-xs font-medium ${
                scrolled
                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                  : "bg-white/30 text-white hover:bg-white/50"
              }`}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <>
            <Link
              href="/sign-in"
              className={`px-4 py-2 transition-all h-[70%] flex items-center justify-center w-28 border-[1px] rounded-md
              ${scrolled ? "border-blue-500 hover:border-transparent text-blue-500 hover:bg-blue-500/50 hover:text-white" : "border-white text-white hover:border-transparent hover:bg-white/30"} duration-200`}
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className={`px-4 py-2 transition-all h-[70%] flex items-center justify-center w-28 border-[1px] rounded-md
              ${scrolled ? "bg-blue-500 border-blue-500 text-white hover:bg-blue-600" : "bg-white text-blue-500 border-white hover:bg-blue-500 hover:border-transparent hover:text-white"} duration-200`}
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
