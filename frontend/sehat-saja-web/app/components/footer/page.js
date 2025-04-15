import Link from "next/link";
import { FacebookLogo, LinkedinLogo, InstagramLogo, XLogo, ArrowRight } from "@phosphor-icons/react/dist/ssr";

export default function Footer() {
    return(
        <>
        <div className="mask py-20 px-[10rem] bg-[url('/assets/bg-footer.png')] bg-cover">
        <div className="footer flex flex-col gap-6">
        <div className="footer-top mb-5">
            <img src="/assets/logo-sehatsaja-white.png" className="h-15" alt=""/>
        </div>
        <div className="footer-bottom flex flex-row justify-between">
            <div className="footer-bottom-left w-[28%] flex flex-col">
            <h1 className="text-sm font-light mb-6 text-white">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Debitis quibusdam eaque sed totam quidem tempora illum modi voluptate fugit omnis.
            </h1>
            <h1 className="font-semibold text-xl mb-4">
                Contact Us
            </h1>
            <div className="foot-email items-center flex flex-row text-blue-200 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                <h1 className="text-sm ml-2 text-white font-light">
                sehatsaja@gmail.com
                </h1>
            </div>
            <div className="foot-phone items-center flex flex-row text-blue-200">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
                <h1 className="text-sm ml-2 text-white font-light">
                0899-9999-9999
                </h1>
            </div>
            </div>
            <div className="footer-bottom-center w-[28%] flex flex-col text-white">
            <div className="footer-nav">
                <h1 className="font-semibold text-xl mb-4">
                Navigation
                </h1>
                <h1 className="text-sm text-white font-light mb-3">
                About Us
                </h1>
                <h1 className="text-sm text-white font-light mb-3">
                FAQs
                </h1>
                <h1 className="text-sm text-white font-light mb-3">
                Fitur 3
                </h1>
                <h1 className="text-sm text-white font-light mb-3">
                Fitur 4
                </h1>
            </div>
            </div>
            <div className="footer-bottom-right w-[28%] flex flex-col text-white">
                <h1 className="font-semibold text-xl mb-4">
                Social Media
                </h1>
                <div className="social-logos flex flex-row mb-6">
                <div className="social-logo-child mr-2">
                    <FacebookLogo size={32} color="#ffffff" weight="bold" />
                </div>
                <div className="social-logo-child mr-2">
                    <LinkedinLogo size={32} color="#ffffff" weight="bold" />
                </div>
                <div className="social-logo-child mr-2">
                    <InstagramLogo size={32} color="#ffffff" weight="bold" />
                </div>
                <div className="social-logo-child mr-2">
                    <XLogo size={32} color="#ffffff" weight="bold" />
                </div>
                </div>
                <h1 className="font-semibold text-xl mb-4">
                Stay Connected
                </h1>
                <div className="input border-white border-solid border-2 rounded-md font-light flex items-center justify-between">
                <input type="text" className="py-[0.78rem] outline-none text-sm px-4" placeholder="Enter Email Address"/>
                <ArrowRight size={30} color="#ffffff" weight="bold" className="mr-2" />
                </div>
            </div>
        </div>
        <div className="footer-bottom w-full flex justify-end">
            <h1 className="text-sm text-white font-light">
            SehatSaja &copy; 2025, All Rights Reserved
            </h1>
        </div>
        </div>
        </div>
        </>
    )
}

