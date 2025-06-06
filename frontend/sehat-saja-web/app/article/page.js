"use client";

import Footer from "@/components/footer/page";
import NavbarWhite from "@/components/navbar-white";
import ArticleSlider from "@/components/ArticleSlider";
import ArticleList from "@/components/ArticleList";
import TopArticle from "@/components/TopArticle";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase"; // Sesuaikan dengan path firebase config Anda

export default function News() {
  const [tempSearchTerm, setTempSearchTerm] = useState("");
  const [tempCategory, setTempCategory] = useState("all");

  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");

  // Dynamic categories from Firebase
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Fetch unique categories from Firebase
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const newsCollection = collection(db, "news");
        const querySnapshot = await getDocs(newsCollection);

        const allLabels = new Set();
        allLabels.add("all"); // Add "all" option

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.labels && Array.isArray(data.labels)) {
            data.labels.forEach((label) => {
              if (label && typeof label === "string") {
                allLabels.add(label.toLowerCase());
              }
            });
          }
        });

        // Convert Set to Array and sort
        const sortedCategories = Array.from(allLabels).sort((a, b) => {
          if (a === "all") return -1;
          if (b === "all") return 1;
          return a.localeCompare(b);
        });

        setCategories(sortedCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Fallback to static categories if Firebase fails
        setCategories([
          "all",
          "medication",
          "nursing",
          "emergency",
          "training",
          "education",
          "patient care",
          "hygiene",
          "technology",
          "innovation",
          "mental health",
          "support",
          "rural",
          "access",
          "diversity",
          "ethics",
          "chronic illness",
          "long-term care",
          "telehealth",
          "future",
          "nutrition",
          "decision making",
        ]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(tempSearchTerm);
    setCategory(tempCategory);
  };

  const handleClearFilters = () => {
    setTempSearchTerm("");
    setTempCategory("all");
    setSearchTerm("");
    setCategory("all");
  };

  const capitalizeWords = (str) => {
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <>
      <div className="all relative">
        <NavbarWhite />

        <div className="bg-blue-50 text-black w-full pt-[8rem] pb-10 px-4 md:px-[14rem]">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Search The Latest Information About Health
            </h1>
            <p className="text-gray-600 text-lg">
              Add your knowledge about health only here!
            </p>
          </div>
        </div>

        {/* Hero Section with Slider */}
        <div className="top-news-slide bg-blue-50 text-black justify-center flex flex-col items-center w-full h-auto pb-10 px-4 md:px-[14rem]">
          <ArticleSlider slideCount={3} autoplayDelay={6000} height="35rem" />

          {/* Trending Articles Section */}
          <div className="news-top flex justify-center items-center w-full mt-16">
            <div className="articles-child w-full h-auto flex flex-col items-center">
              <div className="articles-top flex flex-row w-full justify-between items-center mb-10">
                <h1 className="text-3xl font-semibold mb-1">
                  Trending Articles
                </h1>
              </div>
              <TopArticle articleCount={3} layout="horizontal" />
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bottom-news bg-blue-50 text-black justify-center flex flex-col items-center w-full h-auto py-20 pt-10 px-4 md:px-[14rem]">
          {/* Search Form */}
          <form
            onSubmit={handleSubmit}
            className="w-full bg-white p-7 rounded-md border-gray-300 border-[0.1rem] mb-10 shadow-[0px_0px_10px_rgba(0,0,0,0.15)]"
          >
            {/* Search Input */}
            <div className="w-full h-[3.5rem] mb-4">
              <input
                type="text"
                placeholder="Search articles by title or content..."
                className="w-full h-full px-5 py-4 outline-none border-gray-300 border-[0.1rem] rounded-md bg-blue-50 hover:border-blue-500 focus:border-blue-500 transition-colors"
                value={tempSearchTerm}
                onChange={(e) => setTempSearchTerm(e.target.value)}
              />
            </div>

            {/* Category and Buttons */}
            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* Category Select */}
              <div className="flex flex-col w-full md:w-2/3">
                <label className="text-sm text-gray-600 mb-1">Category</label>
                <select
                  className="w-full h-[3.5rem] px-4 py-3 border-gray-300 border-[0.1rem] rounded-md outline-none hover:border-blue-500 focus:border-blue-500 transition-colors"
                  value={tempCategory}
                  onChange={(e) => setTempCategory(e.target.value)}
                  disabled={categoriesLoading}
                >
                  {categoriesLoading ? (
                    <option value="all">Loading categories...</option>
                  ) : (
                    categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === "all"
                          ? "All Categories"
                          : capitalizeWords(cat)}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 w-full md:w-1/3 h-[3.5rem] mt-5 md:mt-0">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="flex-1 h-full px-4 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Clear
                </button>
                <button
                  type="submit"
                  className="flex-1 h-full px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || category !== "all") && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-gray-600 mb-2">Active filters:</p>
                <div className="flex flex-wrap gap-2">
                  {searchTerm && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      Search: "{searchTerm}"
                    </span>
                  )}
                  {category !== "all" && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Category: {capitalizeWords(category)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </form>

          {/* Articles List */}
          <div className="w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">
                {searchTerm || category !== "all"
                  ? "Search Results"
                  : "All Articles"}
              </h2>
              {(searchTerm || category !== "all") && (
                <button
                  onClick={handleClearFilters}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Show all articles
                </button>
              )}
            </div>

            <ArticleList
              articleCount={20}
              searchTerm={searchTerm}
              selectedCategory={category}
              className="mb-8"
            />
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}

// "use client";

// import Footer from "@/components/footer/page";
// import NavbarWhite from "@/components/navbar-white";
// import ArticleSlider from "@/components/ArticleSlider";
// import ArticleList from "@/components/ArticleList";
// import TopArticle from "@/components/TopArticle";
// import { useState } from "react";

// export default function News() {
//   const [tempSearchTerm, setTempSearchTerm] = useState("");
//   const [tempCategory, setTempCategory] = useState("all");

//   const [searchTerm, setSearchTerm] = useState("");
//   const [category, setCategory] = useState("all");

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     setSearchTerm(tempSearchTerm);
//     setCategory(tempCategory);
//   };

//   return (
//     <>
//       <div className="all relative">
//         <NavbarWhite />
//         <div className="top-news-slide bg-blue-50 text-black justify-center flex flex-col items-center w-full h-auto mt-16 pb-10 pt-20 px-[14rem]">
//           <ArticleSlider />
//           <div className="news-top flex justify-center items-center">
//             <div className="articles-child w-full h-auto flex flex-col items-center">
//               <div className="articles-top flex flex-row w-full justify-between items-center mb-10">
//                 <h1 className="text-3xl font-semibold mb-1">Trending Article</h1>
//               </div>
//               <TopArticle />
//             </div>
//           </div>
//         </div>

//         <div className="bottom-news bg-blue-50 text-black justify-center flex flex-col items-center w-full h-auto py-20 pt-10 px-[14rem]">
//           <form
//             onSubmit={handleSubmit}
//             className="w-full bg-white p-7 rounded-md border-gray-300 border-[0.1rem] mb-10 shadow-[0px_0px_10px_rgba(0,0,0,0.15)]"
//           >
//             <div className="w-full h-[3.5rem] mb-4">
//               <input
//                 type="text"
//                 placeholder="Search Article"
//                 className="w-full h-full px-5 py-4 outline-none border-gray-300 border-[0.1rem] rounded-md bg-blue-50 hover:border-blue-500"
//                 value={tempSearchTerm}
//                 onChange={(e) => setTempSearchTerm(e.target.value)}
//               />
//             </div>

//             <div className="flex flex-row items-center gap-4 h-[4.5rem]">
//               <div className="flex flex-col w-full">
//                 <label className="text-sm text-gray-600">Category</label>
//                 <select
//                   className="w-full h-full px-4 py-3 border-gray-300 border-[0.1rem] rounded-md outline-none"
//                   value={tempCategory}
//                   onChange={(e) => setTempCategory(e.target.value)}
//                 >
//                   <option value="all">All</option>
//                   <option value="medication">Medication</option>
//                   <option value="nursing">Nursing</option>
//                   <option value="emergency">Emergency</option>
//                   <option value="training">Training</option>
//                   <option value="education">Education</option>
//                   <option value="patient care">Patient Care</option>
//                   <option value="hygiene">Hygiene</option>
//                   <option value="technology">Technology</option>
//                   <option value="innovation">Innovation</option>
//                   <option value="mental health">Mental Health</option>
//                   <option value="support">Support</option>
//                   <option value="rural">Rural</option>
//                   <option value="access">Access</option>
//                   <option value="diversity">Diversity</option>
//                   <option value="ethics">Ethics</option>
//                   <option value="chronic illness">Chronic Illness</option>
//                   <option value="long-term care">Long-term Care</option>
//                   <option value="telehealth">Telehealth</option>
//                   <option value="future">Future</option>
//                   <option value="nutrition">Nutrition</option>
//                   <option value="decision making">Decision Making</option>
//                 </select>
//               </div>

//               <div className="w-full h-full flex justify-end">
//                 <button
//                   type="submit"
//                   className="w-full h-full px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
//                 >
//                   Search
//                 </button>
//               </div>
//             </div>
//           </form>

//           <ArticleList
//             articleCount={20}
//             searchTerm={searchTerm}
//             selectedCategory={category}
//           />
//         </div>
//         <Footer />
//       </div>
//     </>
//   );
// }
