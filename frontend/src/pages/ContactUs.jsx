// src/pages/ContactUs.jsx
import React, { useRef } from "react";
import emailjs from "@emailjs/browser";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone } from "lucide-react";
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
        () => {
          alert("Message sent successfully ✅");
          form.current.reset();
        },
        () => {
          alert("Message failed ❌ Please try again.");
        },
      );
  };

  return (
    <>
      <SEO
        title="Contact Us | Apex Learning Hub"
        description="Get in touch with Apex Learning Hub — notes, exams and past papers for Kenyan students."
        path="/contact"
      />
      <div className="w-full min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white py-16 px-6">
        {/* Hero */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-blue-400">
            Get in Touch
          </h1>
          <p className="text-lg text-gray-300 max-w-xl mx-auto">
            Questions, feedback, or something not working right? We'd love to hear from you.
          </p>
        </motion.div>

        {/* Contact info + form */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          {/* Contact details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="space-y-6"
          >
            <div className="flex items-start gap-4">
              <span className="flex items-center justify-center h-11 w-11 rounded-xl bg-blue-500/10 shrink-0">
                <MapPin size={18} className="text-blue-400" />
              </span>
              <div>
                <p className="font-semibold text-white">Location</p>
                <p className="text-gray-400 text-sm">Nairobi, Kenya</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="flex items-center justify-center h-11 w-11 rounded-xl bg-blue-500/10 shrink-0">
                <Mail size={18} className="text-blue-400" />
              </span>
              <div>
                <p className="font-semibold text-white">Email</p>
                <p className="text-gray-400 text-sm">apexlearningresource@gmail.com</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="flex items-center justify-center h-11 w-11 rounded-xl bg-blue-500/10 shrink-0">
                <Phone size={18} className="text-blue-400" />
              </span>
              <div>
                <p className="font-semibold text-white">Phone</p>
                <p className="text-gray-400 text-sm">0700 930 322</p>
              </div>
            </div>
          </motion.div>

          {/* Contact form */}
          <motion.form
            ref={form}
            onSubmit={sendEmail}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="space-y-4"
          >
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
          </motion.form>
        </div>
      </div>
    </>
  );
};

export default ContactUs;