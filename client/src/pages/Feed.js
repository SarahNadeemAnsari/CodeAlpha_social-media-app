import { useEffect, useState, useRef } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";

function Feed() {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [comments, setComments] = useState({});
  const [likes, setLikes] = useState({});
  const [showComments, setShowComments] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef();
  const navigate = useNavigate();

  const myId = localStorage.getItem("token")
    ? JSON.parse(atob(localStorage.getItem("token").split(".")[1])).id
    : null;

  const fetchPosts = async () => {
    try {
      const res = await axios.get("/posts");
      setPosts(res.data);

      const likesData = {};
      const commentCountData = {};
      await Promise.all(
        res.data.map(async (post) => {
          const [l, c] = await Promise.all([
            axios.get(`/likes/${post._id}`),
            axios.get(`/comments/${post._id}`),
          ]);
          likesData[post._id] = l.data;
          commentCountData[post._id] = c.data.length;
        })
      );
      setLikes(likesData);
      setCommentCounts(commentCountData);
    } catch (err) {
      console.error("Fetch error:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const createPost = async () => {
    if (!text.trim() && !mediaFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("text", text);
      if (mediaFile) formData.append("media", mediaFile);

      await axios.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setText("");
      removeMedia();
      fetchPosts();
    } catch (err) {
      console.error("Create post error:", err.response?.data || err.message);
    } finally {
      setUploading(false);
    }
  };

  const deletePost = async (postId) => {
    try {
      await axios.delete(`/posts/${postId}`);
      fetchPosts();
    } catch (err) {
      console.error("Delete error:", err.response?.data || err.message);
    }
  };

  const toggleLike = async (postId) => {
    const postLikes = likes[postId] || [];
    const alreadyLiked = postLikes.some((l) => l.user === myId);
    try {
      if (alreadyLiked) {
        await axios.delete(`/likes/${postId}`);
      } else {
        await axios.post(`/likes/${postId}`);
      }
      const res = await axios.get(`/likes/${postId}`);
      setLikes((prev) => ({ ...prev, [postId]: res.data }));
    } catch (err) {
      console.error("Like error:", err.response?.data || err.message);
    }
  };

  const fetchComments = async (postId) => {
    try {
      const res = await axios.get(`/comments/${postId}`);
      setComments((prev) => ({ ...prev, [postId]: res.data }));
      setCommentCounts((prev) => ({ ...prev, [postId]: res.data.length }));
    } catch (err) {
      console.error("Fetch comments error:", err.response?.data || err.message);
    }
  };

  const toggleComments = async (postId) => {
    if (!showComments[postId]) await fetchComments(postId);
    setShowComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const addComment = async (postId) => {
    const t = commentText[postId];
    if (!t?.trim()) return;
    try {
      await axios.post(`/comments/${postId}`, { text: t });
      setCommentText((prev) => ({ ...prev, [postId]: "" }));
      fetchComments(postId);
    } catch (err) {
      console.error("Comment error:", err.response?.data || err.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const Avatar = ({ user, size = 36 }) => {
    const initials = user?.username?.[0]?.toUpperCase() || "?";
    if (user?.profilePicture) {
      return (
        <img
          src={user.profilePicture}
          alt={user.username}
          style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
        />
      );
    }
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%", flexShrink: 0,
        background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.36, fontWeight: 600, color: "#fff",
      }}>
        {initials}
      </div>
    );
  };

  return (
    <div style={s.page}>
      <div style={s.navbar}>
        <span style={s.brand}>Connectly</span>
        <div style={s.navActions}>
          <button onClick={() => navigate("/profile")} style={s.navBtn} title="My Profile">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </button>
          <button onClick={logout} style={s.navBtn} title="Logout">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      <div style={s.feed}>
        {/* Compose box */}
        <div style={s.compose}>
          <textarea
            placeholder="Share something..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={s.composeInput}
            rows={2}
          />
          {mediaPreview && (
            <div style={s.previewWrapper}>
              {mediaFile?.type.startsWith("video/") ? (
                <video src={mediaPreview} controls style={s.previewMedia} />
              ) : (
                <img src={mediaPreview} alt="preview" style={s.previewMedia} />
              )}
              <button onClick={removeMedia} style={s.removeMedia}>✕</button>
            </div>
          )}
          <div style={s.composeFooter}>
            <button onClick={() => fileInputRef.current.click()} style={s.mediaBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Photo/Video
            </button>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileChange} style={{ display: "none" }} />
            <button
              onClick={createPost}
              style={{ ...s.postBtn, opacity: uploading ? 0.6 : 1 }}
              disabled={uploading}
            >
              {uploading ? "Posting..." : "Share"}
            </button>
          </div>
        </div>

        {/* Posts */}
        {posts.map((post) => {
          const postLikes = likes[post._id] || [];
          const alreadyLiked = postLikes.some((l) => l.user === myId);
          const isOwner = post.user?._id === myId;

          return (
            <div key={post._id} style={s.card}>
              <div style={s.cardHeader}>
                <Avatar user={post.user} size={36} />
                <div style={s.cardMeta}>
                  <span
                    onClick={() => navigate(`/profile/${post.user?._id}`)}
                    style={s.username}
                  >
                    {post.user?.username}
                  </span>
                  <span style={s.time}>
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {isOwner && (
                  <button onClick={() => deletePost(post._id)} style={s.deleteBtn} title="Delete">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                )}
              </div>

              {post.text && <p style={s.postText}>{post.text}</p>}

              {post.mediaUrl && post.mediaType === "image" && (
                <img src={post.mediaUrl} alt="post" style={s.postMedia} />
              )}
              {post.mediaUrl && post.mediaType === "video" && (
                <video src={post.mediaUrl} controls style={s.postMedia} />
              )}

              <div style={s.actions}>
                <button
                  onClick={() => toggleLike(post._id)}
                  style={{ ...s.actionBtn, color: alreadyLiked ? "#ed4956" : "#aaa" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={alreadyLiked ? "#ed4956" : "none"} stroke={alreadyLiked ? "#ed4956" : "#aaa"} strokeWidth="1.8">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
                <button
                  onClick={() => toggleComments(post._id)}
                  style={{ ...s.actionBtn, color: showComments[post._id] ? "#0095f6" : "#aaa" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
                <span style={s.counts}>
                  {postLikes.length} {postLikes.length === 1 ? "like" : "likes"} · {commentCounts[post._id] ?? 0} {commentCounts[post._id] === 1 ? "comment" : "comments"}
                </span>
              </div>

              {showComments[post._id] && (
                <div style={s.commentsSection}>
                  {(comments[post._id] || []).map((comment) => (
                    <div key={comment._id} style={s.comment}>
                      <Avatar user={comment.user} size={24} />
                      <div style={s.commentBubble}>
                        <span style={s.commentUsername}>{comment.user?.username} </span>
                        <span style={s.commentText}>{comment.text}</span>
                      </div>
                    </div>
                  ))}
                  <div style={s.commentInputRow}>
                    <input
                      placeholder="Add a comment..."
                      value={commentText[post._id] || ""}
                      onChange={(e) => setCommentText((prev) => ({ ...prev, [post._id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && addComment(post._id)}
                      style={s.commentInput}
                    />
                    <button onClick={() => addComment(post._id)} style={s.sendBtn}>Post</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#000", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  navbar: { background: "#000", borderBottom: "1px solid #262626", padding: "0 20px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 },
  brand: { color: "#fff", fontSize: 20, fontWeight: 700, letterSpacing: -0.5 },
  navActions: { display: "flex", alignItems: "center", gap: 12 },
  navBtn: { background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" },
  feed: { maxWidth: 470, margin: "0 auto", padding: "20px 12px" },
  compose: { background: "#111", border: "1px solid #262626", borderRadius: 12, padding: "14px 16px", marginBottom: 20 },
  composeInput: { width: "100%", background: "none", border: "none", outline: "none", color: "#fff", fontSize: 14, resize: "none", fontFamily: "inherit", lineHeight: 1.5 },
  previewWrapper: { position: "relative", marginTop: 10 },
  previewMedia: { width: "100%", maxHeight: 300, objectFit: "cover", borderRadius: 8 },
  removeMedia: { position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: "50%", width: 28, height: 28, cursor: "pointer", fontSize: 13 },
  composeFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, paddingTop: 10, borderTop: "1px solid #262626" },
  mediaBtn: { background: "none", border: "none", color: "#aaa", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },
  postBtn: { background: "#0095f6", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  card: { background: "#111", border: "1px solid #262626", borderRadius: 12, marginBottom: 16, overflow: "hidden" },
  cardHeader: { display: "flex", alignItems: "center", gap: 10, padding: "12px 14px" },
  cardMeta: { flex: 1, display: "flex", flexDirection: "column" },
  username: { fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" },
  time: { fontSize: 11, color: "#555", marginTop: 1 },
  deleteBtn: { background: "none", border: "none", color: "#555", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" },
  postText: { fontSize: 14, color: "#fff", lineHeight: 1.6, padding: "0 14px 12px" },
  postMedia: { width: "100%", maxHeight: 400, objectFit: "cover" },
  actions: { display: "flex", alignItems: "center", gap: 4, padding: "10px 10px 6px", borderTop: "1px solid #1a1a1a" },
  actionBtn: { background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex", alignItems: "center", borderRadius: 6 },
  counts: { fontSize: 13, color: "#555", marginLeft: 4 },
  commentsSection: { borderTop: "1px solid #1a1a1a", padding: "10px 14px 6px" },
  comment: { display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" },
  commentBubble: { background: "#1a1a1a", borderRadius: 8, padding: "7px 10px", flex: 1 },
  commentUsername: { fontSize: 12, fontWeight: 600, color: "#fff" },
  commentText: { fontSize: 13, color: "#aaa" },
  commentInputRow: { display: "flex", gap: 8, alignItems: "center", marginTop: 8 },
  commentInput: { flex: 1, background: "#1a1a1a", border: "1px solid #262626", borderRadius: 20, padding: "7px 14px", fontSize: 13, color: "#fff", outline: "none" },
  sendBtn: { background: "none", border: "none", color: "#0095f6", fontSize: 13, fontWeight: 600, cursor: "pointer" },
};

export default Feed;