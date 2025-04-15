"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname(); // Menentukan halaman aktif

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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
      {/* Logo */}
      <Link href="/">
        <img
          src={scrolled ? "/assets/logo-sehatsaja-blue.png" : "/assets/logo-sehatsaja-white.png"}
          className="h-10"
          alt="Logo"
        />
      </Link>

      {/* Navbar Items */}
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

      {/* Login & Register Buttons */}
      <div className="logreg flex flex-row h-full w-65 items-center justify-end gap-2 font-medium">
        <Link
          href="/tes"
          className={`px-4 py-2 transition-all h-[70%] flex items-center justify-center w-28 border-[1px] rounded-md
          ${scrolled ? "border-blue-500 hover:border-transparent text-blue-500 hover:bg-blue-500/50 hover:text-white" : "border-white text-white hover:border-transparent hover:bg-white/30"} duration-[1px]00`}
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
      </div>
    </div>
  );
}







// "use client";

// import { useState, useEffect } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";

// export default function Navbar() {
//   const [scrolled, setScrolled] = useState(false);
//   const pathname = usePathname(); // Cek halaman yang sedang aktif

//   useEffect(() => {
//     const handleScroll = () => {
//       setScrolled(window.scrollY > 50);
//     };

//     window.addEventListener("scroll", handleScroll);
//     return () => {
//       window.removeEventListener("scroll", handleScroll);
//     };
//   }, []);

//   const navItems = [
//     { name: "Home", href: "/" },
//     { name: "Appointment", href: "/appointment" },
//     { name: "News", href: "/news" },
//     { name: "Maps", href: "/maps" },
//   ];

//   return (
//     <div
//       className={`fixed top-0 left-0 w-full px-15 flex items-center justify-between h-16 z-50 transition-all duration-200 ${
//         scrolled ? "bg-white shadow-sm" : "bg-transparent"
//       }`}
//     >
//       <Link href="/">
//         <img
//           src={scrolled ? "/assets/logo-sehatsaja-blue.png" : "/assets/logo-sehatsaja-white.png"}
//           className="h-10"
//           alt="Logo"
//         />
//       </Link>
//       <div className="bar flex flex-row justify-evenly w-1/2 h-full">
//         <Link href="/" className="h-full flex flex-col items-center justify-center w-3/4 group">
//           <h1 className={`group-hover:font-semibold duration-200 transition-all ${
//             scrolled ? "text-blue-500" : "text-white"
//           }`}>Home</h1>
//         </Link>
//         <Link href="/appointment" className="h-full flex flex-col items-center justify-center w-3/4 group">
//           <h1 className={`group-hover:font-semibold duration-200 transition-all ${
//             scrolled ? "text-blue-500" : "text-white"
//           }`}>Appointment</h1>
//         </Link>
//         <Link href="/news" className="h-full flex flex-col items-center justify-center w-3/4 group">
//           <h1 className={`group-hover:font-semibold duration-200 transition-all ${
//             scrolled ? "text-blue-500" : "text-white"
//           }`}>News</h1>
//         </Link>
//         <Link href="/maps" className="h-full flex flex-col items-center justify-center w-3/4 group">
//           <h1 className={`group-hover:font-semibold duration-200 transition-all ${
//             scrolled ? "text-blue-500" : "text-white"
//           }`}>Maps</h1>
//         </Link>
//       </div>
//       <div className="logreg flex flex-row h-full w-65 items-center justify-end gap-2 font-medium">
//         <Link
//           href="/sign-in"
//           className={`px-4 py-2 transition-all signin-head h-[70%] flex items-center justify-center w-28 border-solid border-2 rounded-md bg-black/0 hover:bg-black/5 ease-in-out duration-200${
//             scrolled ? "border-blue-500 text-blue-500" : "border-white text-white"
//           }`}
//         >
//           Sign In
//         </Link>
//         <Link
//           href="/sign-in"
//           className={`px-4 py-2 transition-all signin-head h-[70%] bg-blue-500 flex items-center justify-center w-28 border-solid border-2 rounded-md bg-black/0 hover:bg-black/5 ease-in-out duration-200${
//             scrolled ? "bg-blue-500 border-blue-500 text-white" : " bg-white text-blue-500 border-white"
//           }`}
//         >
//           Sign Up
//         </Link>
//       </div>
//     </div>
//   );
// }
