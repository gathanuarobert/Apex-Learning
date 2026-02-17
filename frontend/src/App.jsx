import { useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import AboutUs from './pages/AboutUs'
import Register from './components/Register'
import AddProduct from './components/AddProduct'
import EditProduct from './components/EditProduct'
import Login from './components/Login'
import NewsComposer from './components/NewsComposer'
import AccountPage from './pages/AccountPage'
import AdminUserPage from './pages/AdminUserPage'
import Dashboard from './pages/Dashboard'
import AdminNews from './pages/AdminNews'
import ContactUs from './pages/ContactUs'
import NotesPage from './pages/NotesPage'
import UserDashboard from './pages/UserDashboard'
import ExamsPage from './pages/ExamsPage'
import PastPapersPage from './pages/PastPapersPage'
import ForgotPassword from './pages/ForgotPaasword'
import RevisionPage from './pages/RevisionPage'
import NewsPage from './pages/NewsPage'
// const useAuthCheck = () => {
//   useEffect(() => {
//     const checkToken = async () => {
//       const token = localStorage.getItem('token')
//       if (!token && window.location.pathname !== '/login') {
//         window.location.href = '/login'
//         // Validate token
//       }
//     }
//     checkToken()
//   }, [])
// }

function App() {
  // useAuthCheck()
  return (
   
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/register" element={<Register />} />
        <Route path="/add-product" element={<AddProduct />} />
        <Route path='/edit-product/:id' element={<EditProduct />} />
        <Route path='/login' element={<Login />} />
        <Route path='/news-composer' element={<NewsComposer />} />
        <Route path='/account' element={<AccountPage />} />
        <Route path='/admin' element={<AdminUserPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin-news" element={<AdminNews />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/notes" element={<NotesPage />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="/exams" element={<ExamsPage />} />
        <Route path="/past-papers" element={<PastPapersPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/revision" element={<RevisionPage />} />
        <Route path="/news" element={<NewsPage />} />
        {/* Add more routes as needed */}
      </Routes>
  
  )
}

export default App
