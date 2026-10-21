/**
 * ============================================================================
 * ABIDE TOGETHER — PREMIUM BIBLE STUDY WEB APPLICATION
 * Grow in the Word. Encourage one another.
 * ============================================================================
 */

document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    // ------------------------------------------------------------------------
    // 1. Constants & Configuration
    // ------------------------------------------------------------------------
    const PLAN_START_DATE = new Date(2026, 9, 12); // Monday, 12 October 2026
    const TOTAL_PLAN_DAYS = 14;
    const TOTAL_CHAPTERS = 28;

    // Storage Keys (Unified Architecture)
    const KEYS = {
        JOURNAL: "abide_journal_v2",
        PROGRESS: "abide_progress_v2",
        PROFILE: "abide_profile_v2",
        SCHEDULE: "abide_fellowship_v2", // Clean schedule sessions
        VERSES: "abide_saved_verses_v2",
        MEMBERS: "abide_members_v2",
        SETTINGS: "abide_settings_v2"
    };

    // DOM Helper
    const $ = id => document.getElementById(id);

    // Initial Date State
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    let selectedDate = new Date(currentDate);
    if (selectedDate < PLAN_START_DATE) {
        selectedDate = new Date(PLAN_START_DATE);
    }

    let calendarViewingMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    let supabaseClient = null;
    let currentUserSession = null;
    let currentUserIsAdmin = false;
    let hasUnsavedJournalChanges = false;
    let selectedVODTranslation = "KJV";

    // ------------------------------------------------------------------------
    // 2. Curated Scripture Treasury & 4-Translation Verse of the Day Data
    // ------------------------------------------------------------------------
    // Each featured scripture accurately contains authentic text for NLT, NIV, KJV, and NKJV
    const FEATURED_VERSES = [
        {
            reference: "Matthew 6:33",
            translations: {
                KJV: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.",
                NKJV: "But seek first the kingdom of God and His righteousness, and all these things shall be added to you.",
                NIV: "But seek first his kingdom and his righteousness, and all these things will be given to you as well.",
                NLT: "Seek the Kingdom of God above all else, and live righteously, and he will give you everything you need."
            }
        },
        {
            reference: "John 15:5",
            translations: {
                KJV: "I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit: for without me ye can do nothing.",
                NKJV: "I am the vine, you are the branches. He who abides in Me, and I in him, bears much fruit; for without Me you can do nothing.",
                NIV: "I am the vine; you are the branches. If you remain in me and I in you, you will bear much fruit; apart from me you can do nothing.",
                NLT: "Yes, I am the vine; you are the branches. Those who remain in me, and I in them, will produce much fruit. For apart from me you can do nothing."
            }
        },
        {
            reference: "Matthew 11:28–30",
            translations: {
                KJV: "Come unto me, all ye that labour and are heavy laden, and I will give you rest. Take my yoke upon you, and learn of me; for I am meek and lowly in heart: and ye shall find rest unto your souls. For my yoke is easy, and my burden is light.",
                NKJV: "Come to Me, all you who labor and are heavy laden, and I will give you rest. Take My yoke upon you and learn from Me, for I am gentle and lowly in heart, and you will find rest for your souls. For My yoke is easy and My burden is light.",
                NIV: "Come to me, all you who are weary and burdened, and I will give you rest. Take my yoke upon you and learn from me, for I am gentle and humble in heart, and you will find rest for your souls. For my yoke is easy and my burden is light.",
                NLT: "Then Jesus said, “Come to me, all of you who are weary and carry heavy burdens, and I will give you rest. Take my yoke upon you. Let me teach you, because I am humble and gentle at heart, and you will find rest for your souls. For my yoke is easy to bear, and the burden I give you is light.”"
            }
        },
        {
            reference: "Philippians 4:6–7",
            translations: {
                KJV: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.",
                NKJV: "Be anxious for nothing, but in everything by prayer and supplication, with thanksgiving, let your requests be made known to God; and the peace of God, which surpasses all understanding, will guard your hearts and minds through Christ Jesus.",
                NIV: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
                NLT: "Don’t worry about anything; instead, pray about everything. Tell God what you need, and thank him for all he has done. Then you will experience God’s peace, which exceeds anything we can understand. His peace will guard your hearts and minds as you live in Christ Jesus."
            }
        },
        {
            reference: "Proverbs 3:5–6",
            translations: {
                KJV: "Trust in the Lord with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.",
                NKJV: "Trust in the Lord with all your heart, and lean not on your own understanding; in all your ways acknowledge Him, and He shall direct your paths.",
                NIV: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
                NLT: "Trust in the Lord with all your heart; do not depend on your own understanding. Seek his will in all you do, and he will show you which path to take."
            }
        },
        {
            reference: "Isaiah 40:31",
            translations: {
                KJV: "But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.",
                NKJV: "But those who wait on the Lord shall renew their strength; they shall mount up with wings like eagles, they shall run and not be weary, they shall walk and not faint.",
                NIV: "but those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not be weary, they will walk and not faint.",
                NLT: "But those who trust in the Lord will find new strength. They will soar high on wings like eagles. They will run and not grow weary. They will walk and not faint."
            }
        },
        {
            reference: "Matthew 28:19–20",
            translations: {
                KJV: "Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost: teaching them to observe all things whatsoever I have commanded you: and, lo, I am with you always, even unto the end of the world. Amen.",
                NKJV: "Go therefore and make disciples of all the nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit, teaching them to observe all things that I have commanded you; and lo, I am with you always, even to the end of the age. Amen.",
                NIV: "Therefore go and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit, and teaching them to obey everything I have commanded you. And surely I am with you always, to the very end of the age.",
                NLT: "Therefore, go and make disciples of all the nations, baptizing them in the name of the Father and the Son and the Holy Spirit. Teach these new disciples to obey all the commands I have given you. And be sure of this: I am with you always, even to the end of the age."
            }
        }
    ];

    // ------------------------------------------------------------------------
    // 3. Local Storage & Clean Startup (No Sample/Fake Data)
    // ------------------------------------------------------------------------
    function getStorage(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw !== null ? JSON.parse(raw) : fallback;
        } catch (e) {
            console.warn("Storage read error for " + key, e);
            return fallback;
        }
    }

    function setStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error("Storage write error for " + key, e);
            showToast("Storage quota exceeded or private mode error", "error");
            return false;
        }
    }

    /**
     * Preserves genuine user data while stripping all demo/sample schedules & members
     */
    function runDataMigration() {
        // 1. Preserve Notes
        const currentJournal = getStorage(KEYS.JOURNAL, {});
        setStorage(KEYS.JOURNAL, currentJournal);

        // 2. Preserve Chapter Completion Progress
        const currentProg = getStorage(KEYS.PROGRESS, {});
        setStorage(KEYS.PROGRESS, currentProg);

        // 3. Profile
        const currentProf = getStorage(KEYS.PROFILE, {
            name: "Anna Grace",
            email: "annagrace@example.com",
            bio: "Growing together in Christ.",
            favoriteVerse: "John 15:5",
            isAdmin: false,
            emailRemindersEnabled: true,
            emailReminderTiming: "30m"
        });
        setStorage(KEYS.PROFILE, currentProf);

        // 4. CLEAN SCHEDULE: Remove all seeded/demo records (starts completely blank)
        const currentSchedule = getStorage(KEYS.SCHEDULE, null);
        if (!currentSchedule || !Array.isArray(currentSchedule)) {
            setStorage(KEYS.SCHEDULE, []);
        } else {
            // Filter out any older demo sessions with fake IDs
            const cleaned = currentSchedule.filter(s => s && !s.id.startsWith("f-2026-10-"));
            setStorage(KEYS.SCHEDULE, cleaned);
        }

        // 5. CLEAN MEMBERS: Remove all fake members (Samuel, Joyce, Daniel, etc.)
        const currentMembers = getStorage(KEYS.MEMBERS, null);
        if (!currentMembers || !Array.isArray(currentMembers)) {
            setStorage(KEYS.MEMBERS, []);
        } else {
            // Keep only real registered members
            const cleanedMembers = currentMembers.filter(m => m && m.email && m.email !== "cousin@example.com" && m.email !== "samuel@example.com" && m.email !== "joyce@example.com" && m.email !== "daniel@example.com");
            setStorage(KEYS.MEMBERS, cleanedMembers);
        }

        // 6. Curated Saved Verses Treasury starter
        const currentVerses = getStorage(KEYS.VERSES, null);
        if (!currentVerses || !Array.isArray(currentVerses) || currentVerses.length === 0) {
            setStorage(KEYS.VERSES, [
                {
                    id: "v-starter-1",
                    reference: "Matthew 6:33",
                    text: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.",
                    translation: "KJV",
                    category: "Matthew",
                    notes: "Our core priority in walking with Christ."
                },
                {
                    id: "v-starter-2",
                    reference: "John 15:5",
                    text: "I am the vine; you are the branches. Whoever abides in me and I in him, he it is that bears much fruit, for apart from me you can do nothing.",
                    translation: "ESV",
                    category: "Favorites",
                    notes: "The foundational verse of Abide Together."
                }
            ]);
        }

        console.log("[Abide Together] Clean database & migration initialized. Schedule starts empty.");
    }

    // ------------------------------------------------------------------------
    // 4. Administrator Role Checking
    // ------------------------------------------------------------------------
   function isCurrentUserAdmin() {
    return !!(
        supabaseClient &&
        currentUserSession &&
        currentUserSession.user &&
        currentUserIsAdmin
    );
}

    function updateAdminUIControls() {
        const isAdmin = isCurrentUserAdmin();
        document.querySelectorAll(".admin-only-control").forEach(el => {
            if (isAdmin) {
                el.classList.remove("hidden");
            } else {
                el.classList.add("hidden");
            }
        });
        if ($("sidebarUserRole")) {
            $("sidebarUserRole").textContent = isAdmin ? "Administrator" : "Member";
        }
        if ($("profileRoleBadge")) {
            $("profileRoleBadge").textContent = isAdmin ? "Administrator" : "Member";
            $("profileRoleBadge").className = `badge ${isAdmin ? "badge-gold" : "badge-blue"}`;
        }
    }

    // ------------------------------------------------------------------------
    // 5. Date & Reading Plan Utilities
    // ------------------------------------------------------------------------
    function formatDateKey(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }

    function formatDisplayDate(date, options = { weekday: "long", day: "numeric", month: "long", year: "numeric" }) {
        return date.toLocaleDateString("en-IN", options);
    }

    function parseDateString(str) {
        if (!str) return new Date();
        const parts = str.split("-");
        if (parts.length === 3) {
            return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        }
        return new Date(str);
    }

    /**
     * Matthew 1–28 Reading Plan (12 Oct – 25 Oct 2026, 2 chapters/day)
     * Outside range returns empty array (no fake assignments)
     */
    
function getAssignedChapters(date) {
    const start = new Date(PLAN_START_DATE);
    start.setHours(0, 0, 0, 0);

    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    if (target < start) {
        return [];
    }

    let readingDay = 0;
    const cursor = new Date(start);

    while (cursor < target) {
        if (cursor.getDay() !== 0) {
            readingDay++;
        }
        cursor.setDate(cursor.getDate() + 1);
    }

    // No assigned reading on Sundays
    if (target.getDay() === 0) {
        return [];
    }

    const firstChapter = readingDay * 2 + 1;
    const secondChapter = firstChapter + 1;

    const result = [];

    if (firstChapter <= TOTAL_CHAPTERS) {
        result.push(firstChapter);
    }

    if (secondChapter <= TOTAL_CHAPTERS) {
        result.push(secondChapter);
    }

    return result;
}


    // ------------------------------------------------------------------------
    // 6. UI Toast Notifications
    // ------------------------------------------------------------------------
    function showToast(message, type = "info") {
        const container = $("toastContainer");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `toast ${type === "error" ? "toast-error" : type === "success" ? "toast-success" : ""}`;
        toast.textContent = message;

        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transition = "opacity 0.3s";
            setTimeout(() => toast.remove(), 300);
        }, 3400);
    }

    // ------------------------------------------------------------------------
    // 7. Navigation & View Routing
    // ------------------------------------------------------------------------
    function navigateToView(viewName) {
        if (hasUnsavedJournalChanges && viewName !== "journal") {
            const leave = confirm("You have unsaved changes in your study journal. Do you want to leave without saving?");
            if (!leave) return;
            hasUnsavedJournalChanges = false;
        }

        document.querySelectorAll(".view").forEach(el => el.classList.add("hidden"));
        const targetView = $(`view-${viewName}`);
        if (targetView) {
            targetView.classList.remove("hidden");
        }

        document.querySelectorAll(".nav-link").forEach(btn => {
            btn.classList.toggle("active", btn.dataset.view === viewName);
        });

        const titles = {
            overview: "Overview",
            calendar: "Reading Calendar",
            journal: "Study Journal",
            verses: "Scripture Treasury",
            schedule: "Schedule",
            people: "Our People",
            reminders: "Reminders",
            settings: "Settings & Cloud"
        };
        if ($("topbarTitle")) {
            $("topbarTitle").textContent = titles[viewName] || "Abide Together";
        }

        closeSidebar();

        if (viewName === "overview") refreshDashboard();
        if (viewName === "calendar") renderCalendar();
        if (viewName === "journal") loadJournalForDate(selectedDate);
        if (viewName === "verses") renderSavedVerses();
        if (viewName === "schedule") renderScheduleSessions();
        if (viewName === "people") renderPeopleView();
        if (viewName === "reminders") updateReminderUI();
        if (viewName === "settings") loadSettingsView();

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function openSidebar() {
        $("appSidebar")?.classList.add("open");
        $("sidebarOverlay")?.classList.add("open");
    }

    function closeSidebar() {
        $("appSidebar")?.classList.remove("open");
        $("sidebarOverlay")?.classList.remove("open");
    }

    // ------------------------------------------------------------------------
    // 8. Theme Toggle (Dark Blue Light / Dark Mode)
    // ------------------------------------------------------------------------
    function applyTheme(themeName) {
        const isDark = themeName === "dark";
        document.body.classList.toggle("dark-mode", isDark);

        const icon = $("themeToggleIcon");
        if (icon) {
            icon.textContent = isDark ? "☀️" : "🌙";
        }

        const settings = getStorage(KEYS.SETTINGS, {});
        settings.theme = themeName;
        setStorage(KEYS.SETTINGS, settings);
    }

    function initTheme() {
        const settings = getStorage(KEYS.SETTINGS, {});
        let preferredTheme = settings.theme;

        if (!preferredTheme) {
            if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
                preferredTheme = "dark";
            } else {
                preferredTheme = "light";
            }
        }
        applyTheme(preferredTheme);
    }

    // ------------------------------------------------------------------------
    // 9. Dashboard / Overview Logic
    // ------------------------------------------------------------------------
    function calculateStatistics() {
        const progress = getStorage(KEYS.PROGRESS, {});
        const journals = getStorage(KEYS.JOURNAL, {});

        const completedChapters = new Set();
        Object.values(progress).forEach(arr => {
            if (Array.isArray(arr)) {
                arr.forEach(ch => {
                    if (Number.isInteger(ch) && ch >= 1 && ch <= TOTAL_CHAPTERS) {
                        completedChapters.add(ch);
                    }
                });
            }
        });

        const totalCompleted = completedChapters.size;
        const completionPercent = Math.round((totalCompleted / TOTAL_CHAPTERS) * 100);

        const entryCount = Object.values(journals).filter(e => {
            return e && (
                (e.observation && e.observation.trim()) ||
                (e.understanding && e.understanding.trim()) ||
                (e.application && e.application.trim()) ||
                (e.keyVerse && e.keyVerse.trim()) ||
                (e.otherNotes && e.otherNotes.trim()) ||
                (e.prayerPoints && e.prayerPoints.trim())
            );
        }).length;

        let streak = 0;
        let testDate = new Date();
        testDate.setHours(0, 0, 0, 0);

        for (let i = 0; i < 30; i++) {
            const key = formatDateKey(testDate);
            const chaptersForDay = getAssignedChapters(testDate);
            const done = progress[key] || [];

            if (chaptersForDay.length > 0) {
                const isDayComplete = chaptersForDay.every(ch => done.includes(ch));
                if (isDayComplete) {
                    streak++;
                } else if (i > 0) {
                    break;
                }
            }
            testDate.setDate(testDate.getDate() - 1);
        }

        return {
            totalCompleted,
            completionPercent,
            entryCount,
            streak
        };
    }

    function refreshDashboard() {
        const profile = getStorage(KEYS.PROFILE, { name: "Anna Grace" });
        const stats = calculateStatistics();
        const todayKey = formatDateKey(currentDate);
        const todayChapters = getAssignedChapters(currentDate);

        // Welcome & Topbar
        if ($("heroGreeting")) {
            $("heroGreeting").textContent = `Welcome back, ${profile.name || "Cousin"} ✦`;
        }
        if ($("sidebarUserName")) {
            $("sidebarUserName").textContent = profile.name || "Anna Grace";
        }
        if ($("sidebarAvatar")) {
            const initials = (profile.name || "AG").split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
            $("sidebarAvatar").textContent = initials;
        }

        // Stats Display
        if ($("statCompletedChapters")) {
            $("statCompletedChapters").textContent = `${stats.totalCompleted} / ${TOTAL_CHAPTERS}`;
        }
        if ($("statCompletionPercent")) {
            $("statCompletionPercent").textContent = `${stats.completionPercent}%`;
        }
        if ($("statStreak")) {
            $("statStreak").textContent = `${stats.streak} Days`;
        }
        if ($("statJournalEntries")) {
            $("statJournalEntries").textContent = stats.entryCount;
        }

        // Today's reading summary
        const readingString = todayChapters.length
            ? `Matthew ${todayChapters.join("–")}`
            : "No Assigned Reading Today";

        if ($("statTodayReading")) $("statTodayReading").textContent = readingString;
        if ($("topbarReadingText")) $("topbarReadingText").textContent = readingString;
        if ($("todayReadingSubtext")) $("todayReadingSubtext").textContent = formatDisplayDate(currentDate);

        // Today's chapter completion progress
        const todayProgress = (getStorage(KEYS.PROGRESS, {}))[todayKey] || [];
        const container = $("todayChaptersList");
        if (container) {
            container.replaceChildren();

            if (todayChapters.length === 0) {
                const emptyMsg = document.createElement("p");
                emptyMsg.style.color = "var(--text-muted)";
                emptyMsg.textContent = "Today is outside the 14-day Matthew reading plan. You can still journal freely!";
                container.appendChild(emptyMsg);
            } else {
                todayChapters.forEach(ch => {
                    const label = document.createElement("label");
                    label.style.display = "flex";
                    label.style.alignItems = "center";
                    label.style.gap = "10px";
                    label.style.padding = "10px 14px";
                    label.style.background = "var(--bg-subtle)";
                    label.style.borderRadius = "var(--radius-md)";
                    label.style.cursor = "pointer";

                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.checked = todayProgress.includes(ch);
                    checkbox.style.width = "20px";
                    checkbox.style.height = "20px";
                    checkbox.style.accentColor = "var(--brand-blue)";

                    const text = document.createElement("span");
                    text.textContent = `Matthew Chapter ${ch}`;
                    text.style.fontWeight = "600";

                    checkbox.addEventListener("change", () => {
                        toggleChapterCompletion(currentDate, ch, checkbox.checked);
                        refreshDashboard();
                    });

                    label.append(checkbox, text);
                    container.appendChild(label);
                });
            }
        }

        const todayDoneCount = todayChapters.filter(ch => todayProgress.includes(ch)).length;
        const todayPercent = todayChapters.length ? Math.round((todayDoneCount / todayChapters.length) * 100) : 100;
        if ($("todayProgressBar")) $("todayProgressBar").style.width = `${todayPercent}%`;
        if ($("todayProgressLabel")) $("todayProgressLabel").textContent = `${todayDoneCount} of ${todayChapters.length} completed`;
        if ($("todayProgressPercent")) $("todayProgressPercent").textContent = `${todayPercent}%`;

        // Update Verse of the Day Card (Section 2)
        updateVerseOfDayCard();

        // Update Single Live Upcoming-Class Announcement (Section 3)
        updateDashboardUpcomingClassAnnouncement();

        // Update Real Registered Group Members
        renderGroupReadingProgress("groupMemberList");

        // Update admin controls
        updateAdminUIControls();
    }

    /**
     * Verse of the Day with accurate NLT, NIV, KJV, and NKJV translations
     */
    function updateVerseOfDayCard() {
        const dayOfYear = Math.floor((currentDate - new Date(currentDate.getFullYear(), 0, 0)) / 86400000);
        const currentItem = FEATURED_VERSES[dayOfYear % FEATURED_VERSES.length];

        if ($("dashVODRef")) $("dashVODRef").textContent = currentItem.reference;

        const translationMapNames = {
            NLT: "New Living Translation (NLT)",
            NIV: "New International Version (NIV)",
            KJV: "King James Version (KJV)",
            NKJV: "New King James Version (NKJV)"
            BSI_TELUGU: "Telugu Bible (BSI)"
        };

        const activeText = currentItem.translations[selectedVODTranslation] || currentItem.translations.KJV;
        if ($("dashVODText")) $("dashVODText").textContent = `"${activeText}"`;
        if ($("dashVODTranslationBadge")) $("dashVODTranslationBadge").textContent = translationMapNames[selectedVODTranslation] || selectedVODTranslation;

        // Translation Selector Event
        if ($("vodTranslationSelect")) {
            $("vodTranslationSelect").value = selectedVODTranslation;
            $("vodTranslationSelect").onchange = (e) => {
                selectedVODTranslation = e.target.value;
                updateVerseOfDayCard();
            };
        }

        // Copy button
        if ($("dashCopyVODBtn")) {
            $("dashCopyVODBtn").onclick = () => {
                navigator.clipboard.writeText(`${currentItem.reference} — "${activeText}" (${selectedVODTranslation})`);
                showToast("Verse copied to clipboard!", "success");
            };
        }

        // Save to Favorites button
        if ($("dashSaveVODBtn")) {
            $("dashSaveVODBtn").onclick = () => {
                const verses = getStorage(KEYS.VERSES, []);
                const exists = verses.some(v => v.reference === currentItem.reference && v.translation === selectedVODTranslation);
                if (exists) {
                    showToast(`${currentItem.reference} (${selectedVODTranslation}) is already in your Treasury!`, "info");
                } else {
                    verses.unshift({
                        id: "v-" + Date.now(),
                        reference: currentItem.reference,
                        text: activeText,
                        translation: selectedVODTranslation,
                        category: "Favorites",
                        notes: "Saved from Verse of the Day."
                    });
                    setStorage(KEYS.VERSES, verses);
                    showToast(`Saved ${currentItem.reference} (${selectedVODTranslation}) to Favorites!`, "success");
                }
            };
        }
    }

    /**
     * Single Live Upcoming-Class Announcement on Dashboard
     * Only displays real sessions published by the administrator.
     * Shows meeting date, start time, sermon leader, description, and Google Meet join button.
     * If blank, shows "Our next gathering will be announced here."
     */
    function updateDashboardUpcomingClassAnnouncement() {
        const sessions = getStorage(KEYS.SCHEDULE, []);
        const todayStr = formatDateKey(currentDate);

        const upcoming = sessions
            .filter(s => s.date >= todayStr)
            .sort((a, b) => a.date.localeCompare(b.date));

        const next = upcoming[0];
        const body = $("dashUpcomingClassBody");
        const actions = $("dashUpcomingClassActions");

        if (!next) {
            // Clean empty state
            if ($("dashUpcomingClassTitle")) $("dashUpcomingClassTitle").textContent = "Next Gathering Announcement";
            if ($("dashUpcomingClassSubtitle")) $("dashUpcomingClassSubtitle").textContent = "Live fellowship, sermon sharing, and prayer";
            if (actions) actions.replaceChildren();
            if (body) {
                body.innerHTML = `
                    <p style="color: var(--text-secondary); font-size: 1.05rem; padding: 14px 0;">
                        Our next gathering will be announced here.
                    </p>
                `;
            }
            return;
        }

        const sessionDate = parseDateString(next.date);
        const formattedDate = formatDisplayDate(sessionDate, { weekday: "long", day: "numeric", month: "long" });

        if ($("dashUpcomingClassTitle")) $("dashUpcomingClassTitle").textContent = next.topic || "Upcoming Bible Study Session";
        if ($("dashUpcomingClassSubtitle")) $("dashUpcomingClassSubtitle").textContent = `${formattedDate} · ${next.time}`;

        // Join Google Meet Button
        if (actions) {
            actions.replaceChildren();
            if (next.meetingLink && isValidHttpsUrl(next.meetingLink)) {
                const joinBtn = document.createElement("a");
                joinBtn.href = next.meetingLink;
                joinBtn.target = "_blank";
                joinBtn.rel = "noopener noreferrer";
                joinBtn.className = "meet-btn";
                joinBtn.innerHTML = "🎥 Join Google Meet";
                actions.appendChild(joinBtn);
            }
        }

        if (body) {
            body.innerHTML = `
                <div style="padding: 10px 0;">
                    <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 10px; flex-wrap: wrap;">
                        <span class="badge badge-blue">${next.type || "Fellowship"}</span>
                        <span style="font-weight: 700; color: var(--brand-blue);">${next.time}</span>
                        <span style="font-size: 0.88rem; color: var(--text-secondary);">Passages: <strong>${next.passages}</strong></span>
                    </div>
                    <div style="margin-bottom: 12px; font-size: 0.95rem;">
                        <span>Assigned Speaker: </span>
                        <strong style="color: var(--brand-navy); font-size: 1.05rem;">${next.leader}</strong>
                    </div>
                    ${next.topic ? `<p style="font-size: 0.95rem; color: var(--text-primary); margin-bottom: 12px;">${next.topic}</p>` : ""}
                    ${next.meetingLink && isValidHttpsUrl(next.meetingLink) ? `
                        <div style="font-size: 0.82rem; color: var(--text-muted);">
                            Google Meet Link: <a href="${next.meetingLink}" target="_blank" rel="noopener noreferrer" style="color: var(--brand-blue); text-decoration: underline;">${next.meetingLink}</a>
                        </div>
                    ` : ""}
                </div>
            `;
        }
    }

    function isValidHttpsUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === "https:";
        } catch (_) {
            return false;
        }
    }

    function renderGroupReadingProgress(containerId) {
        const container = $(containerId);
        if (!container) return;
        container.replaceChildren();

        const members = getStorage(KEYS.MEMBERS, []);
        const stats = calculateStatistics();
        const profile = getStorage(KEYS.PROFILE, { name: "Anna Grace" });

        if (members.length === 0) {
            const row = document.createElement("div");
            row.style.padding = "16px";
            row.style.background = "var(--bg-subtle)";
            row.style.borderRadius = "var(--radius-md)";
            row.style.textAlign = "center";
            row.style.color = "var(--text-secondary)";
            row.innerHTML = `
                <p style="font-weight: 600; margin-bottom: 4px;">You are currently the first registered member!</p>
                <p style="font-size: 0.84rem;">When your cousins register through the portal, their real reading progress will appear here.</p>
            `;
            container.appendChild(row);
            return;
        }

        members.forEach((m, idx) => {
            const row = document.createElement("div");
            row.style.display = "flex";
            row.style.alignItems = "center";
            row.style.justifyContent = "space-between";
            row.style.gap = "16px";
            row.style.padding = "12px 16px";
            row.style.borderRadius = "var(--radius-md)";
            row.style.background = "var(--bg-page)";
            row.style.border = "1px solid var(--border-color)";

            const isMe = m.email === profile.email || m.name === profile.name;
            const completedCount = isMe ? stats.totalCompleted : (m.chaptersCompleted || 0);
            const pct = Math.round((completedCount / TOTAL_CHAPTERS) * 100);
            const initials = m.name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();

            row.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; min-width: 140px;">
                    <div class="avatar-circle" style="width: 36px; height: 36px; font-size: 0.85rem;">${initials}</div>
                    <div>
                        <div style="font-weight: 700; font-size: 0.92rem;">${m.name} ${isMe ? '<span class="badge badge-blue" style="font-size: 0.65rem;">You</span>' : ''}</div>
                        <div style="font-size: 0.76rem; color: var(--text-muted);">${m.email || 'Member'}</div>
                    </div>
                </div>
                <div style="flex: 1; display: flex; align-items: center; gap: 12px;">
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${pct}%;"></div>
                    </div>
                </div>
                <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); min-width: 90px; text-align: right;">
                    ${completedCount} / ${TOTAL_CHAPTERS} (${pct}%)
                </div>
            `;
            container.appendChild(row);
        });
    }

    // ------------------------------------------------------------------------
    // 10. Reading Calendar Logic (CLEAN CELLS: NO WED/SAT LABELS)
    // ------------------------------------------------------------------------
    function renderCalendar() {
        const grid = $("calendarGrid");
        if (!grid) return;
        grid.replaceChildren();

        const year = calendarViewingMonth.getFullYear();
        const month = calendarViewingMonth.getMonth();

        if ($("calendarMonthHeading")) {
            $("calendarMonthHeading").textContent = formatDisplayDate(calendarViewingMonth, { month: "long", year: "numeric" });
        }

        const firstOfMonth = new Date(year, month, 1);
        const startDayOffset = (firstOfMonth.getDay() + 6) % 7;
        const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

        // Empty cells before the 1st
        for (let i = 0; i < startDayOffset; i++) {
            const emptyCell = document.createElement("div");
            emptyCell.className = "calendar-day";
            emptyCell.style.background = "transparent";
            emptyCell.style.border = "1px dashed transparent";
            emptyCell.style.pointerEvents = "none";
            grid.appendChild(emptyCell);
        }

        const progressData = getStorage(KEYS.PROGRESS, {});
        const journalsData = getStorage(KEYS.JOURNAL, {});

        // Render each day in month
        for (let day = 1; day <= totalDaysInMonth; day++) {
            const dayDate = new Date(year, month, day);
            const dateKey = formatDateKey(dayDate);
            const assignedChapters = getAssignedChapters(dayDate);
            const completedList = progressData[dateKey] || [];
            const hasNotes = journalsData[dateKey] && (
                journalsData[dateKey].observation ||
                journalsData[dateKey].understanding ||
                journalsData[dateKey].application ||
                journalsData[dateKey].keyVerse ||
                journalsData[dateKey].otherNotes ||
                journalsData[dateKey].prayerPoints
            );

            const isToday = formatDateKey(dayDate) === formatDateKey(currentDate);
            const isSelected = formatDateKey(dayDate) === formatDateKey(selectedDate);
            const isAllCompleted = assignedChapters.length > 0 && assignedChapters.every(ch => completedList.includes(ch));

            const dayCell = document.createElement("div");
            dayCell.className = `calendar-day ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`;
            dayCell.tabIndex = 0;
            dayCell.setAttribute("role", "button");
            dayCell.setAttribute("aria-label", `${formatDisplayDate(dayDate)}. ${assignedChapters.length ? 'Matthew ' + assignedChapters.join('–') : 'Personal Study'}`);

            // Day Header: CLEAN DATE NUMBER ONLY (NO WED / SAT LABELS)
            const header = document.createElement("div");
            header.className = "day-header";

            const num = document.createElement("span");
            num.className = "day-num";
            num.textContent = day;
            header.appendChild(num);

            dayCell.appendChild(header);

            // Reading Assignment Badge
            if (assignedChapters.length > 0) {
                const readingBadge = document.createElement("span");
                readingBadge.className = "day-reading-badge";
                readingBadge.textContent = `Matt ${assignedChapters.join("–")}`;
                dayCell.appendChild(readingBadge);
            }

            // Bottom Indicators
            const indicators = document.createElement("div");
            indicators.style.display = "flex";
            indicators.style.alignItems = "center";
            indicators.style.gap = "6px";
            indicators.style.fontSize = "0.72rem";

            if (isAllCompleted) {
                const chk = document.createElement("span");
                chk.style.color = "var(--brand-green)";
                chk.style.fontWeight = "700";
                chk.innerHTML = "✓ <span style='font-size:0.65rem;'>Done</span>";
                indicators.appendChild(chk);
            }

            if (hasNotes) {
                const nIcon = document.createElement("span");
                nIcon.style.color = "var(--brand-blue)";
                nIcon.style.fontWeight = "600";
                nIcon.textContent = "✎ Notes";
                indicators.appendChild(nIcon);
            }

            dayCell.appendChild(indicators);

            // Click Handler: Select Date & Open Journal
            dayCell.addEventListener("click", () => {
                selectedDate = new Date(dayDate);
                renderCalendar();
                navigateToView("journal");
            });

            dayCell.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectedDate = new Date(dayDate);
                    navigateToView("journal");
                }
            });

            grid.appendChild(dayCell);
        }
    }

    // ------------------------------------------------------------------------
    // 11. Study Journal Logic (6 Structured Sections Preserved)
    // ------------------------------------------------------------------------
    function loadJournalForDate(date) {
        selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);

        const dateKey = formatDateKey(selectedDate);
        const assigned = getAssignedChapters(selectedDate);
        const progress = (getStorage(KEYS.PROGRESS, {}))[dateKey] || [];
        const journals = getStorage(KEYS.JOURNAL, {});
        const entry = journals[dateKey] || {};

        if ($("journalDatePicker")) $("journalDatePicker").value = dateKey;
        if ($("journalDateFormatted")) $("journalDateFormatted").textContent = formatDisplayDate(selectedDate);

        if ($("journalReadingHeading")) {
            $("journalReadingHeading").textContent = assigned.length
                ? `Matthew ${assigned.join("–")}`
                : "No Assigned Chapters (Personal Reflection)";
        }

        const checkboxesContainer = $("journalChaptersContainer");
        if (checkboxesContainer) {
            checkboxesContainer.replaceChildren();

            if (assigned.length === 0) {
                const emptyMsg = document.createElement("p");
                emptyMsg.style.color = "var(--text-muted)";
                emptyMsg.textContent = "You can record personal reflections, quiet time thoughts, or verses for this date.";
                checkboxesContainer.appendChild(emptyMsg);
            } else {
                assigned.forEach(ch => {
                    const label = document.createElement("label");
                    label.style.display = "flex";
                    label.style.alignItems = "center";
                    label.style.gap = "10px";
                    label.style.padding = "8px 14px";
                    label.style.background = "var(--bg-subtle)";
                    label.style.borderRadius = "var(--radius-md)";
                    label.style.cursor = "pointer";

                    const cb = document.createElement("input");
                    cb.type = "checkbox";
                    cb.checked = progress.includes(ch);
                    cb.style.width = "20px";
                    cb.style.height = "20px";
                    cb.style.accentColor = "var(--brand-blue)";

                    const title = document.createElement("span");
                    title.textContent = `Mark Matthew Chapter ${ch} as Completed`;
                    title.style.fontWeight = "600";

                    cb.addEventListener("change", () => {
                        toggleChapterCompletion(selectedDate, ch, cb.checked);
                    });

                    label.append(cb, title);
                    checkboxesContainer.appendChild(label);
                });
            }
        }

        // 6 Structured Fields
        if ($("journalObservation")) $("journalObservation").value = entry.observation || "";
        if ($("journalUnderstanding")) $("journalUnderstanding").value = entry.understanding || "";
        if ($("journalApplication")) $("journalApplication").value = entry.application || "";
        if ($("journalKeyVerse")) $("journalKeyVerse").value = entry.keyVerse || "";
        if ($("journalOtherNotes")) $("journalOtherNotes").value = entry.otherNotes || "";
        if ($("journalPrayerPoints")) $("journalPrayerPoints").value = entry.prayerPoints || "";

        hasUnsavedJournalChanges = false;
        updateJournalSaveStatus("All changes saved locally ✓", true);
    }

    function saveJournalEntry() {
        const dateKey = formatDateKey(selectedDate);
        const journals = getStorage(KEYS.JOURNAL, {});

        journals[dateKey] = {
            observation: $("journalObservation")?.value.trim() || "",
            understanding: $("journalUnderstanding")?.value.trim() || "",
            application: $("journalApplication")?.value.trim() || "",
            keyVerse: $("journalKeyVerse")?.value.trim() || "",
            otherNotes: $("journalOtherNotes")?.value.trim() || "",
            prayerPoints: $("journalPrayerPoints")?.value.trim() || "",
            updatedAt: new Date().toISOString()
        };

        if (setStorage(KEYS.JOURNAL, journals)) {
            hasUnsavedJournalChanges = false;
            updateJournalSaveStatus("Saved successfully ✓", true);
            showToast(`Journal saved for ${formatDisplayDate(selectedDate)}`, "success");
            syncJournalEntryToCloud(dateKey, journals[dateKey]);
        }
    }

    function updateJournalSaveStatus(text, isSaved) {
        if ($("journalSaveStatus")) $("journalSaveStatus").textContent = text;
        if ($("journalSaveDot")) {
            $("journalSaveDot").style.backgroundColor = isSaved ? "var(--brand-green)" : "var(--brand-gold)";
        }
    }

    function markJournalUnsaved() {
        hasUnsavedJournalChanges = true;
        updateJournalSaveStatus("Unsaved changes...", false);
    }

    function toggleChapterCompletion(date, chapterNumber, isCompleted) {
        const dateKey = formatDateKey(date);
        const progressData = getStorage(KEYS.PROGRESS, {});
        let list = progressData[dateKey] || [];

        if (isCompleted && !list.includes(chapterNumber)) {
            list.push(chapterNumber);
        } else if (!isCompleted) {
            list = list.filter(ch => ch !== chapterNumber);
        }

        progressData[dateKey] = list;
        setStorage(KEYS.PROGRESS, progressData);
        syncProgressToCloud(dateKey, chapterNumber, isCompleted);
    }

    // ------------------------------------------------------------------------
    // 12. Saved Verses Logic
    // ------------------------------------------------------------------------
    let currentVerseFilter = "all";

    function renderSavedVerses() {
        const listContainer = $("savedVersesList");
        if (!listContainer) return;
        listContainer.replaceChildren();

        const verses = getStorage(KEYS.VERSES, []);

        if ($("verseCountAll")) $("verseCountAll").textContent = verses.length;
        if ($("verseCountMatt")) $("verseCountMatt").textContent = verses.filter(v => v.category === "Matthew").length;
        if ($("verseCountFav")) $("verseCountFav").textContent = verses.filter(v => v.category === "Favorites").length;
        if ($("verseCountEnc")) $("verseCountEnc").textContent = verses.filter(v => v.category === "Encouragement").length;

        const filtered = currentVerseFilter === "all"
            ? verses
            : verses.filter(v => v.category === currentVerseFilter);

        if (filtered.length === 0) {
            const empty = document.createElement("div");
            empty.className = "card";
            empty.style.textAlign = "center";
            empty.style.padding = "36px";
            empty.style.color = "var(--text-secondary)";
            empty.innerHTML = `
                <p style="font-size: 1.1rem; margin-bottom: 8px;">No verses found in this category.</p>
                <p style="font-size: 0.88rem;">Click "+ Add New Verse" above to save your favorite passages.</p>
            `;
            listContainer.appendChild(empty);
            return;
        }

        filtered.forEach(v => {
            const card = document.createElement("div");
            card.className = "card";
            card.style.borderLeft = "5px solid var(--brand-blue)";

            card.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <div>
                        <span class="badge badge-blue">${v.category || "Scripture"}</span>
                        <h3 class="verse-ref" style="margin-top: 4px;">${v.reference}</h3>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary btn-sm copy-btn" title="Copy text">📋 Copy</button>
                        <button class="btn btn-danger btn-sm del-btn" title="Delete verse">🗑</button>
                    </div>
                </div>
                <p class="verse-text" style="font-size: 1.15rem;">"${v.text}"</p>
                ${v.notes ? `<div style="background: var(--bg-subtle); padding: 10px 14px; border-radius: var(--radius-sm); font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px;"><strong>Reflection:</strong> ${v.notes}</div>` : ""}
                <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-muted); border-top: 1px solid var(--border-color); padding-top: 10px;">
                    <span class="badge badge-gold">${v.translation || "KJV"}</span>
                    <span>Abide Treasury</span>
                </div>
            `;

            card.querySelector(".copy-btn").addEventListener("click", () => {
                navigator.clipboard.writeText(`${v.reference} — "${v.text}" (${v.translation || "KJV"})`);
                showToast("Verse copied to clipboard!", "success");
            });

            card.querySelector(".del-btn").addEventListener("click", () => {
                if (confirm(`Remove ${v.reference} from your saved verses?`)) {
                    deleteSavedVerse(v.id);
                }
            });

            listContainer.appendChild(card);
        });
    }

    function saveNewVerse(verseObj) {
        const verses = getStorage(KEYS.VERSES, []);
        verses.unshift(verseObj);
        setStorage(KEYS.VERSES, verses);
        renderSavedVerses();
        showToast("New verse added to Scripture Treasury!", "success");
    }

    function deleteSavedVerse(id) {
        let verses = getStorage(KEYS.VERSES, []);
        verses = verses.filter(v => v.id !== id);
        setStorage(KEYS.VERSES, verses);
        renderSavedVerses();
        showToast("Verse removed.", "info");
    }

    // ------------------------------------------------------------------------
    // 13. SCHEDULE (RENAMED FROM FELLOWSHIP — STARTS CLEAN & BLANK)
    // ------------------------------------------------------------------------
    let currentScheduleTab = "upcoming";

    function renderScheduleSessions() {
        const container = $("fellowshipSessionsList");
        if (!container) return;
        container.replaceChildren();

        const sessions = getStorage(KEYS.SCHEDULE, []);
        const todayStr = formatDateKey(currentDate);
        const isAdmin = isCurrentUserAdmin();

        let displayed = [];
        if (currentScheduleTab === "upcoming") {
            displayed = sessions
                .filter(s => s.date >= todayStr)
                .sort((a, b) => a.date.localeCompare(b.date));
        } else {
            displayed = sessions
                .filter(s => s.date < todayStr || (s.summary && s.summary.trim()))
                .sort((a, b) => b.date.localeCompare(a.date));
        }

        // Friendly Empty State (Starts 100% clean with no demo data)
        if (displayed.length === 0) {
            const empty = document.createElement("div");
            empty.className = "card";
            empty.style.textAlign = "center";
            empty.style.padding = "48px 24px";
            empty.style.color = "var(--text-secondary)";
            empty.innerHTML = `
                <p style="font-size: 1.15rem; font-weight: 600; margin-bottom: 8px;">No sessions scheduled yet.</p>
                <p style="font-size: 0.95rem; color: var(--text-muted); margin-bottom: 16px;">Check back here for our next gathering.</p>
                ${isAdmin ? '<button id="emptyScheduleBtn" class="btn btn-primary btn-sm">+ Create First Gathering</button>' : ''}
            `;
            container.appendChild(empty);
            if (isAdmin) {
                empty.querySelector("#emptyScheduleBtn")?.addEventListener("click", () => {
                    $("scheduleFellowshipModal")?.classList.remove("hidden");
                });
            }
            return;
        }

        displayed.forEach((session, idx) => {
            const card = document.createElement("div");
            card.className = "card";
            card.style.borderLeft = "5px solid var(--brand-blue)";

            const sessionDate = parseDateString(session.date);
            const formattedDate = formatDisplayDate(sessionDate, { weekday: "long", day: "numeric", month: "long" });

            card.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                    <div>
                        <span class="badge badge-blue">${session.type}</span>
                        ${idx === 0 && currentScheduleTab === "upcoming" ? '<span class="badge badge-gold" style="margin-left: 6px;">Next Gathering</span>' : ''}
                        <h3 style="margin-top: 6px; font-size: 1.25rem; color: var(--brand-navy);">${session.topic}</h3>
                    </div>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        ${session.meetingLink && isValidHttpsUrl(session.meetingLink) ? `
                            <a href="${session.meetingLink}" target="_blank" rel="noopener noreferrer" class="meet-btn btn-sm">🎥 Join Meeting</a>
                        ` : ''}
                        ${isAdmin ? `
                            <button class="btn btn-secondary btn-sm summary-btn">✎ Summary</button>
                            <button class="btn btn-danger btn-sm del-session-btn">🗑</button>
                        ` : ''}
                    </div>
                </div>

                <div class="grid-2" style="background: var(--bg-subtle); padding: 14px 18px; border-radius: var(--radius-md); margin: 12px 0;">
                    <div>
                        <div style="font-size: 0.76rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Date & Time</div>
                        <div style="font-size: 0.95rem; font-weight: 700; color: var(--brand-navy); margin-top: 2px;">${formattedDate} · ${session.time}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.76rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Assigned Sermon Speaker</div>
                        <div style="font-size: 0.95rem; font-weight: 700; color: var(--brand-blue); margin-top: 2px;">${session.leader}</div>
                    </div>
                </div>

                <div style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 8px;">
                    Passages Covered: <strong>${session.passages}</strong>
                </div>

                ${session.meetingLink && isValidHttpsUrl(session.meetingLink) ? `
                    <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 8px;">
                        Google Meet: <a href="${session.meetingLink}" target="_blank" rel="noopener noreferrer" style="color: var(--brand-blue); text-decoration: underline;">${session.meetingLink}</a>
                    </div>
                ` : ''}

                ${session.summary ? `
                    <div style="background: var(--bg-page); padding: 12px 16px; border-radius: var(--radius-sm); border-left: 3px solid var(--brand-green); margin-top: 10px;">
                        <strong style="font-size: 0.85rem; color: var(--brand-green);">Session Summary & Prayer Points:</strong>
                        <p style="font-size: 0.88rem; margin-top: 4px;">${session.summary}</p>
                    </div>
                ` : ''}
            `;

            if (isAdmin) {
                card.querySelector(".summary-btn")?.addEventListener("click", () => {
                    openRecordSummaryModal(session);
                });
                card.querySelector(".del-session-btn")?.addEventListener("click", () => {
                    if (confirm(`Delete the scheduled session for ${session.date}?`)) {
                        deleteScheduleSession(session.id);
                    }
                });
            }

            container.appendChild(card);
        });
    }

    function openRecordSummaryModal(session) {
        if (!isCurrentUserAdmin()) {
            alert("Only the administrator can record session summaries.");
            return;
        }
        $("summarySessionId").value = session.id;
        $("summarySessionTitle").textContent = `Summary for ${session.topic} (${session.date})`;
        $("summaryTextInput").value = session.summary || "";
        $("recordSummaryModal").classList.remove("hidden");
    }

    function saveScheduleSummary(sessionId, summaryText) {
        if (!isCurrentUserAdmin()) return;
        const sessions = getStorage(KEYS.SCHEDULE, []);
        const target = sessions.find(s => s.id === sessionId);
        if (target) {
            target.summary = summaryText;
            setStorage(KEYS.SCHEDULE, sessions);
            renderScheduleSessions();
            showToast("Session summary recorded successfully!", "success");
            if (supabaseClient) {
                supabaseClient.from("fellowship_sessions").update({ summary: summaryText }).eq("id", sessionId).then(({ error }) => {
                    if (error) console.error("Cloud summary update error:", error);
                });
            }
        }
    }

    function deleteScheduleSession(id) {
        if (!isCurrentUserAdmin()) return;
        let sessions = getStorage(KEYS.SCHEDULE, []);
        sessions = sessions.filter(s => s.id !== id);
        setStorage(KEYS.SCHEDULE, sessions);
        renderScheduleSessions();
        refreshDashboard();
        showToast("Session removed.", "info");
        if (supabaseClient) {
            supabaseClient.from("fellowship_sessions").delete().eq("id", id).then(({ error }) => {
                if (error) console.error("Cloud session delete error:", error);
            });
        }
    }

    // ------------------------------------------------------------------------
    // 14. Profiles & Real Members
    // ------------------------------------------------------------------------
    function renderPeopleView() {
        const profile = getStorage(KEYS.PROFILE, {
            name: "Anna Grace",
            email: "annagrace@example.com",
            bio: "Growing together in Christ.",
            favoriteVerse: "John 15:5",
            isAdmin: false
        });

        if ($("inputProfileName")) $("inputProfileName").value = profile.name || "";
        if ($("inputProfileEmail")) $("inputProfileEmail").value = profile.email || "";
        if ($("inputProfileBio")) $("inputProfileBio").value = profile.bio || "";
        if ($("inputProfileFavoriteVerse")) $("inputProfileFavoriteVerse").value = profile.favoriteVerse || "";

        if ($("profileNameDisplay")) $("profileNameDisplay").textContent = profile.name || "Anna Grace";
        if ($("profileEmailDisplay")) $("profileEmailDisplay").textContent = profile.email || "Member";

        const initials = (profile.name || "AG").split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
        if ($("profileAvatarLg")) $("profileAvatarLg").textContent = initials;

        renderGroupReadingProgress("peopleMemberList");
        updateAdminUIControls();
    }

    function saveProfile() {
        const profile = getStorage(KEYS.PROFILE, {});
        profile.name = $("inputProfileName")?.value.trim() || "Anna Grace";
        profile.email = $("inputProfileEmail")?.value.trim() || "";
        profile.bio = $("inputProfileBio")?.value.trim() || "";
        profile.favoriteVerse = $("inputProfileFavoriteVerse")?.value.trim() || "John 15:5";

        if (setStorage(KEYS.PROFILE, profile)) {
            renderPeopleView();
            refreshDashboard();
            showToast("Profile details updated successfully!", "success");
            syncProfileToCloud(profile);
        }
    }

    // ------------------------------------------------------------------------
    // 15. Reminders Logic (Browser & Member Email Preferences)
    // ------------------------------------------------------------------------
    function updateReminderUI() {
        const profile = getStorage(KEYS.PROFILE, {});
        const settings = getStorage(KEYS.SETTINGS, {});

        if ($("reminderToggle")) $("reminderToggle").checked = !!settings.reminderEnabled;
        if ($("reminderTimeInput") && settings.reminderTime) $("reminderTimeInput").value = settings.reminderTime;

        if ($("emailReminderToggle")) $("emailReminderToggle").checked = profile.emailRemindersEnabled !== false;
        if ($("emailReminderTimingSelect") && profile.emailReminderTiming) $("emailReminderTimingSelect").value = profile.emailReminderTiming;

        const badge = $("notificationStatusBadge");
        if (badge) {
            if (!("Notification" in window)) {
                badge.textContent = "Not Supported";
                badge.className = "badge badge-gold";
            } else if (Notification.permission === "granted") {
                badge.textContent = "Permission Granted ✓";
                badge.className = "badge badge-green";
            } else if (Notification.permission === "denied") {
                badge.textContent = "Permission Blocked ✕";
                badge.className = "badge badge-gold";
            } else {
                badge.textContent = "Permission Not Requested";
                badge.className = "badge badge-blue";
            }
        }
    }

    function requestNotificationPermission() {
        if (!("Notification" in window)) {
            showToast("Web Notifications are not supported in this browser.", "error");
            return;
        }

        Notification.requestPermission().then(permission => {
            updateReminderUI();
            if (permission === "granted") {
                showToast("Notification permission granted!", "success");
            } else {
                showToast("Notification permission was not granted.", "info");
            }
        });
    }

    function triggerTestNotification() {
        const chapters = getAssignedChapters(currentDate);
        const readingText = chapters.length
            ? `Today's Reading: Matthew ${chapters.join("–")}`
            : "Take a quiet moment in God's Word today.";

        if ("Notification" in window && Notification.permission === "granted") {
            try {
                new Notification("Abide Together — Daily Reading Reminder", {
                    body: readingText,
                    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✦</text></svg>"
                });
                showToast("Test notification dispatched!", "success");
            } catch (e) {
                console.error(e);
                showToast("Notification error: " + e.message, "error");
            }
        } else {
            alert(`[Abide Together Reminder Alert]\n\n${readingText}\n\n"Abide in me, and I in you." — John 15:4`);
            showToast("Showing in-browser preview reminder.", "info");
        }
    }

    // ------------------------------------------------------------------------
    // 16. Supabase Cloud Integration & Hybrid Fallback
    // ------------------------------------------------------------------------
    function loadSettingsView() {
        const settings = getStorage(KEYS.SETTINGS, {});
        if ($("supabaseUrlInput")) $("supabaseUrlInput").value = settings.supabaseUrl || "";
        if ($("supabaseAnonKeyInput")) $("supabaseAnonKeyInput").value = settings.supabaseAnonKey || "";

        const badge = $("supabaseStatusBadge");
        if (badge) {
            if (supabaseClient && currentUserSession) {
                badge.textContent = `Connected: ${currentUserSession.user?.email || "Authenticated"}`;
                badge.className = "badge badge-green";
            } else if (supabaseClient) {
                badge.textContent = "Supabase Initialized (Not Signed In)";
                badge.className = "badge badge-blue";
            } else {
                badge.textContent = "Local Storage Active";
                badge.className = "badge badge-gold";
            }
        }
    }

    function initSupabase() {
        const settings = getStorage(KEYS.SETTINGS, {});

const url = settings.supabaseUrl ||
    "https://duemwhflahymoobfasna.supabase.co";

const key = settings.supabaseAnonKey ||
    sb_publishable_KYc7CsZrzPqzb9ZqAbmMsg_otX-j-1d;

        if (url && key && window.supabase) {
            try {
                supabaseClient = window.supabase.createClient(url, key);
                updateConnectionIndicator(true, "Cloud Connected");

                supabaseClient.auth.getSession().then(({ data }) => {
                    if (data && data.session) {
                        currentUserSession = data.session;
                        updateConnectionIndicator(true, currentUserSession.user?.email || "Cloud Synced");
                        loadUserDataFromCloud();
                    }
                });

                
supabaseClient.auth.onAuthStateChange((event, session) => {
    currentUserSession = session;

    if (event === "PASSWORD_RECOVERY") {
        const modal = $("newPasswordModal");
        const msg = $("newPasswordMsg");

        if (msg) {
            msg.style.display = "none";
            msg.textContent = "";
        }

        if (modal) {
            modal.classList.remove("hidden");
        }
    }

    if (session) {
        updateConnectionIndicator(
            true,
            session.user?.email || "Cloud Synced"
        );

        if (event === "SIGNED_IN") {
            showToast(
                `Signed in as ${session.user?.email}`,
                "success"
            );
        }
    } else {
        updateConnectionIndicator(false, "Local Storage");
    }

    loadSettingsView();
    updateAdminUIControls();
});

            } catch (err) {
                console.error("Supabase init error:", err);
                updateConnectionIndicator(false, "Local Storage");
            }
        } else {
            updateConnectionIndicator(false, "Local Storage");
        }
    }

    function updateConnectionIndicator(isConnected, label) {
        if ($("connectionDot")) {
            $("connectionDot").style.backgroundColor = isConnected ? "var(--brand-green)" : "var(--brand-gold)";
        }
        if ($("connectionText")) {
            $("connectionText").textContent = label;
        }
    }

    async function syncJournalEntryToCloud(dateKey, entry) {
        if (!supabaseClient || !currentUserSession) return;
        try {
            await supabaseClient.from("journal_entries").upsert({
                user_id: currentUserSession.user.id,
                study_date: dateKey,
                observation: entry.observation,
                understanding: entry.understanding,
                application: entry.application,
                key_verse: entry.keyVerse,
                other_notes: entry.otherNotes,
                prayer_points: entry.prayerPoints,
                updated_at: new Date().toISOString()
            }, { onConflict: "user_id, study_date" });
        } catch (e) {
            console.warn("Could not sync journal to cloud:", e);
        }
    }

    async function syncProgressToCloud(dateKey, chapter, isCompleted) {
        if (!supabaseClient || !currentUserSession) return;
        try {
            if (isCompleted) {
                await supabaseClient.from("reading_progress").upsert({
                    user_id: currentUserSession.user.id,
                    study_date: dateKey,
                    chapter_number: chapter,
                    completed: true,
                    completed_at: new Date().toISOString()
                }, { onConflict: "user_id, study_date, chapter_number" });
            } else {
                await supabaseClient.from("reading_progress").delete().match({
                    user_id: currentUserSession.user.id,
                    study_date: dateKey,
                    chapter_number: chapter
                });
            }
        } catch (e) {
            console.warn("Could not sync progress to cloud:", e);
        }
    }

    async function syncProfileToCloud(profile) {
        if (!supabaseClient || !currentUserSession) return;
        try {
            await supabaseClient.from("profiles").upsert({
                id: currentUserSession.user.id,
                display_name: profile.name,
                email: currentUserSession.user.email,
                bio: profile.bio,
                favorite_verse: profile.favoriteVerse,
                email_reminders_enabled: profile.emailRemindersEnabled,
                email_reminder_timing: profile.emailReminderTiming,
                updated_at: new Date().toISOString()
            });
        } catch (e) {
            console.warn("Could not sync profile to cloud:", e);
        }
    }

    async function loadUserDataFromCloud() {
        if (!supabaseClient || !currentUserSession) return;

        try {
            // Profile
            const { data: profData } = await supabaseClient
                .from("profiles")
                .select("*")
                .eq("id", currentUserSession.user.id)
                .single();

            if (profData) {
                currentUserIsAdmin = profData.is_admin === true;
                const localProf = getStorage(KEYS.PROFILE, {});
                localProf.name = profData.display_name || localProf.name;
                localProf.bio = profData.bio || localProf.bio;
                localProf.favoriteVerse = profData.favorite_verse || localProf.favoriteVerse;
                localProf.emailRemindersEnabled = profData.email_reminders_enabled ?? localProf.emailRemindersEnabled;
                localProf.emailReminderTiming = profData.email_reminder_timing || localProf.emailReminderTiming;
                localProf.isAdmin = currentUserIsAdmin;
                setStorage(KEYS.PROFILE, localProf);
                updateAdminUIControls();
                refreshDashboard();
            }

            // Real Schedules from Cloud
            const { data: scheduleRows } = await supabaseClient
                .from("fellowship_sessions")
                .select("*");

            if (scheduleRows && scheduleRows.length) {
                const mapped = scheduleRows.map(r => ({
                    id: r.id,
                    date: r.meeting_date,
                    time: r.meeting_time,
                    type: r.session_type,
                    leader: r.leader_name,
                    passages: r.passages,
                    topic: r.topic,
                    meetingLink: r.meeting_link || "",
                    summary: r.summary || ""
                }));
                setStorage(KEYS.SCHEDULE, mapped);
                renderScheduleSessions();
                updateDashboardUpcomingClassAnnouncement();
            }

            // Real Registered Members from Cloud
            const { data: memberRows } = await supabaseClient
                .from("profiles")
                .select("id, display_name, email");

            if (memberRows && memberRows.length) {
                const mappedMembers = memberRows.map(m => ({
                    id: m.id,
                    name: m.display_name,
                    email: m.email,
                    chaptersCompleted: 0
                }));
                setStorage(KEYS.MEMBERS, mappedMembers);
                renderGroupReadingProgress("groupMemberList");
            }

            showToast("Cloud study data synchronized successfully!", "success");
        } catch (e) {
            console.error("Cloud data load error:", e);
        }
    }

    // ------------------------------------------------------------------------
    // 17. Backup & Restore (JSON)
    // ------------------------------------------------------------------------
    function exportBackupJson() {
        const payload = {
            version: "2.1",
            exportDate: new Date().toISOString(),
            profile: getStorage(KEYS.PROFILE, {}),
            journal: getStorage(KEYS.JOURNAL, {}),
            progress: getStorage(KEYS.PROGRESS, {}),
            schedule: getStorage(KEYS.SCHEDULE, []),
            savedVerses: getStorage(KEYS.VERSES, []),
            members: getStorage(KEYS.MEMBERS, []),
            settings: getStorage(KEYS.SETTINGS, {})
        };

        const jsonStr = JSON.stringify(payload, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `abide-together-backup-${formatDateKey(new Date())}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast("Backup exported to downloads folder!", "success");
    }

    function importBackupJson(file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = JSON.parse(e.target.result);
                if (data.journal) setStorage(KEYS.JOURNAL, data.journal);
                if (data.progress) setStorage(KEYS.PROGRESS, data.progress);
                if (data.profile) setStorage(KEYS.PROFILE, data.profile);
                if (data.schedule) setStorage(KEYS.SCHEDULE, data.schedule);
                if (data.savedVerses) setStorage(KEYS.VERSES, data.savedVerses);
                if (data.settings) setStorage(KEYS.SETTINGS, data.settings);

                showToast("Backup successfully restored!", "success");
                refreshDashboard();
                renderCalendar();
                renderScheduleSessions();
            } catch (err) {
                alert("Invalid JSON backup file. Please select a valid backup.");
            }
        };
        reader.readAsText(file);
    }

    // ------------------------------------------------------------------------
    // 18. Event Listeners & Wire-up
    // ------------------------------------------------------------------------
    function setupEventListeners() {
        console.log("SETUP EVENT LISTENERS STARTED");
console.log("Forgot button:", $("btnForgotPwd"));
        // Navigation links
        document.querySelectorAll("[data-view]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                navigateToView(btn.dataset.view);
            });
        });

        // Mobile drawer
        $("menuToggleBtn")?.addEventListener("click", openSidebar);
        $("closeSidebarBtn")?.addEventListener("click", closeSidebar);
        $("sidebarOverlay")?.addEventListener("click", closeSidebar);

        // Sidebar user badge & shortcuts
        $("sidebarUserBadge")?.addEventListener("click", () => navigateToView("people"));
        $("quickProfileBtn")?.addEventListener("click", () => navigateToView("people"));
        $("themeToggleBtn")?.addEventListener("click", () => {
            const isDark = document.body.classList.contains("dark-mode");
            applyTheme(isDark ? "light" : "dark");
        });

        // Overview shortcuts
        $("heroOpenJournalBtn")?.addEventListener("click", () => navigateToView("journal"));
        $("heroOpenCalendarBtn")?.addEventListener("click", () => navigateToView("calendar"));
        $("quickJournalLink")?.addEventListener("click", () => navigateToView("journal"));
        $("managePeopleBtn")?.addEventListener("click", () => navigateToView("people"));

        // Calendar navigation
        $("prevMonthBtn")?.addEventListener("click", () => {
            calendarViewingMonth = new Date(calendarViewingMonth.getFullYear(), calendarViewingMonth.getMonth() - 1, 1);
            renderCalendar();
        });
        $("nextMonthBtn")?.addEventListener("click", () => {
            calendarViewingMonth = new Date(calendarViewingMonth.getFullYear(), calendarViewingMonth.getMonth() + 1, 1);
            renderCalendar();
        });
        $("todayMonthBtn")?.addEventListener("click", () => {
            calendarViewingMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            renderCalendar();
        });

        // Journal controls
        $("journalPrevDayBtn")?.addEventListener("click", () => {
            selectedDate.setDate(selectedDate.getDate() - 1);
            loadJournalForDate(selectedDate);
        });
        $("journalNextDayBtn")?.addEventListener("click", () => {
            selectedDate.setDate(selectedDate.getDate() + 1);
            loadJournalForDate(selectedDate);
        });
        $("journalTodayBtn")?.addEventListener("click", () => {
            selectedDate = new Date(currentDate);
            loadJournalForDate(selectedDate);
        });
        $("journalBackToCalendarBtn")?.addEventListener("click", () => {
            navigateToView("calendar");
        });
        $("journalDatePicker")?.addEventListener("change", (e) => {
            if (e.target.value) {
                selectedDate = parseDateString(e.target.value);
                loadJournalForDate(selectedDate);
            }
        });

        ["journalObservation", "journalUnderstanding", "journalApplication", "journalKeyVerse", "journalOtherNotes", "journalPrayerPoints"].forEach(id => {
            $(id)?.addEventListener("input", markJournalUnsaved);
        });

        $("journalSaveBtn")?.addEventListener("click", saveJournalEntry);
        $("journalClearBtn")?.addEventListener("click", () => {
            if (confirm("Clear all notes for this date? (Unsaved changes will be cleared)")) {
                ["journalObservation", "journalUnderstanding", "journalApplication", "journalKeyVerse", "journalOtherNotes", "journalPrayerPoints"].forEach(id => {
                    if ($(id)) $(id).value = "";
                });
                markJournalUnsaved();
            }
        });

        // Verse Filter Tabs
        document.querySelectorAll("[data-verse-filter]").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll("[data-verse-filter]").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                currentVerseFilter = btn.dataset.verseFilter;
                renderSavedVerses();
            });
        });

        // Schedule Tabs
        document.querySelectorAll("[data-fellowship-tab]").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll("[data-fellowship-tab]").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                currentScheduleTab = btn.dataset.fellowshipTab;
                renderScheduleSessions();
            });
        });

        // Profile save
        $("saveProfileBtn")?.addEventListener("click", saveProfile);

        // Reminders & Email settings
        $("reminderToggle")?.addEventListener("change", (e) => {
            const settings = getStorage(KEYS.SETTINGS, {});
            settings.reminderEnabled = e.target.checked;
            setStorage(KEYS.SETTINGS, settings);
            if (e.target.checked && "Notification" in window && Notification.permission !== "granted") {
                requestNotificationPermission();
            }
            showToast(e.target.checked ? "Daily browser reminder enabled" : "Daily browser reminder disabled", "info");
        });

        $("reminderTimeInput")?.addEventListener("change", (e) => {
            const settings = getStorage(KEYS.SETTINGS, {});
            settings.reminderTime = e.target.value;
            setStorage(KEYS.SETTINGS, settings);
            showToast(`Daily reading reminder set to ${e.target.value}`, "info");
        });

        $("requestNotificationPermissionBtn")?.addEventListener("click", requestNotificationPermission);
        $("testReminderBtn")?.addEventListener("click", triggerTestNotification);

        // Save Email Reminder Preference
        $("saveEmailReminderPrefBtn")?.addEventListener("click", () => {
            const profile = getStorage(KEYS.PROFILE, {});
            profile.emailRemindersEnabled = $("emailReminderToggle") ? $("emailReminderToggle").checked : true;
            profile.emailReminderTiming = $("emailReminderTimingSelect") ? $("emailReminderTimingSelect").value : "30m";
            setStorage(KEYS.PROFILE, profile);
            syncProfileToCloud(profile);
            showToast(`Email reminder preference saved (${profile.emailReminderTiming})!`, "success");
        });

        // Settings themes
        $("themeSelectLight")?.addEventListener("click", () => applyTheme("light"));
        $("themeSelectDark")?.addEventListener("click", () => applyTheme("dark"));

        // Settings Supabase config
        $("saveSupabaseConfigBtn")?.addEventListener("click", () => {
            const url = $("supabaseUrlInput")?.value.trim();
            const key = $("supabaseAnonKeyInput")?.value.trim();

            const settings = getStorage(KEYS.SETTINGS, {});
            settings.supabaseUrl = url;
            settings.supabaseAnonKey = key;
            setStorage(KEYS.SETTINGS, settings);

            initSupabase();
            showToast("Supabase configuration saved!", "success");
            loadSettingsView();
        });

        $("testSupabaseConnBtn")?.addEventListener("click", async () => {
            if (!supabaseClient) {
                alert("Please save your Supabase URL and Anon Key first.");
                return;
            }
            try {
                const { error } = await supabaseClient.from("fellowship_sessions").select("count").limit(1);
                if (error && error.code !== "PGRST116") {
                    showToast(`Connection error: ${error.message}`, "error");
                } else {
                    showToast("Supabase connected successfully ✓", "success");
                }
            } catch (e) {
                showToast("Connection failed: " + e.message, "error");
            }
        });

        // Backup & Restore
        $("exportDataJsonBtn")?.addEventListener("click", exportBackupJson);
        $("importJsonFileInput")?.addEventListener("change", (e) => {
            if (e.target.files && e.target.files[0]) {
                importBackupJson(e.target.files[0]);
            }
        });
        $("runDataMigrationBtn")?.addEventListener("click", () => {
            runDataMigration();
            showToast("Migration re-run completed.", "success");
            refreshDashboard();
            renderCalendar();
            renderScheduleSessions();
        });
        $("resetProgressOnlyBtn")?.addEventListener("click", () => {
            if (confirm("Reset all chapter checkmarks? Your journal notes will NOT be deleted.")) {
                localStorage.removeItem(KEYS.PROGRESS);
                refreshDashboard();
                renderCalendar();
                showToast("Reading checkmarks have been reset.", "info");
            }
        });

        // Modals close buttons
        document.querySelectorAll("[data-close-modal]").forEach(btn => {
            btn.addEventListener("click", () => {
                const modalId = btn.dataset.closeModal;
                $(modalId)?.classList.add("hidden");
            });
        });

        // Add Verse Modal Form
        $("openAddVerseModalBtn")?.addEventListener("click", () => {
            $("addVerseModal")?.classList.remove("hidden");
        });
        $("addVerseForm")?.addEventListener("submit", (e) => {
            e.preventDefault();
            const newVerse = {
                id: "v-" + Date.now(),
                reference: $("verseRefInput").value.trim(),
                text: $("verseTextInput").value.trim(),
                translation: $("verseTranslationInput").value,
                category: $("verseCategoryInput").value,
                notes: $("verseNotesInput").value.trim()
            };
            saveNewVerse(newVerse);
            $("addVerseModal").classList.add("hidden");
            $("addVerseForm").reset();
        });

        // Schedule Fellowship Modal Form (Admin Only with Google Meet link validation)
        $("openScheduleFellowshipBtn")?.addEventListener("click", () => {
            if (!isCurrentUserAdmin()) {
                alert("Only the administrator can schedule gatherings.");
                return;
            }
            $("fellowshipDateInput").value = formatDateKey(currentDate);
            $("scheduleFellowshipModal")?.classList.remove("hidden");
        });

        $("scheduleFellowshipForm")?.addEventListener("submit", (e) => {
            e.preventDefault();
            if (!isCurrentUserAdmin()) {
                alert("Only the administrator can publish scheduled sessions.");
                return;
            }

            const meetLinkRaw = $("fellowshipMeetLinkInput").value.trim();
            if (meetLinkRaw && !isValidHttpsUrl(meetLinkRaw)) {
                alert("Please enter a valid HTTPS Google Meet URL (e.g. https://meet.google.com/xxx-yyyy-zzz)");
                return;
            }

            const newSession = {
                id: "session-" + Date.now(),
                date: $("fellowshipDateInput").value,
                time: $("fellowshipTimeInput").value.trim(),
                type: $("fellowshipTypeInput").value,
                leader: $("fellowshipLeaderInput").value.trim(),
                meetingLink: meetLinkRaw,
                passages: $("fellowshipPassagesInput").value.trim(),
                topic: $("fellowshipTopicInput").value.trim(),
                summary: ""
            };

            const sessions = getStorage(KEYS.SCHEDULE, []);
            sessions.push(newSession);
            setStorage(KEYS.SCHEDULE, sessions);
            renderScheduleSessions();
            refreshDashboard();
            $("scheduleFellowshipModal").classList.add("hidden");
            $("scheduleFellowshipForm").reset();
            showToast("Gathering published to shared schedule!", "success");

            // Sync to Supabase if connected
            if (supabaseClient) {
                supabaseClient.from("fellowship_sessions").insert({
                    meeting_date: newSession.date,
                    meeting_time: newSession.time,
                    session_type: newSession.type,
                    leader_name: newSession.leader,
                    meeting_link: newSession.meetingLink,
                    passages: newSession.passages,
                    topic: newSession.topic
                }).then(({ error }) => {
                    if (error) console.error("Cloud schedule sync error:", error);
                });
            }
        });

        // Record Summary Form
        $("recordSummaryForm")?.addEventListener("submit", (e) => {
            e.preventDefault();
            const sId = $("summarySessionId").value;
            const text = $("summaryTextInput").value.trim();
            saveScheduleSummary(sId, text);
            $("recordSummaryModal").classList.add("hidden");
        });

       // Forgot Password Modal — temporary debugging
$("btnForgotPwd")?.addEventListener("click", () => {
    console.log("FORGOT PASSWORD HANDLER STARTED");

    const modal = $("forgotPasswordModal");
    console.log("Modal before opening:", modal?.className);

    modal?.classList.remove("hidden");

    console.log("Modal after opening:", modal?.className);
});
        $("forgotPasswordForm")?.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = $("forgotEmailInput").value.trim();
            const msg = $("forgotMsg");
            if (!email) return;

            if (supabaseClient) {
                try {
                    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                        redirectTo: window.location.origin
                    });
                    if (error) throw error;
                    msg.style.display = "block";
                    msg.style.color = "var(--brand-green)";
                    msg.textContent = "Password reset link sent! Please check your inbox.";
                } catch (err) {
                    msg.style.display = "block";
                    msg.style.color = "var(--brand-red)";
                    msg.textContent = err.message;
                }
            } else {
                msg.style.display = "block";
                msg.style.color = "var(--brand-blue)";
                msg.textContent = "Local mode: Reset not required. Use password123 to log in.";
            }
        });

$("newPasswordForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = $("newPasswordInput").value;
    const confirmPassword = $("confirmNewPasswordInput").value;
    const msg = $("newPasswordMsg");
    const button = e.submitter;

    const showMessage = (text, color) => {
        if (!msg) return;
        msg.style.display = "block";
        msg.style.color = color;
        msg.textContent = text;
    };

    if (password.length < 8) {
        showMessage(
            "Password must be at least 8 characters.",
            "var(--brand-red)"
        );
        return;
    }

    if (password !== confirmPassword) {
        showMessage(
            "The passwords do not match. Please try again.",
            "var(--brand-red)"
        );
        return;
    }

    if (!supabaseClient || !currentUserSession) {
        showMessage(
            "Your recovery session is missing or expired. Please request a new reset link.",
            "var(--brand-red)"
        );
        return;
    }

    if (button) button.disabled = true;

    try {
        const { error } = await supabaseClient.auth.updateUser({
            password: password
        });

        if (error) throw error;

        showMessage(
            "Password updated successfully! Please sign in with your new password.",
            "var(--brand-green)"
        );

        $("newPasswordInput").value = "";
        $("confirmNewPasswordInput").value = "";

        await supabaseClient.auth.signOut();

        $("newPasswordModal")?.classList.add("hidden");
        $("forgotPasswordModal")?.classList.add("hidden");

        showToast(
            "Password updated. Please sign in with your new password.",
            "success"
        );
    } catch (err) {
        showMessage(
            err.message || "Could not update the password. Please try again.",
            "var(--brand-red)"
        );
    } finally {
        if (button) button.disabled = false;
    }
});


        // ====================================================================
        // FRONT DOOR: AUTHENTICATION GATEWAY HANDLERS
        // ====================================================================
        let isGatewaySignUp = false;

       function checkGatewaySession() {
    const gateway = $("authGatewayOverlay");

    if (!gateway) return;

    const isAuthenticated = !!(
        supabaseClient &&
        currentUserSession &&
        currentUserSession.user
    );

    gateway.classList.toggle("hidden", isAuthenticated);
}

       function enterAppAsUser(displayName, email) {
    if (!supabaseClient || !currentUserSession?.user) {
        $("authGatewayOverlay")?.classList.remove("hidden");
        showToast("Please sign in with your account first.", "error");
        return;
    }

    const profile = getStorage(KEYS.PROFILE, {});
    profile.name = displayName || profile.name || splitEmailName(email);
    profile.email = email || currentUserSession.user.email || "";
    // Do not set the admin role here. It must come from the database.
    setStorage(KEYS.PROFILE, profile);

    $("authGatewayOverlay")?.classList.add("hidden");
    loadUserDataFromCloud();
    refreshDashboard();
    renderCalendar();
    renderScheduleSessions();
    updateAdminUIControls();
    showToast(`Welcome to Abide Together, ${profile.name}!`, "success");
}
        function exitToGateway() {
            currentUserIsAdmin = false;
            localStorage.removeItem("abide_session_active");
            $("authGatewayOverlay")?.classList.remove("hidden");
            if (supabaseClient) {
                supabaseClient.auth.signOut();
            }
            showToast("Signed out.", "info");
        }

        // Gateway Tabs
        $("tabBtnSignIn")?.addEventListener("click", () => {
            isGatewaySignUp = false;
            $("tabBtnSignIn").classList.add("active");
            $("tabBtnSignUp")?.classList.remove("active");
            $("gatewayNameGroup")?.classList.add("hidden");
            if ($("gatewaySubmitBtn")) $("gatewaySubmitBtn").textContent = "Sign In to Circle →";
        });

        $("tabBtnSignUp")?.addEventListener("click", () => {
            isGatewaySignUp = true;
            $("tabBtnSignUp").classList.add("active");
            $("tabBtnSignIn")?.classList.remove("active");
            $("gatewayNameGroup")?.classList.remove("hidden");
            if ($("gatewaySubmitBtn")) $("gatewaySubmitBtn").textContent = "Join Cousin Circle →";
        });

        // Quick Guest / Owner Access
        // Guest access disabled: all users must authenticate with Supabase.
$("btnQuickEnterGuest")?.addEventListener("click", () => {
    showToast("Please sign in or create an account to continue.", "error");
});

        // Gateway Form Submit
        
$("gatewayAuthForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = $("gatewayEmailInput")?.value.trim().toLowerCase();
    const password = $("gatewayPasswordInput")?.value;
    const name = $("gatewayNameInput")?.value.trim() || splitEmailName(email);
    const errDiv = $("gatewayErrorMsg");
    const submitBtn = $("gatewaySubmitBtn");

    if (errDiv) {
        errDiv.style.display = "none";
        errDiv.textContent = "";
    }

    if (!supabaseClient) {
        if (errDiv) {
            errDiv.textContent =
                "Supabase is not configured. Please check your Settings.";
            errDiv.style.display = "block";
        }
        return;
    }

    if (!email || !password) {
        if (errDiv) {
            errDiv.textContent = "Please enter your email and password.";
            errDiv.style.display = "block";
        }
        return;
    }

    if (submitBtn) submitBtn.disabled = true;

    try {
        if (isGatewaySignUp) {
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: {
                    data: { display_name: name }
                }
            });

            if (error) throw error;

            if (!data.session) {
                if (errDiv) {
                    errDiv.textContent =
                        "Account request submitted. Check your email to confirm your account, then sign in here.";
                    errDiv.style.display = "block";
                }
                return;
            }

            currentUserSession = data.session;
        } else {
            const { data, error } =
                await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });

            if (error) throw error;

            currentUserSession = data.session;
        }

        if (!currentUserSession?.user) {
            throw new Error("Authentication was not completed. Please sign in again.");
        }

        const { data: profile, error: profileError } = await supabaseClient
            .from("profiles")
            .select("id, display_name, email, is_admin")
            .eq("id", currentUserSession.user.id)
            .maybeSingle();

        if (profileError) throw profileError;

        if (!profile) {
            await supabaseClient.auth.signOut();
            currentUserSession = null;
            currentUserIsAdmin = false;
            throw new Error(
                "Your account profile was not found. Please contact the site administrator."
            );
        }

        currentUserIsAdmin = profile.is_admin === true;

        const savedProfile = getStorage(KEYS.PROFILE, {});
        savedProfile.name =
            profile.display_name || name || splitEmailName(email);
        savedProfile.email = currentUserSession.user.email || email;
        savedProfile.isAdmin = currentUserIsAdmin;
        setStorage(KEYS.PROFILE, savedProfile);

        enterAppAsUser(savedProfile.name, savedProfile.email);
        updateAdminUIControls();

    } catch (err) {
        console.error("Authentication error:", err);

        if (errDiv) {
            errDiv.textContent = err.message || "Authentication failed. Please try again.";
            errDiv.style.display = "block";
        }
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
});
   enterAppAsUser

        function splitEmailName(email) {
            if (!email) return "Cousin";
            const part = email.split("@")[0];
            return part.charAt(0).toUpperCase() + part.slice(1);
        }

        // Sidebar Logout button
        $("sidebarLogoutBtn")?.addEventListener("click", (e) => {
            e.stopPropagation();
            exitToGateway();
        });

        checkGatewaySession();
    }

    // ------------------------------------------------------------------------
    // 19. Application Bootstrapping
    // ------------------------------------------------------------------------
    function init() {
        runDataMigration();
        initTheme();
        initSupabase();
        setupEventListeners();
        refreshDashboard();
        renderCalendar();
        renderScheduleSessions();
        console.log("✦ Abide Together web app loaded with Dark Blue theme.");
    }

    init();
});
