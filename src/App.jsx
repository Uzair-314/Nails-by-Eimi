import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import NewArrivals from './pages/NewArrivals'
import GelNails from './pages/GelNails'
import Category from './pages/Category'
import ProductDetail from './pages/ProductDetail'
import SearchPage from './pages/Search'
import Contact from './pages/Contact'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderPlaced from './pages/OrderPlaced'
import TrackOrder from './pages/TrackOrder'
import Login from './pages/Login'
import AccountLayout from './pages/account/AccountLayout'
import DashboardHome from './pages/account/DashboardHome'
import MyOrders from './pages/account/MyOrders'
import History from './pages/account/History'
import Wishlist from './pages/account/Wishlist'
import SavedAddresses from './pages/account/SavedAddresses'
import PaymentMethods from './pages/account/PaymentMethods'
import NailProfile from './pages/account/NailProfile'
import RewardsLoyalty from './pages/account/RewardsLoyalty'
import AccountSettings from './pages/account/AccountSettings'
import { useAuth } from './context/AuthContext'

/** Sends signed-out visitors to the login screen, remembering where they were headed. */
function RequireAuth({ children }) {
  const { loading, isSignedIn } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="container-e grid place-items-center py-24">
        <p className="text-sm text-muted">One moment…</p>
      </div>
    )
  }
  if (!isSignedIn) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

function NotFound() {
  return (
    <div className="container-e py-24 text-center">
      <p className="eyebrow justify-center">404</p>
      <h1 className="mt-3 font-display text-[36px] font-semibold text-ink">This page has been filed away</h1>
      <p className="mx-auto mt-3 max-w-md text-[15px] text-muted">
        The link may be old, or the piece may have been retired. Try the menu, or start again from home.
      </p>
      <Link to="/" className="btn-primary mx-auto mt-7">Back to home</Link>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="new-arrivals" element={<NewArrivals />} />
        <Route path="gel-nails" element={<GelNails />} />
        <Route path="category/*" element={<Category />} />
        <Route path="product/:slug" element={<ProductDetail />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="contact" element={<Contact />} />
        <Route path="cart" element={<Cart />} />
        <Route path="login" element={<Login />} />
        {/* Deliberately open: nobody is asked to sign in to buy something. */}
        <Route path="checkout" element={<Checkout />} />
        <Route path="order-placed" element={<OrderPlaced />} />
        <Route path="track" element={<TrackOrder />} />

        {/* The menu's "Rewards / Loyalty" entry lands on the member dashboard. */}
        <Route path="rewards" element={<Navigate to="/account/rewards" replace />} />

        <Route path="account" element={<RequireAuth><AccountLayout /></RequireAuth>}>
          <Route index element={<DashboardHome />} />
          <Route path="orders" element={<MyOrders />} />
          <Route path="history" element={<History />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="addresses" element={<SavedAddresses />} />
          <Route path="payment" element={<PaymentMethods />} />
          <Route path="nail-profile" element={<NailProfile />} />
          <Route path="rewards" element={<RewardsLoyalty />} />
          <Route path="settings" element={<AccountSettings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
