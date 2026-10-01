import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { PageLoading, Toaster } from './components/ui';
import { isConfigured } from './lib/supabase';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import StorePage from './pages/buyer/StorePage';

const CheckoutPage = lazy(() => import('./pages/buyer/CheckoutPage'));
const TrackPage = lazy(() => import('./pages/buyer/TrackPage'));
const MyOrdersPage = lazy(() => import('./pages/buyer/MyOrdersPage'));
const Login = lazy(() => import('./pages/seller/Login'));
const SellerLayout = lazy(() => import('./pages/seller/SellerLayout'));
const Orders = lazy(() => import('./pages/seller/Orders'));
const OrderDetail = lazy(() => import('./pages/seller/OrderDetail'));
const Products = lazy(() => import('./pages/seller/Products'));
const Delivery = lazy(() => import('./pages/seller/Delivery'));
const StoreSettings = lazy(() => import('./pages/seller/StoreSettings'));
const Share = lazy(() => import('./pages/seller/Share'));

function NotConfigured() {
  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="text-xl font-bold">Supabase belum dikonfigurasi</h1>
      <p className="mt-2 text-sm text-stone-600">
        Salin <code>.env.example</code> menjadi <code>.env</code>, isi <code>VITE_SUPABASE_URL</code> dan{' '}
        <code>VITE_SUPABASE_ANON_KEY</code>, lalu jalankan ulang <code>npm run dev</code>. Di Vercel, isi keduanya
        di Project Settings → Environment Variables lalu redeploy.
      </p>
    </div>
  );
}

export default function App() {
  if (!isConfigured) return <NotConfigured />;
  return (
    <BrowserRouter>
      <Toaster />
      <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/t/:slug" element={<StorePage />} />
          <Route path="/t/:slug/checkout" element={<CheckoutPage />} />
          <Route path="/o/:id" element={<TrackPage />} />
          <Route path="/pesanan" element={<MyOrdersPage />} />
          <Route path="/seller/login" element={<Login />} />
          <Route path="/seller" element={<SellerLayout />}>
            <Route index element={<Orders />} />
            <Route path="pesanan/:id" element={<OrderDetail />} />
            <Route path="produk" element={<Products />} />
            <Route path="ongkir" element={<Delivery />} />
            <Route path="toko" element={<StoreSettings />} />
            <Route path="bagikan" element={<Share />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
