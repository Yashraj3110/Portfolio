/* ============================================================
   PARTICLE GENERATOR — Ultra Mobile Mode (Few Particles)
============================================================ */
function initParticles(id, cfg = {}) {
    const section = document.getElementById(id);
    if (!section) return;

    // Detect true mobile
    const isMobile =
        navigator.maxTouchPoints > 0 &&
        window.matchMedia("(max-width: 768px)").matches;

    const fragment = document.createDocumentFragment();

    // ⭐ Mobile = drastically fewer particles
    const reduction = isMobile ? 0.15 : 1; // 85% fewer

    const colors = cfg.colors || [
        "rgba(0,255,255,0.8)",
        "rgba(168,55,247,0.8)",
        "rgba(0,150,255,0.8)"
    ];

    const layers = [
        { count: Math.floor((cfg.backCount ?? 20) * reduction), cls: "particle-back", size: 4 },
        { count: Math.floor((cfg.midCount ?? 10) * reduction), cls: "particle-mid", size: 6 },
        { count: Math.floor((cfg.frontCount ?? 5) * reduction), cls: "particle-front", size: 10 },
    ];

    layers.forEach(layer => {
        const wrap = document.createElement("div");
        wrap.className = `particle-layer ${layer.cls}`;

        let html = "";

        for (let i = 0; i < layer.count; i++) {
            const size = (Math.random() * layer.size + 2).toFixed(1);
            const x = (Math.random() * 100).toFixed(1);
            const y = (Math.random() * 100).toFixed(1);
            const duration = (6 + Math.random() * 6).toFixed(1);
            const delay = (Math.random() * 4).toFixed(1);
            const color = colors[(Math.random() * colors.length) | 0];

            html += `
                <div class="particle ultra-lite"
                    style="
                        --size:${size}px;
                        --x:${x}vw;
                        --y:${y}vh;
                        --color:${color};
                        --duration:${duration}s;
                        --delay:${delay}s;
                    ">
                </div>
            `;
        }

        wrap.innerHTML = html;
        fragment.appendChild(wrap);
    });

    section.appendChild(fragment);
}



/* ============================================================
   1. SET CSS VARIABLE ON SCROLL
============================================================ */
window.addEventListener("scroll", () => {
    document.documentElement.style.setProperty("--scrollY", window.scrollY);
});


/* ============================================================
   2. SECTION SNAP + DOT NAVIGATION
============================================================ */
function initSectionNavigation() {

    let lock = false;
    let current = 0;

    const sections = [...document.querySelectorAll("section[id]")];
    const dots = [...document.querySelectorAll(".dot")];
    const isMobile =
        navigator.maxTouchPoints > 0 &&
        window.matchMedia("(max-width: 768px)").matches;

    function setActiveDot(index) {
        dots.forEach(d => d.classList.remove("active"));
        const dot = document.querySelector(
            `.dot[data-target="#${sections[index].id}"]`
        );
        if (dot) dot.classList.add("active");
    }

    function goTo(index, forceJump = false) {
        if (lock && !forceJump) return;

        lock = !forceJump;
        index = Math.max(0, Math.min(index, sections.length - 1));
        current = index;

        sections[index].scrollIntoView({ behavior: "smooth" });
        setActiveDot(index);

        if (!forceJump) setTimeout(() => (lock = false), 600);
    }

    // Anchor links
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener("click", e => {
            const target = document.querySelector(a.getAttribute("href"));
            if (!target) return;

            e.preventDefault();
            goTo(sections.indexOf(target), true);
        });
    });

    // Dot click nav
    dots.forEach((dot, index) => {
        dot.addEventListener("click", () => goTo(index, true));
    });

    // Fade-in observer
    const fadeObserver = new IntersectionObserver(
        entries => {
            entries.forEach(e => {
                if (e.isIntersecting) e.target.classList.add("is-visible");
            });
        },
        { threshold: 0.25 }
    );

    document
        .querySelectorAll(".fade-in-on-scroll")
        .forEach(el => fadeObserver.observe(el));

    // Dot observer
    const dotObserver = new IntersectionObserver(
        entries => {
            if (lock) return;

            entries.forEach(e => {
                if (e.intersectionRatio < 0.85) return;

                current = sections.indexOf(e.target);
                setActiveDot(current);
            });
        },
        { threshold: [0, 1] }
    );

    sections.forEach(sec => dotObserver.observe(sec));

    // Wheel snap (desktop)
    if (!isMobile) {
        let wheelLock = false;

        window.addEventListener(
            "wheel",
            e => {
                if (lock || wheelLock) return;

                wheelLock = true;
                const minDelta = 35;

                if (Math.abs(e.deltaY) < minDelta) {
                    setTimeout(() => (wheelLock = false), 150);
                    return;
                }

                goTo(current + (e.deltaY > 0 ? 1 : -1));

                setTimeout(() => (wheelLock = false), 650);
            },
            { passive: false }
        );
    }

    // Mobile swipe
    if (isMobile) {
        let startY = 0;

        window.addEventListener(
            "touchstart",
            e => {
                startY = e.touches[0].clientY;
            },
            { passive: true }
        );

        window.addEventListener(
            "touchend",
            e => {
                if (lock) return;

                const diff = startY - e.changedTouches[0].clientY;
                if (Math.abs(diff) < 60) return;

                goTo(current + (diff > 0 ? 1 : -1));
            }
        );
    }
}


/* ============================================================
   3. PROJECT CAROUSEL
============================================================ */
function initProjectCarousel() {
    const viewport = document.getElementById("project-list-viewport");
    const list = document.getElementById("project-list-container");

    const tabPersonal = document.getElementById("tab-personal");
    const tabCompany = document.getElementById("tab-company");

    const btnPrev = document.getElementById("projectPrev");
    const btnNext = document.getElementById("projectNext");

    const cards = () => [...document.querySelectorAll(".project-list-item:not(.hidden)")];
    const details = () => [...document.querySelectorAll(".detail-content")];

    let currentIndex = 0;
    const isMobile = () =>
        navigator.maxTouchPoints > 0 &&
        window.matchMedia("(max-width: 768px)").matches;

    function setDetail(id) {
        details().forEach(d => {
            const active = d.dataset.projectId === id;
            d.classList.toggle("active", active);
            d.classList.toggle("hidden", !active);
        });
    }

    /* Desktop carousel */
    function initDesktopCarousel() {
        if (isMobile()) return;

        const itemHeight = 100;
        currentIndex = 0;

        function update() {
            const c = cards();
            if (!c.length) return;

            list.style.transform = `translateY(-${currentIndex * itemHeight}px)`;

            const activeId = c[currentIndex].dataset.projectId;
            setDetail(activeId);

            c.forEach((card, i) => {
                const el = card.querySelector(".item-card");
                el.classList.toggle("active-card", i === currentIndex);
                el.classList.toggle("inactive-card", i !== currentIndex);
            });
        }

        document.getElementById("nextProject").onclick = () => {
            const c = cards();
            if (currentIndex < c.length - 1) currentIndex++;
            update();
        };

        document.getElementById("prevProject").onclick = () => {
            if (currentIndex > 0) currentIndex--;
            update();
        };

        cards().forEach((card, i) => {
            card.onclick = () => {
                currentIndex = i;
                update();
            };
        });

        update();
    }

    /* Mobile carousel */
    function initMobileCarousel() {
        if (!isMobile()) return;

        currentIndex = 0;

        function center(i) {
            const c = cards();
            if (!c.length) return;

            i = Math.max(0, Math.min(i, c.length - 1));
            currentIndex = i;

            const spac = window.innerWidth * 0.26;
            const left = c[i].offsetLeft - spac;

            viewport.scrollTo({ left, behavior: "smooth" });

            setDetail(c[i].dataset.projectId);

            c.forEach((card, idx) => {
                const el = card.querySelector(".item-card");
                el.classList.toggle("active-card", idx === i);
                el.classList.toggle("inactive-card", idx !== i);
            });
        }

        btnPrev.onclick = () => center(currentIndex - 1);
        btnNext.onclick = () => center(currentIndex + 1);

        cards().forEach((card, i) => {
            card.onclick = () => center(i);
        });

        center(0);

        window.addEventListener("reinit-mobile-carousel", () => {
            setTimeout(() => center(0), 50);
        });
    }

    /* Filter projects */
    function filterProjects(type) {
        const all = document.querySelectorAll(".project-list-item");

        all.forEach(item => item.classList.toggle("hidden", item.dataset.type !== type));

        const first = document.querySelector(".project-list-item:not(.hidden)");
        if (first) setDetail(first.dataset.projectId);

        if (isMobile()) {
            window.dispatchEvent(new Event("reinit-mobile-carousel"));
        } else {
            list.style.transform = "translateY(0)";
            initDesktopCarousel();
        }
    }

    tabPersonal.onclick = () => {
        tabPersonal.classList.add("active-tab");
        tabCompany.classList.remove("active-tab");
        filterProjects("personal");
    };

    tabCompany.onclick = () => {
        tabCompany.classList.add("active-tab");
        tabPersonal.classList.remove("active-tab");
        filterProjects("company");
    };

    filterProjects("personal");
    initDesktopCarousel();
    initMobileCarousel();
}


/* ============================================================
   INIT EVERYTHING
============================================================ */
document.addEventListener("DOMContentLoaded", () => {

    // 🌌 Initialize particles in all sections
    [
        ["about", {}],
        ["experience", { backCount: 12, midCount: 6, frontCount: 3 }],
        ["projects", { backCount: 16, midCount: 10, frontCount: 4 }],
        ["education", { backCount: 16, midCount: 10, frontCount: 4 }],
        ["skills", { backCount: 16, midCount: 10, frontCount: 4 }],
        ["contact", { backCount: 8, midCount: 3, frontCount: 2 }]
    ].forEach(([id, cfg]) => initParticles(id, cfg));

    // Navigation + Scroll Snap
    initSectionNavigation();

    // Projects Carousel
    initProjectCarousel();
});
