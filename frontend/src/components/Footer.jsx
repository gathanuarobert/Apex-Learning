// src/components/Footer.jsx
import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-white/5 pt-12 pb-6 w-full">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 md:gap-6">
        {/* Brand */}
        <div className="md:max-w-xs">
          <h3 className="text-2xl font-black tracking-tighter text-white">
            APEX <span className="text-blue-500">LEARNING</span>
          </h3>
          <p className="mt-3 text-sm text-slate-500 leading-relaxed">
            Notes, exams and past papers for Kenyan students — built for every curriculum.
          </p>
        </div>

        {/* Get in Touch */}
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Get in Touch</h4>
          <div className="space-y-2.5 text-sm text-slate-500">
            <p>Nairobi, Kenya</p>
            <p>apexlearningresource@gmail.com</p>
            <p>0700 930 322</p>
          </div>
        </div>

        {/* Learn More */}
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Learn More</h4>
          <div className="flex flex-col space-y-2.5 text-sm text-slate-500">
            <Link to="/about" className="hover:text-slate-300 transition-colors w-fit">
              About Us
            </Link>
            <Link to="/contact" className="hover:text-slate-300 transition-colors w-fit">
              Contact Us
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
        <p>© {year} Apex Learning Hub. All rights reserved.</p>
        <p>
          Designed and Developed by{" "}
          <span className="text-slate-400 font-semibold">Flowmerce Technologies</span>
        </p>
      </div>
    </footer>
  );
}