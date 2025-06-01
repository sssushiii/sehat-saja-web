'use client';

import { useState, useRef } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useRouter } from 'next/navigation';

import {
  EnvelopeSimple,
  LockSimple,
  Phone,
  GenderFemale,
  GenderMale,
  User,
  Camera,
  CalendarBlank,
  IdentificationCard,
  FirstAid,
  CurrencyDollar
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export default function SignUpDoctor() {
  // Form states
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [price, setPrice] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  
  // UI states
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Refs
  const fileInputRef = useRef(null);
  const router = useRouter();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate image type and size
      if (!file.type.match('image.*')) {
        setError('File harus berupa gambar');
        return;
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB
        setError('Ukuran gambar terlalu besar (maksimal 2MB)');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Validation functions for each step
  const validateFirstStep = () => {
    if (!email || !password || !confirmPassword || !phone) {
      setError('Harap isi semua field yang diperlukan');
      return false;
    }
    
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Format email tidak valid');
      return false;
    }
    
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak sama');
      return false;
    }
    
    if (!/^[0-9]{10,13}$/.test(phone)) {
      setError('Nomor telepon harus 10-13 digit angka');
      return false;
    }
    
    return true;
  };

  const validateSecondStep = () => {
    if (!name || !gender) {
      setError('Harap isi semua field yang diperlukan');
      return false;
    }
    
    if (name.length < 2) {
      setError('Nama terlalu pendek');
      return false;
    }
    
    return true;
  };

  const validateThirdStep = () => {
    if (!specialization || !licenseNumber || !price) {
      setError('Harap isi semua field yang diperlukan');
      return false;
    }
    if (!/^[A-Za-z0-9]{8,20}$/.test(licenseNumber)) {
      setError('Nomor lisensi harus 8-20 karakter alfanumerik');
      return false;
    }
    if (!/^\d+$/.test(price)) {
      setError('Harga harus berupa angka');
      return false;
    }
    return true;
  };

  // Step handlers
  const handleFirstStepSubmit = (e) => {
    e.preventDefault();
    if (validateFirstStep()) {
      setStep(2);
      setError('');
    }
  };

  const handleSecondStepSubmit = (e) => {
    e.preventDefault();
    if (validateSecondStep()) {
      setStep(3);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateThirdStep()) return;
    
    setLoading(true);
    
    try {
      // 1. Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Update user profile with name
      await updateProfile(user, {
        displayName: name,
      });

      // 3. Save additional doctor data to Firestore sesuai struktur entitas
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email,
        phone,
        gender,
        birthDate: birthDate || "",
        photoUrl: profileImage || "",
        role: "doctor",
        specialization,
        licenseNumber,
        price: parseInt(price),
        status: "pending", // Admin needs to verify doctor credentials
        description: "", // Kosong, akan diisi di dashboard
        dailySchedules: {}, // Kosong, akan diisi di dashboard
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 4. Redirect to sign in with success message
      router.push(
        "/sign-in-doctor?success=Doctor account created successfully. Please wait for admin verification."
      );
    } catch (error) {
      console.error("Error during sign up:", error);
      
      let errorMessage = "Gagal membuat akun. Silakan coba lagi.";
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "Email sudah terdaftar";
          break;
        case "auth/weak-password":
          errorMessage = "Password terlalu lemah";
          break;
        case "auth/invalid-email":
          errorMessage = "Email tidak valid";
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="all w-full h-screen flex bg-[url('/assets/bg-all-sign.jpg')] bg-cover text-black relative">
      <div className="w-full h-full backdrop-blur-sm flex items-center justify-end">
        <div className="first-left w-full h-full bg-transparent flex items-center justify-end">
          <div className="second-left w-[75%] h-[85%] bg-white rounded-l-2xl justify-center px-[10%] py-[6%] tracking-wide">
            <div className="signinform flex flex-col h-full">
              <div className="logo w-full flex justify-center mb-5">
                <img
                  src="/assets/logo-sehatsaja-black.png"
                  className="w-[40%]"
                  alt="Logo SehatSaja"
                />
              </div>
              
              {/* Step 1: Basic Information */}
              {step === 1 && (
                <>
                  <div className="signin-title mb-4">
                    <h1 className="font-semibold text-3xl">Doctor Sign Up</h1>
                    <h1 className="font-light">
                      Welcome to SehatSaja! Register as a healthcare professional
                    </h1>
                  </div>

                  <form
                    onSubmit={handleFirstStepSubmit}
                    className="flex flex-col justify-between h-full gap-2"
                  >
                    <div className="email w-full bg-gray-100 h-14 rounded-md flex justify-evenly items-center text-gray-500">
                      <EnvelopeSimple size={26} color="#858585" weight="bold" />
                      <input
                        type="email"
                        placeholder="Email Address"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-full w-[80%] outline-none font-semibold text-sm bg-transparent"
                      />
                    </div>

                    <div className="password w-full bg-gray-100 h-14 rounded-md flex justify-evenly items-center text-gray-500">
                      <LockSimple size={26} color="#858585" weight="bold" />
                      <input
                        type="password"
                        placeholder="Password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-full w-[80%] outline-none font-semibold text-sm bg-transparent"
                      />
                    </div>

                    <div className="confirm-password w-full bg-gray-100 h-14 rounded-md flex justify-evenly items-center text-gray-500">
                      <LockSimple size={26} color="#858585" weight="bold" />
                      <input
                        type="password"
                        placeholder="Confirm Password"
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-full w-[80%] outline-none font-semibold text-sm bg-transparent"
                      />
                    </div>

                    <div className="phone-2 w-full bg-gray-100 h-14 rounded-md flex justify-evenly items-center text-gray-500">
                      <Phone size={26} color="#858585" weight="bold" />
                      <input
                        type="tel"
                        placeholder="Phone Number"
                        required
                        pattern="[0-9]{10,13}"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-full w-[80%] outline-none font-semibold text-sm bg-transparent"
                      />
                    </div>

                    {error && (
                      <div className="text-red-500 text-sm font-medium py-2">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-blue-500 hover:bg-blue-600 transition-all ease-in-out duration-200 text-white font-semibold h-14 rounded-md flex justify-center items-center"
                    >
                      Continue
                    </button>

                    <div className="dont-have w-full flex flex-row font-medium text-xs justify-center pt-2">
                      <h1 className="mr-1">Already have account?</h1>
                      <Link
                        href="/sign-in"
                        className="font-semibold text-blue-500 hover:text-blue-700"
                      >
                        Sign In
                      </Link>
                    </div>
                  </form>
                </>
              )}

              {/* Step 2: Personal Information */}
              {step === 2 && (
                <>
                  <div className="signin-title mb-4">
                    <h1 className="font-semibold text-3xl">Personal Information</h1>
                    <h1 className="font-light">
                      Please provide your personal details
                    </h1>
                  </div>

                  <form
                    onSubmit={handleSecondStepSubmit}
                    className="flex flex-col justify-between h-full gap-3"
                  >
                    <div className="flex flex-col items-center gap-4 mb-4">
                      <div className="relative">
                        <div
                          className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer border-2 border-gray-300 hover:border-gray-400 transition-colors"
                          onClick={triggerFileInput}
                        >
                          {profileImage ? (
                            <img
                              src={profileImage}
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
                          onChange={handleImageChange}
                          accept="image/*"
                          className="hidden"
                          disabled={loading}
                        />
                      </div>
                      <p className="text-sm text-gray-500 text-center">
                        Click to upload profile picture
                        <br />
                        (max 2MB, optional)
                      </p>
                    </div>

                    <div className="name w-full bg-gray-100 h-16 rounded-md flex justify-evenly items-center text-gray-500">
                      <User size={26} color="#858585" weight="bold" />
                      <input
                        type="text"
                        placeholder="Full Name"
                        required
                        minLength={2}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-full w-[80%] outline-none font-semibold text-sm bg-transparent"
                        disabled={loading}
                      />
                    </div>

                    <div className="gender flex flex-row gap-2">
                      <label
                        className={`gender-option w-full h-14 rounded-md flex justify-evenly items-center cursor-pointer ${
                          gender === "male"
                            ? "bg-blue-100 outline outline-blue-500"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="gender"
                          value="male"
                          className="hidden"
                          onChange={() => setGender("male")}
                          checked={gender === "male"}
                          required
                        />
                        <GenderMale
                          size={26}
                          color={gender === "male" ? "#3467fe" : "#858585"}
                          weight="bold"
                        />
                        <span
                          className={`font-semibold ${
                            gender === "male" ? "text-blue-500" : "text-gray-500"
                          }`}
                        >
                          Male
                        </span>
                      </label>
                      <label
                        className={`gender-option w-full h-14 rounded-md flex justify-evenly items-center cursor-pointer ${
                          gender === "female"
                            ? "bg-pink-100 outline outline-pink-500"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name="gender"
                          value="female"
                          className="hidden"
                          onChange={() => setGender("female")}
                          checked={gender === "female"}
                          required
                        />
                        <GenderFemale
                          size={26}
                          color={gender === "female" ? "#ff70e0" : "#858585"}
                          weight="bold"
                        />
                        <span
                          className={`font-semibold ${
                            gender === "female"
                              ? "text-pink-500"
                              : "text-gray-500"
                          }`}
                        >
                          Female
                        </span>
                      </label>
                    </div>

                    <div className="birthdate w-full bg-gray-100 h-16 rounded-md flex justify-evenly items-center text-gray-500">
                      <CalendarBlank size={26} color="#858585" weight="bold" />
                      <div className="w-[80%] h-full flex items-center relative">
                        <input
                          type="date"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          className="h-full w-full outline-none font-semibold text-sm bg-transparent text-gray-700"
                          max={new Date().toISOString().split("T")[0]}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="text-red-500 text-sm font-medium py-2">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="w-full bg-gray-200 hover:bg-gray-300 transition-all ease-in-out duration-200 text-gray-700 font-semibold h-16 rounded-md flex justify-center items-center"
                        disabled={loading}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="w-full bg-blue-500 hover:bg-blue-600 transition-all ease-in-out duration-200 text-white font-semibold h-16 rounded-md flex justify-center items-center"
                        disabled={loading}
                      >
                        Continue
                      </button>
                    </div>
                  </form>
                </>
              )}

              {/* Step 3: Professional Information */}
              {step === 3 && (
                <>
                  <div className="signin-title mb-4">
                    <h1 className="font-semibold text-3xl">
                      Professional Information
                    </h1>
                    <h1 className="font-light">
                      Complete your professional details for verification
                    </h1>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    className="flex flex-col justify-between h-full gap-3"
                  >
                    <div className="specialization w-full bg-gray-100 h-16 rounded-md flex justify-evenly items-center text-gray-500">
                      <FirstAid size={26} color="#858585" weight="bold" />
                      <select
                        required
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        className="h-full w-[80%] outline-none font-semibold text-sm bg-transparent text-gray-700"
                        disabled={loading}
                      >
                        <option value="">Select Specialization</option>
                        <option value="Dokter Umum">Dokter Umum</option>
                        <option value="Dokter Gigi">Dokter Gigi</option>
                        <option value="Dokter Tulang">Dokter Tulang</option>
                        <option value="Dokter THT">Dokter THT</option>
                        <option value="Dokter Kulit">Dokter Kulit</option>
                        <option value="Dokter Anak">Dokter Anak</option>
                        <option value="Dokter Kandungan">Dokter Kandungan</option>
                        <option value="Dokter Saraf">Dokter Saraf</option>
                        <option value="Dokter Mata">Dokter Mata</option>
                        <option value="Dokter Penyakit Dalam">Dokter Penyakit Dalam</option>
                      </select>
                    </div>

                    <div className="license w-full bg-gray-100 h-16 rounded-md flex justify-evenly items-center text-gray-500">
                      <IdentificationCard
                        size={26}
                        color="#858585"
                        weight="bold"
                      />
                      <input
                        type="text"
                        placeholder="License Number"
                        required
                        pattern="[A-Za-z0-9]{8,20}"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        className="h-full w-[80%] outline-none font-semibold text-sm bg-transparent"
                        disabled={loading}
                      />
                    </div>

                    <div className="price w-full bg-gray-100 h-16 rounded-md flex justify-evenly items-center text-gray-500">
                      <CurrencyDollar size={26} color="#858585" weight="bold" />
                      <input
                        type="text"
                        placeholder="Consultation Fee (IDR)"
                        required
                        pattern="\d*"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="h-full w-[80%] outline-none font-semibold text-sm bg-transparent"
                        disabled={loading}
                      />
                    </div>

                    {error && (
                      <div className="text-red-500 text-sm font-medium py-2">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="w-full bg-gray-200 hover:bg-gray-300 transition-all ease-in-out duration-200 text-gray-700 font-semibold h-16 rounded-md flex justify-center items-center"
                        disabled={loading}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="w-full bg-blue-500 hover:bg-blue-600 transition-all ease-in-out duration-200 text-white font-semibold h-16 rounded-md flex justify-center items-center"
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="flex items-center">
                            <svg
                              className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          "Complete Registration"
                        )}
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
            <img
              className="absolute bottom-0"
              src="/assets/doctor-sign.png"
              alt="Doctor Illustration"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
















// 'use client';

// import { useState, useRef } from 'react';
// import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
// import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
// import { auth, db } from '../../lib/firebase';
// import { useRouter } from 'next/navigation';

// import {
//   EnvelopeSimple,
//   LockSimple,
//   Phone,
//   GenderFemale,
//   GenderMale,
//   User,
//   Camera,
//   CalendarBlank,
//   IdentificationCard,
//   FirstAid,
//   Info,
//   CurrencyDollar
// } from "@phosphor-icons/react/dist/ssr";
// import Link from "next/link";

// export default function SignUpDoctor() {
//   // Form states
//   const [email, setEmail] = useState('');
//   const [name, setName] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [phone, setPhone] = useState('');
//   const [gender, setGender] = useState('');
//   const [birthDate, setBirthDate] = useState('');
//   const [specialization, setSpecialization] = useState('');
//   const [licenseNumber, setLicenseNumber] = useState('');
//   const [about, setAbout] = useState('');
//   const [price, setPrice] = useState('');
//   const [profileImage, setProfileImage] = useState(null);
  
//   // UI states
//   const [error, setError] = useState('');
//   const [step, setStep] = useState(1);
//   const [loading, setLoading] = useState(false);
  
//   // Refs
//   const fileInputRef = useRef(null);
//   const router = useRouter();

//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       // Validate image type and size
//       if (!file.type.match('image.*')) {
//         setError('File harus berupa gambar');
//         return;
//       }
//       if (file.size > 2 * 1024 * 1024) { // 2MB
//         setError('Ukuran gambar terlalu besar (maksimal 2MB)');
//         return;
//       }
      
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setProfileImage(reader.result);
//         setError('');
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const triggerFileInput = () => {
//     fileInputRef.current.click();
//   };

//   // Validation functions for each step
//   const validateFirstStep = () => {
//     if (!email || !password || !confirmPassword || !phone) {
//       setError('Harap isi semua field yang diperlukan');
//       return false;
//     }
    
//     if (!/^\S+@\S+\.\S+$/.test(email)) {
//       setError('Format email tidak valid');
//       return false;
//     }
    
//     if (password.length < 6) {
//       setError('Password minimal 6 karakter');
//       return false;
//     }
    
//     if (password !== confirmPassword) {
//       setError('Password dan konfirmasi password tidak sama');
//       return false;
//     }
    
//     if (!/^[0-9]{10,13}$/.test(phone)) {
//       setError('Nomor telepon harus 10-13 digit angka');
//       return false;
//     }
    
//     return true;
//   };

//   const validateSecondStep = () => {
//     if (!name || !gender) {
//       setError('Harap isi semua field yang diperlukan');
//       return false;
//     }
    
//     if (name.length < 2) {
//       setError('Nama terlalu pendek');
//       return false;
//     }
    
//     return true;
//   };

//   const validateThirdStep = () => {
//     if (!specialization || !licenseNumber || !birthDate) {
//       setError('Harap isi semua field yang diperlukan');
//       return false;
//     }
//     if (!/^[A-Za-z0-9]{8,20}$/.test(licenseNumber)) {
//       setError('Nomor lisensi harus 8-20 karakter alfanumerik');
//       return false;
//     }
//     return true;
//   };

//   const validateFourthStep = () => {
//     if (!about || !price) {
//       setError('Harap isi semua field yang diperlukan');
//       return false;
//     }
//     if (about.length < 50) {
//       setError('Deskripsi minimal 50 karakter');
//       return false;
//     }
//     if (!/^\d+$/.test(price)) {
//       setError('Harga harus berupa angka');
//       return false;
//     }
//     return true;
//   };

//   // Step handlers
//   const handleFirstStepSubmit = (e) => {
//     e.preventDefault();
//     if (validateFirstStep()) {
//       setStep(2);
//       setError('');
//     }
//   };

//   const handleSecondStepSubmit = (e) => {
//     e.preventDefault();
//     if (validateSecondStep()) {
//       setStep(3);
//       setError('');
//     }
//   };

//   const handleThirdStepSubmit = (e) => {
//     e.preventDefault();
//     if (validateThirdStep()) {
//       setStep(4);
//       setError('');
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
    
//     if (!validateFourthStep()) return;
    
//     setLoading(true);
    
//     try {
//       // 1. Create user with email and password
//       const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//       const user = userCredential.user;

//       // 2. Update user profile with name
//       await updateProfile(user, {
//         displayName: name,
//       });

//       // 3. Save additional doctor data to Firestore
//       await setDoc(doc(db, "users", user.uid), {
//         uid: user.uid,
//         name,
//         email,
//         phone,
//         gender,
//         birthDate: birthDate || null,
//         photoUrl: profileImage || "",
//         role: "doctor",
//         specialization,
//         licenseNumber,
//         about,
//         price: parseInt(price),
//         status: "pending", // Admin needs to verify doctor credentials
//         createdAt: serverTimestamp(),
//         lastLogin: serverTimestamp()
//       });

//       // 4. Redirect to sign in with success message
//       router.push(
//         "/sign-in?success=Doctor account created successfully. Please wait for admin verification."
//       );
//     } catch (error) {
//       console.error("Error during sign up:", error);
      
//       let errorMessage = "Gagal membuat akun. Silakan coba lagi.";
//       switch (error.code) {
//         case "auth/email-already-in-use":
//           errorMessage = "Email sudah terdaftar";
//           break;
//         case "auth/weak-password":
//           errorMessage = "Password terlalu lemah";
//           break;
//         case "auth/invalid-email":
//           errorMessage = "Email tidak valid";
//           break;
//         default:
//           errorMessage = error.message || errorMessage;
//       }
      
//       setError(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="all w-full h-screen flex bg-[url('/assets/bg-all-sign.jpg')] bg-cover text-black relative">
//       <div className="w-full h-full backdrop-blur-sm flex items-center justify-end">
//         <div className="first-left w-full h-full bg-transparent flex items-center justify-end">
//           <div className="second-left w-[75%] h-[85%] bg-white rounded-l-2xl justify-center px-[10%] py-[6%] tracking-wide">
//             <div className="signinform flex flex-col h-full">
//               <div className="logo w-full flex justify-center mb-5">
//                 <img
//                   src="/assets/logo-sehatsaja-black.png"
//                   className="w-[40%]"
//                   alt="Logo SehatSaja"
//                 />
//               </div>
              
//               {/* Step 1: Basic Information */}
//               {step === 1 && (
//                 <>
//                   <div className="signin-title mb-4">
//                     <h1 className="font-semibold text-3xl">Doctor Sign Up</h1>
//                     <h1 className="font-light">
//                       Welcome to SehatSaja! Register as a healthcare professional
//                     </h1>
//                   </div>

//                   <form
//                     onSubmit={handleFirstStepSubmit}
//                     className="flex flex-col justify-between h-full gap-2"
//                   >
//                     <div className="email w-full bg-gray-100 h-14 rounded-md flex justify-evenly items-center text-gray-500">
//                       <EnvelopeSimple size={26} color="#858585" weight="bold" />
//                       <input
//                         type="email"
//                         placeholder="Email Address"
//                         required
//                         value={email}
//                         onChange={(e) => setEmail(e.target.value)}
//                         className="h-full w-[80%] outline-none font-semibold text-sm bg-transparent"
//                       />
//                     </div>

//                     <div className="password w-full bg-gray-100 h-14 rounded-md flex justify-evenly items-center text-gray-500">
//                       <LockSimple size={26} color="#858585" weight="bold" />
//                       <input
//                         type="password"
//                         placeholder="Password"
//                         required
//                         minLength={6}
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                         className="h-full w-[80%] outline-none font-semibold text-sm bg-transparent"
//                       />
//                     </div>

//                     <div className="confirm-password w-full bg-gray-100 h-14 rounded-md flex justify-evenly items-center text-gray-500">
//                       <LockSimple size={26} color="#858585" weight="bold" />
//                       <input
//                         type="password"
//                         placeholder="Confirm Password"
//                         required
//                         minLength={6}
//                         value={confirmPassword}
//                         onChange={(e) => setConfirmPassword(e.target.value)}
//                         className="h-full w-[80%] outline-none font-semibold text-sm bg-transparent"
//                       />
//                     </div>

//                     <div className="phone-2 w-full bg-gray-100 h-14 rounded-md flex justify-evenly items-center text-gray-500">
//                       <Phone size={26} color="#858585" weight="bold" />
//                       <input
//                         type="tel"
//                         placeholder="Phone Number"
//                         required
//                         pattern="[0-9]{10,13}"
//                         value={phone}
//                         onChange={(e) => setPhone(e.target.value)}
//                         className="h-full w-[80%] outline-none font-semibold text-sm bg-transparent"
//                       />
//                     </div>

//                     {error && (
//                       <div className="text-red-500 text-sm font-medium py-2">
//                         {error}
//                       </div>
//                     )}

//                     <button
//                       type="submit"
//                       className="w-full bg-blue-500 hover:bg-blue-600 transition-all ease-in-out duration-200 text-white font-semibold h-14 rounded-md flex justify-center items-center"
//                     >
//                       Continue
//                     </button>

//                     <div className="dont-have w-full flex flex-row font-medium text-xs justify-center pt-2">
//                       <h1 className="mr-1">Already have account?</h1>
//                       <Link
//                         href="/sign-in"
//                         className="font-semibold text-blue-500 hover:text-blue-700"
//                       >
//                         Sign In
//                       </Link>
//                     </div>
//                   </form>
//                 </>
//               )}

//               {/* Step 2: Personal Information */}
//               {step === 2 && (
//                 <>
//                   <div className="signin-title mb-4">
//                     <h1 className="font-semibold text-3xl">Personal Information</h1>
//                     <h1 className="font-light">
//                       Please provide your personal details
//                     </h1>
//                   </div>

//                   <form
//                     onSubmit={handleSecondStepSubmit}
//                     className="flex flex-col justify-between h-full gap-3"
//                   >
//                     <div className="flex flex-col items-center gap-4 mb-4">
//                       <div className="relative">
//                         <div
//                           className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer border-2 border-gray-300 hover:border-gray-400 transition-colors"
//                           onClick={triggerFileInput}
//                         >
//                           {profileImage ? (
//                             <img
//                               src={profileImage}
//                               alt="Profile"
//                               className="w-full h-full object-cover"
//                             />
//                           ) : (
//                             <Camera size={32} color="#858585" weight="bold" />
//                           )}
//                         </div>
//                         <input
//                           type="file"
//                           ref={fileInputRef}
//                           onChange={handleImageChange}
//                           accept="image/*"
//                           className="hidden"
//                           disabled={loading}
//                         />
//                       </div>
//                       <p className="text-sm text-gray-500 text-center">
//                         Click to upload profile picture
//                         <br />
//                         (max 2MB, optional)
//                       </p>
//                     </div>

//                     <div className="name w-full bg-gray-100 h-16 rounded-md flex justify-evenly items-center text-gray-500">
//                       <User size={26} color="#858585" weight="bold" />
//                       <input
//                         type="text"
//                         placeholder="Full Name"
//                         required
//                         minLength={2}
//                         value={name}
//                         onChange={(e) => setName(e.target.value)}
//                         className="h-full w-[80%] outline-none font-semibold text-sm bg-transparent"
//                         disabled={loading}
//                       />
//                     </div>

//                     <div className="gender flex flex-row gap-2">
//                       <label
//                         className={`gender-option w-full h-14 rounded-md flex justify-evenly items-center cursor-pointer ${
//                           gender === "male"
//                             ? "bg-blue-100 outline outline-blue-500"
//                             : "bg-gray-100 hover:bg-gray-200"
//                         }`}
//                       >
//                         <input
//                           type="radio"
//                           name="gender"
//                           value="male"
//                           className="hidden"
//                           onChange={() => setGender("male")}
//                           checked={gender === "male"}
//                           required
//                         />
//                         <GenderMale
//                           size={26}
//                           color={gender === "male" ? "#3467fe" : "#858585"}
//                           weight="bold"
//                         />
//                         <span
//                           className={`font-semibold ${
//                             gender === "male" ? "text-blue-500" : "text-gray-500"
//                           }`}
//                         >
//                           Male
//                         </span>
//                       </label>
//                       <label
//                         className={`gender-option w-full h-14 rounded-md flex justify-evenly items-center cursor-pointer ${
//                           gender === "female"
//                             ? "bg-pink-100 outline outline-pink-500"
//                             : "bg-gray-100 hover:bg-gray-200"
//                         }`}
//                       >
//                         <input
//                           type="radio"
//                           name="gender"
//                           value="female"
//                           className="hidden"
//                           onChange={() => setGender("female")}
//                           checked={gender === "female"}
//                           required
//                         />
//                         <GenderFemale
//                           size={26}
//                           color={gender === "female" ? "#ff70e0" : "#858585"}
//                           weight="bold"
//                         />
//                         <span
//                           className={`font-semibold ${
//                             gender === "female"
//                               ? "text-pink-500"
//                               : "text-gray-500"
//                           }`}
//                         >
//                           Female
//                         </span>
//                       </label>
//                     </div>

//                     {error && (
//                       <div className="text-red-500 text-sm font-medium py-2">
//                         {error}
//                       </div>
//                     )}

//                     <div className="flex gap-2">
//                       <button
//                         type="button"
//                         onClick={() => setStep(1)}
//                         className="w-full bg-gray-200 hover:bg-gray-300 transition-all ease-in-out duration-200 text-gray-700 font-semibold h-16 rounded-md flex justify-center items-center"
//                         disabled={loading}
//                       >
//                         Back
//                       </button>
//                       <button
//                         type="submit"
//                         className="w-full bg-blue-500 hover:bg-blue-600 transition-all ease-in-out duration-200 text-white font-semibold h-16 rounded-md flex justify-center items-center"
//                         disabled={loading}
//                       >
//                         Continue
//                       </button>
//                     </div>
//                   </form>
//                 </>
//               )}

//               {/* Step 3: Professional Information */}
//               {step === 3 && (
//                 <>
//                   <div className="signin-title mb-4">
//                     <h1 className="font-semibold text-3xl">
//                       Professional Information
//                     </h1>
//                     <h1 className="font-light">
//                       Complete your professional details for verification
//                     </h1>
//                   </div>

//                   <form
//                     onSubmit={handleThirdStepSubmit}
//                     className="flex flex-col justify-between h-full gap-3"
//                   >
//                     <div className="specialization w-full bg-gray-100 h-16 rounded-md flex justify-evenly items-center text-gray-500">
//                       <FirstAid size={26} color="#858585" weight="bold" />
//                       <select
//                         required
//                         value={specialization}
//                         onChange={(e) => setSpecialization(e.target.value)}
//                         className="h-full w-[80%] outline-none font-semibold text-sm bg-transparent text-gray-700"
//                         disabled={loading}
//                       >
//                         <option value="">Select Specialization</option>
//                         <option value="Dokter Umum">Dokter Umum</option>
//                         <option value="Dokter Gigi">Dokter Gigi</option>
//                         <option value="Dokter Tulang">Dokter Tulang</option>
//                         <option value="Dokter THT">Dokter THT</option>
//                         <option value="Dokter Kulit">Dokter Kulit</option>
//                         <option value="Dokter Anak">Dokter Anak</option>
//                         <option value="Dokter Kandungan">Dokter Kandungan</option>
//                         <option value="Dokter Saraf">Dokter Saraf</option>
//                         <option value="Dokter Mata">Dokter Mata</option>
//                         <option value="Dokter Penyakit Dalam">Dokter Penyakit Dalam</option>
//                       </select>
//                     </div>

//                     <div className="license w-full bg-gray-100 h-16 rounded-md flex justify-evenly items-center text-gray-500">
//                       <IdentificationCard
//                         size={26}
//                         color="#858585"
//                         weight="bold"
//                       />
//                       <input
//                         type="text"
//                         placeholder="License Number"
//                         required
//                         pattern="[A-Za-z0-9]{8,20}"
//                         value={licenseNumber}
//                         onChange={(e) => setLicenseNumber(e.target.value)}
//                         className="h-full w-[80%] outline-none font-semibold text-sm bg-transparent"
//                         disabled={loading}
//                       />
//                     </div>

//                     <div className="birthdate w-full bg-gray-100 h-16 rounded-md flex justify-evenly items-center text-gray-500">
//                       <CalendarBlank size={26} color="#858585" weight="bold" />
//                       <div className="w-[80%] h-full flex items-center relative">
//                         <input
//                           type="date"
//                           required
//                           value={birthDate}
//                           onChange={(e) => setBirthDate(e.target.value)}
//                           className="h-full w-full outline-none font-semibold text-sm bg-transparent text-gray-700"
//                           max={new Date().toISOString().split("T")[0]}
//                           disabled={loading}
//                         />
//                       </div>
//                     </div>

//                     {error && (
//                       <div className="text-red-500 text-sm font-medium py-2">
//                         {error}
//                       </div>
//                     )}

//                     <div className="flex gap-2">
//                       <button
//                         type="button"
//                         onClick={() => setStep(2)}
//                         className="w-full bg-gray-200 hover:bg-gray-300 transition-all ease-in-out duration-200 text-gray-700 font-semibold h-16 rounded-md flex justify-center items-center"
//                         disabled={loading}
//                       >
//                         Back
//                       </button>
//                       <button
//                         type="submit"
//                         className="w-full bg-blue-500 hover:bg-blue-600 transition-all ease-in-out duration-200 text-white font-semibold h-16 rounded-md flex justify-center items-center"
//                         disabled={loading}
//                       >
//                         Continue
//                       </button>
//                     </div>
//                   </form>
//                 </>
//               )}

//               {/* Step 4: Professional Details (About & Price) */}
//               {step === 4 && (
//                 <>
//                   <div className="signin-title mb-4">
//                     <h1 className="font-semibold text-3xl">
//                       Professional Details
//                     </h1>
//                     <h1 className="font-light">
//                       Tell us more about your practice
//                     </h1>
//                   </div>

//                   <form
//                     onSubmit={handleSubmit}
//                     className="flex flex-col justify-between h-full gap-3"
//                   >
//                     <div className="about w-full bg-gray-100 rounded-md flex flex-col p-4 text-gray-500">
//                       <div className="flex items-center gap-2 mb-2">
//                         <Info size={26} color="#858585" weight="bold" />
//                         <label className="font-semibold">About You</label>
//                       </div>
//                       <textarea
//                         placeholder="Describe your experience, qualifications, and approach to patient care (minimum 50 characters)"
//                         required
//                         minLength={50}
//                         value={about}
//                         onChange={(e) => setAbout(e.target.value)}
//                         className="w-full outline-none font-semibold text-sm bg-transparent min-h-[100px] resize-none"
//                         disabled={loading}
//                       />
//                     </div>

//                     <div className="price w-full bg-gray-100 h-16 rounded-md flex justify-evenly items-center text-gray-500">
//                       <CurrencyDollar size={26} color="#858585" weight="bold" />
//                       <input
//                         type="text"
//                         placeholder="Consultation Fee (IDR)"
//                         required
//                         pattern="\d*"
//                         value={price}
//                         onChange={(e) => setPrice(e.target.value)}
//                         className="h-full w-[80%] outline-none font-semibold text-sm bg-transparent"
//                         disabled={loading}
//                       />
//                     </div>

//                     {error && (
//                       <div className="text-red-500 text-sm font-medium py-2">
//                         {error}
//                       </div>
//                     )}

//                     <div className="flex gap-2">
//                       <button
//                         type="button"
//                         onClick={() => setStep(3)}
//                         className="w-full bg-gray-200 hover:bg-gray-300 transition-all ease-in-out duration-200 text-gray-700 font-semibold h-16 rounded-md flex justify-center items-center"
//                         disabled={loading}
//                       >
//                         Back
//                       </button>
//                       <button
//                         type="submit"
//                         className="w-full bg-blue-500 hover:bg-blue-600 transition-all ease-in-out duration-200 text-white font-semibold h-16 rounded-md flex justify-center items-center"
//                         disabled={loading}
//                       >
//                         {loading ? (
//                           <span className="flex items-center">
//                             <svg
//                               className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
//                               xmlns="http://www.w3.org/2000/svg"
//                               fill="none"
//                               viewBox="0 0 24 24"
//                             >
//                               <circle
//                                 className="opacity-25"
//                                 cx="12"
//                                 cy="12"
//                                 r="10"
//                                 stroke="currentColor"
//                                 strokeWidth="4"
//                               ></circle>
//                               <path
//                                 className="opacity-75"
//                                 fill="currentColor"
//                                 d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                               ></path>
//                             </svg>
//                             Processing...
//                           </span>
//                         ) : (
//                           "Complete Registration"
//                         )}
//                       </button>
//                     </div>
//                   </form>
//                 </>
//               )}
//             </div>
//           </div>
//         </div>

//         <div className="first-right w-full h-full bg-transparent flex items-center">
//           <div className="second-left w-[75%] h-[85%] bg-blue-500 rounded-r-2xl relative">
//             <img
//               className="absolute bottom-0"
//               src="/assets/doctor-sign.png"
//               alt="Doctor Illustration"
//             />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
