import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase";
import "./styles.css";

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("customer");
  const [activeCreator, setActiveCreator] = useState<any>(null);

  const [storiesList, setStoriesList] = useState<any[]>([]);
  const [featuredCreators, setFeaturedCreators] = useState<any[]>([]);
  const [galleryList, setGalleryList] = useState<any[]>([]);
  const [vipList, setVipList] = useState<any[]>([]);
  const [allAdminMedia, setAllAdminMedia] = useState<any[]>([]);

  const [isVipMember, setIsVipMember] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeStoryModal, setActiveStoryModal] = useState<any>(null);
  const [storyProgress, setStoryProgress] = useState<number>(0);

  const [uploadDestination, setUploadDestination] = useState<"story" | "gallery" | "vip">("story");
  const [customVipPrice, setCustomVipPrice] = useState<number>(9.99);

  // Auth Inputs
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [selectedRoleInput, setSelectedRoleInput] = useState<"creator" | "customer">("creator");
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");

  // Admin Dashboard Lists
  const [adminUsers, setAdminUsers] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<any>(null);

  // Auto-progress Story Viewer Timer (5 Seconds)
  useEffect(() => {
    if (activeStoryModal) {
      setStoryProgress(0);
      const interval = setInterval(() => {
        setStoryProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setActiveStoryModal(null);
            return 100;
          }
          return prev + 2;
        });
      }, 100);
      timerRef.current = interval;
      return () => clearInterval(interval);
    }
  }, [activeStoryModal]);

  useEffect(() => {
    const initApp = async () => {
      // 1. Get logged-in user
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      setCurrentUser(user || null);

      let loggedInCreatorProf = null;
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          setUserRole(profile.role || "customer");
          setIsVipMember(profile.is_vip_member || false);
          if (profile.role === "creator") {
            loggedInCreatorProf = profile;
          }
        }
      }

      // 2. Parse Ultra-Clean Username Link (e.g. ?hippygogo, /hippygogo, ?creator=hippygogo)
      let linkHandle = "";
      const search = window.location.search;
      const pathname = window.location.pathname.replace("/", "").trim();

      if (search.startsWith("?") && search.length > 1) {
        const queryStr = search.substring(1);
        if (queryStr.includes("=")) {
          const params = new URLSearchParams(search);
          linkHandle = params.get("creator") || params.get("invite") || params.get("username") || "";
        } else {
          linkHandle = queryStr;
        }
      } else if (pathname && !pathname.includes(".")) {
        linkHandle = pathname;
      }

      const cleanHandle = linkHandle ? linkHandle.trim().toLowerCase() : "";

      // Set active creator profile:
      // Priority 1: Link parameter in URL (?username)
      // Priority 2: Logged in creator user's own profile page
      if (linkHandle) {
        const { data: creatorProf } = await supabase
          .from("profiles")
          .select("*")
          .filter("role", "eq", "creator")
          .or(`username.ilike.%${cleanHandle}%,display_name.ilike.%${cleanHandle}%,id.eq.${cleanHandle}`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        setActiveCreator(creatorProf || loggedInCreatorProf || null);
      } else if (loggedInCreatorProf) {
        setActiveCreator(loggedInCreatorProf);
      } else {
        setActiveCreator(null);
      }

      // Clean Sample Model Creators for Demonstration
      const sampleCreators = [
        {
          id: "demo-creator-1",
          username: "sophia",
          display_name: "Sophia Rose 👑",
          role: "creator",
          avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
        },
        {
          id: "demo-creator-2",
          username: "isabella",
          display_name: "Isabella VIP 💎",
          role: "creator",
          avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400",
        },
        {
          id: "demo-creator-3",
          username: "maya",
          display_name: "Maya Gold ✨",
          role: "creator",
          avatar_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400",
        },
        {
          id: "demo-creator-4",
          username: "chloe",
          display_name: "Chloe Luxe 🔥",
          role: "creator",
          avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
        },
        {
          id: "demo-creator-5",
          username: "elena",
          display_name: "Elena Adult+ 💋",
          role: "creator",
          avatar_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400",
        },
        {
          id: "demo-creator-6",
          username: "victoria",
          display_name: "Victoria Chic 👑",
          role: "creator",
          avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
        },
      ];

      // Sample Gallery & VIP Media
      const sampleGalleryMedia = [
        {
          id: "sample-gal-1",
          creator_id: "demo-creator-1",
          media_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800",
          is_public_gallery: true,
        },
        {
          id: "sample-gal-2",
          creator_id: "demo-creator-1",
          media_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800",
          is_public_gallery: true,
        },
        {
          id: "sample-gal-3",
          creator_id: "demo-creator-1",
          media_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800",
          is_public_gallery: true,
        },
      ];

      const sampleVipMedia = [
        {
          id: "sample-vip-1",
          creator_id: "demo-creator-1",
          media_url: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800",
          is_public_gallery: false,
        },
        {
          id: "sample-vip-2",
          creator_id: "demo-creator-1",
          media_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800",
          is_public_gallery: false,
        },
      ];

      // Fetch Featured Creators
      const { data: creatorsData } = await supabase
        .from("profiles")
        .select("*")
        .filter("role", "eq", "creator")
        .order("created_at", { ascending: false });

      if (creatorsData && creatorsData.length > 0) {
        const filtered = creatorsData.filter((c: any) => {
          const handle = (c.username || "").toLowerCase();
          const email = (c.email || "").toLowerCase();
          const name = (c.display_name || "").toLowerCase();
          return (
            c.role === "creator" &&
            !handle.includes("katie") &&
            !handle.includes("katigee") &&
            !handle.includes("hippy") &&
            !handle.includes("hippygogo") &&
            !handle.includes("modeltest") &&
            !handle.includes("solly") &&
            !handle.includes("modeljohn") &&
            !email.includes("customer69") &&
            !name.includes("cj")
          );
        });
        setFeaturedCreators(filtered.length > 0 ? filtered : sampleCreators);
      } else {
        setFeaturedCreators(sampleCreators);
      }

      if (linkHandle) {
        const foundDemo = sampleCreators.find(s => s.username === cleanHandle);
        if (foundDemo && !activeCreator) {
          setActiveCreator(foundDemo);
        }
      }

      // Sample 24h Snap Stories Avatar Circles
      const sampleStoriesList = [
        {
          id: "sample-story-1",
          media_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
          user_profile: { display_name: "Sophia Rose" },
        },
        {
          id: "sample-story-2",
          media_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300",
          user_profile: { display_name: "Isabella" },
        },
        {
          id: "sample-story-3",
          media_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300",
          user_profile: { display_name: "Maya Gold" },
        },
        {
          id: "sample-story-4",
          media_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
          user_profile: { display_name: "Chloe Luxe" },
        },
        {
          id: "sample-story-5",
          media_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300",
          user_profile: { display_name: "Elena Adult+" },
        },
      ];

      // Fetch all public media for Discover Feed
      const { data: dbStories } = await supabase
        .from("stories")
        .select("*, user_profile:profiles(display_name, username, avatar_url)")
        .order("created_at", { ascending: false });

      if (dbStories && dbStories.length > 0) {
        setStoriesList(dbStories);
      } else {
        setStoriesList(sampleStoriesList);
      }

      const { data: media } = await supabase
        .from("vip_content")
        .select("*")
        .order("created_at", { ascending: false });

      if (media && media.length > 0) {
        if (linkHandle && activeCreator) {
          const creatorMedia = media.filter((m: any) => m.creator_id === activeCreator.id);
          setGalleryList(creatorMedia.filter((item: any) => Boolean(item.is_public_gallery)));
          setVipList(creatorMedia.filter((item: any) => !Boolean(item.is_public_gallery)));
        } else {
          setGalleryList(media.filter((item: any) => Boolean(item.is_public_gallery)));
          setVipList(media.filter((item: any) => !Boolean(item.is_public_gallery)));
        }
      } else {
        setGalleryList(sampleGalleryMedia);
        setVipList(sampleVipMedia);
      }
    };

    initApp();
  }, []);

  // Handle Device Media Upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    const isVideo = file.type.startsWith("video");
    const previewUrl = URL.createObjectURL(file);
    const tempId = `temp-${Date.now()}`;

    // Optimistic Instant UI Render (<100ms)
    if (uploadDestination === "story") {
      const newStory = {
        id: tempId,
        user_id: currentUser.id,
        media_url: previewUrl,
        media_type: isVideo ? "video" : "image",
        created_at: new Date().toISOString(),
        user_profile: { display_name: activeCreator?.display_name || "Creator" },
      };
      setStoriesList((prev) => [newStory, ...prev]);
    } else if (uploadDestination === "gallery") {
      setGalleryList((prev) => [{ id: tempId, media_url: previewUrl, is_public_gallery: true }, ...prev]);
    } else {
      setVipList((prev) => [{ id: tempId, media_url: previewUrl, is_public_gallery: false }, ...prev]);
    }

    setShowAddModal(false);

    // Background Storage Upload
    try {
      const fileExt = isVideo ? "mp4" : "jpg";
      const fileName = `vip_content/${currentUser.id}/${Date.now()}.${fileExt}`;

      const { error: storageErr } = await supabase.storage
        .from("snaps-media")
        .upload(fileName, file, { upsert: true });

      let publicUrl = previewUrl;
      if (!storageErr) {
        const { data: urlData } = supabase.storage.from("snaps-media").getPublicUrl(fileName);
        if (urlData?.publicUrl) publicUrl = urlData.publicUrl;
      }

      if (uploadDestination === "story") {
        await supabase.from("stories").insert({
          user_id: currentUser.id,
          media_url: publicUrl,
          media_type: isVideo ? "video" : "image",
        });
      } else {
        await supabase.from("vip_content").insert({
          creator_id: currentUser.id,
          media_url: publicUrl,
          media_type: isVideo ? "video" : "image",
          title: `My ${uploadDestination} Snap`,
          description: "",
          is_public_gallery: uploadDestination === "gallery",
        });
      }
      alert(`✨ Published to ${uploadDestination.toUpperCase()} successfully!`);
    } catch (err) {
      console.error("[Upload Error]", err);
    }
  };

  // Auth Handler
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) return;

    if (authMode === "signup") {
      let userObj = null;

      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: emailInput,
        password: passwordInput,
      });

      if (signUpErr) {
        if (signUpErr.message.includes("User already registered")) {
          // If auth user exists in Supabase Auth schema, log in directly and upsert profile
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: emailInput,
            password: passwordInput,
          });
          if (signInErr) {
            alert(`Authentication Error: ${signInErr.message}`);
            return;
          }
          userObj = signInData?.user;
        } else {
          alert(`Sign Up Error: ${signUpErr.message}`);
          return;
        }
      } else {
        userObj = signUpData?.user;
      }

      if (userObj) {
        await supabase.from("profiles").upsert({
          id: userObj.id,
          username: (usernameInput || emailInput.split("@")[0]).trim().toLowerCase(),
          display_name: usernameInput || emailInput.split("@")[0],
          email: emailInput.trim().toLowerCase(),
          role: selectedRoleInput,
        });

        setCurrentUser(userObj);
        setUserRole(selectedRoleInput);
        setShowAuthModal(false);
        alert(`🎉 Account registered/logged in as ${selectedRoleInput.toUpperCase()}!`);
      }
    } else {
      const { data: loginData, error } = await supabase.auth.signInWithPassword({
        email: emailInput,
        password: passwordInput,
      });

      if (error) {
        alert(`Login Error: ${error.message}`);
        return;
      }

      if (loginData?.user) {
        setCurrentUser(loginData.user);
        const { data: prof } = await supabase.from("profiles").select("*").eq("id", loginData.user.id).maybeSingle();
        if (prof) setUserRole(prof.role || "customer");
        setShowAuthModal(false);
        alert(`Welcome back!`);
      }
    }
  };

  // Delete Media Item
  const handleDeleteMedia = async (id: string, table: "vip_content" | "stories") => {
    setGalleryList((prev) => prev.filter((item) => item.id !== id));
    setVipList((prev) => prev.filter((item) => item.id !== id));
    setStoriesList((prev) => prev.filter((item) => item.id !== id));

    if (!id.startsWith("temp-")) {
      await supabase.from(table).delete().eq("id", id);
    }
    alert("🗑️ Deleted permanently!");
  };

  // Fetch Admin Users & Media List
  const openAdminConsole = async () => {
    setShowAdminModal(true);
    const [usersRes, storiesRes, mediaRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("stories").select("*").order("created_at", { ascending: false }),
      supabase.from("vip_content").select("*").order("created_at", { ascending: false }),
    ]);

    if (usersRes.data) setAdminUsers(usersRes.data);
    if (mediaRes.data) setAllAdminMedia(mediaRes.data);
  };

  // Change User Role (Admin Control)
  const handleChangeUserRole = async (userId: string, newRole: string) => {
    setAdminUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
    alert(`✓ Role updated to ${newRole.toUpperCase()}`);
  };

  // Admin Delete User Account
  const handleAdminDeleteUser = async (userId: string) => {
    setAdminUsers((prev) => prev.filter((u) => u.id !== userId));
    await supabase.from("profiles").delete().eq("id", userId);
    alert(`🗑️ User account deleted permanently!`);
  };

  // Admin Purge All Platform Data
  const handleMasterWipe = async () => {
    if (confirm("⚠️ WARNING: This will permanently wipe all users, stories, and media across the platform. Continue?")) {
      await supabase.from("profiles").delete().gt("created_at", "1970-01-01T00:00:00Z");
      await supabase.from("stories").delete().gt("created_at", "1970-01-01T00:00:00Z");
      await supabase.from("vip_content").delete().gt("created_at", "1970-01-01T00:00:00Z");
      setAdminUsers([]);
      setGalleryList([]);
      setVipList([]);
      setStoriesList([]);
      alert("🔥 Platform database wiped 100% clean!");
    }
  };

  return (
    <div className="app-viewport">
      {/* Navbar Header */}
      <header className="app-header">
        <h1 className="brand-logo">adultplus</h1>
        <div className="header-actions">
          {userRole === "admin" && (
            <button className="btn-pill-gold" onClick={openAdminConsole}>
              🛡️ Admin
            </button>
          )}
          {userRole === "creator" && (
            <button className="btn-pill-gold" onClick={() => setShowStudioModal(true)}>
              🎨 Studio
            </button>
          )}
          {!currentUser ? (
            <button className="btn-pill-gold" onClick={() => setShowAuthModal(true)}>
              🔑 Log In / Sign Up
            </button>
          ) : (
            <button
              className="btn-pill-gold"
              onClick={async () => {
                await supabase.auth.signOut();
                setCurrentUser(null);
                setUserRole("customer");
              }}
            >
              🚪 Sign Out
            </button>
          )}
        </div>
      </header>

      {/* 24h Snap Stories Circle Bar */}
      <section className="stories-bar-section">
        <div className="stories-scroll">
          {/* Add Snap Circle for Creators */}
          {userRole !== "customer" && (
            <div className="story-circle-item" onClick={() => setShowAddModal(true)}>
              <div className="avatar-ring-story avatar-ring-add">
                <span style={{ fontSize: "24px", color: "#D4AF37" }}>＋</span>
              </div>
              <span className="story-label">Add Snap</span>
            </div>
          )}

          {/* Stories List */}
          {storiesList.map((story) => (
            <div key={story.id} className="story-circle-item" onClick={() => setActiveStoryModal(story)}>
              <div className="avatar-ring-story">
                <img src={story.media_url} alt="Snap Story" className="story-avatar-img" />
              </div>
              <span className="story-label">{story.user_profile?.display_name || "Snap"}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. DEDICATED CREATOR PROFILE PAGE VIEW (EXACT REFERENCE REPLICATION) */}
      {/* ========================================================================= */}
      {activeCreator && activeCreator.role === "creator" && (
        <div style={{ paddingBottom: "40px" }}>
          {/* Luxury Hero Banner Section */}
          <div className="hero-banner-container">
            {/* Top Bar Actions */}
            <div className="hero-top-bar">
              <button className="hero-icon-btn" onClick={() => (window.location.search = "")}>
                ‹
              </button>
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="hero-icon-btn">⎘</button>
                <button className="hero-icon-btn">•••</button>
              </div>
            </div>

            {/* Liquid Gold Header Background Cover */}
            <div className="hero-gold-liquid-cover">
              <img
                src={activeCreator?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800"}
                alt="Cover"
                className="hero-cover-img"
              />
              <div className="hero-cover-overlay" />
            </div>

            {/* Double-Ring Glowing Gold Avatar Frame */}
            <div className="hero-avatar-center">
              <div className="avatar-gold-double-ring">
                <img
                  src={activeCreator?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"}
                  alt="Profile Avatar"
                  className="avatar-gold-img"
                />
                <div className="avatar-gold-crown-badge">👑</div>
              </div>
            </div>
          </div>

          {/* Profile Details & Action Stack */}
          <div className="profile-details-container">
            <div className="profile-share-icon">⎘</div>

            <h2 className="profile-title-text">
              {activeCreator?.display_name || activeCreator?.username}
              <span className="gold-check-icon">✔</span>
              <span className="gold-crown-icon">👑</span>
            </h2>

            <p className="profile-followers-text">
              VIP Creator • <strong>5.2K</strong> Followers
            </p>

            {/* Action Buttons Stack */}
            <div className="profile-actions-stack">
              <div className="row-actions">
                <button className="btn-follow-glass" onClick={() => alert(`✓ Following @${activeCreator?.username}`)}>
                  ＋ Follow
                </button>
                <button
                  className="btn-chat-glass"
                  onClick={() => {
                    if (!currentUser) setShowAuthModal(true);
                    else if (!isVipMember) alert(`🔒 Direct 1-on-1 Chat is reserved for VIP Subscribers ($${customVipPrice}/mo).`);
                    else alert(`💬 Starting 1-on-1 Chat with @${activeCreator?.username}!`);
                  }}
                >
                  🗨 1-on-1 Chat
                </button>
              </div>

              {!isVipMember && (
                <button
                  className="btn-subscribe-gold-bar"
                  onClick={() => {
                    if (!currentUser) setShowAuthModal(true);
                    else alert(`👑 Subscribing to @${activeCreator?.username}'s VIP Lounge ($${customVipPrice}/mo)`);
                  }}
                >
                  👑 Subscribe to VIP Lounge (${customVipPrice}/mo)
                </button>
              )}
            </div>

            {/* Gallery Header with Underline */}
            <div className="gallery-header-row">
              <h3 className="gallery-title-active">Gallery</h3>
              <div className="gallery-gold-underline" />
            </div>

            {/* Gallery Grid Carousel with + Add Card for Creator Owner */}
            <div className="gallery-grid-3col">
              {/* + Add Photo Card for Creator */}
              {currentUser && currentUser.id === activeCreator.id && (
                <div className="gallery-add-card" onClick={() => setShowAddModal(true)}>
                  <span className="plus-gold-icon">＋</span>
                </div>
              )}

              {galleryList.length === 0 ? (
                <p style={{ color: "#888", fontStyle: "italic", fontSize: "13px", padding: "12px", gridColumn: "1 / -1" }}>
                  No public gallery photos uploaded yet.
                </p>
              ) : (
                galleryList.map((item) => (
                  <img key={item.id} src={item.media_url} alt="Gallery Post" className="gallery-grid-img" loading="eager" />
                ))
              )}
            </div>

            {/* Exclusive VIP Section */}
            <div className="gallery-header-row" style={{ marginTop: "24px" }}>
              <h3 className="gallery-title-active" style={{ color: "#FFD700" }}>👑 VIP Section</h3>
              <div className="gallery-gold-underline" style={{ background: "#FFD700" }} />
            </div>

            <div className="vip-grid-container">
              {vipList.length === 0 ? (
                <p style={{ color: "#888", fontStyle: "italic", fontSize: "13px", padding: "12px", gridColumn: "1 / -1" }}>
                  No VIP Lounge posts available.
                </p>
              ) : (
                vipList.map((item) => {
                  const canViewUnblurred = isVipMember || userRole === "creator" || userRole === "admin" || (currentUser && item.creator_id === currentUser.id);

                  return (
                    <div key={item.id} className="vip-card-wrapper" onClick={() => !canViewUnblurred && setShowAuthModal(true)}>
                      <img
                        src={item.media_url}
                        alt="VIP Content"
                        className={`vip-card-img ${!canViewUnblurred ? "vip-card-blur" : ""}`}
                        loading="lazy"
                      />
                      {!canViewUnblurred && (
                        <div className="vip-lock-overlay">
                          <span style={{ fontSize: "28px" }}>🔒</span>
                          <span style={{ fontSize: "11px", fontWeight: "bold", color: "#FFD700" }}>VIP GOLD</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FRONT HOME PAGE VIEW (MAX 6 FEATURED CREATORS GRID) */}
      {/* ========================================================================= */}
      {!activeCreator && (
        <section style={{ padding: "16px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#D4AF37", marginBottom: "14px" }}>
            ⭐ Featured Creators
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px" }}>
            {featuredCreators.slice(0, 6).map((c) => (
              <div
                key={c.id}
                style={{
                  background: "linear-gradient(180deg, rgba(212,175,55,0.12) 0%, rgba(22,22,26,0.92) 100%)",
                  border: "1px solid rgba(212,175,55,0.3)",
                  borderRadius: "20px",
                  padding: "16px 12px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                }}
                onClick={() => {
                  window.location.search = `?${c.username}`;
                }}
              >
                <img
                  src={c.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                  alt={c.display_name}
                  style={{
                    width: "68px",
                    height: "68px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #D4AF37",
                    boxShadow: "0 0 16px rgba(212,175,55,0.4)",
                  }}
                />
                <h4 style={{ fontSize: "15px", fontWeight: 800, color: "#fff", margin: 0, textAlign: "center" }}>
                  {c.display_name || c.username}
                </h4>
                <p style={{ fontSize: "12px", color: "#D4AF37", fontWeight: "bold", margin: 0 }}>@{c.username}</p>
                <button
                  style={{
                    width: "100%",
                    padding: "8px",
                    marginTop: "4px",
                    borderRadius: "14px",
                    border: "none",
                    background: "var(--gold-gradient)",
                    color: "#000",
                    fontWeight: 800,
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  View Profile 👑
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FULL SCREEN SNAP STORY VIEWER MODAL WITH TIMER BAR */}
      {activeStoryModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "#000",
            zIndex: 999999,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Top Progress Timer Bar */}
          <div style={{ position: "absolute", top: "12px", left: "16px", right: "16px", zIndex: 100, display: "flex", gap: "6px" }}>
            <div style={{ flex: 1, height: "4px", background: "rgba(255,255,255,0.3)", borderRadius: "2px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  background: "#FFD700",
                  width: `${storyProgress}%`,
                  transition: "width 0.1s linear",
                }}
              />
            </div>
          </div>

          {/* Story Creator Header Info */}
          <div style={{ position: "absolute", top: "24px", left: "16px", right: "16px", zIndex: 100, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img
                src={activeStoryModal.media_url}
                alt=""
                style={{ width: "36px", height: "36px", borderRadius: "50%", border: "2px solid #FFD700", objectFit: "cover" }}
              />
              <div>
                <h4 style={{ fontSize: "14px", fontWeight: "bold", color: "#fff", margin: 0 }}>
                  {activeStoryModal.user_profile?.display_name || "Snap Story"}
                </h4>
                <p style={{ fontSize: "11px", color: "#FFD700", margin: 0 }}>24h Quick Snap 👻</p>
              </div>
            </div>
            <button
              style={{ background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", fontSize: "20px", width: "36px", height: "36px", borderRadius: "50%", cursor: "pointer" }}
              onClick={() => setActiveStoryModal(null)}
            >
              ✕
            </button>
          </div>

          {/* Full Screen Story Image Display */}
          <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img
              src={activeStoryModal.media_url}
              alt="Snap Story"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        </div>
      )}
      <input type="file" ref={fileInputRef} accept="image/*,video/*" style={{ display: "none" }} onChange={handleFileUpload} />

      {/* 1. ADD CONTENT MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800 }}>👻 Add Snap Content</h3>
              <button style={{ background: "none", border: "none", color: "#fff", fontSize: "18px", cursor: "pointer" }} onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>

            <p style={{ fontSize: "13px", color: "#aaa", marginBottom: "16px" }}>Where do you want to post this content?</p>

            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <button
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "14px",
                  border: uploadDestination === "story" ? "2px solid #00F2FE" : "1px solid #333",
                  background: "#222",
                  color: uploadDestination === "story" ? "#00F2FE" : "#aaa",
                  fontWeight: "bold",
                }}
                onClick={() => setUploadDestination("story")}
              >
                Story (24h)
              </button>
              <button
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "14px",
                  border: uploadDestination === "gallery" ? "2px solid #00F2FE" : "1px solid #333",
                  background: "#222",
                  color: uploadDestination === "gallery" ? "#00F2FE" : "#aaa",
                  fontWeight: "bold",
                }}
                onClick={() => setUploadDestination("gallery")}
              >
                Gallery
              </button>
              <button
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "14px",
                  border: uploadDestination === "vip" ? "2px solid #FFD700" : "1px solid #333",
                  background: "#222",
                  color: uploadDestination === "vip" ? "#FFD700" : "#aaa",
                  fontWeight: "bold",
                }}
                onClick={() => setUploadDestination("vip")}
              >
                VIP 🔒
              </button>
            </div>

            <button
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "16px",
                border: "none",
                background: "var(--gold-gradient)",
                color: "#000",
                fontWeight: 800,
                fontSize: "15px",
                cursor: "pointer",
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              📁 Select Photo / Video from Device
            </button>
          </div>
        </div>
      )}

      {/* 2. CREATOR CONTENT STUDIO MODAL */}
      {showStudioModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800 }}>🎨 Creator Content Studio</h3>
              <button style={{ background: "none", border: "none", color: "#fff", fontSize: "18px", cursor: "pointer" }} onClick={() => setShowStudioModal(false)}>
                ✕
              </button>
            </div>

            {/* Price Configurator */}
            <div style={{ marginBottom: "20px", padding: "12px", background: "#222", borderRadius: "14px" }}>
              <label style={{ fontSize: "12px", color: "#aaa", fontWeight: "bold" }}>VIP Subscription Price ($/mo):</label>
              <input
                type="number"
                value={customVipPrice}
                onChange={(e) => setCustomVipPrice(parseFloat(e.target.value) || 9.99)}
                style={{ width: "100%", padding: "10px", marginTop: "6px", borderRadius: "10px", border: "1px solid #444", background: "#111", color: "#fff", fontWeight: "bold" }}
              />
            </div>

            <h4 style={{ fontSize: "14px", marginBottom: "10px" }}>Manage Uploaded Posts</h4>
            <div style={{ maxHeight: "250px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
              {[...galleryList, ...vipList].map((item) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#222", padding: "8px 12px", borderRadius: "12px" }}>
                  <img src={item.media_url} alt="" style={{ width: "45px", height: "45px", borderRadius: "8px", objectFit: "cover" }} />
                  <span style={{ fontSize: "12px", color: item.is_public_gallery ? "#00F2FE" : "#FFD700", fontWeight: "bold" }}>
                    {item.is_public_gallery ? "Gallery" : "VIP Lounge"}
                  </span>
                  <button style={{ background: "#ff4444", border: "none", color: "#fff", padding: "6px 12px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }} onClick={() => handleDeleteMedia(item.id, "vip_content")}>
                    🗑️ Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. MASTER ADMIN CONSOLE MODAL */}
      {showAdminModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "560px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#FFD700" }}>🛡️ Master Admin Console</h3>
                <p style={{ fontSize: "12px", color: "#aaa" }}>Full Platform Control & User Management</p>
              </div>
              <button style={{ background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer" }} onClick={() => setShowAdminModal(false)}>
                ✕
              </button>
            </div>

            {/* Platform Stats Header */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <div style={{ flex: 1, background: "#222", padding: "12px", borderRadius: "14px", textAlign: "center" }}>
                <span style={{ fontSize: "18px", fontWeight: "bold", color: "#00F2FE" }}>{adminUsers.length}</span>
                <p style={{ fontSize: "11px", color: "#aaa", margin: 0 }}>Registered Users</p>
              </div>
              <div style={{ flex: 1, background: "#222", padding: "12px", borderRadius: "14px", textAlign: "center" }}>
                <span style={{ fontSize: "18px", fontWeight: "bold", color: "#FFD700" }}>{adminUsers.filter(u => u.role === "creator").length}</span>
                <p style={{ fontSize: "11px", color: "#aaa", margin: 0 }}>Creators</p>
              </div>
              <div style={{ flex: 1, background: "#222", padding: "12px", borderRadius: "14px", textAlign: "center" }}>
                <span style={{ fontSize: "18px", fontWeight: "bold", color: "#FF5555" }}>{galleryList.length + vipList.length}</span>
                <p style={{ fontSize: "11px", color: "#aaa", margin: 0 }}>Total Media Posts</p>
              </div>
            </div>

            {/* Emergency Platform Wipe Button */}
            <button
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "14px",
                border: "1px solid #ff4444",
                background: "rgba(255, 68, 68, 0.15)",
                color: "#ff4444",
                fontWeight: "bold",
                fontSize: "13px",
                cursor: "pointer",
                marginBottom: "20px",
              }}
              onClick={handleMasterWipe}
            >
              🔥 Emergency Master Database Wipe
            </button>

            {/* User Account Controls */}
            <h4 style={{ fontSize: "15px", marginBottom: "12px", color: "#00F2FE" }}>User Accounts ({adminUsers.length})</h4>
            <div style={{ maxHeight: "280px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {adminUsers.length === 0 ? (
                <p style={{ fontSize: "13px", color: "#888", fontStyle: "italic" }}>No accounts registered yet.</p>
              ) : (
                adminUsers.map((u) => (
                  <div key={u.id} style={{ background: "#222", padding: "12px", borderRadius: "14px", border: "1px solid #333" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div>
                        <span style={{ fontSize: "14px", fontWeight: 800, color: "#fff" }}>@{u.username}</span>
                        <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", background: u.role === "creator" ? "#D4AF37" : u.role === "admin" ? "#ff4444" : "#00F2FE", color: "#000", fontWeight: "bold", marginLeft: "8px" }}>
                          {u.role.toUpperCase()}
                        </span>
                      </div>
                      <button
                        style={{ background: "#ff4444", border: "none", color: "#fff", padding: "6px 10px", borderRadius: "8px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
                        onClick={() => handleAdminDeleteUser(u.id)}
                      >
                        🗑️ Delete User
                      </button>
                    </div>

                    <p style={{ fontSize: "12px", color: "#00F2FE", margin: "0 0 10px 0" }}>✉️ {u.email || `${u.username}@gmail.com`}</p>

                    {/* Role Switcher */}
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", color: "#aaa" }}>Switch Role:</span>
                      <button
                        style={{ padding: "4px 8px", borderRadius: "8px", border: "none", background: u.role === "customer" ? "#00F2FE" : "#333", color: u.role === "customer" ? "#000" : "#fff", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
                        onClick={() => handleChangeUserRole(u.id, "customer")}
                      >
                        Customer
                      </button>
                      <button
                        style={{ padding: "4px 8px", borderRadius: "8px", border: "none", background: u.role === "creator" ? "#D4AF37" : "#333", color: u.role === "creator" ? "#000" : "#fff", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
                        onClick={() => handleChangeUserRole(u.id, "creator")}
                      >
                        Creator
                      </button>
                      <button
                        style={{ padding: "4px 8px", borderRadius: "8px", border: "none", background: u.role === "admin" ? "#ff4444" : "#333", color: "#fff", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}
                        onClick={() => handleChangeUserRole(u.id, "admin")}
                      >
                        Admin
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. AUTHENTICATION MODAL */}
      {showAuthModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800 }}>{authMode === "signup" ? "Create Account" : "Welcome Back"}</h3>
              <button style={{ background: "none", border: "none", color: "#fff", fontSize: "18px", cursor: "pointer" }} onClick={() => setShowAuthModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {authMode === "signup" && (
                <>
                  <input
                    type="text"
                    placeholder="Desired Username (e.g. modeljohn)"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #333", background: "#222", color: "#fff" }}
                    required
                  />
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      style={{ flex: 1, padding: "10px", borderRadius: "10px", border: selectedRoleInput === "creator" ? "2px solid #D4AF37" : "1px solid #333", background: "#222", color: selectedRoleInput === "creator" ? "#D4AF37" : "#aaa", fontWeight: "bold" }}
                      onClick={() => setSelectedRoleInput("creator")}
                    >
                      👑 Creator
                    </button>
                    <button
                      type="button"
                      style={{ flex: 1, padding: "10px", borderRadius: "10px", border: selectedRoleInput === "customer" ? "2px solid #00F2FE" : "1px solid #333", background: "#222", color: selectedRoleInput === "customer" ? "#00F2FE" : "#aaa", fontWeight: "bold" }}
                      onClick={() => setSelectedRoleInput("customer")}
                    >
                      👤 Customer / Follower
                    </button>
                  </div>
                </>
              )}

              <input
                type="email"
                placeholder="Email Address"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #333", background: "#222", color: "#fff" }}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid #333", background: "#222", color: "#fff" }}
                required
              />

              <button
                type="submit"
                style={{ width: "100%", padding: "14px", borderRadius: "16px", border: "none", background: "var(--gold-gradient)", color: "#000", fontWeight: 800, fontSize: "15px", cursor: "pointer", marginTop: "10px" }}
              >
                {authMode === "signup" ? "🚀 Create Account" : "🔑 Sign In"}
              </button>
            </form>

            <p style={{ textAlign: "center", fontSize: "12px", color: "#aaa", marginTop: "16px", cursor: "pointer" }} onClick={() => setAuthMode(authMode === "signup" ? "login" : "signup")}>
              {authMode === "signup" ? "Already have an account? Log In" : "Need an account? Sign Up"}
            </p>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="bottom-navigation">
        <button className="nav-item-btn active">
          <span style={{ fontSize: "22px" }}>👥</span>
          <span>Stories</span>
        </button>
        <button className="nav-item-btn" onClick={() => alert("💬 Chat feature active!")}>
          <span style={{ fontSize: "22px" }}>💬</span>
          <span>Chat</span>
        </button>
        <button className="nav-item-btn" onClick={() => alert("👑 VIP Lounge feature active!")}>
          <span style={{ fontSize: "22px" }}>👑</span>
          <span>VIP Lounge</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
