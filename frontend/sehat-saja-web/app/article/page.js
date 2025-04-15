"use client";

import Footer from "@/components/footer/page";
import NavbarWhite from "@/components/navbar-white";
import ArticleSlider from "@/components/ArticleSlider";
import ArticleList from "@/components/ArticleList";
import TopArticle from "@/components/TopArticle";
import { useState } from "react";

export default function News() {
  const [tempSearchTerm, setTempSearchTerm] = useState("");
  const [tempCategory, setTempCategory] = useState("all");

  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(tempSearchTerm);
    setCategory(tempCategory);
  };

  return (
    <>
      <div className="all relative">
        <NavbarWhite />
        <div className="top-news-slide bg-blue-50 text-black justify-center flex flex-col items-center w-full h-auto mt-16 pb-10 pt-20 px-[18rem]">
          <ArticleSlider />
          <div className="news-top flex justify-center items-center">
            <div className="articles-child w-full h-auto flex flex-col items-center">
              <div className="articles-top flex flex-row w-full justify-between items-center mb-10">
                <h1 className="text-3xl font-semibold mb-1">Trending Article</h1>
              </div>
              <TopArticle />
            </div>
          </div>
        </div>

        <div className="bottom-news bg-blue-50 text-black justify-center flex flex-col items-center w-full h-auto py-20 pt-10 px-[18rem]">
          <form
            onSubmit={handleSubmit}
            className="w-full bg-white p-7 rounded-md border-gray-300 border-[0.1rem] mb-10 shadow-[0px_0px_10px_rgba(0,0,0,0.15)]"
          >
            <div className="w-full h-[3.5rem] mb-4">
              <input
                type="text"
                placeholder="Search Article"
                className="w-full h-full px-5 py-4 outline-none border-gray-300 border-[0.1rem] rounded-md bg-blue-50 hover:border-blue-500"
                value={tempSearchTerm}
                onChange={(e) => setTempSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-row items-center gap-4 h-[4.5rem]">
              <div className="flex flex-col w-full">
                <label className="text-sm text-gray-600">Category</label>
                <select
                  className="w-full h-full px-4 py-3 border-gray-300 border-[0.1rem] rounded-md outline-none"
                  value={tempCategory}
                  onChange={(e) => setTempCategory(e.target.value)}
                >
                  {/* ...option list tetap sama... */}
                  <option value="all">All</option>
                  <option value="medication">Medication</option>
                  <option value="nursing">Nursing</option>
                  <option value="emergency">Emergency</option>
                  <option value="training">Training</option>
                  <option value="education">Education</option>
                  <option value="patient care">Patient Care</option>
                  <option value="hygiene">Hygiene</option>
                  <option value="technology">Technology</option>
                  <option value="innovation">Innovation</option>
                  <option value="mental health">Mental Health</option>
                  <option value="support">Support</option>
                  <option value="rural">Rural</option>
                  <option value="access">Access</option>
                  <option value="diversity">Diversity</option>
                  <option value="ethics">Ethics</option>
                  <option value="chronic illness">Chronic Illness</option>
                  <option value="long-term care">Long-term Care</option>
                  <option value="telehealth">Telehealth</option>
                  <option value="future">Future</option>
                  <option value="nutrition">Nutrition</option>
                  <option value="decision making">Decision Making</option>
                </select>
              </div>

              <div className="w-full h-full flex justify-end">
                <button
                  type="submit"
                  className="w-full h-full px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                >
                  Search
                </button>
              </div>
            </div>
          </form>

          <ArticleList
            articleCount={20}
            searchTerm={searchTerm}
            selectedCategory={category}
          />
        </div>
        <Footer />
      </div>
    </>
  );
}
