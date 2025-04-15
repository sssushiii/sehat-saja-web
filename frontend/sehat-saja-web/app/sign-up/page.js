import { EnvelopeSimple, LockSimple, Phone, GenderFemale, GenderMale } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default function SignUp() {
    return(
        <>
        <div className="all w-full h-screen flex bg-[url('/assets/bg-all-sign.jpg')] bg-cover text-black">
        <div className="w-full h-full backdrop-blur-sm flex items-center justify-end">
            <div className="first-left w-full h-full bg-transparent flex items-center justify-end">
                    <div className="second-left w-[75%] h-[85%] bg-white rounded-l-2xl justify-center px-[10%] py-[6%] tracking-wide">
                        <div className="signinform flex flex-col h-full">
                            <div className="logo w-full flex justify-center mb-5">
                                <img src="/assets/logo-sehatsaja-black.png" className="w-[40%]  " alt="" />
                            </div>
                            <div className="signin-title mb-4">
                                <h1 className="font-semibold text-3xl">
                                    Sign Up
                                </h1>
                                <h1 className="font-light">
                                    Welcome to SehatSaja! create your account here
                                </h1>
                            </div>
                            <form action="/" className="flex flex-col justify-between h-full">
                                <div className="email w-full bg-gray-100 h-16 rounded-md flex justify-evenly items-center text-gray-500">
                                    <EnvelopeSimple size={26} color="#858585" weight="bold" />
                                    <input type="email" name="" id="" className="h-full w-[80%] outline-none font-semibold text-sm" placeholder="Email Address" required />
                                </div>
                                <div className="password w-full bg-gray-100 h-16 rounded-md flex justify-evenly items-center text-gray-500">
                                    <LockSimple size={26} color="#858585" weight="bold" />
                                    <input type="password" name="" id="" className="h-full w-[80%] outline-none font-semibold text-sm" placeholder="Password" required />
                                </div>
                                <div className="password-2 w-full bg-gray-100 h-16 rounded-md flex justify-evenly items-center text-gray-500">
                                    <LockSimple size={26} color="#858585" weight="bold" />
                                    <input type="password" name="" id="" className="h-full w-[80%] outline-none font-semibold text-sm" placeholder="Confirm Password" required />
                                </div>
                                <div className="phone-2 w-full bg-gray-100 h-16 rounded-md flex justify-evenly items-center text-gray-500">
                                    <Phone size={26} color="#858585" weight="bold" />
                                    <input type="phone" name="" id="" className="h-full w-[80%] outline-none font-semibold text-sm" placeholder="Phone" required />
                                </div>
                                <div className="gender flex flex-row gap-2">
                                    <div className="gender-male w-full hover:bg-gray-200 transition-all ease-in-out duration-200 bg-gray-100 h-16 rounded-md flex justify-evenly items-center">
                                        <GenderMale size={26} color="#3467fe" weight="bold" />
                                    </div>
                                    <div className="gender-male w-full hover:bg-gray-200 transition-all ease-in-out duration-200 bg-gray-100 h-16 rounded-md flex justify-evenly items-center">
                                        <GenderFemale size={26} color="#ff70e0" weight="bold" />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 transition-all ease-in-out duration-200 text-white font-semibold h-16 rounded-md flex justify-evenly items-center">
                                    Sign Up
                                </button>
                                <div className="dont-have w-full flex flex-row font-medium text-xs justify-center">
                                    <h1 className="mr-1">Already have account?</h1>
                                    <Link href="/sign-in" className="font-semibold text-blue-500">
                                    Sign In
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            <div className="first-right w-full h-full bg-transparent flex items-center">
                <div className="second-left w-[75%] h-[85%] bg-blue-500 rounded-r-2xl relative">
                        <img className="absolute bottom-0 " src="/assets/doctor-sign.png" alt="" />
                </div>
            </div>
        </div>
        </div>
        </>
    );
}