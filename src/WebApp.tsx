import React, { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

export const WebApp: React.FC = () => {
  const [activeCreator, setActiveCreator] = useState<any>(null);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [vipItems, setVipItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"stories" | "chat" | "vip">("stories");

  useEffect(() => {
    const initWebData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(window.location.search);
        const creatorHandle = params.get("creator") || params.get("invite") || "hippygogo";
        const cleanHandle = creatorHandle.trim().toLowerCase();

        // 1. Fetch exact or fuzzy matching creator profile by handle or display name
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("role", "creator")
          .or(`username.ilike.%${cleanHandle}%,display_name.ilike.%${cleanHandle}%,id.eq.${creatorHandle}`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        let effectiveCreator = profile;
        if (!effectiveCreator) {
          const { data: defaultCreator } = await supabase
            .from("profiles")
            .select("*")
            .eq("role", "creator")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          effectiveCreator = defaultCreator;
        }

        setActiveCreator(effectiveCreator);

        if (effectiveCreator) {
          const { data: media } = await supabase
            .from("vip_content")
            .select("*")
            .eq("creator_id", effectiveCreator.id)
            .order("created_at", { ascending: false });

          if (media) {
            setGalleryItems(media.filter((item: any) => Boolean(item.is_public_gallery)));
            setVipItems(media.filter((item: any) => !Boolean(item.is_public_gallery)));
          }
        }
      } catch (err) {
        console.error("[Web App Init Error]", err);
      } finally {
        setLoading(false);
      }
    };

    initWebData();
  }, []);

  return (
    <div className="web-app-container">
      {/* Top Bar */}
      <header className="web-header">
        <h1 className="brand-title">clubdior</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: "1px solid rgba(212,175,55,0.4)",
              background: "rgba(212,175,55,0.15)",
              color: "#D4AF37",
              fontWeight: "bold",
              fontSize: "13px",
              cursor: "pointer",
            }}
            onClick={() => window.location.reload()}
          >
            🔄 Refresh
          </button>
        </div>
      </header>

      {/* Main Content View */}
      <main style={{ flex: 1 }}>
        {/* Creator Banner Profile */}
        <section className="creator-banner-card">
          <div className="avatar-ring-container">
            <img
              src={activeCreator?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
              alt="Creator Avatar"
              className="creator-avatar-img"
              loading="eager"
            />
            <div className="crown-badge">👑</div>
          </div>

          <h2 style={{ fontSize: "22px", fontWeight: 800, margin: 0 }}>
            {activeCreator?.display_name || "hippygogo"}
          </h2>
          <p style={{ color: "#D4AF37", fontSize: "13px", margin: "4px 0 16px 0", fontWeight: 600 }}>
            @{activeCreator?.username || "hippygogo"}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "340px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: "20px",
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.08)",
                  color: "#FFF",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
                onClick={() => alert(`✓ Following @${activeCreator?.username || "creator"}`)}
              >
                + Follow Creator
              </button>
              <button
                style={{
                  flex: 1,
                  padding: "11px",
                  borderRadius: "20px",
                  border: "1px solid rgba(212,175,55,0.4)",
                  background: "rgba(212,175,55,0.15)",
                  color: "#D4AF37",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
                onClick={() => alert(`🔒 1-on-1 Direct Chat is reserved for $9.99/mo VIP Lounge subscribers.`)}
              >
                🔒 1-on-1 Chat
              </button>
            </div>

            <button
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: "20px",
                border: "none",
                background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                color: "#000",
                fontWeight: 800,
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(255, 215, 0, 0.35)",
              }}
              onClick={() => alert(`👑 Subscribing to @${activeCreator?.username || "hippygogo"}'s VIP Lounge ($9.99/mo)`)}
            >
              👑 Subscribe to @{activeCreator?.username || "hippygogo"}'s VIP Lounge ($9.99/mo)
            </button>
          </div>
        </section>

        {/* Gallery Section */}
        <h3 className="section-title">Gallery</h3>
        <div className="gallery-carousel">
          {galleryItems.length === 0 ? (
            <p style={{ color: "#888", fontStyle: "italic", fontSize: "14px", padding: "12px" }}>
              No public gallery photos uploaded yet.
            </p>
          ) : (
            galleryItems.map((item) => (
              <img
                key={item.id}
                src={item.media_url}
                alt="Gallery Media"
                className="gallery-card-img"
                loading="eager"
                decoding="async"
              />
            ))
          )}
        </div>

        {/* VIP Lounge Section */}
        <h3 className="section-title" style={{ color: "#FFD700" }}>👑 VIP Section</h3>
        <div className="vip-grid">
          {vipItems.length === 0 ? (
            <p style={{ color: "#888", fontStyle: "italic", fontSize: "14px", padding: "12px", gridColumn: "1 / -1" }}>
              No VIP Lounge posts available.
            </p>
          ) : (
            vipItems.map((item) => (
              <img
                key={item.id}
                src={item.media_url}
                alt="VIP Media"
                className="vip-card-img"
                loading="lazy"
                decoding="async"
              />
            ))
          )}
        </div>
      </main>

      {/* Bottom Bar */}
      <nav className="bottom-nav">
        <button className={`nav-btn ${activeTab === "stories" ? "active" : ""}`} onClick={() => setActiveTab("stories")}>
          <span style={{ fontSize: "20px" }}>👥</span>
          <span>Stories</span>
        </button>
        <button className={`nav-btn ${activeTab === "chat" ? "active" : ""}`} onClick={() => setActiveTab("chat")}>
          <span style={{ fontSize: "20px" }}>💬</span>
          <span>Chat</span>
        </button>
        <button className={`nav-btn ${activeTab === "vip" ? "active" : ""}`} onClick={() => setActiveTab("vip")}>
          <span style={{ fontSize: "20px" }}>👑</span>
          <span>VIP Lounge</span>
        </button>
      </nav>
    </div>
  );
};

export default WebApp;
