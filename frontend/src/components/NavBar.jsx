// import React, { useState } from 'react';
// import { Link } from 'react-router-dom';
// import { Menu, X, ChevronDown } from 'lucide-react';

// const Navbar = () => {
//   const [navOpen, setNavOpen] = useState(false);
//   const [dropdownOpen, setDropdownOpen] = useState(false);

//   return (
//     <nav className="bg-white shadow-md fixed top-0 left-0 w-full z-50">
//       <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
//         <Link to="/" className="text-2xl font-bold text-indigo-600">Apex Learning</Link>

//         {/* Desktop Menu */}
//         <ul className="hidden md:flex space-x-6 text-gray-700 font-medium items-center">
//           <li><Link to="/" className="hover:text-indigo-600">Home</Link></li>
//           <li><Link to="/courses" className="hover:text-indigo-600">Courses</Link></li>
//           <li><Link to="/news" className="hover:text-indigo-600">News</Link></li>

//           {/* Dropdown */}
//           <li className="relative">
//             <button
//               onClick={() => setDropdownOpen(!dropdownOpen)}
//               className="flex items-center gap-1 hover:text-indigo-600"
//             >
//               Account <ChevronDown size={16} />
//             </button>
//             {dropdownOpen && (
//               <ul className="absolute bg-white shadow-md mt-2 rounded-md w-40 p-2 right-0 z-50 space-y-2">
//                 <li>
//                   <Link
//                     to="/dashboard"
//                     className="block px-4 py-2 hover:bg-gray-100"
//                     onClick={() => setDropdownOpen(false)}
//                   >
//                     Dashboard
//                   </Link>
//                 </li>
//                 <li>
//                   <Link
//                     to="/profile"
//                     className="block px-4 py-2 hover:bg-gray-100"
//                     onClick={() => setDropdownOpen(false)}
//                   >
//                     Profile
//                   </Link>
//                 </li>
//                 <li>
//                   <Link
//                     to="/logout"
//                     className="block px-4 py-2 hover:bg-gray-100 text-red-600"
//                     onClick={() => setDropdownOpen(false)}
//                   >
//                     Logout
//                   </Link>
//                 </li>
//               </ul>
//             )}
//           </li>
//         </ul>

//         {/* Mobile Menu Button */}
//         <button
//           className="md:hidden text-gray-800"
//           onClick={() => setNavOpen(!navOpen)}
//         >
//           {navOpen ? <X size={28} /> : <Menu size={28} />}
//         </button>
//       </div>

//       {/* Mobile Menu */}
//       {navOpen && (
//         <ul className="md:hidden px-6 pb-4 space-y-4 bg-white text-gray-700 font-medium">
//           <li><Link to="/" onClick={() => setNavOpen(false)}>Home</Link></li>
//           <li><Link to="/courses" onClick={() => setNavOpen(false)}>Courses</Link></li>
//           <li><Link to="/news" onClick={() => setNavOpen(false)}>News</Link></li>
//           <li><Link to="/dashboard" onClick={() => setNavOpen(false)}>Dashboard</Link></li>
//           <li><Link to="/profile" onClick={() => setNavOpen(false)}>Profile</Link></li>
//           <li><Link to="/logout" onClick={() => setNavOpen(false)} className="text-red-600">Logout</Link></li>
//         </ul>
//       )}
//     </nav>
//   );
// };

// export default Navbar;
