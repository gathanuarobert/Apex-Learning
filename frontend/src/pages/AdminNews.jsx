import React, { useState } from "react";
import "../styles/AdminNews.css";

const AdminNews = () => {
  const [newsList, setNewsList] = useState([
    { id: 1, title: "Platform Update", category: "Announcements", content: "New features coming soon!", media: null },
    { id: 2, title: "Tech Maintenance", category: "Tech", content: "Scheduled maintenance this weekend.", media: null },
    { id: 3, title: "School Event", category: "Events", content: "Annual academic event announced!", media: null },
    { id: 4, title: "Mobile App Launch", category: "Announcements", content: "ApexLHub app now available!", media: null },
    { id: 5, title: "Server Upgrade", category: "Tech", content: "Faster servers deployed.", media: null },
  ]);

  const [editingNews, setEditingNews] = useState(null);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const [newNews, setNewNews] = useState({ title: "", category: "Announcements", content: "", media: null });

  const [currentPage, setCurrentPage] = useState(1);
  const newsPerPage = 3;

  const handleDelete = (id) => setNewsList(newsList.filter((news) => news.id !== id));
  const handleEdit = (news) => {
    setEditingNews(news);
    setPreviewMedia(news.media || null);
  };

  const handleMediaUpload = (e, setter) => {
    const file = e.target.files[0];
    if (file) {
      const mediaUrl = URL.createObjectURL(file);
      setter((prev) => ({ ...prev, media: mediaUrl }));
      setPreviewMedia(mediaUrl);
    }
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    setNewsList(newsList.map((news) => (news.id === editingNews.id ? editingNews : news)));
    setEditingNews(null);
    setPreviewMedia(null);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const newId = newsList.length ? newsList[newsList.length - 1].id + 1 : 1;
    setNewsList([...newsList, { ...newNews, id: newId }]);
    setNewNews({ title: "", category: "Announcements", content: "", media: null });
    setPreviewMedia(null);
  };

  const filteredNews = newsList.filter((news) => {
    const matchesCategory = selectedCategory === "All" || news.category === selectedCategory;
    const matchesSearch =
      news.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      news.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Pagination logic
  const indexOfLastNews = currentPage * newsPerPage;
  const indexOfFirstNews = indexOfLastNews - newsPerPage;
  const currentNews = filteredNews.slice(indexOfFirstNews, indexOfLastNews);
  const totalPages = Math.ceil(filteredNews.length / newsPerPage);

  return (
    <div className="admin-news-container">
      <h2 className="title">📰 Admin News Management</h2>

      {/* Filters & Search */}
      <div className="filters-container">
        <div className="category-filters">
          {["All", "Announcements", "Tech", "Events"].map((cat) => (
            <button
              key={cat}
              className={`filter-btn ${selectedCategory === cat ? "active" : ""}`}
              onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
            >
              {cat}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="🔍 Search news..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          className="search-bar"
        />
      </div>

      {/* Create News */}
      <div className="create-news">
        <h3>Create News Post</h3>
        <form onSubmit={handleCreate}>
          <input type="text" placeholder="News Title" value={newNews.title} onChange={(e) => setNewNews({ ...newNews, title: e.target.value })} required />
          <select value={newNews.category} onChange={(e) => setNewNews({ ...newNews, category: e.target.value })}>
            <option value="Announcements">Announcements</option>
            <option value="Tech">Tech</option>
            <option value="Events">Events</option>
          </select>
          <textarea placeholder="News Content" value={newNews.content} onChange={(e) => setNewNews({ ...newNews, content: e.target.value })} required></textarea>
          <input type="file" accept="image/*,video/*" onChange={(e) => handleMediaUpload(e, setNewNews)} />
          {newNews.media && (
            newNews.media.endsWith(".mp4") ? (
              <video controls width="100%" className="media-preview">
                <source src={newNews.media} type="video/mp4" />
              </video>
            ) : (
              <img src={newNews.media} alt="Preview" className="media-preview" />
            )
          )}
          <button type="submit" className="save-btn">➕ Post News</button>
        </form>
      </div>

      {/* News List */}
      <div className="news-list">
        {currentNews.map((news) => (
          <div key={news.id} className="news-item">
            <h3>{news.title}</h3>
            <span className="category">{news.category}</span>
            <p>{news.content}</p>
            {news.media && (
              news.media.endsWith(".mp4") ? (
                <video controls width="100%" className="news-media">
                  <source src={news.media} type="video/mp4" />
                </video>
              ) : (
                <img src={news.media} alt="News Media" className="news-media" />
              )
            )}
            <div className="actions">
              <button className="edit-btn" onClick={() => handleEdit(news)}>✏ Edit</button>
              <button className="delete-btn" onClick={() => handleDelete(news.id)}>🗑 Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="pagination">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            className={`page-btn ${currentPage === i + 1 ? "active" : ""}`}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Edit Modal */}
      {editingNews && (
        <div className="modal">
          <div className="modal-content">
            <h3>Edit News</h3>
            <form onSubmit={handleUpdate}>
              <input type="text" value={editingNews.title} onChange={(e) => setEditingNews({ ...editingNews, title: e.target.value })} required />
              <select value={editingNews.category} onChange={(e) => setEditingNews({ ...editingNews, category: e.target.value })}>
                <option value="Announcements">Announcements</option>
                <option value="Tech">Tech</option>
                <option value="Events">Events</option>
              </select>
              <textarea value={editingNews.content} onChange={(e) => setEditingNews({ ...editingNews, content: e.target.value })} required></textarea>
              <input type="file" accept="image/*,video/*" onChange={(e) => handleMediaUpload(e, setEditingNews)} />
              {previewMedia && (
                previewMedia.endsWith(".mp4") ? (
                  <video controls width="100%" className="media-preview">
                    <source src={previewMedia} type="video/mp4" />
                  </video>
                ) : (
                  <img src={previewMedia} alt="Preview" className="media-preview" />
                )
              )}
              <div className="modal-actions">
                <button type="submit" className="save-btn">💾 Save</button>
                <button type="button" className="cancel-btn" onClick={() => setEditingNews(null)}>✖ Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNews;
