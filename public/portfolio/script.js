/* =========================================================
   DIPANSHU DWIVEDI - PORTFOLIO JAVASCRIPT
   ========================================================= */


/* ================= MOBILE MENU ================= */

const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

if (menuBtn && navLinks) {

    menuBtn.addEventListener("click", () => {

        navLinks.classList.toggle("show");

        const icon = menuBtn.querySelector("i");

        if (navLinks.classList.contains("show")) {

            icon.classList.remove("fa-bars");
            icon.classList.add("fa-xmark");

        } else {

            icon.classList.remove("fa-xmark");
            icon.classList.add("fa-bars");

        }

    });


    /* Close menu after clicking a link */

    document.querySelectorAll(".nav-link").forEach(link => {

        link.addEventListener("click", () => {

            navLinks.classList.remove("show");

            const icon = menuBtn.querySelector("i");

            icon.classList.remove("fa-xmark");
            icon.classList.add("fa-bars");

        });

    });

}


/* ================= NAVBAR SCROLL ================= */

const header = document.querySelector(".header");

window.addEventListener("scroll", () => {

    if (window.scrollY > 50) {

        header.classList.add("scrolled");

    } else {

        header.classList.remove("scrolled");

    }

});


/* ================= TYPING EFFECT ================= */

const typingText = document.getElementById("typingText");

const roles = [
    "Software Developer",
    "C++ Programmer",
    "Python Developer",
    "Web Developer",
    "Computer Science Student"
];

let roleIndex = 0;
let characterIndex = 0;
let deleting = false;


function typeEffect() {

    const currentRole = roles[roleIndex];

    if (!deleting) {

        typingText.textContent =
            currentRole.substring(0, characterIndex + 1);

        characterIndex++;

        if (characterIndex === currentRole.length) {

            deleting = true;

            setTimeout(typeEffect, 1500);

            return;

        }

    } else {

        typingText.textContent =
            currentRole.substring(0, characterIndex - 1);

        characterIndex--;

        if (characterIndex === 0) {

            deleting = false;

            roleIndex++;

            if (roleIndex >= roles.length) {
                roleIndex = 0;
            }

        }

    }

    const speed = deleting ? 50 : 90;

    setTimeout(typeEffect, speed);
}


typeEffect();


/* ================= ACTIVE NAVIGATION ================= */

const sections = document.querySelectorAll("section[id]");
const navigationLinks = document.querySelectorAll(".nav-link");


function updateActiveLink() {

    let currentSection = "";

    sections.forEach(section => {

        const sectionTop = section.offsetTop - 150;

        if (window.scrollY >= sectionTop) {

            currentSection = section.getAttribute("id");

        }

    });


    navigationLinks.forEach(link => {

        link.classList.remove("active");

        if (
            link.getAttribute("href") ===
            `#${currentSection}`
        ) {

            link.classList.add("active");

        }

    });

}


window.addEventListener("scroll", updateActiveLink);


/* ================= BACK TO TOP ================= */

const backToTop = document.getElementById("backToTop");

window.addEventListener("scroll", () => {

    if (window.scrollY > 500) {

        backToTop.classList.add("show");

    } else {

        backToTop.classList.remove("show");

    }

});


backToTop.addEventListener("click", () => {

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});


/* ================= SCROLL REVEAL ================= */

const revealElements = document.querySelectorAll(
    ".section-heading, " +
    ".about-grid, " +
    ".skills-grid, " +
    ".timeline, " +
    ".projects-grid, " +
    ".education-grid, " +
    ".cert-grid, " +
    ".contact-grid"
);


const revealObserver = new IntersectionObserver(
    (entries, observer) => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add("reveal");

                observer.unobserve(entry.target);

            }

        });

    },
    {
        threshold: 0.12
    }
);


revealElements.forEach(element => {

    revealObserver.observe(element);

});


/* ================= CONTACT FORM ================= */

const contactForm =
    document.getElementById("contactForm");

const formMessage =
    document.getElementById("formMessage");


if (contactForm) {

    contactForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const name =
            document.getElementById("name").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const message =
            document.getElementById("message").value.trim();


        if (!name || !email || !message) {

            formMessage.textContent =
                "Please fill in all fields.";

            return;

        }


        /*
         * This is a frontend-only form.
         * It does not send the message to a server.
         */

        formMessage.textContent =
            "Thanks! Your message has been prepared. Please use the email shown above to contact me.";

        contactForm.reset();

    });

}


/* ================= CURRENT YEAR ================= */

const currentYear =
    document.getElementById("currentYear");

if (currentYear) {

    currentYear.textContent =
        new Date().getFullYear();

}


/* ================= SMOOTH INTERNAL LINKS ================= */

document.querySelectorAll('a[href^="#"]').forEach(link => {

    link.addEventListener("click", function (event) {

        const targetId =
            this.getAttribute("href");

        if (
            targetId === "#" ||
            targetId === ""
        ) {
            return;
        }


        const target =
            document.querySelector(targetId);

        if (target) {

            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth"
            });

        }

    });

});