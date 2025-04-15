import ClientWrapper from "@/components/ClientWrapper";
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
