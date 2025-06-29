"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../lib/firebase"; // Sesuaikan dengan path firebase config Anda

const TopArticle = ({ 
  articleCount = 3,
  className = "",
  layout = "horizontal" // "horizontal" or "vertical"
}) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch top articles from Firebase
  useEffect(() => {
    const fetchTopArticles = async () => {
      try {
        setLoading(true);
        const newsCollection = collection(db, "news");
        const q = query(
          newsCollection, 
          orderBy("createdAt", "desc"), 
          limit(articleCount)
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
        
        setArticles(articlesData);
        setError(null);
      } catch (err) {
        console.error("Error fetching top articles:", err);
        setError("Failed to load articles");
      } finally {
        setLoading(false);
      }
    };

    fetchTopArticles();
  }, [articleCount]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Hapus fungsi truncateText yang tidak digunakan

  if (loading) {
    return <TopArticleSkeleton articleCount={articleCount} layout={layout} className={className} />;
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <p>No top articles found</p>
      </div>
    );
  }

  // Layout horizontal (default - side by side)
  if (layout === "horizontal") {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full ${className}`}>
        {articles.map((article) => (
          <TopArticleCard key={article.id} article={article} />
        ))}
      </div>
    );
  }

  // Layout vertical (stacked)
  return (
    <div className={`space-y-4 w-full ${className}`}>
      {articles.map((article) => (
        <TopArticleCardVertical key={article.id} article={article} />
      ))}
    </div>
  );
};

// Horizontal Card Component (Default - sesuai design asli)
const TopArticleCard = ({ article }) => {
  // Fungsi truncate lokal di dalam komponen
  const truncateDescription = (text, maxLength = 120) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="group w-full h-full shadow-md border border-gray-200 flex flex-col rounded-lg hover:scale-105 hover:border-blue-500 transition-all duration-200 bg-white hover:shadow-lg overflow-hidden">
      <Link href={`/article/${article.id}`} className="h-full flex flex-col">
        {/* Image */}
        <div className="w-full h-48 md:h-56 lg:h-64 relative">
          <Image
            src={article.image}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={(e) => {
              e.target.src = "/assets/default-article.jpg";
            }}
          />
        </div>

        {/* Content */}
        <div className="p-4 md:p-5 flex flex-col gap-3 flex-grow text-center justify-between">
          <h2 className="font-semibold text-lg line-clamp-2">
            {article.title}
          </h2>
          
          <div className="flex flex-wrap justify-center gap-2">
            {article.labels.slice(0, 2).map((label, index) => (
              <span
                key={index}
                className="bg-blue-50 text-blue-600 text-xs px-3 py-1 rounded-md border border-blue-100"
              >
                {label}
              </span>
            ))}
          </div>
          
          <p className="text-sm text-gray-600 line-clamp-3">
            {truncateDescription(article.description, 120)}
          </p>
        </div>
      </Link>
    </div>
  );
};

// Vertical Card Component
const TopArticleCardVertical = ({ article }) => {
  // Fungsi truncate lokal di dalam komponen
  const truncateDescription = (text, maxLength = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-blue-500">
      <Link href={`/article/${article.id}`} className="block">
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="relative h-48 md:h-32 md:w-48 flex-shrink-0">
            <Image
              src={article.image}
              alt={article.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 200px"
              onError={(e) => {
                e.target.src = "/assets/default-article.jpg";
              }}
            />
            
            {/* Labels overlay */}
            {article.labels.length > 0 && (
              <div className="absolute top-2 left-2">
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-md">
                  {article.labels[0]}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 flex-1">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <span>{article.author}</span>
              <span>•</span>
              <span>{formatDate(article.createdAt)}</span>
            </div>
            
            <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
              {article.title}
            </h3>
            
            <p className="text-gray-600 text-sm line-clamp-2">
              {truncateDescription(article.description, 150)}
            </p>
            
            {/* Labels */}
            {article.labels.length > 1 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {article.labels.slice(1, 4).map((label, index) => (
                  <span 
                    key={index}
                    className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded"
                  >
                    {label}
                  </span>
                ))}
                {article.labels.length > 4 && (
                  <span className="text-xs text-gray-400">+{article.labels.length - 4}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

// Loading Skeleton Component
const TopArticleSkeleton = ({ articleCount, layout, className }) => {
  const skeletons = Array.from({ length: articleCount });

  if (layout === "horizontal") {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full ${className}`}>
        {skeletons.map((_, index) => (
          <div key={index} className="group w-full h-full shadow-md border border-gray-200 flex flex-col rounded-lg bg-white overflow-hidden animate-pulse">
            <div className="w-full h-48 md:h-56 lg:h-64 bg-gray-200"></div>
            <div className="p-4 md:p-5 flex flex-col gap-3 flex-grow text-center">
              <div className="h-5 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2 mx-auto"></div>
              <div className="flex justify-center gap-2 mb-3">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="space-y-1">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-4 w-full ${className}`}>
      {skeletons.map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden animate-pulse">
          <div className="flex flex-col md:flex-row">
            <div className="h-48 md:h-32 md:w-48 bg-gray-200"></div>
            <div className="p-4 flex-1">
              <div className="flex gap-2 mb-2">
                <div className="h-3 bg-gray-200 rounded w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-5 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="space-y-1">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
              <div className="flex gap-1 mt-3">
                <div className="h-5 bg-gray-200 rounded w-12"></div>
                <div className="h-5 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TopArticle;





// import Link from 'next/link';
// import Image from 'next/image';
// import { Article } from '@/data/articles';

// const TopArticle = () => {
//   const truncateDescription = (text, maxLength = 150) => {
//     if (!text) return '';
//     if (text.length <= maxLength) return text;
//     return text.substring(0, maxLength) + '...';
//   };

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 w-full">
//       {Article.slice(0, 3).map((articleItem) => (
//         <div 
//           key={articleItem.id} 
//           className="group w-full h-full shadow-md border border-gray-200 flex flex-col rounded-lg hover:scale-105 hover:border-blue-500 transition-all duration-200 bg-white hover:shadow-lg overflow-hidden"
//         >
//           <Link href={`/article/${articleItem.id}`} className="h-full flex flex-col">
//             <div className="w-full h-48 md:h-56 lg:h-64 relative">
//               <Image
//                 src={articleItem.image}
//                 alt={articleItem.title}
//                 fill
//                 className="object-cover"
//                 sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
//               />
//             </div>
            
//             <div className="p-4 md:p-5 flex flex-col gap-3 flex-grow text-center">
//               <h2 className="font-semibold text-lg line-clamp-2">
//                 {articleItem.title}
//               </h2>
              
//               <div className="flex flex-wrap justify-center gap-2">
//                 {articleItem.labels.slice(0, 2).map((label, index) => (
//                   <span
//                     key={index}
//                     className="bg-blue-50 text-blue-600 text-xs px-3 py-1 rounded-md border border-blue-100"
//                   >
//                     {label}
//                   </span>
//                 ))}
//               </div>
              
//               <p className="text-sm text-gray-600 line-clamp-3">
//                 {truncateDescription(articleItem.description, 120)}
//               </p>
//             </div>
//           </Link>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default TopArticle;
