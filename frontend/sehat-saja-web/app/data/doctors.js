export const Doctors = [
    {
      id: 1,
      title: "Dr. Hakim Ismail",
      image: "/assets/doctor_1.webp",
      specialization: ["Dokter Umum"],
      price: "Rp 45.000",
      patient: 156,
      rating: 4.8,
      years: "5yr+",
      description: "Dr. Hakim Ismail is a compassionate general practitioner with over five years of experience in diagnosing and treating a wide range of health conditions. He focuses on providing holistic care, ensuring his patients' overall well-being. Dr. Hakim believes in building lasting relationships with his patients to offer personalized medical advice and treatment.",
      schedules: [
        { day: "Monday", times: ["08:00-09:00", "10:30-11:00", "13:00-14:00"] },
        { day: "Wednesday", times: ["09:00-10:00", "11:00-12:00", "14:00-15:00"] },
        { day: "Friday", times: ["08:30-09:30", "10:30-11:30", "13:30-14:30"] }
      ]
    },
    {
      id: 2,
      title: "Dr. Dina Kartika",
      image: "/assets/doctor_2.jpg",
      specialization: ["Dokter Gigi"],
      price: "Rp 50.000",
      patient: 78,
      rating: 4.9,
      years: "7yr+",
      description: "Dr. Dina Kartika is a skilled dentist with seven years of experience in oral care. Specializing in both cosmetic and restorative dentistry, she is passionate about improving smiles and dental health. Dr. Dina ensures a comfortable experience for her patients while delivering high-quality treatments like implants, fillings, and teeth whitening.",
      schedules: [
        { day: "Tuesday", times: ["08:00-09:00", "10:00-11:00", "13:00-14:00"] },
        { day: "Thursday", times: ["09:00-10:00", "11:00-12:00", "14:00-15:00"] },
        { day: "Saturday", times: ["08:00-12:00"] }
      ]
    },
    {
      id: 3,
      title: "Dr. Mulyono Kencono",
      image: "/assets/doctor_3.jpg",
      specialization: ["Dokter Tulang"],
      price: "Rp 35.000",
      patient: 31,
      rating: 4.7,
      years: "6yr+",
      description: "Dr. Mulyono Kencono is an orthopedic doctor with over six years of experience in treating bone and joint disorders. He specializes in sports injuries, fractures, and joint replacements, focusing on restoring mobility and reducing pain for his patients. Dr. Mulyono emphasizes non-invasive treatments and personalized rehabilitation programs.",
      schedules: [
        { day: "Monday", times: ["08:00-09:30", "10:30-12:00"] },
        { day: "Thursday", times: ["13:00-14:00", "15:00-16:00"] },
        { day: "Saturday", times: ["09:00-11:00"] }
      ]
    },
    {
      id: 4,
      title: "Dr. Arief Nugroho",
      image: "/assets/doctor_4.jpg",
      specialization: ["Dokter THT"],
      price: "Rp 40.000",
      patient: 89,
      rating: 4.8,
      years: "8yr+",
      description: "Dr. Arief Nugroho is a highly experienced ENT specialist with eight years of practice. He treats a wide range of ear, nose, and throat conditions, from allergies to complex surgeries. Dr. Arief is committed to improving his patients' quality of life by offering innovative treatments for hearing loss, sinus problems, and throat disorders.",
      schedules: [
        { day: "Tuesday", times: ["08:00-09:00", "10:00-11:00", "14:00-15:00"] },
        { day: "Friday", times: ["09:00-10:00", "11:30-12:30"] }
      ]
    },
    {
      id: 5,
      title: "Dr. Tika Nuraini",
      image: "/assets/doctor_5.jpg",
      specialization: ["Dokter Kulit"],
      price: "Rp 50.000",
      patient: 54,
      rating: 4.6,
      years: "4yr+",
      description: "Dr. Tika Nuraini is a dermatologist with four years of experience in treating skin conditions such as acne, eczema, and psoriasis. She is known for her gentle approach and effective treatments, focusing on both the medical and cosmetic aspects of skin health. Dr. Tika helps her patients achieve healthy, radiant skin.",
      schedules: [
        { day: "Wednesday", times: ["08:00-09:30", "10:00-11:00"] },
        { day: "Thursday", times: ["13:30-14:30", "15:00-16:00"] }
      ]
    },
    {
      id: 6,
      title: "Dr. Alberto Azis",
      image: "/assets/doctor_6.jpg",
      specialization: ["Dokter Anak"],
      price: "Rp 30.000",
      patient: 25,
      rating: 4.7,
      years: "3yr+",
      description: "Dr. Alberto Azis is a pediatrician with three years of experience in treating children of all ages. He specializes in pediatric care, from routine check-ups to managing childhood diseases. Dr. Alberto is dedicated to ensuring children's health, growth, and development, while providing parents with the knowledge they need to care for their little ones.",
      schedules: [
        { day: "Monday", times: ["09:00-10:00", "11:00-12:00"] },
        { day: "Thursday", times: ["14:00-15:30"] },
        { day: "Minggu", times: ["08:00-10:00"] }
      ]
    },
    {
      id: 7,
      title: "Dr. Kevin Pratama",
      image: "/assets/doctor_7.jpg",
      specialization: ["Dokter Kandungan"],
      price: "Rp 45.000",
      patient: 74,
      rating: 4.7,
      years: "6yr+",
      description: "Dr. Kevin Pratama is an experienced obstetrician and gynecologist with six years of experience. He provides comprehensive care for women's health, including pregnancy management, childbirth, and reproductive health. Dr. Kevin prioritizes his patients' comfort and well-being, offering personalized guidance throughout their reproductive journey.",
      schedules: [
        { day: "Tuesday", times: ["08:30-09:30", "11:00-12:00"] },
        { day: "Friday", times: ["13:00-14:00", "15:00-16:00"] }
      ]
    },
    {
      id: 8,
      title: "Dr. Rina Fitria",
      image: "/assets/doctor_8.jpg",
      specialization: ["Dokter Saraf"],
      price: "Rp 35.000",
      patient: 58,
      rating: 4.9,
      years: "10yr+",
      description: "Dr. Rina Fitria is a neurologist with over ten years of experience in treating neurological disorders. She specializes in conditions like migraines, epilepsy, and neurodegenerative diseases. Dr. Rina takes a patient-centered approach, helping her patients understand their conditions and offering effective treatment options to manage symptoms.",
      schedules: [
        { day: "Monday", times: ["08:00-09:30", "10:30-12:00"] },
        { day: "Thursday", times: ["13:30-14:30"] },
        { day: "Saturday", times: ["09:00-11:00"] }
      ]
    },
    {
      id: 9,
      title: "Dr. Jihan Kartika",
      image: "/assets/doctor_9.jpg",
      specialization: ["Dokter Mata"],
      price: "Rp 40.000",
      patient: 61,
      rating: 4.8,
      years: "5yr+",
      description: "Dr. Jihan Kartika is an ophthalmologist with five years of experience in diagnosing and treating various eye conditions. From routine eye exams to advanced surgeries, Dr. Jihan ensures her patients' vision is in good hands. She is passionate about preventing blindness and improving the quality of life for those with eye-related issues.",
      schedules: [
        { day: "Wednesday", times: ["08:00-09:00", "10:00-11:00", "13:00-14:00"] },
        { day: "Friday", times: ["09:00-10:30"] }
      ]
    },
    {
      id: 10,
      title: "Dr. Rizky Firdaus",
      image: "/assets/doctor_10.jpg",
      specialization: ["Dokter Penyakit Dalam"],
      price: "Rp 50.000",
      patient: 33,
      rating: 4.8,
      years: "9yr+",
      description: "Dr. Rizky Firdaus is an internist with nine years of experience in managing internal medicine conditions. He specializes in treating chronic diseases such as diabetes, hypertension, and heart disease. Dr. Rizky believes in proactive care and helps his patients manage their conditions to improve overall health and quality of life.",
      schedules: [
        { day: "Monday", times: ["08:30-09:30", "10:30-11:30", "13:30-14:30"] },
        { day: "Thursday", times: ["09:00-10:00", "11:00-12:00", "14:00-15:00"] }
      ]
    }
  ];
  