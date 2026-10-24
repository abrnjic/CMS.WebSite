import { Routes, Route, useLocation, useParams } from "react-router";
import { useEffect } from "react";
import { ServiceStatus } from "@/components/ServiceStatus";
import { AppProvider } from "@/context/AppContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import HomePage from "@/pages/Home";
import PropertiesPage from "@/pages/Properties";
import PropertyPage from "@/pages/Property";
import CheckoutPage from "@/pages/Checkout";
import ConfirmationPage from "@/pages/Confirmation";
import HowItWorksPage from "@/pages/HowItWorks";
import CmsPage from "@/pages/CmsPage";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminBookings from "@/pages/admin/Bookings";
import AdminProperties from "@/pages/admin/Properties";
import AdminPropertyEdit from "@/pages/admin/PropertyEdit";
import AdminMedia from "@/pages/admin/Media";
import AdminSeo from "@/pages/admin/Seo";
import PageBuilder from "@/pages/admin/PageBuilder";
import ThemeEditor from "@/pages/admin/ThemeEditor";
import AdminAdmins from "@/pages/admin/Admins";
import AdminProdaja from "@/pages/admin/Prodaja";
import Login from "@/pages/Login";
import ClaimAdmin from "@/pages/ClaimAdmin";
import Setup from "@/pages/Setup";

import ContactPage from "@/pages/Contact";
import AdminInquiries from "@/pages/admin/Inquiries";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <AppProvider>
      <ScrollToTop />
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <ServiceStatus>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/smjestaj" element={<PropertiesPage />} />
              <Route path="/smjestaj/:slug" element={<PropertyPage />} />
              <Route path="/kontakt" element={<ContactPage />} />
              <Route path="/rezervacija" element={<CheckoutPage />} />
              <Route path="/potvrda/:code" element={<ConfirmationPage />} />
              <Route path="/kako-funkcionira" element={<HowItWorksPage />} />
              <Route path="/stranica/:slug" element={<CmsPageWrapper />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin-claim" element={<ClaimAdmin />} />
              <Route path="/postavljanje" element={<Setup />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="stranice/:id" element={<PageBuilder />} />
                <Route path="teme" element={<ThemeEditor />} />
                <Route path="administratori" element={<AdminAdmins />} />
                <Route path="prodaja" element={<AdminProdaja />} />
                <Route path="objekti" element={<AdminProperties />} />
                <Route path="objekti/:id" element={<AdminPropertyEdit />} />
                <Route path="upiti" element={<AdminInquiries />} />
                <Route path="rezervacije" element={<AdminBookings />} />
                <Route path="mediji" element={<AdminMedia />} />
                <Route path="seo" element={<AdminSeo />} />
              </Route>
              <Route path="*" element={<HomePage />} />
            </Routes>
          </ServiceStatus>
        </main>
        <Footer />
      </div>
    </AppProvider>
  );
}

function CmsPageWrapper() {
  const { slug } = useParams();
  return <CmsPage slug={slug ?? ""} />;
}
