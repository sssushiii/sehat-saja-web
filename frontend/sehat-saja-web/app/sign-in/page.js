import { EnvelopeSimple, LockSimple } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default function SignIn() {
    return(
        <>
        <div className="all w-full bg-[url('/assets/bg-all-sign.jpg')] bg-cover h-screen flex text-black">
        <div className="w-full h-full backdrop-blur-sm flex items-center justify-end">
            <div className="first-left w-full h-full bg-transparent flex items-center justify-end">
                    <div className="second-left w-[75%] h-[85%] bg-white rounded-l-2xl justify-center px-[10%] py-[8%] tracking-wide">
                        <div className="signinform flex flex-col h-full">
                            <div className="logo w-full flex justify-center mb-6">
                                <img src="/assets/logo-sehatsaja-black.png" className="w-[40%]  " alt="" />
                            </div>
                            <div className="signin-title mb-4">
                                <h1 className="font-semibold text-3xl">
                                    Sign In
                                </h1>
                                <h1 className="font-light">
                                    Welcome back to SehatSaja
                                </h1>
                            </div>
                            <form action="/" className="flex flex-col justify-between h-full">
                                <div className="email w-full bg-gray-100 h-16 rounded-md flex justify-evenly items-center text-gray-500">
                                    <EnvelopeSimple size={26} color="#858585" weight="bold" />
                                    <input type="email" name="" id="" className="h-full w-[80%] outline-none font-semibold text-sm" placeholder="Email Address" required />
                                </div>
                                <div className="pswd-parent">
                                    <div className="password mb-2 w-full bg-gray-100 h-16 rounded-md flex justify-evenly items-center text-gray-500">
                                        <LockSimple size={26} color="#858585" weight="bold" />
                                        <input type="password" name="" id="" className="h-full w-[80%] outline-none font-semibold text-sm" placeholder="Password" required />
                                    </div>
                                    <div className="forgot flex justify-end">
                                        <Link href="#" className="font-medium text-xs">
                                            Forgot Password?
                                        </Link>
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 transition-all ease-in-out duration-200 text-white font-semibold h-16 rounded-md flex justify-evenly items-center">
                                    Sign In
                                </button>
                                <div className="or flex items-center">
                                    <div className="kosong w-full h-0 border-[1.5px] border-black rounded-full"></div>
                                    <h1 className="w-full flex justify-center font-medium text-xs">Or Sign In With</h1>
                                    <div className="kosong w-full h-0 border-[1.5px] border-black rounded-full"></div>
                                </div>
                                <div className="logos-signin flex flex-row justify-center items-center gap-10">
                                    <img src="/assets/icon_facebook.png" className="w-12 h-auto" alt="" />
                                    <img src="/assets/icon_google.png" className="w-14 h-auto" alt="" />
                                </div>
                                <div className="dont-have w-full flex flex-row font-medium text-xs justify-center">
                                    <h1 className="mr-1">Don't have account?</h1>
                                    <Link href="/sign-up" className="font-semibold text-blue-500">
                                    Sign Up
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            <div className="first-right bg-transparent w-full h-full flex items-center">
                <div className="second-left w-[75%] h-[85%] bg-blue-500 rounded-r-2xl relative">
                        <img className="absolute bottom-0 " src="/assets/doctor-sign.png" alt="" />
                </div>
            </div>
        </div>
        </div>
        </>
    );
}