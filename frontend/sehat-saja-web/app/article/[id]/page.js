"use client";

import NavbarWhite from "@/components/navbar-white";
import Footer from "@/components/footer/page";
import { notFound } from 'next/navigation';
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CaretLeft, CaretUpIcon } from "@phosphor-icons/react/dist/ssr";
import { useState, useEffect, use } from "react"; // Tambah 'use' import
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../lib/firebase";
import {
  onAuthStateChanged,
} from "firebase/auth";

export default function ArticlePage({ params }) {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Cek role dan redirect jika bukan "user"
            if (userData.role === "admin") {
              router.push("/dashboard/admin");
              return;
            } else if (userData.role === "doctor") {
              router.push("/dashboard/doctor");
              return;
            } else if (userData.role !== "user") {
              // Role tidak dikenal, redirect ke home
              router.push("/");
              return;
            }
            
            // Jika role adalah "user", biarkan akses halaman
            // Set user state jika diperlukan
            setUser(currentUser);
            setLoading(false);
          } else {
            // User document tidak ada, redirect ke home
            router.push("/");
          }
        } catch (error) {
          console.error("Error checking user role:", error);
          router.push("/sign-in");
        }
      } else {
        // User tidak login, redirect ke sign-in
        router.push("/sign-in");
      }
    });
  
    return () => unsubscribe();
  }, [router]);
  // Unwrap params menggunakan React.use()
  const { id } = use(params);
  
  const [article, setArticle] = useState(null);
  const [error, setError] = useState(null);

  // Fetch single article from Firebase
  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const articleDoc = doc(db, "news", id);
        const articleSnapshot = await getDoc(articleDoc);
        
        if (articleSnapshot.exists()) {
          const data = articleSnapshot.data();
          setArticle({
            id: articleSnapshot.id,
            title: data.title || "",
            description: data.description || "",
            image: data.image || "/assets/default-article.jpg",
            labels: data.labels || [],
            author: data.author || "Admin",
            content: data.content || [],
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
            date: data.date?.toDate ? data.date.toDate() : new Date(),
          });
        } else {
          setError("Article not found");
        }
      } catch (err) {
        console.error("Error fetching article:", err);
        setError("Failed to load article");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchArticle();
    }
  }, [id]);

  // Loading state
  if (loading) {
    return <ArticlePageSkeleton />;
  }

  // Error state
  if (error) {
    return <ArticlePageError error={error} />;
  }

  // Article not found
  if (!article) {
    notFound();
  }

  // Function untuk memisahkan content menjadi paragraf yang lebih readable
  const processContent = (content) => {
    if (!content || !Array.isArray(content)) return [];
    
    const processedParagraphs = [];
    
    content.forEach((item, index) => {
      if (typeof item === 'string') {
        // Method 1: Split by double line breaks (\n\n)
        if (item.includes('\n\n')) {
          const splitByLineBreaks = item.split('\n\n').filter(p => p.trim());
          processedParagraphs.push(...splitByLineBreaks);
          return;
        }
        
        // Method 2: Split by single line breaks (\n) if text is very long
        if (item.includes('\n') && item.length > 300) {
          const splitByLines = item.split('\n').filter(p => p.trim());
          processedParagraphs.push(...splitByLines);
          return;
        }
        
        // Method 3: Split very long paragraphs (>800 chars) by sentences
        if (item.length > 800) {
          const sentences = item.split(/(?<=[.!?])\s+(?=[A-Z])/);
          let currentParagraph = '';
          
          sentences.forEach((sentence, sentenceIndex) => {
            currentParagraph += sentence + ' ';
            
            // Create new paragraph every 2-3 sentences or when reaching ~400 chars
            if (currentParagraph.length > 400 || (sentenceIndex + 1) % 3 === 0 || sentenceIndex === sentences.length - 1) {
              if (currentParagraph.trim()) {
                processedParagraphs.push(currentParagraph.trim());
              }
              currentParagraph = '';
            }
          });
          return;
        }
        
        // Default: keep as single paragraph
        processedParagraphs.push(item);
      }
    });
    
    return processedParagraphs;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Process content untuk paragraf yang lebih readable
  const processedContent = article ? processContent(article.content || []) : [];

  return (
    <>
      <div className="all relative" id="#">
        <NavbarWhite />
        
        <div className="article-container bg-blue-50 text-black w-full min-h-screen pt-20 pb-20 px-4 md:px-[14rem]">
          <div className="article-content bg-white p-6 md:p-10 rounded-md shadow-lg">
            
            {/* Back Button - Mobile Responsive */}
            <div className="mb-6">
              <Link 
                href="/article" 
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
              >
                <CaretLeft size={20} className="mr-2"/>
                <span className="hidden sm:inline">Back to Articles</span>
                <span className="sm:hidden">Back</span>
              </Link>
            </div>

            {/* Article Header */}
            <div className="article-header mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
                {article.title}
              </h1>
              
              {/* Labels */}
              <div className="flex flex-wrap gap-2 mb-4">
                {article.labels.map((label, index) => (
                  <span 
                    key={index} 
                    className="bg-blue-50 text-blue-600 text-sm py-1 px-3 rounded-md border border-blue-200"
                  >
                    {label}
                  </span>
                ))}
              </div>
              
              {/* Author and Date */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-600 mb-6">
                <div className="flex items-center gap-2">
                  <span className="font-medium">By {article.author}</span>
                </div>
                <span className="hidden sm:inline">•</span>
                <div className="flex items-center gap-2">
                  <span>{formatDate(article.date)}</span>
                </div>
              </div>
            </div>
            
            {/* Article Image */}
            <div className="article-image w-full h-64 md:h-[35rem] relative mb-8 rounded-lg overflow-hidden">
              <Image
                src={article.image}
                alt={article.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 1200px"
                onError={(e) => {
                  e.target.src = "/assets/default-article.jpg";
                }}
              />
            </div>
            
            {/* Article Description */}
            {article.description && (
              <div className="article-description mb-8 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <p className="text-gray-700 leading-relaxed font-medium italic">
                  {article.description}
                </p>
              </div>
            )}
            
            {/* Article Content */}
            <div className="article-body prose prose-lg max-w-none">
              {processedContent.length > 0 ? (
                processedContent.map((paragraph, index) => (
                  <p key={index} className="mb-6 text-gray-700 leading-relaxed text-justify">
                    {paragraph}
                  </p>
                ))
              ) : (
                <p className="text-gray-500 italic">
                  Content is not available for this article.
                </p>
              )}
            </div>
            
            {/* Article Footer */}
            <div className="article-footer mt-12 pt-8 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="text-sm text-gray-500">
                  Published on {formatDate(article.createdAt)}
                </div>
                
                {/* Share buttons or additional info could go here */}
                <div className="flex flex-wrap gap-2">
                  {article.labels.slice(0, 3).map((label, index) => (
                    <span 
                      key={index}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                    >
                      #{label.toLowerCase().replace(``, ` `)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Navigation */}
            <div className="mt-10 pt-6 border-t border-gray-200">
              <Link 
                href="#" 
                className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
              >
                <CaretUpIcon size={20} className="mr-3"/>
                Back to Top
              </Link>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    </>
  );
}

// Loading Skeleton Component
const ArticlePageSkeleton = () => {
  return (
    <div className="all relative">
      <NavbarWhite />
      
      <div className="article-container bg-blue-50 text-black w-full min-h-screen pt-20 pb-20 px-4 md:px-[14rem]">
        <div className="article-content bg-white p-6 md:p-10 rounded-md shadow-lg animate-pulse">
          
          {/* Back Button Skeleton */}
          <div className="mb-6">
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>

          {/* Header Skeleton */}
          <div className="article-header mb-8">
            <div className="h-8 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            
            <div className="flex gap-2 mb-4">
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
              <div className="h-6 bg-gray-200 rounded w-18"></div>
            </div>
            
            <div className="flex gap-4 mb-6">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
          
          {/* Image Skeleton */}
          <div className="w-full h-64 md:h-[35rem] bg-gray-200 rounded-lg mb-8"></div>
          
          {/* Content Skeleton */}
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
          
          {/* Back Button Skeleton */}
          <div className="mt-10">
            <div className="h-12 bg-gray-200 rounded w-48"></div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

// Error Component
const ArticlePageError = ({ error }) => {
  return (
    <div className="all relative">
      <NavbarWhite />
      
      <div className="article-container bg-blue-50 text-black w-full min-h-screen pt-20 pb-20 px-4 md:px-[14rem]">
        <div className="article-content bg-white p-6 md:p-10 rounded-md shadow-lg">
          
          {/* Back Button */}
          <div className="mb-6">
            <Link 
              href="/article" 
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
            >
              <CaretLeft size={20} className="mr-2"/>
              Back to Articles
            </Link>
          </div>

          {/* Error Message */}
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📰</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Article Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              {error === "Article not found" 
                ? "The article you`re looking for doesn`t exist or has been removed."
                : "There was an error loading this article. Please try again later."
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/article"
                className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Browse All Articles
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};







// "use client";

// import NavbarWhite from "@/components/navbar-white";
// import Footer from "@/components/footer/page";
// import { notFound } from 'next/navigation';
// import Link from "next/link";
// import Image from "next/image";
// import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
// import { useState, useEffect, use } from "react"; // Tambah 'use' import
// import { doc, getDoc } from "firebase/firestore";
// import { db } from "../../../lib/firebase"; // Sesuaikan dengan path firebase config Anda

// export default function ArticlePage({ params }) {
//   // Unwrap params menggunakan React.use()
//   const { id } = use(params);
  
//   const [article, setArticle] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Fetch single article from Firebase
//   useEffect(() => {
//     const fetchArticle = async () => {
//       try {
//         setLoading(true);
//         setError(null);
        
//         const articleDoc = doc(db, "news", id);
//         const articleSnapshot = await getDoc(articleDoc);
        
//         if (articleSnapshot.exists()) {
//           const data = articleSnapshot.data();
//           setArticle({
//             id: articleSnapshot.id,
//             title: data.title || "",
//             description: data.description || "",
//             image: data.image || "/assets/default-article.jpg",
//             labels: data.labels || [],
//             author: data.author || "Admin",
//             content: data.content || [],
//             createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
//             date: data.date?.toDate ? data.date.toDate() : new Date(),
//           });
//         } else {
//           setError("Article not found");
//         }
//       } catch (err) {
//         console.error("Error fetching article:", err);
//         setError("Failed to load article");
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (id) {
//       fetchArticle();
//     }
//   }, [id]);

//   // Loading state
//   if (loading) {
//     return <ArticlePageSkeleton />;
//   }

//   // Error state
//   if (error) {
//     return <ArticlePageError error={error} />;
//   }

//   // Article not found
//   if (!article) {
//     notFound();
//   }

//   const formatDate = (date) => {
//     return new Date(date).toLocaleDateString('id-ID', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric'
//     });
//   };

//   return (
//     <>
//       <div className="all relative">
//         <NavbarWhite />
        
//         <div className="article-container bg-blue-50 text-black w-full min-h-screen pt-20 pb-20 px-4 md:px-[14rem]">
//           <div className="article-content bg-white p-6 md:p-10 rounded-md shadow-lg">
            
//             {/* Back Button - Mobile Responsive */}
//             <div className="mb-6">
//               <Link 
//                 href="/article" 
//                 className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
//               >
//                 <CaretLeft size={20} className="mr-2"/>
//                 <span className="hidden sm:inline">Back to Articles</span>
//                 <span className="sm:hidden">Back</span>
//               </Link>
//             </div>

//             {/* Article Header */}
//             <div className="article-header mb-8">
//               <h1 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
//                 {article.title}
//               </h1>
              
//               {/* Labels */}
//               <div className="flex flex-wrap gap-2 mb-4">
//                 {article.labels.map((label, index) => (
//                   <span 
//                     key={index} 
//                     className="bg-blue-50 text-blue-600 text-sm py-1 px-3 rounded-md border border-blue-200"
//                   >
//                     {label}
//                   </span>
//                 ))}
//               </div>
              
//               {/* Author and Date */}
//               <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-600 mb-6">
//                 <div className="flex items-center gap-2">
//                   <span className="font-medium">By {article.author}</span>
//                 </div>
//                 <span className="hidden sm:inline">•</span>
//                 <div className="flex items-center gap-2">
//                   <span>{formatDate(article.date)}</span>
//                 </div>
//               </div>
//             </div>
            
//             {/* Article Image */}
//             <div className="article-image w-full h-64 md:h-[35rem] relative mb-8 rounded-lg overflow-hidden">
//               <Image
//                 src={article.image}
//                 alt={article.title}
//                 fill
//                 className="object-cover"
//                 sizes="(max-width: 768px) 100vw, 1200px"
//                 onError={(e) => {
//                   e.target.src = "/assets/default-article.jpg";
//                 }}
//               />
//             </div>
            
//             {/* Article Description */}
//             {article.description && (
//               <div className="article-description mb-8 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
//                 <p className="text-gray-700 leading-relaxed font-medium italic">
//                   {article.description}
//                 </p>
//               </div>
//             )}
            
//             {/* Article Content */}
//             <div className="article-body prose prose-lg max-w-none">
//               {article.content && article.content.length > 0 ? (
//                 article.content.map((paragraph, index) => (
//                   <p key={index} className="mb-6 text-gray-700 leading-relaxed text-justify">
//                     {paragraph}
//                   </p>
//                 ))
//               ) : (
//                 <p className="text-gray-500 italic">
//                   Content is not available for this article.
//                 </p>
//               )}
//             </div>
            
//             {/* Article Footer */}
//             <div className="article-footer mt-12 pt-8 border-t border-gray-200">
//               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//                 <div className="text-sm text-gray-500">
//                   Published on {formatDate(article.createdAt)}
//                 </div>
                
//                 {/* Share buttons or additional info could go here */}
//                 <div className="flex flex-wrap gap-2">
//                   {article.labels.slice(0, 3).map((label, index) => (
//                     <span 
//                       key={index}
//                       className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
//                     >
//                       #{label.toLowerCase().replace(' ', '')}
//                     </span>
//                   ))}
//                 </div>
//               </div>
//             </div>
            
//             {/* Navigation */}
//             <div className="mt-10 pt-6 border-t border-gray-200">
//               <Link 
//                 href="/article" 
//                 className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
//               >
//                 <CaretLeft size={20} className="mr-3"/>
//                 Back to All Articles
//               </Link>
//             </div>
//           </div>
//         </div>
        
//         <Footer />
//       </div>
//     </>
//   );
// }

// // Loading Skeleton Component
// const ArticlePageSkeleton = () => {
//   return (
//     <div className="all relative">
//       <NavbarWhite />
      
//       <div className="article-container bg-blue-50 text-black w-full min-h-screen pt-20 pb-20 px-4 md:px-[14rem]">
//         <div className="article-content bg-white p-6 md:p-10 rounded-md shadow-lg animate-pulse">
          
//           {/* Back Button Skeleton */}
//           <div className="mb-6">
//             <div className="h-10 bg-gray-200 rounded w-32"></div>
//           </div>

//           {/* Header Skeleton */}
//           <div className="article-header mb-8">
//             <div className="h-8 bg-gray-200 rounded w-full mb-2"></div>
//             <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            
//             <div className="flex gap-2 mb-4">
//               <div className="h-6 bg-gray-200 rounded w-16"></div>
//               <div className="h-6 bg-gray-200 rounded w-20"></div>
//               <div className="h-6 bg-gray-200 rounded w-18"></div>
//             </div>
            
//             <div className="flex gap-4 mb-6">
//               <div className="h-4 bg-gray-200 rounded w-24"></div>
//               <div className="h-4 bg-gray-200 rounded w-32"></div>
//             </div>
//           </div>
          
//           {/* Image Skeleton */}
//           <div className="w-full h-64 md:h-[35rem] bg-gray-200 rounded-lg mb-8"></div>
          
//           {/* Content Skeleton */}
//           <div className="space-y-4">
//             <div className="h-4 bg-gray-200 rounded w-full"></div>
//             <div className="h-4 bg-gray-200 rounded w-5/6"></div>
//             <div className="h-4 bg-gray-200 rounded w-4/5"></div>
//             <div className="h-4 bg-gray-200 rounded w-full"></div>
//             <div className="h-4 bg-gray-200 rounded w-3/4"></div>
//             <div className="h-4 bg-gray-200 rounded w-5/6"></div>
//             <div className="h-4 bg-gray-200 rounded w-2/3"></div>
//           </div>
          
//           {/* Back Button Skeleton */}
//           <div className="mt-10">
//             <div className="h-12 bg-gray-200 rounded w-48"></div>
//           </div>
//         </div>
//       </div>
      
//       <Footer />
//     </div>
//   );
// };

// // Error Component
// const ArticlePageError = ({ error }) => {
//   return (
//     <div className="all relative">
//       <NavbarWhite />
      
//       <div className="article-container bg-blue-50 text-black w-full min-h-screen pt-20 pb-20 px-4 md:px-[14rem]">
//         <div className="article-content bg-white p-6 md:p-10 rounded-md shadow-lg">
          
//           {/* Back Button */}
//           <div className="mb-6">
//             <Link 
//               href="/article" 
//               className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
//             >
//               <CaretLeft size={20} className="mr-2"/>
//               Back to Articles
//             </Link>
//           </div>

//           {/* Error Message */}
//           <div className="text-center py-16">
//             <div className="text-6xl mb-4">📰</div>
//             <h1 className="text-2xl font-bold text-gray-800 mb-2">
//               Article Not Found
//             </h1>
//             <p className="text-gray-600 mb-6">
//               {error === "Article not found" 
//                 ? "The article you're looking for doesn't exist or has been removed."
//                 : "There was an error loading this article. Please try again later."
//               }
//             </p>
//             <div className="flex flex-col sm:flex-row gap-4 justify-center">
//               <Link 
//                 href="/article"
//                 className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
//               >
//                 Browse All Articles
//               </Link>
//               <button
//                 onClick={() => window.location.reload()}
//                 className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
//               >
//                 Try Again
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
      
//       <Footer />
//     </div>
//   );
// };





// // import NavbarWhite from "@/components/navbar-white";
// // import Footer from "@/components/footer/page";
// // import { Article } from "@/data/articles";
// // import { notFound } from 'next/navigation';
// // import Link from "next/link";
// // import Image from "next/image";
// // import { CaretLeft } from "@phosphor-icons/react/dist/ssr";

// // export default function ArticlePage({ params }) {
// //   const { id } = params;
  
// //   const article = Article.find(item => item.id === parseInt(id));
  
// //   if (!article) {
// //     notFound();
// //   }

// //   return (
// //     <>
// //       <div className="all relative">
// //         <NavbarWhite />
        
// //         <div className="article-container bg-blue-50 text-black w-full min-h-screen pt-20 pb-20 px-[14rem]">
// //           <div className="article-content bg-white p-10 rounded-md shadow-lg">
// //             <div className="article-header mb-8">
// //               <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
              
// //               <div className="flex flex-wrap gap-2 mb-4">
// //                 {article.labels.map((label, index) => (
// //                   <span 
// //                     key={index} 
// //                     className="bg-blue-50 text-blue-500 text-sm py-1 px-3 rounded-md border border-gray-300"
// //                   >
// //                     {label}
// //                   </span>
// //                 ))}
// //               </div>
              
// //               <div className="flex items-center gap-4 text-gray-600 mb-6">
// //                 <span className="font-medium">{article.author}</span>
// //                 <span>•</span>
// //                 <span>{new Date(article.date).toLocaleDateString('en-US', {
// //                   year: 'numeric',
// //                   month: 'long',
// //                   day: 'numeric'
// //                 })}</span>
// //               </div>
// //             </div>
            
// //             <div className="article-image w-full h-[35rem] relative mb-8 rounded-lg overflow-hidden">
// //               <img src={`${article.image}`} alt={`${article.title}`} className="object-cover w-full rounded-lg h-full"/>
// //             </div>
            
// //             <div className="article-body">
// //               {article.content.map((paragraph, index) => (
// //                 <p key={index} className="mb-4 text-gray-700 leading-relaxed text-justify">
// //                   {paragraph}
// //                 </p>
// //               ))}
// //             </div>
            
// //             <div className="mt-10">
// //               <Link 
// //                 href="/article" 
// //                 className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
// //               >
// //                 <CaretLeft size={28} className="mr-3"/>
// //                 Back to Articles
// //               </Link>
// //             </div>
// //           </div>
// //         </div>
        
// //         <Footer />
// //       </div>
// //     </>
// //   );
// // }