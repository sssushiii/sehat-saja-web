'use client';

import { useState, useRef } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useRouter } from 'next/navigation';

import { EnvelopeSimple, LockSimple, Phone, GenderFemale, GenderMale, User, Camera, CalendarBlank } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default function SignUp() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1); // 1 for first form, 2 for second form
    const fileInputRef = useRef(null);
    const router = useRouter();

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImage(file);
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const handleFirstStepSubmit = (e) => {
        e.preventDefault();
        if (!email || !password || !phone || !gender) {
            setError('Please fill all required fields');
            return;
        }
        setStep(2);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                name,
                email,
                phone,
                gender,
                birthDate: birthDate || "0000-00-00",
                role: "user",
                createdAt: serverTimestamp(),
                // You might want to handle profile image upload here
                // profileImageUrl: uploadedImageUrl
            });

            alert('Akun berhasil dibuat!');
            router.push('/sign-in');
        } catch (error) {
            console.error(error.message);
            setError('Gagal membuat akun. Pastikan email valid & password minimal 6 karakter.');
        }
    };

    return (
        <div className="all w-full h-screen flex bg-[url('/assets/bg-all-sign.jpg')] bg-cover text-black relative">
            <div className="w-auto fixed right-10 bottom-10 z-10 flex flex-col gap-3">
                <a href="/dashboard/admin" className="bg-white p-4 rounded-md hover:bg-blue-100 transition-all duration-100">Login as Admin</a>
                <a href="/dashboard/doctor" className="bg-white p-4 rounded-md hover:bg-blue-100 transition-all duration-100">Login as Doctor</a>
                <a href="/dashboard/patient" className="bg-white p-4 rounded-md hover:bg-blue-100 transition-all duration-100">Login as Patient</a>
            </div>
            <div className="w-full h-full backdrop-blur-sm flex items-center justify-end">
                <div className="first-left w-full h-full bg-transparent flex items-center justify-end">
                    <div className="second-left w-[75%] h-[85%] bg-white rounded-l-2xl justify-center px-[10%] py-[6%] tracking-wide">
                        <div className="signinform flex flex-col h-full">
                            <div className="logo w-full flex justify-center mb-5">
                                <img src="/assets/logo-sehatsaja-black.png" className="w-[40%]" alt="Logo SehatSaja" />
                            </div>
                            
                            {step === 1 ? (
                                <>
                                    <div className="signin-title mb-4">
                                        <h1 className="font-semibold text-3xl">Sign Up</h1>
                                        <h1 className="font-light">Welcome to SehatSaja! Create your account here</h1>
                                    </div>
                                    <form onSubmit={handleFirstStepSubmit} className="flex flex-col justify-between h-full gap-2">
                                        <div className="email w-full bg-gray-100 h-16 rounded-md flex justify-evenly items-center text-gray-500">
                                            <EnvelopeSimple size={26} color="#858585" weight="bold" />
                                            <input type="email" placeholder="Email Address" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-full w-[80%] outline-none font-semibold text-sm" />
                                        </div>
                                        <div className="password w-full bg-gray-100 h-16 rounded-md flex justify-evenly items-center text-gray-500">
                                            <LockSimple size={26} color="#858585" weight="bold" />
                                            <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-full w-[80%] outline-none font-semibold text-sm" />
                                        </div>
                                        <div className="phone-2 w-full bg-gray-100 h-16 rounded-md flex justify-evenly items-center text-gray-500">
                                            <Phone size={26} color="#858585" weight="bold" />
                                            <input type="tel" placeholder="Phone" required value={phone} onChange={(e) => setPhone(e.target.value)} className="h-full w-[80%] outline-none font-semibold text-sm" />
                                        </div>

                                        <div className="gender flex flex-row gap-2">
                                            <label className={`gender-option w-full h-16 rounded-md flex justify-evenly items-center cursor-pointer ${gender === 'male' ? 'bg-blue-100 outline outline-blue-500' : 'bg-gray-100 hover:bg-gray-200'}`}>
                                                <input type="radio" name="gender" value="male" className="hidden" onChange={() => setGender('male')} checked={gender === 'male'} />
                                                <GenderMale size={26} color={gender === 'male' ? "#3467fe" : "#858585"} weight="bold" />
                                                <span className={`font-semibold ${gender === 'male' ? 'text-blue-500' : 'text-gray-500'}`}>Male</span>
                                            </label>
                                            <label className={`gender-option w-full h-16 rounded-md flex justify-evenly items-center cursor-pointer ${gender === 'female' ? 'bg-pink-100 outline outline-pink-500' : 'bg-gray-100 hover:bg-gray-200'}`}>
                                                <input type="radio" name="gender" value="female" className="hidden" onChange={() => setGender('female')} checked={gender === 'female'} />
                                                <GenderFemale size={26} color={gender === 'female' ? "#ff70e0" : "#858585"} weight="bold" />
                                                <span className={`font-semibold ${gender === 'female' ? 'text-pink-500' : 'text-gray-500'}`}>Female</span>
                                            </label>
                                        </div>

                                        {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

                                        <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 transition-all ease-in-out duration-200 text-white font-semibold h-16 rounded-md flex justify-evenly items-center">
                                            Continue
                                        </button>

                                        <div className="dont-have w-full flex flex-row font-medium text-xs justify-center">
                                            <h1 className="mr-1">Already have account?</h1>
                                            <Link href="/sign-in" className="font-semibold text-blue-500 hover:text-blue-700">
                                                Sign In
                                            </Link>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <>
                                    <div className="signin-title mb-4">
                                        <h1 className="font-semibold text-3xl">Complete Your Profile</h1>
                                        <h1 className="font-light">Add your personal information</h1>
                                    </div>
                                    <form onSubmit={handleSubmit} className="flex flex-col justify-between h-full gap-2">
                                        <div className="flex flex-col items-center gap-4 mb-4">
                                            <div className="relative">
                                                <div 
                                                    className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer"
                                                    onClick={triggerFileInput}
                                                >
                                                    {profileImage ? (
                                                        <img 
                                                            src={URL.createObjectURL(profileImage)} 
                                                            alt="Profile" 
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Camera size={32} color="#858585" weight="bold" />
                                                    )}
                                                </div>
                                                <input 
                                                    type="file" 
                                                    ref={fileInputRef}
                                                    onChange={handleImageUpload}
                                                    accept="image/*"
                                                    className="hidden"
                                                />
                                            </div>
                                            <p className="text-sm text-gray-500">Click to upload profile picture</p>
                                        </div>

                                        <div className="name w-full bg-gray-100 h-16 rounded-md flex justify-evenly items-center text-gray-500">
                                            <User size={26} color="#858585" weight="bold" />
                                            <input 
                                                type="text" 
                                                placeholder="Full Name" 
                                                value={name} 
                                                onChange={(e) => setName(e.target.value)} 
                                                className="h-full w-[80%] outline-none font-semibold text-sm" 
                                            />
                                        </div>

                                        <div className="birthdate w-full bg-gray-100 h-16 rounded-md flex justify-evenly items-center text-gray-500">
                                            <CalendarBlank size={26} color="#858585" weight="bold" />
                                            <input 
                                                type="date" 
                                                placeholder="Birth Date" 
                                                value={birthDate} 
                                                onChange={(e) => setBirthDate(e.target.value)} 
                                                className="h-full w-[80%] outline-none font-semibold text-sm text-gray-500" 
                                            />
                                        </div>

                                        <div className="flex gap-2">
                                            <button 
                                                type="button" 
                                                onClick={() => setStep(1)}
                                                className="w-full bg-gray-200 hover:bg-gray-300 transition-all ease-in-out duration-200 text-gray-700 font-semibold h-16 rounded-md flex justify-evenly items-center"
                                            >
                                                Back
                                            </button>
                                            <button 
                                                type="submit" 
                                                className="w-full bg-blue-500 hover:bg-blue-600 transition-all ease-in-out duration-200 text-white font-semibold h-16 rounded-md flex justify-evenly items-center"
                                            >
                                                Complete Sign Up
                                            </button>
                                        </div>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="first-right w-full h-full bg-transparent flex items-center">
                    <div className="second-left w-[75%] h-[85%] bg-blue-500 rounded-r-2xl relative">
                        <img className="absolute bottom-0" src="/assets/doctor-sign.png" alt="Doctor Illustration" />
                    </div>
                </div>
            </div>
        </div>
    );
}