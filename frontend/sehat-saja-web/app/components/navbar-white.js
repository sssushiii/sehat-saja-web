"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const db = getFirestore();

export default function NavbarWhite() {
  const [user, setUser] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const docSnapshot = await getDoc(userDocRef);

        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          setUser({
            ...currentUser,
            name: userData.name || "",
            email: userData.email || "",
            photoUrl: userData.photoUrl || currentUser.photoURL || ""
          });
        } else {
          setUser({
            ...currentUser,
            name: currentUser.name || "",
            email: currentUser.email || "",
            photoUrl: currentUser.photoURL || ""
          });
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
    <div className="fixed top-0 left-0 w-full px-15 flex items-center justify-between h-16 z-50 transition-all duration-200 bg-white shadow-sm">
      <Link href="/">
        <img
          src="/assets/logo-sehatsaja-blue.png"
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
              ${
                pathname === item.href
                  ? "font-bold text-blue-500"
                  : "text-blue-500"
              }`}
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
            <Link href="../../dashboard/patient">
              <img
                src={user.photoUrl || "/assets/default-profile.jpg"}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border border-gray-300"
                onError={(e) => {
                  e.target.src = "/assets/default-profile.jpg";
                }}
              />
            </Link>
            <div className="text-sm text-right hidden md:block">
              <p className="text-black font-semibold">
                {user.name || user.displayName || "User"}
              </p>
              <p className="text-gray-600 text-xs">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 rounded-md text-xs font-medium bg-red-100 text-red-600 hover:bg-red-200"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <>
            <Link
              href="/sign-in"
              className="px-4 py-2 transition-all h-[70%] flex items-center justify-center w-28 border-[1px] rounded-md
              border-blue-500 hover:border-transparent text-blue-500 hover:bg-blue-500/50 hover:text-white duration-200"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 transition-all h-[70%] flex items-center justify-center w-28 border-[1px] rounded-md
              bg-blue-500 border-blue-500 text-white hover:bg-blue-600 duration-200"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </div>
  );
}