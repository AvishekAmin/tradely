import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import HomePage from "./landing/home/HomePage";
import SignUp from "./landing/signup/SignUp";
import AboutPage from "./landing/about/AboutPage";
import ProductsPage from "./landing/products/ProductsPage";
import PricingPage from "./landing/pricing/PricingPage";
import SupportPage from "./landing/support/SupportPage";
import Navbar from "./landing/Navbar";
import Footer from "./landing/Footer";
import NotFound from "./landing/NotFound";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/product" element={<ProductsPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
