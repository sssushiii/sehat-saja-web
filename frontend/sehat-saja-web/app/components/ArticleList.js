import Link from "next/link";
import Image from "next/image";
import { Article } from "@/data/articles";

const ArticleList = ({ articleCount, searchTerm = "", selectedCategory = "all" }) => {
  const filteredArticle = Article.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      article.labels.some((label) => label.toLowerCase() === selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  }).slice(0, articleCount);

  return (
    <div className="News-bottom w-full h-auto grid grid-cols-2 justify-between gap-5">
      {filteredArticle.map((articleItem) => (
        <ArticleCard key={articleItem.id} {...articleItem} />
      ))}
    </div>
  );
};

const ArticleCard = ({ id, title, image, labels, description }) => {
  return (
    <div className="col-span-1 w-auto h-[14rem] shadow-md outline outline-gray-300 flex flex-col rounded-md hover:outline-blue-500 transition-all duration-100 bg-white">
      <Link href={`/article/${id}`} className="h-full flex">
        <div className="w-2/5 h-full relative">
          <Image 
            src={image} 
            alt={title} 
            fill
            className="object-cover rounded-l-md" 
          />
        </div>
        <div className="px-7 py-5 h-full w-3/5 flex justify-between flex-col text-center">
          <h2 className="font-semibold text-lg">{title}</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {labels.map((label, index) => (
              <span 
                key={index} 
                className="bg-blue-50 text-blue-500 text-sm py-1 px-3 rounded-md border border-gray-300"
              >
                {label}
              </span>
            ))}
          </div>
          <p className="text-sm font-light">{description}</p>
        </div>
      </Link>
    </div>
  );
};

export default ArticleList; 

