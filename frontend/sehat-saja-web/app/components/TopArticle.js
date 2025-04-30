import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@/data/articles';

const TopArticle = () => {
  const truncateDescription = (text, maxLength = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 w-full">
      {Article.slice(0, 3).map((articleItem) => (
        <div 
          key={articleItem.id} 
          className="group w-full h-full shadow-md border border-gray-200 flex flex-col rounded-lg hover:scale-105 hover:border-blue-500 transition-all duration-200 bg-white hover:shadow-lg overflow-hidden"
        >
          <Link href={`/article/${articleItem.id}`} className="h-full flex flex-col">
            <div className="w-full h-48 md:h-56 lg:h-64 relative">
              <Image
                src={articleItem.image}
                alt={articleItem.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            </div>
            
            <div className="p-4 md:p-5 flex flex-col gap-3 flex-grow text-center">
              <h2 className="font-semibold text-lg line-clamp-2">
                {articleItem.title}
              </h2>
              
              <div className="flex flex-wrap justify-center gap-2">
                {articleItem.labels.slice(0, 2).map((label, index) => (
                  <span
                    key={index}
                    className="bg-blue-50 text-blue-600 text-xs px-3 py-1 rounded-md border border-blue-100"
                  >
                    {label}
                  </span>
                ))}
              </div>
              
              <p className="text-sm text-gray-600 line-clamp-3">
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
