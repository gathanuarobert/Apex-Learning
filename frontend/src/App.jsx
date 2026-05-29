import { Routes, Route } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
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
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import RevisionPage from './pages/RevisionPage'
import NewsPage from './pages/NewsPage'
import PaymentComplete from './pages/PaymentComplete'
import AppLayout from './components/AppLayout'

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* ── Public / Auth pages — NO sidebar ── */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/payment/complete" element={<PaymentComplete />} />

        {/* ── Admin pages — NO sidebar ── */}
        <Route path="/add-product" element={<AddProduct />} />
        <Route path="/edit-product/:id" element={<EditProduct />} />
        <Route path="/news-composer" element={<NewsComposer />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/admin" element={<AdminUserPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin-news" element={<AdminNews />} />

        {/* ── User pages — WITH AppLayout sidebar ── */}
        <Route path="/user-dashboard" element={<AppLayout><UserDashboard /></AppLayout>} />
        <Route path="/notes" element={<AppLayout><NotesPage /></AppLayout>} />
        <Route path="/exams" element={<AppLayout><ExamsPage /></AppLayout>} />
        <Route path="/past-papers" element={<AppLayout><PastPapersPage /></AppLayout>} />
        <Route path="/news" element={<AppLayout><NewsPage /></AppLayout>} />
        <Route path="/revision" element={<AppLayout><RevisionPage /></AppLayout>} />
      </Routes>
    </>
  )
}

export default App