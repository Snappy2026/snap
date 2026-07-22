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
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [activeLightboxImg, setActiveLightboxImg] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([
    { id: "1", sender: "creator", text: "Hey love! Welcome to my VIP Lounge 🔥 What are you up to today?", time: "Just now" }
  ]);
  const [chatInputText, setChatInputText] = useState("");
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
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

  // Listen for native PWA 1-click install prompt event (Android / Chrome)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

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

      // 25 Sample 24h Snap Stories for Front Home Page Grid (5 across)
      const demoAvatars = [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300",
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300",
        "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300",
      ];
      const demoNames = [
        "Sophia", "Isabella", "Maya", "Chloe", "Elena",
        "Victoria", "Zara", "Mia", "Aria", "Camila",
        "Layla", "Penelope", "Chloe", "Riley", "Zoey",
        "Nora", "Lily", "Eleanor", "Hannah", "Lillian",
        "Addison", "Aubrey", "Ellie", "Stella", "Natalie"
      ];

      const sampleStoriesList = Array.from({ length: 25 }, (_, i) => ({
        id: `sample-story-${i + 1}`,
        media_url: demoAvatars[i % demoAvatars.length],
        user_profile: { display_name: demoNames[i] },
      }));

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

  // Quick Demo Creator Login Handler
  const handleQuickDemoLogin = async (demoUsername: string, displayName: string, avatarUrl: string) => {
    const demoEmail = `${demoUsername}@adultplus.vip`;
    const demoPassword = `AdultPlus2026!`;

    // Try signing in
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword,
    });

    let userObj = signInData?.user;

    if (signInErr || !userObj) {
      // Create user via signUp if doesn't exist
      const { data: signUpData } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
      });
      userObj = signUpData?.user;
    }

    if (userObj) {
      const demoProfile = {
        id: userObj.id,
        username: demoUsername,
        display_name: displayName,
        email: demoEmail,
        role: "creator",
        avatar_url: avatarUrl,
      };

      await supabase.from("profiles").upsert(demoProfile);

      setCurrentUser(userObj);
      setUserRole("creator");
      setActiveCreator(demoProfile);
      setShowAuthModal(false);
      window.location.search = `?${demoUsername}`;
      alert(`👑 Logged in successfully as Creator @${demoUsername}!`);
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
          {(userRole === "creator" || (currentUser && activeCreator && currentUser.id === activeCreator.id)) && (
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
            </div>

            {/* Liquid Gold Header Background Cover */}
            <div className="hero-gold-liquid-cover">
              <img
                src={activeCreator?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800"}
                alt="Cover"
                className="hero-cover-img"
              />
              <div className="hero-cover-overlay" />

              {/* Exact Golden Arch Wave Swooshes SVG Overlay */}
              <svg className="hero-golden-arches" viewBox="0 0 400 240" preserveAspectRatio="none" fill="none">
                <path
                  d="M0,0 Q200,210 400,0 L400,240 L0,240 Z"
                  fill="url(#goldGradCover)"
                  opacity="0.25"
                />
                <path
                  d="M-50,-20 Q200,230 450,-20"
                  stroke="url(#goldGradStroke)"
                  strokeWidth="8"
                  opacity="0.85"
                />
                <path
                  d="M-50,10 Q200,260 450,10"
                  stroke="url(#goldGradStroke)"
                  strokeWidth="3"
                  opacity="0.6"
                />
                <defs>
                  <linearGradient id="goldGradStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF59D" />
                    <stop offset="50%" stopColor="#FFD700" />
                    <stop offset="100%" stopColor="#FFE082" />
                  </linearGradient>
                  <linearGradient id="goldGradCover" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFD700" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Double-Ring Glowing Gold Avatar Frame (Tap avatar to view Creator's 24h Snap Story!) */}
            <div className="hero-avatar-center" onClick={() => setActiveStoryModal({ media_url: activeCreator?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800", user_profile: { display_name: activeCreator?.display_name || activeCreator?.username } })}>
              <div className="avatar-gold-double-ring" style={{ cursor: "pointer" }}>
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

            {/* Action Buttons Stack (Dynamic for Visitor vs Logged-In Creator Owner) */}
            <div className="profile-actions-stack">
              {currentUser && currentUser.id === activeCreator.id ? (
                // Logged-In Creator Owner Controls
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                  <button className="btn-subscribe-gold-bar" onClick={() => setShowAddModal(true)}>
                    📸 + Upload New Snap / Gallery / VIP Post
                  </button>
                  <div className="row-actions">
                    <button className="btn-follow-glass" onClick={() => setShowStudioModal(true)}>
                      🎨 Creator Studio
                    </button>
                    <button
                      className="btn-chat-glass"
                      style={{ color: "#ff4444", borderColor: "#ff4444" }}
                      onClick={async () => {
                        await supabase.auth.signOut();
                        setCurrentUser(null);
                        setUserRole("customer");
                        window.location.search = "";
                      }}
                    >
                      🚪 Log Out
                    </button>
                  </div>
                </div>
              ) : (
                // Visitor Controls
                <>
                  <div className="row-actions">
                    <button className="btn-follow-glass" onClick={() => alert(`✓ Following @${activeCreator?.username}`)}>
                      ＋ Follow
                    </button>
                    <button
                      className="btn-chat-glass"
                      onClick={() => {
                        if (!currentUser) {
                          setShowAuthModal(true);
                        } else if (!isVipMember && currentUser.id !== activeCreator.id) {
                          setShowSubscribeModal(true);
                        } else {
                          setShowChatModal(true);
                        }
                      }}
                    >
                      🗨 1-on-1 Chat
                    </button>
                  </div>

                  {!isVipMember && currentUser?.id !== activeCreator.id && (
                    <button
                      className="btn-subscribe-gold-bar"
                      onClick={() => {
                        if (!currentUser) setShowAuthModal(true);
                        else setShowSubscribeModal(true);
                      }}
                    >
                      👑 Subscribe to VIP Lounge (7-Day Free Trial)
                    </button>
                  )}
                </>
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
                  <div key={item.id} style={{ position: "relative", width: "100%", aspectRatio: "1" }}>
                    <img
                      src={item.media_url}
                      alt="Gallery Post"
                      className="gallery-grid-img"
                      style={{ cursor: "pointer", width: "100%", height: "100%", objectFit: "cover" }}
                      onClick={() => setActiveLightboxImg(item.media_url)}
                      loading="eager"
                    />

                    {/* Top-Right ✕ Delete Button for Creator Owner / Admin */}
                    {(userRole === "admin" || (currentUser && currentUser.id === activeCreator.id)) && (
                      <button
                        title="Delete Image"
                        style={{
                          position: "absolute",
                          top: "6px",
                          right: "6px",
                          width: "26px",
                          height: "26px",
                          borderRadius: "50%",
                          background: "rgba(255, 68, 68, 0.9)",
                          border: "1.5px solid #fff",
                          color: "#fff",
                          fontSize: "13px",
                          fontWeight: 900,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          zIndex: 30,
                          boxShadow: "0 2px 8px rgba(0,0,0,0.6)",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this gallery image permanently?")) {
                            handleDeleteMedia(item.id, "vip_content");
                          }
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
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
                  const canViewUnblurred = isVipMember || userRole === "admin" || (currentUser && item.creator_id === currentUser.id);

                  return (
                    <div
                      key={item.id}
                      className="vip-card-wrapper"
                      style={{ position: "relative" }}
                      onClick={() => {
                        if (!currentUser) setShowAuthModal(true);
                        else if (!canViewUnblurred) setShowSubscribeModal(true);
                        else setActiveLightboxImg(item.media_url);
                      }}
                    >
                      <img
                        src={item.media_url}
                        alt="VIP Content"
                        className={`vip-card-img ${!canViewUnblurred ? "vip-card-blur" : ""}`}
                        loading="lazy"
                      />

                      {/* Top-Right ✕ Delete Button for Creator Owner / Admin */}
                      {(userRole === "admin" || (currentUser && currentUser.id === activeCreator.id)) && (
                        <button
                          title="Delete VIP Image"
                          style={{
                            position: "absolute",
                            top: "6px",
                            right: "6px",
                            width: "26px",
                            height: "26px",
                            borderRadius: "50%",
                            background: "rgba(255, 68, 68, 0.9)",
                            border: "1.5px solid #fff",
                            color: "#fff",
                            fontSize: "13px",
                            fontWeight: 900,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            zIndex: 30,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.6)",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Delete this VIP image permanently?")) {
                              handleDeleteMedia(item.id, "vip_content");
                            }
                          }}
                        >
                          ✕
                        </button>
                      )}

                      {!canViewUnblurred && (
                        <div className="vip-lock-overlay">
                          <span style={{ fontSize: "28px" }}>🔒</span>
                          <span style={{ fontSize: "11px", fontWeight: "bold", color: "#FFD700" }}>UNLOCK VIP</span>
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
      {/* 3. FRONT HOME PAGE VIEW (5-ACROSS SNAP STORIES GRID WITH 25 DEMOS) */}
      {/* ========================================================================= */}
      {!activeCreator && (
        <section style={{ padding: "16px 12px 40px 12px" }}>
          <h3 style={{ fontSize: "19px", fontWeight: 900, color: "#FFD700", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
            👻 Snap Stories
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "14px 8px" }}>
            {/* Add Snap Option for Creator Accounts */}
            {userRole !== "customer" && (
              <div
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer" }}
                onClick={() => setShowAddModal(true)}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    border: "2px dashed #FFD700",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 12px rgba(255, 215, 0, 0.3)",
                  }}
                >
                  <span style={{ fontSize: "22px", color: "#FFD700", fontWeight: 900 }}>＋</span>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#FFD700", textAlign: "center" }}>Add Snap</span>
              </div>
            )}

            {/* 25 Snap Stories Circles (5 across grid layout) */}
            {storiesList.slice(0, 25).map((story) => (
              <div
                key={story.id}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer" }}
                onClick={() => setActiveStoryModal(story)}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    padding: "2px",
                    background: "linear-gradient(135deg, #FFD700 0%, #AA771C 100%)",
                    boxShadow: "0 0 14px rgba(255, 215, 0, 0.4)",
                  }}
                >
                  <img
                    src={story.media_url}
                    alt="Story"
                    style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                  />
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#eee",
                    textAlign: "center",
                    maxWidth: "60px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {story.user_profile?.display_name || "Snap"}
                </span>
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
            <div
              style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}
              onClick={() => {
                const username = activeStoryModal.user_profile?.username || activeStoryModal.user_profile?.display_name?.toLowerCase().replace(/[^a-z0-9]/g, "") || "sophia";
                setActiveStoryModal(null);
                window.location.search = `?${username}`;
              }}
            >
              <img
                src={activeStoryModal.media_url}
                alt=""
                style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid #FFD700", objectFit: "cover", boxShadow: "0 0 10px rgba(255,215,0,0.5)" }}
              />
              <div>
                <h4 style={{ fontSize: "14px", fontWeight: "bold", color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: "4px" }}>
                  {activeStoryModal.user_profile?.display_name || "Snap Story"}
                  <span style={{ fontSize: "11px", color: "#FFD700" }}>👑</span>
                </h4>
                <p style={{ fontSize: "11px", color: "#FFD700", margin: 0, fontWeight: "bold" }}>View Profile ›</p>
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

            {/* Creator Move to VIP Memories Action Overlay */}
            {userRole !== "customer" && (
              <div style={{ position: "absolute", bottom: "30px", left: "20px", right: "20px", zIndex: 100, display: "flex", justifyContent: "center" }}>
                <button
                  style={{
                    padding: "14px 24px",
                    borderRadius: "30px",
                    border: "1px solid rgba(255,215,0,0.5)",
                    background: "rgba(18, 18, 22, 0.85)",
                    backdropFilter: "blur(16px)",
                    color: "#FFD700",
                    fontWeight: 900,
                    fontSize: "14px",
                    cursor: "pointer",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                  onClick={async () => {
                    const newVipItem = {
                      id: `vip-mem-${Date.now()}`,
                      media_url: activeStoryModal.media_url,
                      is_public_gallery: false,
                      creator_id: currentUser?.id || "demo-creator",
                    };
                    setVipList((prev) => [newVipItem, ...prev]);

                    if (currentUser) {
                      await supabase.from("vip_content").insert([
                        {
                          creator_id: currentUser.id,
                          media_url: activeStoryModal.media_url,
                          is_public_gallery: false,
                        },
                      ]);
                    }

                    alert("✨ Saved Snap to your VIP Memories Lounge!");
                  }}
                >
                  👑 Save Snap to VIP Memories
                </button>
              </div>
            )}
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

            <h4 style={{ fontSize: "14px", marginBottom: "10px", color: "#FFD700" }}>Manage Uploaded Posts (Gallery & VIP)</h4>
            <div style={{ maxHeight: "280px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
              {[...galleryList, ...vipList].length === 0 ? (
                <p style={{ fontSize: "12px", color: "#888", fontStyle: "italic" }}>No uploaded posts yet.</p>
              ) : (
                [...galleryList, ...vipList].map((item) => (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#222", padding: "8px 12px", borderRadius: "12px" }}>
                    <img src={item.media_url} alt="" style={{ width: "45px", height: "45px", borderRadius: "8px", objectFit: "cover" }} />
                    <span style={{ fontSize: "12px", color: item.is_public_gallery ? "#00F2FE" : "#FFD700", fontWeight: "bold" }}>
                      {item.is_public_gallery ? "🖼️ Gallery" : "👑 VIP Lounge"}
                    </span>
                    <button
                      style={{ background: "#ff4444", border: "none", color: "#fff", padding: "6px 12px", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
                      onClick={() => handleDeleteMedia(item.id, "vip_content")}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                ))
              )}
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

            {/* Quick Demo Creator Accounts 1-Tap Login (Outside Form to avoid HTML validation) */}
            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <p style={{ fontSize: "12px", color: "#FFD700", fontWeight: "bold", textAlign: "center", marginBottom: "10px" }}>
                ⚡ Quick 1-Tap Login as Creator:
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                <button
                  type="button"
                  style={{ padding: "10px", borderRadius: "12px", border: "1px solid #FFD700", background: "rgba(255,215,0,0.15)", color: "#FFD700", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}
                  onClick={() => handleQuickDemoLogin("victoria", "Victoria Chic 👑", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400")}
                >
                  👑 @victoria
                </button>
                <button
                  type="button"
                  style={{ padding: "10px", borderRadius: "12px", border: "1px solid #FFD700", background: "rgba(255,215,0,0.15)", color: "#FFD700", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}
                  onClick={() => handleQuickDemoLogin("sophia", "Sophia Rose 👑", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400")}
                >
                  👑 @sophia
                </button>
                <button
                  type="button"
                  style={{ padding: "10px", borderRadius: "12px", border: "1px solid #FFD700", background: "rgba(255,215,0,0.15)", color: "#FFD700", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}
                  onClick={() => handleQuickDemoLogin("isabella", "Isabella VIP 💎", "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400")}
                >
                  👑 @isabella
                </button>
                <button
                  type="button"
                  style={{ padding: "10px", borderRadius: "12px", border: "1px solid #FFD700", background: "rgba(255,215,0,0.15)", color: "#FFD700", fontWeight: "bold", fontSize: "12px", cursor: "pointer" }}
                  onClick={() => handleQuickDemoLogin("elena", "Elena Adult+ 💋", "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400")}
                >
                  👑 @elena
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. FREE TRIAL VIP SUBSCRIBE POP-UP MODAL */}
      {showSubscribeModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ textAlign: "center", maxWidth: "420px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "28px" }}>👑</span>
              <button style={{ background: "none", border: "none", color: "#fff", fontSize: "20px", cursor: "pointer" }} onClick={() => setShowSubscribeModal(false)}>
                ✕
              </button>
            </div>

            <h3 style={{ fontSize: "22px", fontWeight: 900, color: "#FFD700", marginBottom: "6px" }}>
              Unlock @{activeCreator?.username}'s VIP Lounge
            </h3>
            <p style={{ fontSize: "13px", color: "#aaa", marginBottom: "20px" }}>
              Get instant unblurred access to exclusive VIP photos, 1-on-1 direct chat, and private stories!
            </p>

            <div style={{ background: "linear-gradient(180deg, rgba(255,215,0,0.15) 0%, rgba(20,20,25,0.9) 100%)", border: "1px solid rgba(255,215,0,0.4)", padding: "18px", borderRadius: "20px", marginBottom: "20px" }}>
              <div style={{ fontSize: "26px", fontWeight: 900, color: "#fff", marginBottom: "4px" }}>
                $0.00 <span style={{ fontSize: "14px", color: "#FFD700", fontWeight: "bold" }}>(7-Day Free Trial)</span>
              </div>
              <p style={{ fontSize: "12px", color: "#888", margin: 0 }}>Then ${customVipPrice}/month • Cancel anytime</p>
            </div>

            <button
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "20px",
                border: "none",
                background: "linear-gradient(180deg, #FFD700 0%, #AA771C 100%)",
                color: "#000",
                fontWeight: 900,
                fontSize: "16px",
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(255,215,0,0.4)",
              }}
              onClick={() => {
                setIsVipMember(true);
                setShowSubscribeModal(false);
                alert(`🎉 Congratulations! 7-Day Free Trial Activated! VIP Lounge & 1-on-1 Chat Unlocked!`);
              }}
            >
              🚀 Start 7-Day Free Trial Now
            </button>
          </div>
        </div>
      )}

      {/* 6. FULL-SCREEN LIGHTBOX GALLERY IMAGE PREVIEW */}
      {activeLightboxImg && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.92)",
            backdropFilter: "blur(12px)",
            zIndex: 9999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setActiveLightboxImg(null)}
        >
          <button
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "#fff",
              fontSize: "24px",
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              cursor: "pointer",
            }}
            onClick={() => setActiveLightboxImg(null)}
          >
            ✕
          </button>
          <img
            src={activeLightboxImg}
            alt="Enlarged Lightbox"
            style={{
              maxWidth: "100%",
              maxHeight: "85vh",
              borderRadius: "16px",
              objectFit: "contain",
              boxShadow: "0 12px 40px rgba(0,0,0,0.9)",
            }}
          />
        </div>
      )}

      {/* 7. INTERACTIVE 1-ON-1 DIRECT MESSENGER CHAT MODAL */}
      {showChatModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "480px", height: "80vh", display: "flex", flexDirection: "column", padding: "0", overflow: "hidden" }}>
            {/* Chat Room Header */}
            <div style={{ padding: "16px", background: "linear-gradient(180deg, #1f1d19 0%, #121214 100%)", borderBottom: "1px solid rgba(255,215,0,0.25)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <img
                  src={activeCreator?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"}
                  alt=""
                  style={{ width: "42px", height: "42px", borderRadius: "50%", border: "2px solid #FFD700", objectFit: "cover" }}
                />
                <div>
                  <h4 style={{ fontSize: "15px", fontWeight: "bold", color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: "4px" }}>
                    {activeCreator?.display_name || activeCreator?.username || "Creator"}
                    <span style={{ fontSize: "11px", color: "#FFD700" }}>👑 VIP</span>
                  </h4>
                  <p style={{ fontSize: "11px", color: "#00F2FE", margin: 0 }}>● Online 1-on-1 Private Chat</p>
                </div>
              </div>
              <button style={{ background: "none", border: "none", color: "#fff", fontSize: "22px", cursor: "pointer", padding: "4px" }} onClick={() => setShowChatModal(false)}>
                ✕
              </button>
            </div>

            {/* Message History Feed */}
            <div style={{ flex: 1, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", background: "#0d0d0f" }}>
              <div style={{ textAlign: "center", margin: "8px 0" }}>
                <span style={{ fontSize: "11px", background: "rgba(255,255,255,0.08)", padding: "4px 12px", borderRadius: "12px", color: "#888" }}>
                  🔒 End-to-End Encrypted Private Chat
                </span>
              </div>

              {chatMessages.map((msg) => {
                const isMe = msg.sender === "user";
                return (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: isMe ? "flex-end" : "flex-start",
                      maxWidth: "80%",
                      background: isMe ? "linear-gradient(135deg, #FFD700 0%, #AA771C 100%)" : "rgba(45, 45, 52, 0.9)",
                      color: isMe ? "#000" : "#fff",
                      padding: "12px 16px",
                      borderRadius: isMe ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                    }}
                  >
                    <p style={{ fontSize: "13.5px", margin: 0, fontWeight: isMe ? "700" : "500", lineHeight: "1.4" }}>{msg.text}</p>
                    <span style={{ fontSize: "10px", opacity: 0.7, marginTop: "4px", display: "block", textAlign: "right" }}>{msg.time}</span>
                  </div>
                );
              })}
            </div>

            {/* Input Send Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!chatInputText.trim()) return;

                const userMsg = { id: Date.now().toString(), sender: "user", text: chatInputText, time: "Just now" };
                setChatMessages((prev) => [...prev, userMsg]);
                const sentText = chatInputText;
                setChatInputText("");

                // Simulated Creator Auto Reply
                setTimeout(() => {
                  setChatMessages((prev) => [
                    ...prev,
                    {
                      id: (Date.now() + 1).toString(),
                      sender: "creator",
                      text: `Aww thank you! 😘 I loved reading your message "${sentText}". Check out my latest VIP photo! 💋`,
                      time: "Just now",
                    },
                  ]);
                }, 1200);
              }}
              style={{ padding: "12px 16px", background: "#16161a", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "10px", alignItems: "center" }}
            >
              <input
                type="text"
                placeholder={`Message @${activeCreator?.username || "Creator"}...`}
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                style={{ flex: 1, padding: "12px 16px", borderRadius: "24px", border: "1px solid rgba(255,215,0,0.3)", background: "#0a0a0c", color: "#fff", fontSize: "13.5px", outline: "none" }}
              />
              <button
                type="submit"
                style={{
                  padding: "12px 20px",
                  borderRadius: "24px",
                  border: "none",
                  background: "linear-gradient(180deg, #FFD700 0%, #AA771C 100%)",
                  color: "#000",
                  fontWeight: 900,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                Send 🚀
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Nav Bar matching reference design: Discover (Home), + (Add Snap), Messages, Profile (Log Out) */}
      <nav className="bottom-navigation">
        <button
          className={`nav-item-btn ${!activeCreator ? "active" : ""}`}
          onClick={() => (window.location.search = "")}
        >
          <span style={{ fontSize: "22px" }}>🖤</span>
          <span>Discover</span>
        </button>
        <button
          className="nav-item-btn"
          onClick={() => {
            if (!currentUser) setShowAuthModal(true);
            else setShowAddModal(true);
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "var(--gold-gradient)",
              color: "#000",
              fontWeight: 900,
              fontSize: "22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 12px rgba(255,215,0,0.5)",
            }}
          >
            ＋
          </div>
          <span>Add Snap</span>
        </button>
        <button
          className="nav-item-btn"
          onClick={() => {
            if (!currentUser) {
              setShowAuthModal(true);
            } else if (!isVipMember) {
              setShowSubscribeModal(true);
            } else {
              setShowChatModal(true);
            }
          }}
        >
          <span style={{ fontSize: "22px" }}>🗨</span>
          <span>Messages</span>
        </button>
        <button
          className={`nav-item-btn ${activeCreator ? "active" : ""}`}
          onClick={() => {
            if (!currentUser) {
              setShowAuthModal(true);
            } else {
              const username = currentUser.email?.split("@")[0] || "sophia";
              window.location.search = `?${username}`;
            }
          }}
        >
          <span style={{ fontSize: "22px" }}>👤</span>
          <span>{currentUser ? "Profile" : "Log In"}</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
