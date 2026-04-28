import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";

function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [picFile, setPicFile] = useState(null);
  const [picPreview, setPicPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [postLikes, setPostLikes] = useState([]);
  const [postComments, setPostComments] = useState([]);
  const fileInputRef = useRef();

  const myId = localStorage.getItem("token")
    ? JSON.parse(atob(localStorage.getItem("token").split(".")[1])).id
    : null;

  const isOwnProfile = !id || id === myId;

  const fetchProfile = async () => {
    try {
      const res = isOwnProfile
        ? await axios.get("/users/me")
        : await axios.get(`/users/${id}`);
      setProfile(res.data.user);
      setPosts(res.data.posts);
      setUsername(res.data.user.username);
      setBio(res.data.user.bio || "");
    } catch (err) {
      console.error("Profile fetch error:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const handlePicChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPicFile(file);
    setPicPreview(URL.createObjectURL(file));
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("bio", bio);
      if (picFile) formData.append("profilePicture", picFile);

      await axios.put("/users/me", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await fetchProfile();
      setPicFile(null);
      setPicPreview(null);
      setEditing(false);
    } catch (err) {
      const msg = err.response?.data?.message || "Update failed";
      alert(msg); // shows "Username already taken" if that's the issue
      console.error("Update error:", msg);
    } finally {
      setSaving(false);
    }
  };

  const openPost = async (post) => {
    setSelectedPost(post);
    try {
      const [l, c] = await Promise.all([
        axios.get(`/likes/${post._id}`),
        axios.get(`/comments/${post._id}`),
      ]);
      setPostLikes(l.data);
      setPostComments(c.data);
    } catch (err) {
      console.error("Post detail error:", err.response?.data || err.message);
    }
  };

  const closePost = () => {
    setSelectedPost(null);
    setPostLikes([]);
    setPostComments([]);
  };

  if (!profile) return (
    <div style={{ background: "#000", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#555" }}>Loading...</p>
    </div>
  );

  const avatarSrc = picPreview || profile.profilePicture || null;
  const initials = profile.username?.[0]?.toUpperCase() || "?";

  return (
    <div style={s.page}>
      <div style={s.navbar}>
        <button onClick={() => navigate("/feed")} style={s.backBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Feed
        </button>
        <span style={s.brand}>Connectly</span>
        <div style={{ width: 70 }} />
      </div>

      <div style={s.container}>
        <div style={s.profileHeader}>
          <div style={{ position: "relative", display: "inline-block" }}>
            {avatarSrc ? (
              <img src={avatarSrc} alt="avatar" style={s.avatarLg} />
            ) : (
              <div style={s.avatarPlaceholder}>{initials}</div>
            )}
            {editing && (
              <button onClick={() => fileInputRef.current.click()} style={s.changePicBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePicChange} style={{ display: "none" }} />
          </div>

          <div style={s.profileInfo}>
            {editing ? (
              <div style={s.editForm}>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={s.editInput}
                  placeholder="Username"
                />
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  style={{ ...s.editInput, resize: "none", minHeight: 60 }}
                  placeholder="Bio"
                  rows={2}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={saveProfile} style={s.saveBtn} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => { setEditing(false); setPicFile(null); setPicPreview(null); }}
                    style={s.cancelBtn}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={s.usernameRow}>
                  <span style={s.profileUsername}>{profile.username}</span>
                  {isOwnProfile && (
                    <button onClick={() => setEditing(true)} style={s.editBtn}>Edit profile</button>
                  )}
                </div>
                <p style={s.profileBio}>{profile.bio || "No bio yet."}</p>
                <p style={s.profileEmail}>{profile.email}</p>
              </>
            )}
          </div>
        </div>

        <div style={s.statsRow}>
          <div style={s.stat}>
            <span style={s.statNum}>{posts.length}</span>
            <span style={s.statLabel}>posts</span>
          </div>
        </div>

        <div style={s.divider} />

        <div style={s.postsGrid}>
          {posts.length === 0 && (
            <p style={{ color: "#555", textAlign: "center", gridColumn: "1/-1", padding: 40 }}>
              No posts yet.
            </p>
          )}
          {posts.map((post) => (
            <div key={post._id} style={s.gridItem} onClick={() => openPost(post)}>
              {post.mediaUrl && post.mediaType === "image" && (
                <img src={post.mediaUrl} alt="post" style={s.gridMedia} />
              )}
              {post.mediaUrl && post.mediaType === "video" && (
                <video src={post.mediaUrl} style={s.gridMedia} />
              )}
              {!post.mediaUrl && (
                <div style={s.textPost}>
                  <p style={s.textPostContent}>{post.text}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedPost && (
        <div style={s.modalOverlay} onClick={closePost}>
          <div style={s.modalContent} onClick={(e) => e.stopPropagation()}>
            <button onClick={closePost} style={s.closeBtn}>✕</button>
            <div style={s.modalInner}>
              <div style={s.modalLeft}>
                {selectedPost.mediaUrl && selectedPost.mediaType === "image" && (
                  <img src={selectedPost.mediaUrl} alt="post" style={s.modalMedia} />
                )}
                {selectedPost.mediaUrl && selectedPost.mediaType === "video" && (
                  <video src={selectedPost.mediaUrl} controls style={s.modalMedia} />
                )}
                {!selectedPost.mediaUrl && (
                  <div style={s.modalTextOnly}>
                    <p style={{ color: "#fff", fontSize: 18, lineHeight: 1.6 }}>{selectedPost.text}</p>
                  </div>
                )}
              </div>

              <div style={s.modalRight}>
                <div style={s.modalHeader}>
                  {profile.profilePicture ? (
                    <img src={profile.profilePicture} alt="avatar" style={s.modalAvatar} />
                  ) : (
                    <div style={s.modalAvatarPlaceholder}>{initials}</div>
                  )}
                  <span style={s.modalUsername}>{profile.username}</span>
                </div>

                {selectedPost.text && selectedPost.mediaUrl && (
                  <p style={s.modalCaption}>{selectedPost.text}</p>
                )}

                <div style={s.modalDivider} />

                <div style={s.modalComments}>
                  {postComments.length === 0 && (
                    <p style={{ color: "#555", fontSize: 13 }}>No comments yet.</p>
                  )}
                  {postComments.map((c) => (
                    <div key={c._id} style={s.modalComment}>
                      <span style={s.modalCommentUser}>{c.user?.username} </span>
                      <span style={s.modalCommentText}>{c.text}</span>
                    </div>
                  ))}
                </div>

                <div style={s.modalFooter}>
                  <span style={{ color: "#aaa", fontSize: 13 }}>
                    ❤️ {postLikes.length} {postLikes.length === 1 ? "like" : "likes"}
                  </span>
                  <span style={{ color: "#aaa", fontSize: 13 }}>
                    💬 {postComments.length} {postComments.length === 1 ? "comment" : "comments"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", background: "#000", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  navbar: { background: "#000", borderBottom: "1px solid #262626", padding: "0 16px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" },
  backBtn: { background: "none", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 14 },
  brand: { color: "#fff", fontSize: 18, fontWeight: 700, letterSpacing: -0.5 },
  container: { maxWidth: 600, margin: "0 auto", padding: "24px 16px" },
  profileHeader: { display: "flex", gap: 24, alignItems: "flex-start", marginBottom: 20 },
  avatarLg: { width: 86, height: 86, borderRadius: "50%", objectFit: "cover", border: "2px solid #262626" },
  avatarPlaceholder: { width: 86, height: 86, borderRadius: "50%", background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 700, color: "#fff" },
  changePicBtn: { position: "absolute", bottom: 2, right: 2, background: "#0095f6", border: "none", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  profileInfo: { flex: 1 },
  usernameRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" },
  profileUsername: { color: "#fff", fontSize: 18, fontWeight: 600 },
  editBtn: { background: "#1a1a1a", border: "1px solid #262626", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 600, padding: "6px 14px", cursor: "pointer" },
  profileBio: { color: "#aaa", fontSize: 14, lineHeight: 1.5, marginBottom: 4 },
  profileEmail: { color: "#555", fontSize: 13 },
  editForm: { display: "flex", flexDirection: "column", gap: 8 },
  editInput: { background: "#1a1a1a", border: "1px solid #262626", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
  saveBtn: { background: "#0095f6", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  cancelBtn: { background: "#1a1a1a", color: "#fff", border: "1px solid #262626", borderRadius: 8, padding: "8px 18px", fontSize: 13, cursor: "pointer" },
  statsRow: { display: "flex", gap: 32, marginBottom: 20 },
  stat: { display: "flex", flexDirection: "column", alignItems: "center" },
  statNum: { color: "#fff", fontSize: 16, fontWeight: 700 },
  statLabel: { color: "#aaa", fontSize: 13 },
  divider: { height: 1, background: "#262626", margin: "0 -16px 16px" },
  postsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3 },
  gridItem: { aspectRatio: "1", overflow: "hidden", background: "#1a1a1a", cursor: "pointer", position: "relative" },
  gridMedia: { width: "100%", height: "100%", objectFit: "cover" },
  textPost: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 8 },
  textPostContent: { color: "#fff", fontSize: 12, textAlign: "center", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 },
  modalContent: { background: "#111", border: "1px solid #262626", borderRadius: 12, width: "90%", maxWidth: 860, maxHeight: "90vh", overflow: "hidden", position: "relative" },
  closeBtn: { position: "absolute", top: 12, right: 14, background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", zIndex: 10 },
  modalInner: { display: "flex", height: "100%", minHeight: 400, maxHeight: "85vh" },
  modalLeft: { flex: 1, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 },
  modalMedia: { width: "100%", maxHeight: "85vh", objectFit: "contain" },
  modalTextOnly: { display: "flex", alignItems: "center", justifyContent: "center", padding: 40, width: "100%" },
  modalRight: { width: 300, display: "flex", flexDirection: "column", borderLeft: "1px solid #262626" },
  modalHeader: { display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid #262626" },
  modalAvatar: { width: 32, height: 32, borderRadius: "50%", objectFit: "cover" },
  modalAvatarPlaceholder: { width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#fff" },
  modalUsername: { color: "#fff", fontSize: 13, fontWeight: 600 },
  modalCaption: { color: "#fff", fontSize: 14, padding: "12px 16px", lineHeight: 1.5 },
  modalDivider: { height: 1, background: "#262626" },
  modalComments: { flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 },
  modalComment: { fontSize: 13 },
  modalCommentUser: { color: "#fff", fontWeight: 600 },
  modalCommentText: { color: "#aaa" },
  modalFooter: { padding: "12px 16px", borderTop: "1px solid #262626", display: "flex", gap: 16 },
};

export default Profile;