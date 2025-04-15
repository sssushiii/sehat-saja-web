"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Link from "next/link";
import { Article } from '@/data/articles';

export default function ArticleSlider() {
  const truncateDescription = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="top-news-slide bg-white shadow-[0px_0px_10px_rgba(0,0,0,0.15)] rounded-md text-black flex justify-center w-full h-auto mb-16">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000 }}
        loop
        className="w-full h-[35rem] rounded-md"
      >
        {Article.map((articleItem, index) => {
          if (index < 3) {
            return(
              <SwiperSlide key={index} className="relative">
                <div
                  className="news-slide w-full h-full rounded-md bg-cover bg-center"
                  style={{ backgroundImage: `url(${articleItem.image})` }}
                >
                  <div className="gradien z-20 rounded-md bg-gradient-to-r from-blue-900/90 via-blue-300/40 to-blue-200/50 w-full h-full flex flex-col items-center justify-center">
                    <div className="w-[75%] h-[70%]">
                      <div className="title w-[80%]">
                        <h1 className="text-5xl font-normal text-white mb-6 leading-16">
                          {articleItem.title}
                        </h1>
                        <Link
                          href={`../article/${articleItem.id}`}
                          className="bg-white text-blue-500 px-6 py-2 rounded-md hover:bg-gray-200 transition"
                        >
                          VIEW DETAILS
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            )
          }
        }
        )}
      </Swiper>
    </div>
  );
}
