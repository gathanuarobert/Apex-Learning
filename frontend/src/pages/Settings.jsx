// src/pages/Settings.jsx
import React, { useState, useEffect, useRef } from "react";

export default function Settings() {
  const [visibleSections, setVisibleSections] = useState([]);
  const sectionRefs = useRef([]);
  const [hoverSave, setHoverSave] = useState(false);

  // Form states
  const [username, setUsername] = useState("user123");
  const [email, setEmail] = useState("user@example.com");
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ target, isIntersecting }) => {
          if (isIntersecting) {
            const index = Number(target.getAttribute("data-index"));
            setVisibleSections((prev) =>
              prev.includes(index) ? prev : [...prev, index]
            );
            observer.unobserve(target);
          }
        });
      },
      { threshold: 0.1 }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    alert(
      `Settings saved!\n\nUsername: ${username}\nEmail: ${email}\nDark Mode: ${
        darkMode ? "On" : "Off"
      }\nNotifications: ${notifications ? "On" : "Off"}`
    );
  };

  const sections = [
    {
      title: "Profile Settings",
      content: (
        <>
          <label className="block mb-2 font-semibold" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            type="text"
            className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <label className="block mb-2 font-semibold" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </>
      ),
    },
    {
      title: "Preferences",
      content: (
        <>
          <label className="flex items-center gap-2 font-semibold cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
              className="w-5 h-5 accent-blue-500"
            />
            Enable Dark Mode
          </label>

          <label className="flex items-center gap-2 font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              className="w-5 h-5 accent-blue-500"
            />
            Enable Notifications
          </label>
        </>
      ),
    },
  ];

  return (
    <div className="p-6 min-h-screen bg-[#1e1e2f] text-white md:ml-60">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <form
        onSubmit={handleSave}
        className="max-w-3xl mx-auto bg-white/5 backdrop-blur-lg rounded-xl shadow-lg p-6 space-y-8"
      >
        {sections.map((section, index) => (
          <section
            key={index}
            data-index={index}
            ref={(el) => (sectionRefs.current[index] = el)}
            className={`transition-all duration-700 transform ${
              visibleSections.includes(index)
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-5"
            } bg-white/5 p-6 rounded-lg shadow-md`}
          >
            <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
            {section.content}
          </section>
        ))}

        <button
          type="submit"
          className={`px-6 py-3 rounded-lg font-bold transition ${
            hoverSave ? "bg-blue-600" : "bg-blue-500"
          }`}
          onMouseEnter={() => setHoverSave(true)}
          onMouseLeave={() => setHoverSave(false)}
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
