'use client';

import { useState } from 'react';
import { EnvelopeSimple, LockSimple } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { auth } from "../../lib/firebase";
import { db } from "../../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function SignIn() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSignIn = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Ambil data role dari Firestore
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const userData = docSnap.data();
                if (userData.role === 'user' || 'admin') {
                    router.push('/');
                } else {
                    setError('Access denied: You do not have permission to log in as a user.');
                }
            } else {
                setError('User role data not found.');
            }

        } catch (err) {
            console.error(err);
            setError('Invalid credentials. Please try again.');
        }
    };

    return (
        <>
            <div className="all w-full bg-[url('/assets/bg-all-sign.jpg')] bg-cover h-screen flex text-black relative">
                {/* <div className="w-auto fixed right-10 bottom-10 z-10 flex flex-col gap-3">
                    <a href="/dashboard/admin" className="bg-white p-4 rounded-md hover:bg-blue-100 transition-all duration-100">Login as Admin</a>
                    <a href="/dashboard/doctor" className="bg-white p-4 rounded-md hover:bg-blue-100 transition-all duration-100">Login as Doctor</a>
                    <a href="/dashboard/patient" className="bg-white p-4 rounded-md hover:bg-blue-100 transition-all duration-100">Login as Patient</a>
                </div> */}
                <div className="w-full h-full backdrop-blur-sm flex items-center justify-end">
                    <div className="first-left w-full h-full flex items-center justify-end">
                        <div className="second-left w-[75%] h-[85%] bg-white rounded-l-2xl px-[10%] py-[8%] tracking-wide">
                            <div className="signinform flex flex-col h-full">
                                <div className="logo w-full flex justify-center mb-6">
                                    <img src="/assets/logo-sehatsaja-black.png" className="w-[40%]" alt="Logo SehatSaja" />
                                </div>
                                <div className="signin-title mb-4">
                                    <h1 className="font-semibold text-3xl">Sign In</h1>
                                    <p className="font-light">Welcome back to SehatSaja</p>
                                </div>

                                {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

                                <form onSubmit={handleSignIn} className="flex flex-col justify-between h-full gap-3">
                                    <div className="email w-full bg-gray-100 h-16 rounded-md flex items-center text-gray-500 px-4">
                                        <EnvelopeSimple size={26} color="#858585" weight="bold" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="h-full w-full outline-none font-semibold text-sm ml-4 bg-transparent"
                                            placeholder="Email Address"
                                            required
                                        />
                                    </div>

                                    <div className="pswd-parent">
                                        <div className="password mb-2 w-full bg-gray-100 h-16 rounded-md flex items-center text-gray-500 px-4">
                                            <LockSimple size={26} color="#858585" weight="bold" />
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="h-full w-full outline-none font-semibold text-sm ml-4 bg-transparent"
                                                placeholder="Password"
                                                required
                                            />
                                        </div>
                                        <div className="forgot flex justify-end">
                                            <Link href="#" className="font-medium text-xs text-blue-500 hover:underline">
                                                Forgot Password?
                                            </Link>
                                        </div>
                                    </div>

                                    <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 transition-all ease-in-out duration-200 text-white font-semibold h-16 rounded-md flex justify-center items-center">
                                        Sign In
                                    </button>

                                    <div className="or flex items-center gap-2 my-2">
                                        <div className="flex-1 border border-black"></div>
                                        <span className="text-xs font-medium">Or Sign In With</span>
                                        <div className="flex-1 border border-black"></div>
                                    </div>

                                    <div className="logos-signin flex justify-center items-center gap-10">
                                        <img src="/assets/icon_facebook.png" className="w-12 h-auto" alt="Facebook Login" />
                                        <img src="/assets/icon_google.png" className="w-14 h-auto" alt="Google Login" />
                                    </div>

                                    <div className="dont-have flex justify-center text-xs font-medium">
                                        <span className="mr-1">Don’t have an account?</span>
                                        <Link href="/sign-up" className="font-semibold text-blue-500 hover:text-blue-700">
                                            Sign Up
                                        </Link>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    <div className="first-right w-full h-full flex items-center">
                        <div className="second-left w-[75%] h-[85%] bg-blue-500 rounded-r-2xl relative">
                            <img className="absolute bottom-0" src="/assets/doctor-sign.png" alt="Doctor Illustration" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}




// 'use client';

// import { useState } from 'react';
// import { EnvelopeSimple, LockSimple } from "@phosphor-icons/react/dist/ssr";
// import Link from "next/link";
// import { auth } from "../../lib/firebase";
// import { signInWithEmailAndPassword } from "firebase/auth";
// import { useRouter } from "next/navigation";

// export default function SignIn() {
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState('');
//     const router = useRouter();

//     const handleSignIn = async (e) => {
//         e.preventDefault();
//         setError('');
//         try { 
//             await signInWithEmailAndPassword(auth, email, password);
//             router.push('/');
//         } catch (err) {
//             setError('Invalid credentials. Please try again.');
//         }
//     };

//     return (
//         <>
//             <div className="all w-full bg-[url('/assets/bg-all-sign.jpg')] bg-cover h-screen flex text-black relative">
//                 <div className="w-auto fixed right-10 bottom-10 z-10 flex flex-col gap-3">
//                     <a href="/dashboard/admin" className="bg-white p-4 rounded-md hover:bg-blue-100 transition-all duration-100">Login as Admin</a>
//                     <a href="/dashboard/doctor" className="bg-white p-4 rounded-md hover:bg-blue-100 transition-all duration-100">Login as Doctor</a>
//                     <a href="/dashboard/patient" className="bg-white p-4 rounded-md hover:bg-blue-100 transition-all duration-100">Login as Patient</a>
//                 </div>
//                 <div className="w-full h-full backdrop-blur-sm flex items-center justify-end">
//                     <div className="first-left w-full h-full flex items-center justify-end">
//                         <div className="second-left w-[75%] h-[85%] bg-white rounded-l-2xl px-[10%] py-[8%] tracking-wide">
//                             <div className="signinform flex flex-col h-full">
//                                 <div className="logo w-full flex justify-center mb-6">
//                                     <img src="/assets/logo-sehatsaja-black.png" className="w-[40%]" alt="Logo SehatSaja" />
//                                 </div>
//                                 <div className="signin-title mb-4">
//                                     <h1 className="font-semibold text-3xl">Sign In</h1>
//                                     <p className="font-light">Welcome back to SehatSaja</p>
//                                 </div>

//                                 {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

//                                 <form onSubmit={handleSignIn} className="flex flex-col justify-between h-full gap-3">
//                                     <div className="email w-full bg-gray-100 h-16 rounded-md flex items-center text-gray-500 px-4">
//                                         <EnvelopeSimple size={26} color="#858585" weight="bold" />
//                                         <input
//                                             type="email"
//                                             value={email}
//                                             onChange={(e) => setEmail(e.target.value)}
//                                             className="h-full w-full outline-none font-semibold text-sm ml-4 bg-transparent"
//                                             placeholder="Email Address"
//                                             required
//                                         />
//                                     </div>

//                                     <div className="pswd-parent">
//                                         <div className="password mb-2 w-full bg-gray-100 h-16 rounded-md flex items-center text-gray-500 px-4">
//                                             <LockSimple size={26} color="#858585" weight="bold" />
//                                             <input
//                                                 type="password"
//                                                 value={password}
//                                                 onChange={(e) => setPassword(e.target.value)}
//                                                 className="h-full w-full outline-none font-semibold text-sm ml-4 bg-transparent"
//                                                 placeholder="Password"
//                                                 required
//                                             />
//                                         </div>
//                                         <div className="forgot flex justify-end">
//                                             <Link href="#" className="font-medium text-xs text-blue-500 hover:underline">
//                                                 Forgot Password?
//                                             </Link>
//                                         </div>
//                                     </div>

//                                     <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 transition-all ease-in-out duration-200 text-white font-semibold h-16 rounded-md flex justify-center items-center">
//                                         Sign In
//                                     </button>

//                                     <div className="or flex items-center gap-2 my-2">
//                                         <div className="flex-1 border border-black"></div>
//                                         <span className="text-xs font-medium">Or Sign In With</span>
//                                         <div className="flex-1 border border-black"></div>
//                                     </div>

//                                     <div className="logos-signin flex justify-center items-center gap-10">
//                                         <img src="/assets/icon_facebook.png" className="w-12 h-auto" alt="Facebook Login" />
//                                         <img src="/assets/icon_google.png" className="w-14 h-auto" alt="Google Login" />
//                                     </div>

//                                     <div className="dont-have flex justify-center text-xs font-medium">
//                                         <span className="mr-1">Don’t have an account?</span>
//                                         <Link href="/sign-up" className="font-semibold text-blue-500 hover:text-blue-700">
//                                             Sign Up
//                                         </Link>
//                                     </div>
//                                 </form>
//                             </div>
//                         </div>
//                     </div>

//                     <div className="first-right w-full h-full flex items-center">
//                         <div className="second-left w-[75%] h-[85%] bg-blue-500 rounded-r-2xl relative">
//                             <img className="absolute bottom-0" src="/assets/doctor-sign.png" alt="Doctor Illustration" />
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </>
//     );
// }
