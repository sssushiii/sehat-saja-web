import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "../../lib/firebase"; // Sesuaikan dengan path firebase config Anda
import { useRouter } from "next/navigation";

const ArticleList = ({ 
  articleCount, 
  searchTerm = "", 
  selectedCategory = "all",
  showLoadingCount = 6,
  className = ""
}) => {
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
          limit(50) // Ambil maksimal 50 artikel untuk filtering
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
        console.error("Error fetching articles:", err);
        setError("Failed to load articles");
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  // Filter articles berdasarkan search dan category
  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      article.labels.some((label) => label.toLowerCase() === selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  // Apply article count limit only if specified
  const displayedArticles = articleCount 
    ? filteredArticles.slice(0, articleCount)
    : filteredArticles;

  if (loading) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 ${className}`}>
        {Array.from({ length: showLoadingCount }).map((_, index) => (
          <ArticleCardSkeleton key={index} />
        ))}
      </div>
    );
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

  if (displayedArticles.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <p>No articles found</p>
        {(searchTerm || selectedCategory !== "all") && (
          <p className="text-sm mt-2">Try adjusting your search or filter criteria</p>
        )}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 ${className}`}>
      {displayedArticles.map((articleItem) => (
        <ArticleCard key={articleItem.id} {...articleItem} />
      ))}
    </div>
  );
};

const ArticleCard = ({ id, title, image, labels, description, createdAt }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="w-full h-full shadow-md border border-gray-200 flex flex-col rounded-lg hover:border-blue-500 transition-all duration-200 bg-white overflow-hidden hover:shadow-lg">
      <Link href={`/article/${id}`} className="h-full flex flex-col md:flex-row">
        {/* Image Container - Full width on mobile, side on desktop */}
        <div className="w-full md:w-2/5 h-48 md:h-full relative">
          <Image 
            src={image} 
            alt={title} 
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={(e) => {
              e.target.src = "/assets/default-article.jpg";
            }}
          />
        </div>
        
        {/* Content Container */}
        <div className="p-4 md:p-5 w-full md:w-3/5 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold text-lg line-clamp-2 text-left">{title}</h2>
            <p className="text-xs text-gray-400">{formatDate(createdAt)}</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {labels.slice(0, 3).map((label, index) => (
              <span 
                key={index} 
                className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-md border border-blue-100"
              >
                {label}
              </span>
            ))}
            {labels.length > 3 && (
              <span className="text-xs text-gray-400">+{labels.length - 3} more</span>
            )}
          </div>
          
          <p className="text-sm text-gray-600 line-clamp-3 text-left">{description}</p>
        </div>
      </Link>
    </div>
  );
};

// Loading skeleton component
const ArticleCardSkeleton = () => {
  return (
    <div className="w-full h-full shadow-md border border-gray-200 flex flex-col rounded-lg bg-white overflow-hidden animate-pulse">
      <div className="h-full flex flex-col md:flex-row">
        {/* Image Skeleton */}
        <div className="w-full md:w-2/5 h-48 md:h-full bg-gray-200"></div>
        
        {/* Content Skeleton */}
        <div className="p-4 md:p-5 w-full md:w-3/5 flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <div className="h-5 bg-gray-200 rounded w-full"></div>
            <div className="h-5 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
          
          <div className="flex gap-2">
            <div className="h-6 bg-gray-200 rounded w-16"></div>
            <div className="h-6 bg-gray-200 rounded w-20"></div>
          </div>
          
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleList;



// import Link from "next/link";
// import Image from "next/image";
// import { Article } from "@/data/articles";

// const ArticleList = ({ articleCount, searchTerm = "", selectedCategory = "all" }) => {
//   const filteredArticle = Article.filter((article) => {
//     const matchesSearch =
//       article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       article.description.toLowerCase().includes(searchTerm.toLowerCase());

//     const matchesCategory =
//       selectedCategory === "all" ||
//       article.labels.some((label) => label.toLowerCase() === selectedCategory.toLowerCase());

//     return matchesSearch && matchesCategory;
//   }).slice(0, articleCount);

//   return (
//     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
//       {filteredArticle.map((articleItem) => (
//         <ArticleCard key={articleItem.id} {...articleItem} />
//       ))}
//     </div>
//   );
// };

// const ArticleCard = ({ id, title, image, labels, description }) => {
//   return (
//     <div className="w-full h-full shadow-md border border-gray-200 flex flex-col rounded-lg hover:border-blue-500 transition-all duration-200 bg-white overflow-hidden hover:shadow-lg">
//       <Link href={`/article/${id}`} className="h-full flex flex-col md:flex-row">
//         {/* Image Container - Full width on mobile, side on desktop */}
//         <div className="w-full md:w-2/5 h-48 md:h-full relative">
//           <Image 
//             src={image} 
//             alt={title} 
//             fill
//             className="object-cover"
//             sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
//           />
//         </div>
        
//         {/* Content Container */}
//         <div className="p-4 md:p-5 w-full md:w-3/5 flex flex-col gap-3 text-center">
//           <h2 className="font-semibold text-lg line-clamp-2">{title}</h2>
          
//           <div className="flex flex-wrap gap-2 justify-evenly">
//             {labels.map((label, index) => (
//               <span 
//                 key={index} 
//                 className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-md border border-blue-100"
//               >
//                 {label}
//               </span>
//             ))}
//           </div>
          
//           <p className="text-sm text-gray-600 line-clamp-3">{description}</p>
//         </div>
//       </Link>
//     </div>
//   );
// };

// export default ArticleList;