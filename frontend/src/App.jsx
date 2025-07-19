import { useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import AboutUs from './pages/AboutUs'
import Products from './pages/Products'
import News from './pages/News'
import Register from './components/Register'
import AddProduct from './components/AddProduct'
import EditProduct from './components/EditProduct'
import Login from './components/Login'
import NewsComposer from './components/NewsComposer'
import AccountPage from './pages/AccountPage'
import AdminUserPage from './pages/AdminUserPage'

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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/products" element={<Products />} />
        <Route path="/news" element={<News />} />
        <Route path="/register" element={<Register />} />
        <Route path="/add-product" element={<AddProduct />} />
        <Route path='/edit-product/:id' element={<EditProduct />} />
        <Route path='/login' element={<Login />} />
        <Route path='/news-composer' element={<NewsComposer />} />
        <Route path='/account' element={<AccountPage />} />
        <Route path='/admin' element={<AdminUserPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
