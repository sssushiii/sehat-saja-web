import Link from "next/link";
import Image from "next/image";
import ClientWrapper from "@/components/ClientWrapper";
import Footer from "@/components/footer/page";
import Navbar from "@/components/navbar";
import NavbarWhite from "@/components/navbar-white";

export default function Home() {
  return (
    <>
    <NavbarWhite />
    <div className="map bg-white text-black p-0 flex justify-center items-center w-full h-full">
      <ClientWrapper />
    </div>
    </>
  );
}
