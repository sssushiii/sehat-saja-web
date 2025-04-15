import Link from "next/link";
import Image from "next/image";
import Footer from "./components/footer/page";
import Navbar from "@/components/navbar";
import TopNews from "./components/TopArticle";
import SmallClientWrapper from "./components/SmallClientWrapper";

export default function Home() {
  return (
    <>
    <div className="top bg-[url('/assets/bg-all-sign.jpg')] bg-cover relative">
      <div className="w-full h-[35rem] px-[18rem] bg-blue-600/40 backdrop-blur-md text-white relative">
        <div className="isi h-full flex flex-col justify-center absolute z-20">
          <div className="title-head text-7xl font-semibold">
            <h1 className="">Your Path<br></br>to Better<br></br>Health</h1>
          </div>
          <div className="title-desc font-light text-xl">
            <h1>Chat with doctors, find nearby healthcare services, and<br></br>explore various health articles—all in SehatSaja!</h1>
          </div>
        </div>
        <img src="/assets/doctor-sign.png" className="absolute bottom-0 right-50 h-3/4 z-10" alt="Home"/>
      </div>
      <Navbar/>
    </div>
    
    <div className="services bg-blue-50 py-32 px-[18rem] flex justify-center items-center text-black">
      <div className="child-services p-0 w-full">
        <div className="services-top flex flex-row w-full justify-between items-center mb-10">
          <div className="services-top-left">
            <h1 className="text-3xl font-semibold mb-1">
              Our Services
            </h1>
            <h1 className="font-light">
              The features that make it easy for you to stay healthy.
            </h1>
          </div>
          <Link href="#" className="services-top-right h-full bg-blue-500 hover:bg-blue-600 transition-all ease-in-out duration-200 text-white px-8 py-2 rounded-md hidden">
            <h1>View Details</h1>
          </Link>
        </div>
        <div className="services-tab w-full flex justify-center h-full">
          <div className="services-tab-child w-[85%] h-auto flex flex-row justify-between gap-4">
            <Link href="/appointment" className="health-consult bg-white border-transparent hover:border-blue-500 border-[0.1rem] w-full h-full px-7 py-8 rounded-md shadow-[0px_0px_10px_rgba(0,0,0,0.2)] transition-all ease-in-out duration-200">
              <div className="circle1 bg-blue-50 w-fit p-3 flex justify-center items-center shadow-[0px_0px_10px_rgba(0,0,0,0.15)] rounded-full mb-5">
                <img src="/assets/icon-stetoscope-blue.png" className="w-8" alt=""/>
              </div>
              <h1 className="text-[1.3rem] mb-2 font-semibold">Health Consultation</h1>
              <h1 className="font-light text-sm">Get expert health advice and start your consultation now!</h1>
            </Link>
            <Link href="/news" className="hospital-finder bg-white border-transparent hover:border-blue-500 border-[0.1rem] w-full h-full px-7 py-8 rounded-md shadow-[0px_0px_10px_rgba(0,0,0,0.2)] transition-all ease-in-out duration-200">
              <div className="circle1 bg-blue-50 w-fit p-3 flex justify-center items-center shadow-[0px_0px_10px_rgba(0,0,0,0.15)] rounded-full mb-5">
                <img src="/assets/icon-article.png" className="w-8" alt=""/>
              </div>
              <h1 className="text-[1.3rem] mb-2 font-semibold">Health Article</h1>
              <h1 className="font-light text-sm">Find out the newest trend of the medical update!</h1>
            </Link>
            <Link href="/maps" className="health-article bg-white border-transparent hover:border-blue-500 border-[0.1rem] w-full h-full px-7 py-8 rounded-md shadow-[0px_0px_10px_rgba(0,0,0,0.2)] transition-all ease-in-out duration-200">
              <div className="circle1 bg-blue-50 w-fit p-3 flex justify-center items-center shadow-[0px_0px_10px_rgba(0,0,0,0.15)] rounded-full mb-5">
                <img src="/assets/icon-map.png" className="w-8" alt=""/>
              </div>
              <h1 className="text-[1.3rem] mb-2 font-semibold">Hospital Finder</h1>
              <h1 className="font-light text-sm">Find out which hospital most suited your needs nearby!</h1>
            </Link>
          </div>
        </div>
      </div>
    </div>

    <div className="how bg-white text-black py-32 px-[18rem] flex justify-center items-center">
      <div className="how-child">
        <div className="how-child-top flex flex-col text-center mb-10">
          <h1 className="text-3xl font-semibold mb-1">
            How it Works
          </h1>
          <h1 className="font-light">
            Here is the step by step on how you can find your personal doctor!
          </h1>
        </div>
        <div className="how-child-bottom flex flex-col justify-between gap-10">
          <div className="how-line-1 flex flex-row gap-10 justify-between items-center">
            <div className="line-1-desc flex flex-col p-7 w-[50%] border-[0.1rem] border-blue-500 rounded-md">
              <h1 className="font-semibold">
                Find a Doctor
              </h1>
              <h1>
                Browse through our list of qualified doctors. Use filters like specialty, location, and availability to find the perfect match for your needs.
              </h1>
            </div>
            <div className="line-1-number bg-blue-50 w-14 aspect-square rounded-full justify-center items-center flex">
              <h1 className="font-semibold text-blue-500">
                1
              </h1>
            </div>
            <div className="line-1-icon aspect-square h-32 p-7 flex justify-center items-center rounded-full bg-gradient-to-br from-blue-100 to-blue-500 mr-36">
              <img src="/assets/icon-hospital.png" className="h-auto w-14" alt="" />
            </div>
          </div>

          <div className="how-line-2 flex flex-row gap-10 justify-between items-center">
            <div className="line-2-icon aspect-square h-32 p-7 flex justify-center items-center rounded-full bg-gradient-to-br from-blue-100 to-blue-500 ml-36">
              <img src="/assets/icon-check.png" className="h-auto w-14" alt="" />
            </div>
            <div className="line-2-number bg-blue-50 w-14 aspect-square rounded-full justify-center items-center flex">
              <h1 className="font-semibold text-blue-500">
                2
              </h1>
            </div>
            <div className="line-2-desc flex flex-col p-7 w-[50%] border-[0.1rem] border-blue-500 rounded-md">
              <h1 className="font-semibold">
                Book a Meeting
              </h1>
              <h1>
                Once you've chosen your doctor, select a convenient time slot and book your appointment directly on the website.
              </h1>
            </div>
          </div>

          <div className="how-line-3 flex flex-row gap-10 justify-between items-center">
            <div className="line-3-desc flex flex-col p-7 w-[50%] border-[0.1rem] border-blue-500 rounded-md">
              <h1 className="font-semibold">
                Have a Chat
              </h1>
              <h1>
                On your scheduled day, connect with your doctor through a chat. Discuss your health concerns in a comfortable, private setting.
              </h1>
            </div>
            <div className="line-3-number bg-blue-50 w-14 aspect-square rounded-full justify-center items-center flex">
              <h1 className="font-semibold text-blue-500">
                3
              </h1>
            </div>
            <div className="line-3-icon aspect-square h-32 p-7 flex justify-center items-center rounded-full bg-gradient-to-br from-blue-100 to-blue-500 mr-36">
              <img src="/assets/icon-chat.png" className="h-auto w-14" alt="" />
            </div>
          </div>

          <div className="how-line-4 flex flex-row gap-10 justify-between items-center">
            <div className="line-4-icon aspect-square h-32 p-7 flex justify-center items-center rounded-full bg-gradient-to-br from-blue-100 to-blue-500 ml-36">
              <img src="/assets/icon-stetoscope.png" className="h-auto w-14" alt="" />
            </div>
            <div className="line-4-number bg-blue-50 w-14 aspect-square rounded-full justify-center items-center flex">
              <h1 className="font-semibold text-blue-500">
                4
              </h1>
            </div>
            <div className="line-4-desc flex flex-col p-7 w-[50%] border-[0.1rem] border-blue-500 rounded-md">
              <h1 className="font-semibold">
                Get Treatment
              </h1>
              <h1>
                After your consultation, your doctor will provide personalized treatment advice, prescriptions, or referrals as needed. You’ll be on your way to better health!
              </h1>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="articles text-black bg-blue-50 py-32 px-[18rem] flex justify-center items-center">
      <div className="articles-child w-full h-full flex flex-col items-center">
        <div className="articles-top flex flex-row w-full justify-between items-center mb-10">
          <div className="articles-top-left">
            <h1 className="text-3xl font-semibold mb-1">
              Latest Article
            </h1>
            <h1 className="font-light">
              Find the latest health article here!
            </h1>
          </div>
          <Link href="/news" className="articles-top-right h-full bg-blue-500 hover:bg-blue-600 transition-all ease-in-out duration-200 text-white px-8 py-2 rounded-md">
            <h1>See All</h1>
          </Link>
        </div>
        <TopNews/>

      </div>
    </div>
    <div className="map bg-white text-black py-32 px-[18rem] flex justify-center items-center w-full">
      <div className="map-child w-full">
        <div className="map-top flex flex-row w-full justify-between items-center mb-10">
          <div className="map-top-left">
            <h1 className="text-3xl font-semibold mb-1">
              Find Nearest Hospital
            </h1>
            <h1 className="font-light">
              Find out which hospital most suited your needs nearby!
            </h1>
          </div>
          <Link href="#" className="map-top-right h-full bg-blue-500 hover:bg-blue-600 transition-all ease-in-out duration-200 text-white px-8 py-2 rounded-md">
            <h1>View Map</h1>
          </Link>
        </div>
        <div className="map-wrap rounded-md w-full h-[30rem] drop-shadow-2xl">
          <div className="w-full h-[30rem] border-transparent border-[0.1rem] hover:border-blue-500 rounded-md overflow-hidden shadow-[0px_0px_10px_rgba(0,0,0,0.2)] transition-all ease-in-out duration-200">
            <SmallClientWrapper />
          </div>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}
