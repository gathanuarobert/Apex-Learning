// src/pages/ContactUs.jsx
import React, { useRef } from "react";
import emailjs from "@emailjs/browser";
import { motion } from "framer-motion";
import { FaGlobe, FaLaptopCode, FaChartBar } from "react-icons/fa";
import SEO from "../components/SEO";
const ContactUs = () => {
  const form = useRef();

  const sendEmail = (e) => {
    e.preventDefault();

    emailjs
      .sendForm(
        "your_service_id", // replace with EmailJS service ID
        "your_template_id", // replace with EmailJS template ID
        form.current,
        "your_public_key", // replace with EmailJS public key
      )
      .then(
        (result) => {
          alert("Message sent successfully ✅");
          form.current.reset();
        },
        (error) => {
          alert("Message failed ❌ Please try again.");
        },
      );
  };

  return (
    <>
      <SEO
        title="Contact Us | Apex Learning Hub"
        description="Get in touch with Apex Learning Hub for web development, maintenance, and data analytics services in Kenya."
        path="/contact"
      />
      <div className="w-full min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white py-12 px-6">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-blue-400">
            Apex Solutions Limited
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Empowering your business with cutting-edge{" "}
            <span className="text-blue-400">Software Solutions</span>. We
            specialize in Web Maintenance, Web Development, and Data Analytics.
          </p>
        </motion.div>

        {/* Services Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gray-800 rounded-2xl p-6 shadow-lg text-center"
          >
            <FaGlobe className="text-4xl text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Web Maintenance</h3>
            <p className="text-gray-400">
              Keep your website secure, fast, and always online with our
              professional maintenance services.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gray-800 rounded-2xl p-6 shadow-lg text-center"
          >
            <FaLaptopCode className="text-4xl text-green-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Web Development</h3>
            <p className="text-gray-400">
              We build modern, scalable, and responsive websites tailored to
              your unique business needs.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gray-800 rounded-2xl p-6 shadow-lg text-center"
          >
            <FaChartBar className="text-4xl text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Data Analytics</h3>
            <p className="text-gray-400">
              Transform raw data into actionable insights to drive smarter
              decisions and growth.
            </p>
          </motion.div>
        </div>

        {/* Engineers Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-10 text-blue-400">
            Meet Our Engineers
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gray-800 rounded-2xl p-6 shadow-lg"
            >
              <h3 className="text-xl font-semibold mb-2">Karanja Githeci</h3>
              <p className="text-gray-400 mb-2">📞 +254703560705</p>
              <p className="text-gray-400">✉️ asksimon8@gmail.com</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gray-800 rounded-2xl p-6 shadow-lg"
            >
              <h3 className="text-xl font-semibold mb-2">Kang'ara Gathanua</h3>
              <p className="text-gray-400 mb-2">📞 +254794721461</p>
              <p className="text-gray-400">✉️ robertgathanua@gmail.com</p>
            </motion.div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-6 text-blue-400">
            Get in Touch
          </h2>
          <form ref={form} onSubmit={sendEmail} className="space-y-6">
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              required
              className="w-full p-4 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="email"
              name="email"
              placeholder="Your Email"
              required
              className="w-full p-4 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <textarea
              name="message"
              placeholder="Your Message"
              rows="5"
              required
              className="w-full p-4 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            ></textarea>
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 transition-all duration-300 text-white font-semibold py-3 rounded-xl shadow-lg"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ContactUs;
