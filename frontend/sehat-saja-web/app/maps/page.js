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
    {/* <div className="w-full h-[18rem] px-[18rem] bg-blue-50 text-blue-500 relative mt-8">
      <div className="isi h-full flex flex-col w-[70rem] justify-center absolute z-20">
        <div className="title-head text-5xl font-semibold">
          <h1 className="">Find The Nearest Healthcare Service</h1>
        </div>
      </div>
    </div> */}
    <div className="map bg-white text-black p-0 flex justify-center items-center w-full h-full">
      <ClientWrapper />
    </div>
    {/* <Footer /> */}
    </>
  );
}
