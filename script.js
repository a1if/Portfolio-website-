const root = document.documentElement;
const themeToggle = document.querySelector(".theme-toggle");
const navToggle = document.querySelector(".nav-toggle");
const navigation = document.querySelector(".site-nav");
const testimonials = document.querySelectorAll(".testimonial");
const prevButton = document.querySelector(".slider-button--prev");
const nextButton = document.querySelector(".slider-button--next");
const scrollTopButton = document.querySelector(".scroll-top");
const sections = document.querySelectorAll(
  ".section, .timeline__item, .card, .testimonial",
);
const contactForm = document.querySelector(".contact-form");
const contactSubmitButton = contactForm?.querySelector("button[type='submit']");
const contactFeedback = contactForm?.querySelector(".form-feedback");
const storedTheme = localStorage.getItem("preferred-theme");

if (storedTheme) {
  root.setAttribute("data-theme", storedTheme);
}

// Theme toggle
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const currentTheme = root.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    if (newTheme === "light") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", "dark");
    }
    localStorage.setItem("preferred-theme", newTheme);
  });
}

// Mobile navigation toggle
if (navToggle && navigation) {
  navToggle.addEventListener("click", () => {
    const isExpanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", !isExpanded);
    navigation.classList.toggle("open");
  });

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.setAttribute("aria-expanded", "false");
      navigation.classList.remove("open");
    });
  });
}

// Scroll to top button
const toggleScrollTop = () => {
  if (window.scrollY > 400) {
    scrollTopButton?.classList.add("visible");
  } else {
    scrollTopButton?.classList.remove("visible");
  }
};

toggleScrollTop();
window.addEventListener("scroll", toggleScrollTop);

scrollTopButton?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Reveal on scroll
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.15,
  },
);

sections.forEach((section) => {
  section.classList.add("reveal");
  observer.observe(section);
});

if (contactForm && contactSubmitButton && contactFeedback) {
  const originalButtonText = contactSubmitButton.textContent;
  const feedbackStates = ["form-feedback--error", "form-feedback--success"];

  const setFeedback = (message = "", variant = "info") => {
    contactFeedback.textContent = message;
    feedbackStates.forEach((state) => contactFeedback.classList.remove(state));

    if (variant === "error") {
      contactFeedback.classList.add("form-feedback--error");
    }

    if (variant === "success") {
      contactFeedback.classList.add("form-feedback--success");
    }
  };

  setFeedback();

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const payload = Object.fromEntries(formData.entries());

    contactSubmitButton.disabled = true;
    contactSubmitButton.textContent = "Sending…";
    contactForm.classList.add("is-submitting");
    setFeedback();

    try {
      const response = await fetch(contactForm.action, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result?.success === false) {
        const errorMessage =
          result?.error ||
          "We couldn’t send your message right now. Please try again.";

        setFeedback(errorMessage, "error");
        return;
      }

      setFeedback(
        result?.message ||
          "Thanks for reaching out! I’ll respond within two business days.",
        "success",
      );
      contactForm.reset();
    } catch (error) {
      if (isStaticPagesHost) {
        setFeedback(
          "The live preview is running on static hosting, so the contact form is disabled. Please reach out via email or LinkedIn.",
          "error",
        );
      } else {
        setFeedback(
          "Network error — please check your connection and try again.",
          "error",
        );
      }
      setFeedback(
        "Network error — please check your connection and try again.",
        "error",
      );
    } finally {
      contactSubmitButton.disabled = false;
      contactSubmitButton.textContent = originalButtonText;
      contactForm.classList.remove("is-submitting");
    }
  });
}

// Testimonials slider
let currentTestimonial = 0;

const updateTestimonials = () => {
  testimonials.forEach((testimonial, index) => {
    testimonial.classList.toggle("current", index === currentTestimonial);
  });
};

const showNextTestimonial = () => {
  currentTestimonial = (currentTestimonial + 1) % testimonials.length;
  updateTestimonials();
};

const showPrevTestimonial = () => {
  currentTestimonial =
    (currentTestimonial - 1 + testimonials.length) % testimonials.length;
  updateTestimonials();
};

nextButton?.addEventListener("click", showNextTestimonial);
prevButton?.addEventListener("click", showPrevTestimonial);

let sliderInterval = setInterval(showNextTestimonial, 7000);

const resetSliderInterval = () => {
  clearInterval(sliderInterval);
  sliderInterval = setInterval(showNextTestimonial, 7000);
};

[nextButton, prevButton].forEach((button) => {
  button?.addEventListener("click", resetSliderInterval);
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearInterval(sliderInterval);
  } else {
    resetSliderInterval();
  }
});

// Dynamic year in footer
document.getElementById("current-year").textContent = new Date().getFullYear();
