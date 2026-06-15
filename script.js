function ovalBlobRadius() {
  const r = (min, max) => Math.floor(Math.random() * (max - min)) + min;

  return `
    ${r(45, 65)}% ${r(35, 55)}% ${r(45, 65)}% ${r(35, 55)}% /
    ${r(45, 65)}% ${r(45, 65)}% ${r(35, 55)}% ${r(35, 55)}%
  `;
}

const glow = document.querySelector(".profile-glow");
const img = document.querySelector(".profile-img");

setInterval(() => {
  const radius = ovalBlobRadius();
  glow.style.borderRadius = radius;
  img.style.borderRadius = radius;
}, 2200);







const hamburger = document.getElementById("humburger");
const navbar = document.getElementById("navbar");
const navLinks = document.querySelectorAll(".nav-link");

// Toggle navbar on hamburger click
hamburger.addEventListener("click", () => {
  navbar.classList.toggle("active");
  hamburger.classList.toggle("active"); // 🔥 THIS LINE
});


// Close navbar when clicking outside
document.addEventListener("click", (event) => {
  const isClickInsideNav = navbar.contains(event.target);
  const isClickOnHamburger = hamburger.contains(event.target);

  if (!isClickInsideNav && !isClickOnHamburger) {
    navbar.classList.remove("active");
  }
});

// Handle nav link clicks
navLinks.forEach((link) => {
  link.addEventListener("click", function () {
    navLinks.forEach((l) => l.classList.remove("active-link"));
    this.classList.add("active-link");

    navbar.classList.remove("active");
    hamburger.classList.remove("active"); // ✅ RESET TO MENU
  });
});

//When user clicks menu in mobile and direct touch toggle then reset humburger icon
document.addEventListener("click", (event) => {
  const isClickInsideNav = navbar.contains(event.target);
  const isClickOnHamburger = hamburger.contains(event.target);

  if (!isClickInsideNav && !isClickOnHamburger) {
    navbar.classList.remove("active");
    hamburger.classList.remove("active"); // ✅ RESET
  }
});


const sections = document.querySelectorAll("section");
const activeSections = {};

const observern = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      activeSections[entry.target.id] = entry.isIntersecting;
    });

    let activeId = null;
    let maxVisibleHeight = -1;

    sections.forEach((section) => {
      if (activeSections[section.id]) {
        const rect = section.getBoundingClientRect();
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(window.innerHeight, rect.bottom);
        const visibleHeight = visibleBottom - visibleTop;

        if (visibleHeight > maxVisibleHeight) {
          maxVisibleHeight = visibleHeight;
          activeId = section.id;
        }
      }
    });

    if (activeId) {
      navLinks.forEach((link) => {
        const href = link.getAttribute("href");
        if (href === `#${activeId}` || (activeId === "home" && href === "#")) {
          link.classList.add("active-link");
        } else {
          link.classList.remove("active-link");
        }
      });
    }
  },
  {
    root: null,
    threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
  }
);

sections.forEach((section) => {
  observern.observe(section);
});
 const revealSections = document.querySelectorAll(
  '#about, #Skills, #projects, #education, #experience, #contact'
);

/* One-way reveal: tall sections can drop below threshold while scrolling; removing .show
   hid the whole block (opacity:0). Never remove .show after first reveal; threshold:0 for any pixel. */
const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      }
    });
  },
  { threshold: 0 }
);

revealSections.forEach(section => {
  revealObserver.observe(section);
});

    
    

const textarea = document.getElementById("autoTextarea");

textarea.addEventListener("input", function () {
    this.style.height = "auto"; // Reset height
    this.style.height = this.scrollHeight + "px"; // Set to scroll height
});


const themeToggle = document.getElementById("themeToggle");
const sunIcon = document.getElementById("sunIcon");
const moonIcon = document.getElementById("moonIcon");

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");

  const lightMode = document.body.classList.contains("light-mode");

  if (lightMode) {
    sunIcon.style.display = "none";
    moonIcon.style.display = "inline";
  } else {
    sunIcon.style.display = "inline";
    moonIcon.style.display = "none";
  }
});


  function HireMe(event) {
  event.preventDefault(); // prevent default anchor behavior

  const email = "pmeet9174@email.com";
  const subject = "Hiring Conversation";
  const body = "Hi, I want to hire you...";

  const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const gmailWebLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    window.location.href = mailtoLink;
  } else {
    const win = window.open(gmailWebLink, '_blank');

    // If popup blocked, fallback to mailto
    if (!win || win.closed || typeof win.closed === 'undefined') {
      window.location.href = mailtoLink;
    }
  }
}

function startSending() {
  const btn = document.getElementById("sendBtn");
  if (!btn) return;
  btn.classList.add("sending");
  btn.textContent = "Sending...";

  setTimeout(() => {
    btn.classList.remove("sending");
    btn.textContent = "Send Message";
  }, 6000);
}

(function () {
  const form = document.querySelector(".contact-form");
  if (!form) return;
  form.addEventListener("submit", function (e) {
    if (!form.checkValidity()) {
      e.preventDefault();
      form.reportValidity();
      return;
    }
    startSending();
  });
})();

