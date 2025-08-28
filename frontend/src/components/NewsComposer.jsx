// src/pages/NewsComposer.jsx
import React, { useState } from "react";

const NewsComposer = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [newsList, setNewsList] = useState([]);

  const handlePost = () => {
    if (title.trim() && content.trim()) {
      setNewsList([...newsList, { title, content, date: new Date().toLocaleString() }]);
      setTitle("");
      setContent("");
    }
  };

  return (
    <div className="bg-[#0f172a] text-white min-h-screen p-6">
      <h1 className="text-3xl font-bold mb-6">News Composer</h1>
      
      {/* News Form */}
      <div className="bg-[#1e293b] p-6 rounded-lg shadow mb-6">
        <input
          type="text"
          placeholder="News Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 mb-4 bg-[#0f172a] border border-blue-500 rounded"
        />
        <textarea
          placeholder="Write news content..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-2 mb-4 bg-[#0f172a] border border-blue-500 rounded h-32"
        ></textarea>
        <button
          onClick={handlePost}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          Post News
        </button>
      </div>

      {/* News Preview */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Posted News</h2>
        {newsList.length === 0 ? (
          <p className="text-gray-400">No news posted yet.</p>
        ) : (
          newsList.map((news, index) => (
            <div key={index} className="bg-[#1e293b] p-4 rounded-lg mb-4 shadow">
              <h3 className="text-xl font-bold">{news.title}</h3>
              <p className="text-gray-300">{news.content}</p>
              <span className="text-xs text-gray-500">{news.date}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NewsComposer;
