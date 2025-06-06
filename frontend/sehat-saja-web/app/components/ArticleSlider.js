"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Link from "next/link";
import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function ArticleSlider({ 
  slideCount = 3,
  autoplayDelay = 5000,
  className = "",
  height = "35rem"
}) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch articles from Firebase
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const newsCollection = collection(db, "news");
        const q = query(
          newsCollection, 
          orderBy("createdAt", "desc"), 
          limit(slideCount + 2) // Ambil sedikit lebih banyak untuk antisipasi
        );
        
        const querySnapshot = await getDocs(q);
        const articlesData = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          articlesData.push({
            id: doc.id,
            title: data.title || "",
            description: data.description || "",
            image: data.image || "/assets/default-article.jpg",
            labels: data.labels || [],
            author: data.author || "Admin",
            content: data.content || [],
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            date: data.date?.toDate ? data.date.toDate() : new Date(),
          });
        });
        
        setArticles(articlesData.slice(0, slideCount)); // Limit sesuai slideCount
        setError(null);
      } catch (err) {
        console.error("Error fetching articles:", err);
        setError("Failed to load articles");
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [slideCount]);

  const truncateDescription = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return <ArticleSliderSkeleton height={height} className={className} />;
  }

  if (error) {
    return (
      <div className={`bg-white shadow-[0px_0px_10px_rgba(0,0,0,0.15)] rounded-md text-black flex justify-center w-full mb-16 ${className}`}>
        <div className="w-full flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className={`bg-white shadow-[0px_0px_10px_rgba(0,0,0,0.15)] rounded-md text-black flex justify-center w-full mb-16 ${className}`}>
        <div className="w-full flex items-center justify-center" style={{ height }}>
          <div className="text-center text-gray-500">
            <p>No articles available for slider</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`top-news-slide bg-white shadow-[0px_0px_10px_rgba(0,0,0,0.15)] rounded-md text-black flex justify-center w-full h-auto mb-16 ${className}`}>
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: autoplayDelay }}
        loop={articles.length > 1} // Only loop if more than 1 article
        className="w-full rounded-md"
        style={{ height }}
      >
        {articles.map((articleItem, index) => (
          <SwiperSlide key={articleItem.id} className="relative">
            <div
              className="news-slide w-full h-full rounded-md bg-cover bg-center"
              style={{ 
                backgroundImage: `url(${articleItem.image})`,
                backgroundColor: '#f3f4f6' // Fallback color
              }}
            >
              {/* Gradient Overlay */}
              <div className="gradien z-20 rounded-md bg-gradient-to-r from-blue-900/90 via-blue-300/40 to-blue-200/50 w-full h-full flex flex-col items-center justify-center">
                <div className="w-[75%] h-[70%] flex flex-col justify-center">
                  <div className="title w-full max-w-[80%]">
                    {/* Article Labels */}
                    {articleItem.labels.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {articleItem.labels.slice(0, 2).map((label, labelIndex) => (
                          <span 
                            key={labelIndex}
                            className="bg-white/20 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full border border-white/30"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Title */}
                    <h1 className="text-3xl md:text-5xl font-normal text-white mb-4 leading-tight">
                      {articleItem.title}
                    </h1>

                    {/* Description */}
                    <p className="text-white/90 text-lg mb-6 leading-relaxed max-w-[90%]">
                      {truncateDescription(articleItem.description, 200)}
                    </p>

                    {/* Date */}
                    <p className="text-white/70 text-sm mb-6">
                      {articleItem.createdAt.toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>

                    {/* CTA Button */}
                    <Link
                      href={`/article/${articleItem.id}`}
                      className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      READ MORE
                    </Link>
                  </div>
                </div>
              </div>

              {/* Image Error Handling */}
              <img
                src={articleItem.image}
                alt={articleItem.title}
                className="hidden"
                onError={(e) => {
                  e.target.parentElement.style.backgroundImage = `url(/assets/default-article.jpg)`;
                }}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

// Loading Skeleton Component
const ArticleSliderSkeleton = ({ height, className }) => {
  return (
    <div className={`bg-white shadow-[0px_0px_10px_rgba(0,0,0,0.15)] rounded-md w-full mb-16 animate-pulse ${className}`}>
      <div 
        className="w-full rounded-md bg-gray-200 flex items-center justify-center"
        style={{ height }}
      >
        <div className="w-[75%] h-[70%] flex flex-col justify-center">
          <div className="w-full max-w-[80%] space-y-4">
            {/* Labels skeleton */}
            <div className="flex gap-2">
              <div className="h-6 bg-gray-300 rounded-full w-20"></div>
              <div className="h-6 bg-gray-300 rounded-full w-24"></div>
            </div>
            
            {/* Title skeleton */}
            <div className="space-y-3">
              <div className="h-8 bg-gray-300 rounded w-full"></div>
              <div className="h-8 bg-gray-300 rounded w-3/4"></div>
            </div>
            
            {/* Description skeleton */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            </div>
            
            {/* Date skeleton */}
            <div className="h-4 bg-gray-300 rounded w-32"></div>
            
            {/* Button skeleton */}
            <div className="h-12 bg-gray-300 rounded-lg w-32"></div>
          </div>
        </div>
      </div>
    </div>
  );
};




// "use client";

// import { Swiper, SwiperSlide } from "swiper/react";
// import { Navigation, Pagination, Autoplay } from "swiper/modules";
// import "swiper/css";
// import "swiper/css/navigation";
// import "swiper/css/pagination";
// import Link from "next/link";
// import { Article } from '@/data/articles';

// export default function ArticleSlider() {
//   const truncateDescription = (text, maxLength = 150) => {
//     if (text.length <= maxLength) return text;
//     return text.substring(0, maxLength) + '...';
//   };

//   return (
//     <div className="top-news-slide bg-white shadow-[0px_0px_10px_rgba(0,0,0,0.15)] rounded-md text-black flex justify-center w-full h-auto mb-16">
//       <Swiper
//         modules={[Navigation, Pagination, Autoplay]}
//         navigation
//         pagination={{ clickable: true }}
//         autoplay={{ delay: 5000 }}
//         loop
//         className="w-full h-[35rem] rounded-md"
//       >
//         {Article.map((articleItem, index) => {
//           if (index < 3) {
//             return(
//               <SwiperSlide key={index} className="relative">
//                 <div
//                   className="news-slide w-full h-full rounded-md bg-cover bg-center"
//                   style={{ backgroundImage: `url(${articleItem.image})` }}
//                 >
//                   <div className="gradien z-20 rounded-md bg-gradient-to-r from-blue-900/90 via-blue-300/40 to-blue-200/50 w-full h-full flex flex-col items-center justify-center">
//                     <div className="w-[75%] h-[70%]">
//                       <div className="title w-[80%]">
//                         <h1 className="text-5xl font-normal text-white mb-6 leading-16">
//                           {articleItem.title}
//                         </h1>
//                         <Link
//                           href={`../article/${articleItem.id}`}
//                           className="bg-white text-blue-500 px-6 py-2 rounded-md hover:bg-gray-200 transition"
//                         >
//                           VIEW DETAILS
//                         </Link>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </SwiperSlide>
//             )
//           }
//         }
//         )}
//       </Swiper>
//     </div>
//   );
// }
