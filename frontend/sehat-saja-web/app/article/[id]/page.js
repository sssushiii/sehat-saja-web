import NavbarWhite from "@/components/navbar-white";
import Footer from "@/components/footer/page";
import { Article } from "@/data/articles";
import { notFound } from 'next/navigation';
import Link from "next/link";
import Image from "next/image";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";

export default function ArticlePage({ params }) {
  const { id } = params;
  
  const article = Article.find(item => item.id === parseInt(id));
  
  if (!article) {
    notFound();
  }

  return (
    <>
      <div className="all relative">
        <NavbarWhite />
        
        <div className="article-container bg-blue-50 text-black w-full min-h-screen pt-20 pb-20 px-[14rem]">
          <div className="article-content bg-white p-10 rounded-md shadow-lg">
            <div className="article-header mb-8">
              <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {article.labels.map((label, index) => (
                  <span 
                    key={index} 
                    className="bg-blue-50 text-blue-500 text-sm py-1 px-3 rounded-md border border-gray-300"
                  >
                    {label}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center gap-4 text-gray-600 mb-6">
                <span className="font-medium">{article.author}</span>
                <span>•</span>
                <span>{new Date(article.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
            </div>
            
            <div className="article-image w-full h-[35rem] relative mb-8 rounded-lg overflow-hidden">
              <img src={`${article.image}`} alt={`${article.title}`} className="object-cover w-full rounded-lg h-full"/>
            </div>
            
            <div className="article-body">
              {article.content.map((paragraph, index) => (
                <p key={index} className="mb-4 text-gray-700 leading-relaxed text-justify">
                  {paragraph}
                </p>
              ))}
            </div>
            
            <div className="mt-10">
              <Link 
                href="/article" 
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
              >
                <CaretLeft size={28} className="mr-3"/>
                Back to Articles
              </Link>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    </>
  );
}