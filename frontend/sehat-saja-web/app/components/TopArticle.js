import Link from 'next/link';
import { Article } from '@/data/articles';

const TopArticle = () => {
  const truncateDescription = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="news-bottom w-[80%] h-[31rem] flex flex-row justify-between gap-2.5">
      {Article.slice(0, 3).map((articleItem) => (
        <div 
          key={articleItem.id} 
          className="w-full h-full shadow-[0px_0px_10px_rgba(0,0,0,0.15)] outline-[0.1rem] outline-gray-300 flex flex-col rounded-md outline-solid hover:outline-blue-500 ease-in-out transition-all duration-100 bg-white hover:scale-[1.02]"
        >
          <Link href={`/article/${articleItem.id}`} className="h-full flex flex-col">
            <div className="w-full h-1/2 relative">
              <img 
                src={articleItem.image} 
                className="h-full w-full object-cover rounded-t-md aspect-[1/2]" 
                alt={articleItem.title}
              />
            </div>
            <div className="isi px-7 py-8 h-full flex justify-between flex-col text-center">
              <h1 className="font-semibold text-lg">{articleItem.title}</h1>
              <div className="flex flex-wrap justify-center gap-2">
                {articleItem.labels.slice(0, 2).map((label, index) => (
                  <div 
                    key={index} 
                    className="bg-blue-50 text-blue-500 text-sm py-1 rounded-md border border-gray-300 px-3"
                  >
                    {label}
                  </div>
                ))}
              </div>
              <p className="text-sm font-light text-gray-600">
                {truncateDescription(articleItem.description, 120)}
              </p>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default TopArticle;

// import Link from 'next/link';
// import { Article } from '@/data/articles';

// const TopArticle = () => {
//   const truncateDescription = (text, maxLength = 150) => {
//     if (text.length <= maxLength) return text;
//     return text.substring(0, maxLength) + '...';
//   };

//   return (
//     <div className="news-bottom w-[80%] h-[31rem] flex flex-row justify-between gap-2.5">
//       {Article.slice(0, 3).map((articleItem) => (
//         <div 
//           key={articleItem.id} 
//           className="w-full h-full shadow-[0px_0px_10px_rgba(0,0,0,0.15)] outline-[0.1rem] outline-gray-300 flex flex-col rounded-md outline-solid hover:outline-blue-500 ease-in-out transition-all duration-100 bg-white hover:scale-[1.02]"
//         >
//           <Link href={`/article/${articleItem.id}`} className="h-full flex flex-col">
//             <div className="w-full h-1/2 relative">
//               <img 
//                 src={articleItem.image} 
//                 className="h-full w-full object-cover rounded-t-md aspect-[1/2]" 
//                 alt={articleItem.title}
//               />
//             </div>
//             <div className="isi px-7 py-8 h-full flex justify-between flex-col text-center">
//               <h1 className="font-semibold text-lg">{articleItem.title}</h1>
//               <div className="flex flex-wrap justify-center gap-2">
//                 {articleItem.labels.slice(0, 2).map((label, index) => (
//                   <div 
//                     key={index} 
//                     className="bg-blue-50 text-blue-500 text-sm py-1 rounded-md border border-gray-300 px-3"
//                   >
//                     {label}
//                   </div>
//                 ))}
//               </div>
//               <p className="text-sm font-light text-gray-600">
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


