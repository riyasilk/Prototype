"use client";

import React, { useState, useEffect } from "react";
import { API_BASE } from "../utils/api";

// Types for form and selectors
type Industry = "Healthcare" | "Schools" | "Corporate" | "Hospitality" | "Industrial" | "Security" | "Other";
type QuantityRange = "50-100" | "101-500" | "501-1000" | "1000+" | "";
type ContactMethod = "WhatsApp" | "Phone" | "Email" | "";

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  industry: Industry | "";
  quantity: QuantityRange;
  website: string;
  preferredContact: ContactMethod;
  details: string;
  honeypot: string; // Anti-bot field
}

export default function Home() {
  // Navigation states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stickyActive, setStickyActive] = useState(false);
  const [isBusinessHours, setIsBusinessHours] = useState(true);

  // Selector states
  const [activeProductTab, setActiveProductTab] = useState<"corporate" | "healthcare" | "hospitality" | "industrial" | "security">("corporate");
  const [activeGalleryFilter, setActiveGalleryFilter] = useState<string>("Show All");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  // Form states
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    industry: "",
    quantity: "",
    website: "",
    preferredContact: "",
    details: "",
    honeypot: "",
  });

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Catalogue download states
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadForm, setDownloadForm] = useState({ name: "", company: "", email: "" });
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  // Dynamic API states
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any | null>(null);

  // Fetch dynamic landing page content on mount
  useEffect(() => {
    const fetchDynamicData = async () => {
      try {
        const [catRes, prodRes, galRes, testRes, faqRes, settingsRes] = await Promise.all([
          fetch(`${API_BASE}/api/v1/products/categories`),
          fetch(`${API_BASE}/api/v1/products`),
          fetch(`${API_BASE}/api/v1/gallery`),
          fetch(`${API_BASE}/api/v1/testimonials`),
          fetch(`${API_BASE}/api/v1/faqs`),
          fetch(`${API_BASE}/api/v1/settings/homepage`)
        ]);

        if (catRes.ok) setCategories(await catRes.json());
        if (prodRes.ok) setProducts(await prodRes.json());
        if (galRes.ok) setGallery(await galRes.json());
        if (testRes.ok) setTestimonials(await testRes.json());
        if (faqRes.ok) setFaqs(await faqRes.json());
        if (settingsRes.ok) setSettings(await settingsRes.json());
      } catch (err) {
        console.error("Failed to load dynamic page content from API:", err);
      }
    };
    fetchDynamicData();
  }, []);

  // Determine dynamic business hours (Mon-Sat: 9 AM - 6 PM IST)
  useEffect(() => {
    const checkBusinessHours = () => {
      const now = new Date();
      // Set to Indian Standard Time (UTC+5:30) for Riya Silk operations
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const ist = new Date(utc + (3600000 * 5.5));
      
      const day = ist.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
      const hours = ist.getHours();
      
      const isWorkday = day >= 1 && day <= 6;
      const isWorkHours = hours >= 9 && hours < 18;
      
      setIsBusinessHours(isWorkday && isWorkHours);
    };

    checkBusinessHours();
    const interval = setInterval(checkBusinessHours, 60000);
    return () => clearInterval(interval);
  }, []);

  // Handle sticky header activation on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setStickyActive(true);
      } else {
        setStickyActive(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle industry selection from card click
  const selectIndustryAndScroll = (selectedIndustry: Industry, labelText?: string) => {
    setFormData((prev) => ({
      ...prev,
      industry: selectedIndustry,
      details: labelText ? `Inquiry regarding ${labelText} uniforms.` : prev.details,
    }));
    
    const contactSection = document.getElementById("contact-section");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Form inputs change handler
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.honeypot) {
      // Quietly reject bots triggering the honeypot
      return;
    }

    setFormLoading(true);
    setFormError("");

    try {
      const response = await fetch(`${API_BASE}/api/v1/inquiries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contactName: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          industry: formData.industry,
          quantity: formData.quantity,
          source: "Website",
          message: formData.details,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          Array.isArray(errorData.message)
            ? errorData.message.join(", ")
            : errorData.message || "Failed to submit inquiry. Please try again."
        );
      }

      setFormLoading(false);
      setFormSubmitted(true);
      // Reset form fields
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        industry: "",
        quantity: "",
        website: "",
        preferredContact: "",
        details: "",
        honeypot: "",
      });
    } catch (err: any) {
      setFormLoading(false);
      setFormError(err.message || "Something went wrong. Please connect with us directly.");
    }
  };

  // Catalogue Download submit handler
  const handleDownloadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDownloadLoading(true);
    setDownloadError("");

    try {
      const response = await fetch(`${API_BASE}/api/v1/downloads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(downloadForm),
      });

      if (!response.ok) {
        throw new Error("Failed to record catalog request.");
      }

      await response.json().catch(() => ({}));
      
      // Auto trigger browser download from local assets
      const link = document.createElement("a");
      link.href = settings?.catalogPdfUrl || "/riyasilk_catalogue.pdf";
      link.setAttribute("download", "riyasilk_catalogue.pdf");
      document.body.appendChild(link);
      link.click();
      link.remove();

      setDownloadSuccess(true);
    } catch (err: any) {
      setDownloadError(err.message || "Something went wrong. Please try again.");
    } finally {
      setDownloadLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-navy-dark selection:text-white relative">
      
      {/* 1. Global Navigation Bar */}
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          stickyActive
            ? "bg-white/95 backdrop-blur-md shadow-sm py-4 border-b border-zinc-100"
            : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Brand Monogram & Name */}
          <a href="#" className="flex items-center gap-3 group">
            <span className="h-10 w-10 flex items-center justify-center rounded-lg bg-navy-dark text-white font-serif text-xl font-bold tracking-wider group-hover:scale-105 transition-transform">
              RS
            </span>
            <div className="flex flex-col">
              <span className="font-semibold text-lg leading-tight tracking-tight text-navy-dark">
                Riya Silk
              </span>
              <span className="text-[10px] tracking-widest text-steel-grey uppercase font-medium">
                Uniform Manufacturer
              </span>
            </div>
          </a>

          {/* Desktop Sitemap Menu */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#about" className="text-sm font-medium text-steel-grey hover:text-navy-dark transition-colors">About Us</a>
            <a href="#industries" className="text-sm font-medium text-steel-grey hover:text-navy-dark transition-colors">Industries</a>
            <a href="#products" className="text-sm font-medium text-steel-grey hover:text-navy-dark transition-colors">Products</a>
            <a href="#process" className="text-sm font-medium text-steel-grey hover:text-navy-dark transition-colors">Workflow</a>
            <a href="#quality" className="text-sm font-medium text-steel-grey hover:text-navy-dark transition-colors">Quality</a>
            <a href="#showcase" className="text-sm font-medium text-steel-grey hover:text-navy-dark transition-colors">Showcase</a>
            <a href="#faq" className="text-sm font-medium text-steel-grey hover:text-navy-dark transition-colors">FAQ</a>
          </nav>

          {/* Header Action Button */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="#contact-section"
              className="bg-navy-dark text-white px-5 py-2.5 rounded-lg text-sm font-medium tracking-wide uppercase hover:bg-navy-dark/90 hover:scale-[1.02] transition-all"
            >
              Request Quote
            </a>
          </div>

          {/* Mobile Menu Icon */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open Navigation Menu"
            className="md:hidden p-2 text-navy-dark focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Sliding Navigation Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-navy-dark/40 backdrop-blur-sm flex justify-end">
          <div className="w-[280px] bg-white h-full p-8 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <span className="font-serif text-lg font-bold text-navy-dark">Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close Navigation Menu"
                  className="p-2 text-steel-grey hover:text-navy-dark focus:outline-none"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="flex flex-col gap-6">
                <a
                  href="#about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-steel-grey hover:text-navy-dark transition-colors"
                >
                  About Us
                </a>
                <a
                  href="#industries"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-steel-grey hover:text-navy-dark transition-colors"
                >
                  Industries
                </a>
                <a
                  href="#products"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-steel-grey hover:text-navy-dark transition-colors"
                >
                  Products
                </a>
                <a
                  href="#process"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-steel-grey hover:text-navy-dark transition-colors"
                >
                  Workflow
                </a>
                <a
                  href="#quality"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-steel-grey hover:text-navy-dark transition-colors"
                >
                  Quality
                </a>
                <a
                  href="#showcase"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-steel-grey hover:text-navy-dark transition-colors"
                >
                  Showcase
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-medium text-steel-grey hover:text-navy-dark transition-colors"
                >
                  FAQ
                </a>
              </nav>
            </div>
            <a
              href="#contact-section"
              onClick={() => setMobileMenuOpen(false)}
              className="bg-navy-dark text-white w-full py-3 rounded-lg text-center font-medium tracking-wide uppercase block text-sm hover:bg-navy-dark/95 transition-all"
            >
              Request Quote
            </a>
          </div>
        </div>
      )}

      {/* 2. Hero Section & Quick Trust Numbers */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 bg-white border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content Area (Columns 1-7) */}
            <div className="lg:col-span-7 flex flex-col gap-6 text-left">
              <span className="inline-flex self-start px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-ice-grey text-navy-dark border border-zinc-200">
                Trusted by Corporates & Institutions Across India
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-navy-dark leading-[1.15] max-w-2xl">
                {settings?.heroTitle || "Custom Uniform Manufacturing for Businesses That Demand Quality at Scale"}
              </h1>
              <p className="text-lg md:text-xl text-steel-grey font-light max-w-xl leading-relaxed">
                {settings?.heroSubtitle || "Riya Silk designs and manufactures custom corporate workwear, clinical apparel, and industrial uniforms. We combine premium fabrics with state-of-the-art bulk production to deliver consistent quality, on-time, every time."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <a
                  href={settings?.heroCtaLink || "#contact-section"}
                  className="bg-navy-dark text-white px-8 py-4 rounded-lg text-center font-medium tracking-wider uppercase text-sm hover:bg-navy-dark/90 hover:scale-[1.02] hover:shadow-lg transition-all"
                >
                  {settings?.heroCtaText || "Request Consultation & Samples"}
                </a>
                <a
                  href="#products"
                  className="border border-zinc-300 text-navy-dark px-8 py-4 rounded-lg text-center font-medium tracking-wider uppercase text-sm hover:bg-ice-grey hover:scale-[1.02] transition-all"
                >
                  Explore Collections
                </a>
              </div>
            </div>

            {/* Right Graphic Area (Columns 8-12) */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="w-full max-w-md aspect-[4/5] rounded-xl overflow-hidden shadow-2xl relative border-4 border-white bg-gradient-to-tr from-navy-dark via-navy-dark/90 to-steel-grey/30 flex items-center justify-center p-8">
                {/* stylized minimalist vector pattern representing uniform craftsmanship */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>
                <div className="flex flex-col items-center text-center text-white/90 gap-4 z-10 select-none">
                  <span className="h-16 w-16 flex items-center justify-center rounded-full bg-white/10 text-white font-serif text-3xl font-bold tracking-widest border border-white/20">
                    RS
                  </span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-2xl tracking-wider font-headings">Riya Silk</span>
                    <span className="text-[10px] tracking-widest uppercase text-white/60">Factory Showcase</span>
                  </div>
                  <div className="h-[1px] w-24 bg-white/20 my-2"></div>
                  <p className="text-sm font-light leading-relaxed max-w-[260px] text-white/80">
                    Bespoke Tailoring & High-Output Manufacturing Infrastructure.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Immediate Trust Strip */}
          <div className="mt-16 pt-8 border-t border-zinc-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <span className="text-green-600 text-xl font-bold font-sans">✓</span>
                <div className="flex flex-col">
                  <span className="font-semibold text-navy-dark text-sm">Established Heritage</span>
                  <span className="text-xs text-steel-grey">Since 1969</span>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-3">
                <span className="text-green-600 text-xl font-bold font-sans">✓</span>
                <div className="flex flex-col">
                  <span className="font-semibold text-navy-dark text-sm">500+ Client Partners</span>
                  <span className="text-xs text-steel-grey">Organizations served</span>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-3">
                <span className="text-green-600 text-xl font-bold font-sans">✓</span>
                <div className="flex flex-col">
                  <span className="font-semibold text-navy-dark text-sm">Flexible Order Volume</span>
                  <span className="text-xs text-steel-grey">From 50 to 10,000+ units</span>
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-3">
                <span className="text-green-600 text-xl font-bold font-sans">✓</span>
                <div className="flex flex-col">
                  <span className="font-semibold text-navy-dark text-sm">Nationwide Logistics</span>
                  <span className="text-xs text-steel-grey">Pan-India delivery</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. About Us & Factory Statistics */}
      <section id="about" className="py-24 bg-ice-grey border-b border-zinc-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Area (Infrastructure & Image Placeholder) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md aspect-[4/5] rounded-xl overflow-hidden relative bg-gradient-to-br from-steel-grey/20 to-navy-dark/10 flex items-center justify-center p-8 border border-zinc-200/50 shadow-inner">
                <div className="text-center flex flex-col items-center gap-4 text-steel-grey/80">
                  {/* factory line vector */}
                  <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="font-medium tracking-wider uppercase text-xs">Factory Floor Visual</span>
                </div>
              </div>
            </div>

            {/* Right Area (Story & Statistics Grid) */}
            <div className="lg:col-span-7 flex flex-col gap-6 text-left">
              <span className="text-xs font-semibold tracking-wider text-steel-grey uppercase">MANUFACTURING HERITAGE</span>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-navy-dark">
                A Legacy of Precision in Institutional Apparel
              </h2>
              <p className="text-base text-zinc-700 leading-relaxed font-light">
                Since our founding, Riya Silk has been dedicated to manufacturing high-performance corporate workwear, school apparel, and specialized industrial uniforms. We bridge the gap between bespoke tailoring and bulk industrial scaling.
              </p>
              <p className="text-base text-zinc-700 leading-relaxed font-light">
                Our state-of-the-art facility features automated cutting lines, computerized embroidery machinery, and a specialized fabric testing unit. This infrastructure enables us to deliver uncompromised quality across every single run, ensuring your workforce is dressed for performance and safety.
              </p>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-zinc-200">
                <div className="flex flex-col gap-1">
                  <span className="text-3xl font-semibold text-navy-dark font-headings">{settings?.statsCapacity || "5,000+"}</span>
                  <span className="text-xs text-steel-grey uppercase font-medium">Daily Capacity</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-3xl font-semibold text-navy-dark font-headings">{settings?.statsTailors || "150+"}</span>
                  <span className="text-xs text-steel-grey uppercase font-medium">Tailors Team</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-3xl font-semibold text-navy-dark font-headings">{settings?.statsSqFt || "100K+"}</span>
                  <span className="text-xs text-steel-grey uppercase font-medium">Sq. Ft. Facility</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-3xl font-semibold text-navy-dark font-headings">{settings?.statsClients || "500+"}</span>
                  <span className="text-xs text-steel-grey uppercase font-medium">B2B Clients</span>
                </div>
              </div>

              {/* Catalog Lead Gate Action */}
              <div className="pt-4 flex">
                <a
                  href="#contact-section"
                  onClick={() => selectIndustryAndScroll("Other", "Catalog Download Request")}
                  className="inline-flex items-center gap-2 border border-navy-dark text-navy-dark px-6 py-3 rounded-lg text-sm font-medium tracking-wide uppercase hover:bg-navy-dark hover:text-white transition-all duration-200 hover:scale-[1.02]"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 01-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Profile & Catalog
                </a>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* 4. Industries We Serve */}
      <section id="industries" className="py-24 bg-white border-b border-zinc-100 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto flex flex-col gap-4 mb-16">
            <span className="text-xs font-semibold tracking-widest text-steel-grey uppercase">OUR SECTOR EXPERTISE</span>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-navy-dark">
              Uniform Manufacturing for Every Industry
            </h2>
            <p className="text-base text-steel-grey font-light">
              We design and manufacture specialized uniforms engineered for the specific functional demands, durability, and branding guidelines of your sector.
            </p>
          </div>

          {/* 3-Column Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* 1. Healthcare */}
            <div
              onClick={() => selectIndustryAndScroll("Healthcare", "Healthcare scrubs and clinical coats")}
              className="group h-[380px] rounded-xl overflow-hidden shadow-sm hover:shadow-xl border border-zinc-100 relative cursor-pointer hover:scale-[1.01] transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/60 to-transparent z-10"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-teal-900/10 to-navy-dark/30"></div> {/* image backup */}
              <div className="absolute top-6 left-6 z-20 h-10 w-10 flex items-center justify-center rounded-lg bg-white/10 backdrop-blur-md text-white border border-white/20 font-serif">
                H
              </div>
              <div className="absolute bottom-8 left-8 right-8 z-20 flex flex-col gap-3 text-white">
                <h3 className="text-2xl font-medium tracking-tight">Healthcare & Medical</h3>
                <p className="text-sm text-white/80 font-light leading-relaxed">
                  Clean, hygienic apparel engineered for comfort and long clinical shifts.
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/90 border-t border-white/10 pt-3">
                  <span>✓ Scrubs</span>
                  <span>✓ Lab Coats</span>
                  <span>✓ Patient Gowns</span>
                </div>
                <span className="text-xs font-medium uppercase tracking-wider text-white/60 group-hover:text-white transition-colors pt-1">
                  Request Samples →
                </span>
              </div>
            </div>

            {/* 2. Schools */}
            <div
              onClick={() => selectIndustryAndScroll("Schools", "School blazers and activewear")}
              className="group h-[380px] rounded-xl overflow-hidden shadow-sm hover:shadow-xl border border-zinc-100 relative cursor-pointer hover:scale-[1.01] transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/60 to-transparent z-10"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 to-navy-dark/30"></div>
              <div className="absolute top-6 left-6 z-20 h-10 w-10 flex items-center justify-center rounded-lg bg-white/10 backdrop-blur-md text-white border border-white/20 font-serif">
                S
              </div>
              <div className="absolute bottom-8 left-8 right-8 z-20 flex flex-col gap-3 text-white">
                <h3 className="text-2xl font-medium tracking-tight">Schools & Academies</h3>
                <p className="text-sm text-white/80 font-light leading-relaxed">
                  Durable, smart wear made for active daily student and campus life.
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/90 border-t border-white/10 pt-3">
                  <span>✓ Blazers</span>
                  <span>✓ Polo Shirts</span>
                  <span>✓ Sportswear</span>
                </div>
                <span className="text-xs font-medium uppercase tracking-wider text-white/60 group-hover:text-white transition-colors pt-1">
                  Request Samples →
                </span>
              </div>
            </div>

            {/* 3. Corporate */}
            <div
              onClick={() => selectIndustryAndScroll("Corporate", "Corporate executive shirts and blazers")}
              className="group h-[380px] rounded-xl overflow-hidden shadow-sm hover:shadow-xl border border-zinc-100 relative cursor-pointer hover:scale-[1.01] transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/60 to-transparent z-10"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-navy-dark/30"></div>
              <div className="absolute top-6 left-6 z-20 h-10 w-10 flex items-center justify-center rounded-lg bg-white/10 backdrop-blur-md text-white border border-white/20 font-serif">
                C
              </div>
              <div className="absolute bottom-8 left-8 right-8 z-20 flex flex-col gap-3 text-white">
                <h3 className="text-2xl font-medium tracking-tight">Corporate & Finance</h3>
                <p className="text-sm text-white/80 font-light leading-relaxed">
                  Professional tailoring that projects a unified, premium corporate brand image.
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/90 border-t border-white/10 pt-3">
                  <span>✓ Shirts</span>
                  <span>✓ Suits & Blazers</span>
                  <span>✓ Knitted Polos</span>
                </div>
                <span className="text-xs font-medium uppercase tracking-wider text-white/60 group-hover:text-white transition-colors pt-1">
                  Request Samples →
                </span>
              </div>
            </div>

            {/* 4. Hospitality */}
            <div
              onClick={() => selectIndustryAndScroll("Hospitality", "Hospitality chef coats and suits")}
              className="group h-[380px] rounded-xl overflow-hidden shadow-sm hover:shadow-xl border border-zinc-100 relative cursor-pointer hover:scale-[1.01] transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/60 to-transparent z-10"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-rose-900/10 to-navy-dark/30"></div>
              <div className="absolute top-6 left-6 z-20 h-10 w-10 flex items-center justify-center rounded-lg bg-white/10 backdrop-blur-md text-white border border-white/20 font-serif">
                H
              </div>
              <div className="absolute bottom-8 left-8 right-8 z-20 flex flex-col gap-3 text-white">
                <h3 className="text-2xl font-medium tracking-tight">Hotels & Hospitality</h3>
                <p className="text-sm text-white/80 font-light leading-relaxed">
                  Elegant attire designed for premium passenger and guest-facing staff.
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/90 border-t border-white/10 pt-3">
                  <span>✓ Chef Wear</span>
                  <span>✓ Front Desk Suits</span>
                  <span>✓ Tunics</span>
                </div>
                <span className="text-xs font-medium uppercase tracking-wider text-white/60 group-hover:text-white transition-colors pt-1">
                  Request Samples →
                </span>
              </div>
            </div>

            {/* 5. Industrial */}
            <div
              onClick={() => selectIndustryAndScroll("Industrial", "Industrial overalls and safety jackets")}
              className="group h-[380px] rounded-xl overflow-hidden shadow-sm hover:shadow-xl border border-zinc-100 relative cursor-pointer hover:scale-[1.01] transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/60 to-transparent z-10"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-900/10 to-navy-dark/30"></div>
              <div className="absolute top-6 left-6 z-20 h-10 w-10 flex items-center justify-center rounded-lg bg-white/10 backdrop-blur-md text-white border border-white/20 font-serif">
                I
              </div>
              <div className="absolute bottom-8 left-8 right-8 z-20 flex flex-col gap-3 text-white">
                <h3 className="text-2xl font-medium tracking-tight">Industrial & Safety</h3>
                <p className="text-sm text-white/80 font-light leading-relaxed">
                  Rugged, safety-compliant workwear built for durability and protection.
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/90 border-t border-white/10 pt-3">
                  <span>✓ Overalls</span>
                  <span>✓ Safety Pants</span>
                  <span>✓ High-Vis Vests</span>
                </div>
                <span className="text-xs font-medium uppercase tracking-wider text-white/60 group-hover:text-white transition-colors pt-1">
                  Request Samples →
                </span>
              </div>
            </div>

            {/* 6. Security */}
            <div
              onClick={() => selectIndustryAndScroll("Security", "Security duty shirts and tactical pants")}
              className="group h-[380px] rounded-xl overflow-hidden shadow-sm hover:shadow-xl border border-zinc-100 relative cursor-pointer hover:scale-[1.01] transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-navy-dark via-navy-dark/60 to-transparent z-10"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/20 to-navy-dark/30"></div>
              <div className="absolute top-6 left-6 z-20 h-10 w-10 flex items-center justify-center rounded-lg bg-white/10 backdrop-blur-md text-white border border-white/20 font-serif">
                S
              </div>
              <div className="absolute bottom-8 left-8 right-8 z-20 flex flex-col gap-3 text-white">
                <h3 className="text-2xl font-medium tracking-tight">Security & Protection</h3>
                <p className="text-sm text-white/80 font-light leading-relaxed">
                  Authoritative workwear built for tactical strength and shift performance.
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/90 border-t border-white/10 pt-3">
                  <span>✓ Patrol Shirts</span>
                  <span>✓ Tactical Pants</span>
                  <span>✓ Jackets</span>
                </div>
                <span className="text-xs font-medium uppercase tracking-wider text-white/60 group-hover:text-white transition-colors pt-1">
                  Request Samples →
                </span>
              </div>
            </div>

          </div>

          {/* Bottom Banner */}
          <div className="mt-16 bg-ice-grey rounded-xl border border-zinc-200 p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-left">
            <div className="flex flex-col gap-2">
              <span className="font-semibold text-navy-dark text-lg">Need uniforms for another industry?</span>
              <p className="text-sm text-steel-grey font-light max-w-xl">
                We also manufacture custom tailored apparel for Retail, Logistics, Aviation, and special events to your exact color guidelines.
              </p>
            </div>
            <a
              href="#contact-section"
              onClick={() => selectIndustryAndScroll("Other", "Custom sector specifications")}
              className="bg-navy-dark text-white px-6 py-3.5 rounded-lg text-sm font-semibold tracking-wider uppercase hover:bg-navy-dark/95 transition-all text-center whitespace-nowrap"
            >
              Discuss Your Requirements
            </a>
          </div>

        </div>
      </section>

      {/* 5. Product Categories */}
      <section id="products" className="py-24 bg-ice-grey border-b border-zinc-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto flex flex-col gap-4 mb-12">
            <span className="text-xs font-semibold tracking-widest text-steel-grey uppercase font-medium">OUR PRODUCTS</span>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-navy-dark">
              Tailored Uniforms for Every Professional Role
            </h2>
            <p className="text-base text-steel-grey font-light">
              Select a category below to explore our standard workwear lines and customization options.
            </p>
          </div>

          {/* Tab Selector Bar */}
          <div className="flex justify-center mb-12">
            <div className="flex border-b border-zinc-200 overflow-x-auto no-scrollbar max-w-full pb-px">
              {(["corporate", "healthcare", "hospitality", "industrial", "security"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveProductTab(tab)}
                  className={`px-6 py-3 font-semibold text-sm uppercase tracking-wider border-b-2 whitespace-nowrap transition-all duration-200 ${
                    activeProductTab === tab
                      ? "border-navy-dark text-navy-dark"
                      : "border-transparent text-steel-grey hover:text-navy-dark"
                  }`}
                >
                  {tab} Uniforms
                </button>
              ))}
            </div>
          </div>

          {/* Product Items Grid (Changes based on selected tab) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {products
              .filter((p) => (p.category?.name || '').toLowerCase() === activeProductTab)
              .length === 0 ? (
                <div className="col-span-3 py-16 text-center text-steel-grey">
                  <p className="text-sm font-medium">No products listed in this category yet.</p>
                  <p className="text-xs mt-1 font-light">Contact us to discuss your specific uniform requirements.</p>
                </div>
              ) : (
            products
              .filter((p) => (p.category?.name || '').toLowerCase() === activeProductTab)
              .map((product) => (
                <div key={product.id} className="bg-white rounded-xl overflow-hidden border border-zinc-200 shadow-sm flex flex-col justify-between">
                  <div className="h-[220px] overflow-hidden bg-gradient-to-br from-navy-dark/10 to-steel-grey/10 flex items-center justify-center border-b border-zinc-100 relative">
                    {product.images?.[0]?.url ? (
                      <img src={product.images[0].url} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-serif text-steel-grey/60 text-lg uppercase tracking-widest">{product.title}</span>
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-1 justify-between gap-6">
                    <div className="flex flex-col gap-2">
                      <h3 className="text-xl font-semibold text-navy-dark">{product.title}</h3>
                      <p className="text-xs text-steel-grey leading-relaxed">{product.shortDescription}</p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <span className="bg-ice-grey text-steel-grey text-[10px] uppercase font-semibold px-2 py-0.5 rounded">{product.fabricComposition}</span>
                      </div>
                    </div>
                    <div className="border-t border-zinc-100 pt-4 flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-y-1 text-xs text-steel-grey font-light">
                        <span>Colors: {product.availableColors?.join(', ') || 'Custom'}</span>
                        <span>Sizes: {product.availableSizes?.join(', ') || 'S - XL'}</span>
                        <span>MOQ: {product.moq} Units</span>
                        <span>Stitch: Heavy-duty</span>
                      </div>
                      <a
                        href="#contact-section"
                        onClick={() => selectIndustryAndScroll(product.category?.name || "Other", product.title)}
                        className="bg-navy-dark text-white text-center py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider block hover:bg-navy-dark/95 transition-all"
                      >
                        Request {product.title.split(' ')[0]} Samples
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}

          </div>

        </div>
      </section>

      {/* 6. Why Choose Us & Client Logos */}
      <section className="py-24 bg-white border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto flex flex-col gap-4 mb-16">
            <span className="text-xs font-semibold tracking-widest text-steel-grey uppercase font-medium">THE RIYA SILK ADVANTAGE</span>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-navy-dark">
              Why Organizations Choose Riya Silk
            </h2>
            <p className="text-base text-steel-grey font-light">
              We combine high-volume manufacturing capabilities with dedicated personal support to make uniform procurement seamless.
            </p>
          </div>

          {/* Advantages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            
            {/* 1. Custom Fabric Selection */}
            <div className="bg-white rounded-xl border border-zinc-200 p-8 hover-lift flex flex-col gap-4">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-ice-grey text-navy-dark font-sans text-xl">
                🧵
              </div>
              <h3 className="text-lg font-semibold text-navy-dark">Custom Fabric Selection</h3>
              <p className="text-sm text-steel-grey leading-relaxed font-light">
                Select from a wide variety of comfortable, durable, and color-fast fabrics built to withstand daily wear and washing.
              </p>
              <div className="flex flex-col gap-1 text-xs text-navy-dark/80 pt-2 border-t border-zinc-100">
                <span>✓ Comfort-First Weaves</span>
                <span>✓ High Tear-Resistance</span>
              </div>
            </div>

            {/* 2. Accurate Logo Branding */}
            <div className="bg-white rounded-xl border border-zinc-200 p-8 hover-lift flex flex-col gap-4">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-ice-grey text-navy-dark font-sans text-xl">
                🛡️
              </div>
              <h3 className="text-lg font-semibold text-navy-dark">Accurate Logo Branding</h3>
              <p className="text-sm text-steel-grey leading-relaxed font-light">
                We reproduce your corporate identity with clean embroidery and precision screen printing matching your brand guidelines.
              </p>
              <div className="flex flex-col gap-1 text-xs text-navy-dark/80 pt-2 border-t border-zinc-100">
                <span>✓ Precise Thread Matching</span>
                <span>✓ High-Density Stitching</span>
              </div>
            </div>

            {/* 3. Bulk Manufacturing Scale */}
            <div className="bg-white rounded-xl border border-zinc-200 p-8 hover-lift flex flex-col gap-4">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-ice-grey text-navy-dark font-sans text-xl">
                🏭
              </div>
              <h3 className="text-lg font-semibold text-navy-dark">Bulk Manufacturing Scale</h3>
              <p className="text-sm text-steel-grey leading-relaxed font-light">
                Capable of producing large-volume orders on schedule with uniform quality across every garment run.
              </p>
              <div className="flex flex-col gap-1 text-xs text-navy-dark/80 pt-2 border-t border-zinc-100">
                <span>✓ Scalable Production Lines</span>
                <span>✓ Consistent Batch Stitching</span>
              </div>
            </div>

            {/* 4. Consistent Quality Control */}
            <div className="bg-white rounded-xl border border-zinc-200 p-8 hover-lift flex flex-col gap-4">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-ice-grey text-navy-dark font-sans text-xl">
                ✔️
              </div>
              <h3 className="text-lg font-semibold text-navy-dark">Consistent Quality Control</h3>
              <p className="text-sm text-steel-grey leading-relaxed font-light">
                Every uniform batch undergoes rigorous sizing, stitching, and button checks before leaving our facility.
              </p>
              <div className="flex flex-col gap-1 text-xs text-navy-dark/80 pt-2 border-t border-zinc-100">
                <span>✓ Pre-Shipment Inspection</span>
                <span>✓ Accurate Size Matching</span>
              </div>
            </div>

            {/* 5. A Single Point of Contact */}
            <div className="bg-white rounded-xl border border-zinc-200 p-8 hover-lift flex flex-col gap-4">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-ice-grey text-navy-dark font-sans text-xl">
                👥
              </div>
              <h3 className="text-lg font-semibold text-navy-dark">A Single Point of Contact</h3>
              <p className="text-sm text-steel-grey leading-relaxed font-light">
                Work directly with a dedicated manager who handles your project from fabric sampling to delivery.
              </p>
              <div className="flex flex-col gap-1 text-xs text-navy-dark/80 pt-2 border-t border-zinc-100">
                <span>✓ Direct Project Updates</span>
                <span>✓ Faster Sample Approvals</span>
              </div>
            </div>

            {/* 6. Long-Term Partnerships */}
            <div className="bg-white rounded-xl border border-zinc-200 p-8 hover-lift flex flex-col gap-4">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-ice-grey text-navy-dark font-sans text-xl">
                🤝
              </div>
              <h3 className="text-lg font-semibold text-navy-dark">Long-Term Partnerships</h3>
              <p className="text-sm text-steel-grey leading-relaxed font-light">
                We support your business as it grows, making it easy to place re-orders and add new uniform styles.
              </p>
              <div className="flex flex-col gap-1 text-xs text-navy-dark/80 pt-2 border-t border-zinc-100">
                <span>✓ Simple Re-Order System</span>
                <span>✓ Adaptable Uniform Programs</span>
              </div>
            </div>

          </div>

          {/* Grayscale Client Logos Banner ("Trusted By") */}
          <div className="pt-8 border-t border-zinc-100 text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-steel-grey block mb-8">Trusted By Organizations Across India</span>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale select-none">
              <span className="font-headings font-bold text-lg tracking-wider text-navy-dark">Healthcare Corp</span>
              <span className="font-headings font-bold text-lg tracking-wider text-navy-dark">National Academies</span>
              <span className="font-headings font-bold text-lg tracking-wider text-navy-dark">Vanguard Hotels</span>
              <span className="font-headings font-bold text-lg tracking-wider text-navy-dark">Metropolitan Trust</span>
              <span className="font-headings font-bold text-lg tracking-wider text-navy-dark">Apex Logistics</span>
            </div>
          </div>

        </div>
      </section>

      {/* 7. Manufacturing Process */}
      <section id="process" className="py-24 bg-ice-grey border-b border-zinc-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto flex flex-col gap-4 mb-16">
            <span className="text-xs font-semibold tracking-widest text-steel-grey uppercase font-medium">OUR WORKFLOW</span>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-navy-dark">
              Our Step-by-Step Manufacturing Process
            </h2>
            <p className="text-base text-steel-grey font-light">
              A transparent, quality-controlled pipeline designed to deliver your uniform order on schedule.
            </p>
          </div>

          {/* Timeline Nodes (Desktop view: horizontal columns, Mobile view: stacked columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 relative">
            
            {/* Step 1 */}
            <div className="flex flex-col gap-4 bg-white p-6 rounded-lg border border-zinc-200">
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-navy-dark text-white font-semibold text-sm">
                01 👥
              </div>
              <h3 className="font-semibold text-navy-dark text-base">Consultation</h3>
              <span className="text-xs text-steel-grey italic uppercase font-semibold">1-2 Days</span>
              <p className="text-xs text-steel-grey font-light leading-relaxed">
                We discuss brand guidelines, volumes, and sizing to outline the solution.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col gap-4 bg-white p-6 rounded-lg border border-zinc-200">
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-navy-dark text-white font-semibold text-sm">
                02 🧵
              </div>
              <h3 className="font-semibold text-navy-dark text-base">Fabric Selection</h3>
              <span className="text-xs text-steel-grey italic uppercase font-semibold">1-3 Days</span>
              <p className="text-xs text-steel-grey font-light leading-relaxed">
                Choose fabrics matched to your workplace environment and comfort requirements.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col gap-4 bg-white p-6 rounded-lg border border-zinc-200">
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-navy-dark text-white font-semibold text-sm">
                03 📋
              </div>
              <h3 className="font-semibold text-navy-dark text-base">Sample Approval</h3>
              <span className="text-xs text-steel-grey italic uppercase font-semibold">5-7 Days</span>
              <p className="text-xs text-steel-grey font-light leading-relaxed">
                We manufacture a physical uniform sample for fit-testing and your formal sign-off.
              </p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col gap-4 bg-white p-6 rounded-lg border border-zinc-200">
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-navy-dark text-white font-semibold text-sm">
                04 🏭
              </div>
              <h3 className="font-semibold text-navy-dark text-base">Bulk Production</h3>
              <span className="text-xs text-steel-grey italic uppercase font-semibold">2-3 Weeks</span>
              <p className="text-xs text-steel-grey font-light leading-relaxed">
                Your approved design moves to production on our state-of-the-art sewing lines.
              </p>
            </div>

            {/* Step 5 */}
            <div className="flex flex-col gap-4 bg-white p-6 rounded-lg border border-zinc-200">
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-navy-dark text-white font-semibold text-sm">
                05 ✔️
              </div>
              <h3 className="font-semibold text-navy-dark text-base">Quality Check</h3>
              <span className="text-xs text-steel-grey italic uppercase font-semibold">1-2 Days</span>
              <p className="text-xs text-steel-grey font-light leading-relaxed">
                Every garment is checked for sizing accuracy, seam strength, and branding details.
              </p>
            </div>

            {/* Step 6 */}
            <div className="flex flex-col gap-4 bg-white p-6 rounded-lg border border-zinc-200">
              <div className="h-10 w-10 flex items-center justify-center rounded-full bg-navy-dark text-white font-semibold text-sm">
                06 🚚
              </div>
              <h3 className="font-semibold text-navy-dark text-base">Secure Delivery</h3>
              <span className="text-xs text-steel-grey italic uppercase font-semibold">Reliable</span>
              <p className="text-xs text-steel-grey font-light leading-relaxed">
                Garments are packaged, sorted by size, and shipped nationwide.
              </p>
            </div>

          </div>

          <div className="mt-12 flex justify-center">
            <a
              href="#contact-section"
              className="bg-navy-dark text-white px-6 py-3 rounded-lg text-sm font-semibold tracking-wider uppercase hover:bg-navy-dark/95 transition-all"
            >
              Discuss Your Requirements
            </a>
          </div>

        </div>
      </section>

      {/* 8. Quality & Infrastructure Standards */}
      <section id="quality" className="py-24 bg-white border-b border-zinc-100 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column (QA Checkpoints & Details) */}
            <div className="lg:col-span-7 flex flex-col gap-6 text-left">
              <span className="text-xs font-semibold tracking-widest text-steel-grey uppercase font-medium">STANDARDS & INFRASTRUCTURE</span>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-navy-dark">
                Quality & Manufacturing Standards
              </h2>
              <p className="text-base text-zinc-700 leading-relaxed font-light">
                We inspect every garment at multiple stages of the manufacturing cycle. From verifying fabric consistency before cutting to checking finished hems, our quality control process ensures that your uniforms are delivered exactly as approved.
              </p>

              {/* Quality Checkpoints Details */}
              <div className="flex flex-col gap-4 my-2">
                <div className="flex gap-4">
                  <span className="text-green-600 font-bold font-sans">✓</span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-navy-dark text-base">Fabric Consistency Check</span>
                    <span className="text-xs text-steel-grey font-light leading-relaxed">
                      Every fabric roll is inspected for color consistency, weight, and wash durability before production begins.
                    </span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="text-green-600 font-bold font-sans">✓</span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-navy-dark text-base">Stitch Integrity Inspection</span>
                    <span className="text-xs text-steel-grey font-light leading-relaxed">
                      We use reinforced stitching and inspect stress points to ensure uniforms do not tear or fray under daily wear.
                    </span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="text-green-600 font-bold font-sans">✓</span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-navy-dark text-base">Size Accuracy Verification</span>
                    <span className="text-xs text-steel-grey font-light leading-relaxed">
                      Finished garments are hand-checked against our master sizing templates to guarantee a comfortable, accurate fit.
                    </span>
                  </div>
                </div>
              </div>

              {/* Infrastructure bullet list */}
              <div className="pt-4 border-t border-zinc-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-navy-dark block mb-3">Facility Setup Capabilities</span>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-steel-grey font-light">
                  <span>• Modern stitching machinery</span>
                  <span>• Dedicated quality checking desks</span>
                  <span>• Skilled tailoring and cutting team</span>
                  <span>• Secure finishing and packaging area</span>
                </div>
              </div>

            </div>

            {/* Right Column (Certifications & Visual Representation) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Compliance Badges Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-ice-grey border border-zinc-200/50 rounded-lg p-4 text-center">
                  <span className="font-semibold text-sm text-navy-dark block uppercase font-headings">MSME REGISTERED</span>
                  <span className="text-[10px] text-steel-grey uppercase font-medium">Enterprise scale credentials</span>
                </div>
                <div className="bg-ice-grey border border-zinc-200/50 rounded-lg p-4 text-center">
                  <span className="font-semibold text-sm text-navy-dark block uppercase font-headings">GST COMPLIANT</span>
                  <span className="text-[10px] text-steel-grey uppercase font-medium">Certified tax documentation</span>
                </div>
              </div>

              {/* Quality inspection table visual placeholder */}
              <div className="w-full aspect-[16/10] rounded-xl overflow-hidden bg-gradient-to-br from-steel-grey/10 to-navy-dark/10 border border-zinc-200/50 flex items-center justify-center p-8">
                <div className="text-center flex flex-col items-center gap-3 text-steel-grey/80">
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="font-medium tracking-wider uppercase text-[10px]">Stitching Line Inspection Showcase</span>
                </div>
              </div>

              {/* Bottom Custom Standards Callout */}
              <p className="text-xs text-steel-grey font-light text-center border-t border-zinc-100 pt-4">
                Need specific quality standards? We can manufacture uniforms according to your organization&apos;s custom technical specifications.{" "}
                <a href="#contact-section" className="text-navy-dark font-medium hover:underline">
                  Talk to Our Production Team →
                </a>
              </p>

            </div>

          </div>
        </div>
      </section>

      {/* 9. Uniform Showcase */}
      <section id="showcase" className="py-24 bg-white border-b border-zinc-100 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto flex flex-col gap-4 mb-12">
            <span className="text-xs font-semibold tracking-widest text-steel-grey uppercase font-medium">VISUAL GALLERY</span>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-navy-dark">
              Uniform Showcase
            </h2>
            <p className="text-base text-steel-grey font-light">
              Explore the range of professional uniforms we create for businesses and institutions across different sectors.
            </p>
          </div>

          {/* Filtering Pills row */}
          <div className="flex justify-center gap-3 overflow-x-auto no-scrollbar max-w-full pb-3 mb-12">
            {(["Show All", "Corporate", "Healthcare", "Hospitality", "Education", "Industrial", "Security"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveGalleryFilter(filter)}
                className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider border transition-all ${
                  activeGalleryFilter === filter
                    ? "bg-navy-dark border-navy-dark text-white"
                    : "border-zinc-200 text-steel-grey hover:bg-ice-grey"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Grid of items (Filters elements based on selected category) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {gallery.filter((item) => activeGalleryFilter === 'Show All' || item.category === activeGalleryFilter).length === 0 ? (
              <div className="col-span-3 py-16 text-center text-steel-grey">
                <p className="text-sm font-medium">
                  {activeGalleryFilter === 'Show All' ? 'Gallery coming soon.' : `No ${activeGalleryFilter} items in the gallery yet.`}
                </p>
              </div>
            ) : (
            gallery
              .filter((item) => activeGalleryFilter === "Show All" || item.category === activeGalleryFilter)
              .map((item) => (
                <div key={item.id} className="flex flex-col gap-3 group">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br from-indigo-900/10 to-navy-dark/10 border border-zinc-200/50 hover:scale-[1.01] transition-transform duration-300 relative flex items-center justify-center">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-serif text-steel-grey/60 text-xs uppercase tracking-widest">{item.description || item.title}</span>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-steel-grey uppercase font-medium tracking-wider">{item.category} Uniforms</span>
                    <span className="font-semibold text-navy-dark text-sm">{item.title}</span>
                  </div>
                </div>
              ))
            )}

          </div>

          <div className="mt-16 flex justify-center">
            <a
              href="#contact-section"
              className="bg-navy-dark text-white px-6 py-3 rounded-lg text-sm font-semibold tracking-wider uppercase hover:bg-navy-dark/95 transition-all"
            >
              Request Similar Uniforms
            </a>
          </div>

        </div>
      </section>

      {/* 10. Client Success / Testimonials */}
      <section className="py-24 bg-ice-grey border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto flex flex-col gap-4 mb-16">
            <span className="text-xs font-semibold tracking-widest text-steel-grey uppercase font-medium font-sans">CLIENT SUCCESS</span>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-navy-dark">
              What Our Partners Say
            </h2>
            <p className="text-base text-steel-grey font-light">
              Hear from organizations that trust us for their uniform manufacturing requirements.
            </p>
          </div>

          {/* Success Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {testimonials.length === 0 ? (
              <div className="col-span-3 py-12 text-center text-steel-grey">
                <p className="text-sm font-medium">Client testimonials coming soon.</p>
              </div>
            ) : testimonials.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-zinc-200 p-8 flex flex-col justify-between shadow-sm">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="bg-teal-50 text-teal-800 text-xs font-semibold px-2 py-1 rounded">
                      {item.category === "Healthcare" ? "🏥" : item.category === "Corporate" ? "🏢" : "🏫"} {item.category}
                    </span>
                    <span className="text-amber-500 font-sans text-xs">{"★".repeat(item.rating)}</span>
                  </div>
                  <span className="text-navy-dark font-semibold text-xl leading-tight font-headings block">{item.name}</span>
                  <p className="text-sm text-zinc-700 leading-relaxed font-light">
                    &quot;{item.quote}&quot;
                  </p>
                </div>
                <div className="border-t border-zinc-100 pt-4 mt-6 text-left">
                  <span className="font-semibold text-sm text-navy-dark block">{item.company || item.name}</span>
                  <span className="text-xs text-steel-grey">{item.designation || item.region}</span>
                </div>
              </div>
            ))}

          </div>

        </div>
      </section>

      {/* 11. FAQ Accordion */}
      <section id="faq" className="py-24 bg-white border-b border-zinc-100 scroll-mt-20">
        <div className="max-w-3xl mx-auto px-6">
          
          <div className="text-center flex flex-col gap-4 mb-12">
            <span className="text-xs font-semibold tracking-widest text-steel-grey uppercase font-medium">COMMON QUESTIONS</span>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-navy-dark">
              Frequently Asked Questions
            </h2>
            <p className="text-base text-steel-grey font-light">
              Quick answers to help you understand our manufacturing capacity, timelines, and ordering process.
            </p>
          </div>

          {/* Accordion Stack */}
          <div className="flex flex-col mb-12">
            
            {(faqs.length > 0 ? faqs : [
              {
                question: "What is your Minimum Order Quantity (MOQ)?",
                answer: "Our Minimum Order Quantity (MOQ) depends on the product category and the level of customization required. Please contact our sales team to discuss your project requirements, and we will provide specific quantity guidance."
              },
              {
                question: "Can you replicate our existing uniform design?",
                answer: "Yes. We can replicate your current uniforms exactly. You can send us a physical sample, reference photographs, or a technical design drawing, and our tailoring team will match the cuts, colors, and branding details."
              },
              {
                question: "Do you provide sample uniforms before bulk production?",
                answer: "Yes. For bulk orders, we manufacture a physical uniform sample for your team to fit-test and review. We only begin mass production after receiving your formal approval sign-off on the sample."
              },
              {
                question: "Can we customize the uniforms with our corporate branding and logos?",
                answer: "Yes. We offer precision logo branding options including high-density computerized embroidery and quality screen printing matched to your corporate branding guidelines."
              },
              {
                question: "What fabric options do you offer?",
                answer: "We source a wide range of fabrics, including cotton, poly-cotton blends, polyester, and performance textiles. Our team recommends suitable fabric weights and compositions based on your industry, comfort requirements, and durability expectations."
              },
              {
                question: "What are your production and delivery timelines?",
                answer: "Typical production timelines depend on the order quantity, design customization, and fabric availability. We provide an estimated manufacturing and delivery schedule after reviewing your specific requirements."
              },
              {
                question: "Do you deliver across India?",
                answer: "Yes. We ship nationwide through established cargo and transport networks. Every bulk order is sorted by sizing, packed securely, and shipped with tracking information."
              },
              {
                question: "Can we place repeat orders easily?",
                answer: "Yes. We maintain detailed production records, fabric specifications, and embroidery digitizing files for all clients. This guarantees consistent colors, styling, and sizing for all future repeat orders."
              },
              {
                question: "How do you calculate pricing?",
                answer: "Every B2B quotation is calculated individually based on the uniform type, fabric selection, branding complexity, total order quantity, and delivery location."
              }
            ]).map((faq, idx) => {
              const isOpen = expandedFAQ === idx;
              return (
                <div key={faq.id || idx} className="border-b border-zinc-200 py-4 text-left">
                  <button
                    onClick={() => setExpandedFAQ(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between font-semibold text-navy-dark text-base py-2 focus:outline-none"
                  >
                    <span>{faq.question}</span>
                    <span className="text-xl text-steel-grey font-mono">{isOpen ? "−" : "+"}</span>
                  </button>
                  <div
                    className={`transition-all duration-300 overflow-hidden ${
                      isOpen ? "max-h-[300px] opacity-100 mt-2 pb-2" : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="text-sm text-zinc-700 leading-relaxed font-light">{faq.answer}</p>
                  </div>
                </div>
              );
            })}

          </div>

          {/* Transition Card */}
          <div className="bg-ice-grey border border-zinc-200 rounded-xl p-8 text-center flex flex-col items-center gap-4">
            <span className="font-semibold text-navy-dark text-lg">Still have questions?</span>
            <p className="text-sm text-steel-grey font-light max-w-md leading-relaxed">
              Our team can help you choose fabrics, discuss customization options, and recommend the best uniform program for your organization.
            </p>
            <a
              href="#contact-section"
              className="bg-navy-dark text-white px-6 py-3 rounded-lg text-sm font-semibold tracking-wider uppercase hover:bg-navy-dark/95 transition-all"
            >
              Request a Quote
            </a>
          </div>

        </div>
      </section>

      {/* 12. B2B Contact & Inquiry Form */}
      <section id="contact-section" className="py-24 bg-navy-dark text-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Pre-Form Trust Strip */}
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs font-semibold uppercase tracking-widest text-white/60 mb-16 border-b border-white/10 pb-8 text-center">
            <span>✓ Custom Fabric Sourcing</span>
            <span>•</span>
            <span>✓ Pan-India Shipping</span>
            <span>•</span>
            <span>✓ Bulk Manufacturing Scale</span>
            <span>•</span>
            <span>✓ Dedicated Customer Support</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Column (Address & Guarantee) */}
            <div className="lg:col-span-5 flex flex-col gap-6 text-left">
              <span className="text-xs font-semibold tracking-widest text-white/50 uppercase">START YOUR PROJECT</span>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white font-headings">
                Partner with Riya Silk
              </h2>
              
              <div className="bg-white/5 border border-white/10 rounded-lg p-5 flex items-center gap-4 max-w-md my-2">
                <span className="text-2xl">🕒</span>
                <p className="text-xs text-white/80 font-light leading-relaxed">
                  Our procurement team reviews and responds to all inquiries within 24 business hours.
                </p>
              </div>

              {/* Direct clickable contact channels */}
              <div className="flex flex-col gap-4 text-sm font-light text-white/80 mt-4">
                <div className="flex items-start gap-4">
                  <span className="text-lg">📍</span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-white">Manufacturing Facility</span>
                    <span className="text-white/90">
                      {settings?.contactAddress || "Riya Silk Factory, Maharashtra, India"}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-lg">✉️</span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-white">Email Address</span>
                    <a href={`mailto:${settings?.contactEmail || "info@riyasilk.com"}`} className="hover:text-white text-white/90 hover:underline">
                      {settings?.contactEmail || "info@riyasilk.com"}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-lg">📞</span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-white">Direct Business Phone</span>
                    <a href={`tel:${settings?.contactPhone || "+91 99999 99999"}`} className="hover:text-white text-white/90 hover:underline">
                      {settings?.contactPhone || "+91 99999 99999"}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <span className="text-lg">💬</span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-white">WhatsApp Procurement Chat</span>
                    <a
                      href={`https://wa.me/${(settings?.socialWhatsapp || settings?.contactPhone || "919999999999").replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white text-white/90 hover:underline"
                    >
                      {settings?.contactPhone || "+91 99999 99999"}
                    </a>
                  </div>
                </div>
              </div>

              {settings?.googleMapsEmbed && (
                <div className="w-full h-48 rounded-lg overflow-hidden border border-white/10 mt-6">
                  <iframe
                    src={settings.googleMapsEmbed}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                  ></iframe>
                </div>
              )}

              <div className="text-xs text-white/50 mt-4">
                <span>Office Hours: {settings?.officeHours || "Monday to Saturday, 9:00 AM - 6:00 PM IST"}</span>
              </div>
            </div>

            {/* Right Column (The B2B Inquiry Form Card) */}
            <div className="lg:col-span-7 bg-white text-zinc-900 rounded-xl p-8 border border-zinc-200 shadow-2xl">
              
              {formSubmitted ? (
                <div className="py-12 text-center flex flex-col items-center gap-4">
                  <span className="h-12 w-12 flex items-center justify-center rounded-full bg-green-50 text-green-600 text-2xl font-bold font-sans">✓</span>
                  <h3 className="font-semibold text-navy-dark text-xl font-headings">Inquiry Submitted Successfully</h3>
                  <p className="text-sm text-steel-grey font-light max-w-sm leading-relaxed">
                    Thank you for contacting Riya Silk. Our team has received your inquiry and will review your requirements. We&apos;ll contact you shortly using the details you provided.
                  </p>
                  <button
                    onClick={() => setFormSubmitted(false)}
                    className="mt-4 border border-zinc-300 px-6 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-ice-grey"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-left">
                  
                  {/* Honeypot field for bot spam prevention */}
                  <input
                    type="text"
                    name="honeypot"
                    value={formData.honeypot}
                    onChange={handleInputChange}
                    style={{ display: "none" }}
                    tabIndex={-1}
                    autoComplete="off"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-navy-dark">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        autoComplete="name"
                        placeholder="Enter your full name"
                        className="border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-navy-dark"
                      />
                    </div>
                    {/* Business Email */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-navy-dark">Business Email *</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        autoComplete="email"
                        autoCorrect="off"
                        autoCapitalize="none"
                        placeholder="name@company.com"
                        className="border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-navy-dark"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Phone */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-navy-dark">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        autoComplete="tel"
                        inputMode="numeric"
                        placeholder="Enter your contact number"
                        className="border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-navy-dark"
                      />
                    </div>
                    {/* Company */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-navy-dark">Company Name *</label>
                      <input
                        type="text"
                        name="company"
                        required
                        value={formData.company}
                        onChange={handleInputChange}
                        autoComplete="organization"
                        placeholder="Enter your company name"
                        className="border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-navy-dark"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Industry */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-navy-dark">Industry Type</label>
                      <select
                        name="industry"
                        value={formData.industry}
                        onChange={handleInputChange}
                        className="border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-navy-dark bg-white"
                      >
                        <option value="">Select your industry (optional)...</option>
                        <option value="Healthcare">Healthcare & Medical</option>
                        <option value="Schools">Schools & Education</option>
                        <option value="Corporate">Corporate & Finance</option>
                        <option value="Hospitality">Hotels & Hospitality</option>
                        <option value="Industrial">Industrial & Safety</option>
                        <option value="Security">Security Services</option>
                        <option value="Other">Other Custom Sector</option>
                      </select>
                    </div>
                    {/* Quantity */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-navy-dark">Estimated Quantity</label>
                      <select
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        className="border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-navy-dark bg-white"
                      >
                        <option value="">Select quantity (optional)...</option>
                        <option value="50-100">50 – 100 units</option>
                        <option value="101-500">101 – 500 units</option>
                        <option value="501-1000">501 – 1,000 units</option>
                        <option value="1000+">1,000+ units</option>
                      </select>
                    </div>
                  </div>

                  {/* Company Website & Preferred contact method */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-navy-dark">Company Website</label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="https://company.com (optional)"
                        className="border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-navy-dark"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-navy-dark">Preferred Contact Method</label>
                      <select
                        name="preferredContact"
                        value={formData.preferredContact}
                        onChange={handleInputChange}
                        className="border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-navy-dark bg-white"
                      >
                        <option value="">Select contact method (optional)...</option>
                        <option value="WhatsApp">WhatsApp Message</option>
                        <option value="Phone">Direct Phone Call</option>
                        <option value="Email">Email Thread</option>
                      </select>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-navy-dark">Project Details</label>
                    <textarea
                      name="details"
                      rows={3}
                      value={formData.details}
                      onChange={handleInputChange}
                      placeholder="Describe your uniform styling, color, or fabric preferences (optional)..."
                      className="border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-navy-dark resize-none"
                    ></textarea>
                  </div>

                  {/* Form Submission Buttons & Privacy Disclaimer */}
                  <div className="flex flex-col sm:flex-row gap-4 items-center pt-2">
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="w-full sm:w-auto bg-navy-dark text-white px-8 py-4 rounded-lg font-semibold tracking-wider uppercase text-sm hover:bg-navy-dark/95 hover:scale-[1.01] transition-all disabled:opacity-50 text-center"
                    >
                      {formLoading ? "Submitting Inquiry..." : "Submit Inquiry"}
                    </button>
                    
                    <a
                      href={`https://wa.me/${(settings?.socialWhatsapp || settings?.contactPhone || "919999999999").replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto border border-green-600 text-green-700 bg-green-50 px-6 py-4 rounded-lg font-semibold tracking-wider uppercase text-xs hover:bg-green-100 transition-all text-center flex items-center justify-center gap-2"
                    >
                      WhatsApp Procurement
                    </a>
                  </div>

                  {formError && <p className="text-xs text-red-600 font-semibold">{formError}</p>}

                  <p className="text-[10px] text-steel-grey font-light leading-relaxed text-center sm:text-left mt-2">
                    * Your information is used only to respond to your inquiry. We do not share your details with third parties.
                  </p>

                </form>
              )}

            </div>

          </div>

        </div>
      </section>

      {/* 12. Global Footer */}
      <footer className="bg-[#060D1A] text-white pt-20 pb-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16 border-b border-white/5 text-left">
            
            {/* Column 1: Profile (Lg 4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <a href="#" className="flex items-center gap-3">
                <span className="h-9 w-9 flex items-center justify-center rounded-lg bg-white text-navy-dark font-serif text-lg font-bold">
                  RS
                </span>
                <span className="font-semibold text-lg tracking-tight">Riya Silk</span>
              </a>
              <p className="text-xs text-zinc-400 leading-relaxed font-light">
                Riya Silk manufactures high-quality uniforms for healthcare, education, hospitality, corporate, industrial, and institutional clients across India, combining quality craftsmanship with reliable service.
              </p>
              <div className="flex flex-col gap-1 text-[10px] text-zinc-500 uppercase tracking-wider pt-2">
                <span>✓ Custom Manufacturing</span>
                <span>✓ Bulk Orders</span>
                <span>✓ Nationwide Delivery</span>
              </div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest pt-2 font-medium">
                {settings?.msmeNumber ? `MSME: ${settings.msmeNumber}` : "MSME Registered"} 
                {settings?.gstNumber ? ` • GSTIN: ${settings.gstNumber}` : " • GST Compliant Partner"}
              </div>
            </div>

            {/* Column 2: Explore links (Lg 2 cols) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <h4 className="font-semibold text-xs uppercase tracking-widest text-white/50">EXPLORE</h4>
              <nav className="flex flex-col gap-3 text-xs text-zinc-400">
                <a href="#about" className="hover:text-white transition-colors">About Us</a>
                <a href="#products" className="hover:text-white transition-colors">Categories</a>
                <a href="#process" className="hover:text-white transition-colors">Workflow</a>
                <a href="#quality" className="hover:text-white transition-colors">Quality Standards</a>
                <a href="#showcase" className="hover:text-white transition-colors">Showcase</a>
                <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
              </nav>
            </div>

            {/* Column 3: Industries We Serve (Lg 3 cols) */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              <h4 className="font-semibold text-xs uppercase tracking-widest text-white/50">INDUSTRIES</h4>
              <nav className="flex flex-col gap-3 text-xs text-zinc-400">
                <a href="#industries" onClick={() => selectIndustryAndScroll("Healthcare")} className="hover:text-white transition-colors">Healthcare & Medical</a>
                <a href="#industries" onClick={() => selectIndustryAndScroll("Schools")} className="hover:text-white transition-colors">Schools & Academies</a>
                <a href="#industries" onClick={() => selectIndustryAndScroll("Corporate")} className="hover:text-white transition-colors">Corporate & Finance</a>
                <a href="#industries" onClick={() => selectIndustryAndScroll("Hospitality")} className="hover:text-white transition-colors">Hotels & Hospitality</a>
                <a href="#industries" onClick={() => selectIndustryAndScroll("Industrial")} className="hover:text-white transition-colors">Industrial & Safety</a>
                <a href="#industries" onClick={() => selectIndustryAndScroll("Security")} className="hover:text-white transition-colors">Security Services</a>
              </nav>
            </div>

            {/* Column 4: Contact & Resources (Lg 3 cols) */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              <h4 className="font-semibold text-xs uppercase tracking-widest text-white/50">GET IN TOUCH</h4>
              <div className="flex flex-col gap-3 text-xs text-zinc-400">
                <span>Phone: <a href={`tel:${settings?.contactPhone || "+91 99999 99999"}`} className="text-white hover:underline">{settings?.contactPhone || "+91 99999 99999"}</a></span>
                <span>Email: <a href={`mailto:${settings?.contactEmail || "info@riyasilk.com"}`} className="text-white hover:underline">{settings?.contactEmail || "info@riyasilk.com"}</a></span>
                <span>Hours: {settings?.officeHours || "Mon - Sat, 9:00 AM - 6:00 PM"}</span>
              </div>
              <div className="pt-2 flex flex-col gap-3 border-t border-white/5">
                <span className="font-semibold text-[10px] uppercase tracking-widest text-white/40">RESOURCES</span>
                <nav className="flex flex-col gap-2 text-[10px] text-zinc-400 uppercase tracking-wider text-left">
                  <button
                    onClick={() => setDownloadModalOpen(true)}
                    className="hover:text-white transition-colors text-left bg-transparent border-none p-0 cursor-pointer uppercase text-[10px] text-zinc-400"
                  >
                    Catalog PDF
                  </button>
                  <a href="#quality" className="hover:text-white transition-colors">Fabric Guide</a>
                  <a href="#faq" className="hover:text-white transition-colors">Size Charts</a>
                </nav>
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
            <span>© 2026–Present Riya Silk. All Rights Reserved.</span>
            <div className="flex items-center gap-6">
              <a href="#faq" className="hover:text-zinc-300 transition-colors">Privacy Policy</a>
              <a href="#faq" className="hover:text-zinc-300 transition-colors">Terms & Conditions</a>
              <a href="#" className="hover:text-zinc-300 transition-colors">Sitemap</a>
            </div>
          </div>

        </div>
      </footer>

      {/* 13. Dynamic Viewport Sticky CTA Footer (Visible on Mobile viewports only) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-40 bg-white border-t border-zinc-200 py-3 px-6 flex items-center justify-between gap-4 shadow-lg animate-in slide-in-from-bottom duration-300">
        <a
          href={isBusinessHours ? `tel:${settings?.contactPhone || "+91 99999 99999"}` : `https://wa.me/${(settings?.socialWhatsapp || settings?.contactPhone || "919999999999").replace(/[^0-9]/g, "")}`}
          className="flex-1 border border-zinc-300 text-center py-3 rounded-lg text-xs font-semibold uppercase tracking-wider text-navy-dark hover:bg-ice-grey"
        >
          {isBusinessHours ? "📞 Call Us" : "💬 WhatsApp"}
        </a>
        <a
          href="#contact-section"
          className="flex-1 bg-navy-dark text-white text-center py-3 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-navy-dark/95"
        >
          ✉️ Inquire
        </a>
      </div>

      {/* Catalogue Download Modal Overlay */}
      {downloadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 p-8 max-w-md w-full text-left relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setDownloadModalOpen(false);
                setDownloadSuccess(false);
                setDownloadForm({ name: '', company: '', email: '' });
                setDownloadError('');
              }}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 focus:outline-none"
              aria-label="Close modal"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {downloadSuccess ? (
              <div className="py-6 text-center flex flex-col items-center gap-4">
                <span className="h-12 w-12 flex items-center justify-center rounded-full bg-green-50 text-green-600 text-2xl font-bold font-sans">✓</span>
                <h3 className="font-semibold text-navy-dark text-xl font-headings">Catalog Requested</h3>
                <p className="text-sm text-steel-grey font-light leading-relaxed">
                  Thank you! Your download has started automatically, and we have emailed a copy of the catalog link to <strong>{downloadForm.email}</strong>.
                </p>
                <button
                  onClick={() => {
                    setDownloadModalOpen(false);
                    setDownloadSuccess(false);
                  }}
                  className="mt-4 bg-navy-dark text-white px-6 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-navy-dark/95"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-semibold text-navy-dark font-headings mb-2">Request Product Catalogue</h3>
                <p className="text-sm text-steel-grey font-light mb-6 leading-relaxed">
                  Enter your business details below to get instant access to our comprehensive uniform catalogue and guides.
                </p>
                <form onSubmit={handleDownloadSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-navy-dark">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your name"
                      className="border border-zinc-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-navy-dark"
                      value={downloadForm.name}
                      onChange={(e) => setDownloadForm({ ...downloadForm, name: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-navy-dark">Company Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter your company name"
                      className="border border-zinc-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-navy-dark"
                      value={downloadForm.company}
                      onChange={(e) => setDownloadForm({ ...downloadForm, company: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-navy-dark">Business Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      className="border border-zinc-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-navy-dark"
                      value={downloadForm.email}
                      onChange={(e) => setDownloadForm({ ...downloadForm, email: e.target.value })}
                    />
                  </div>

                  {downloadError && <p className="text-xs text-red-600 font-semibold">{downloadError}</p>}

                  <button
                    type="submit"
                    disabled={downloadLoading}
                    className="mt-2 bg-navy-dark text-white w-full py-3.5 rounded-lg font-semibold tracking-wider uppercase text-xs hover:bg-navy-dark/95 transition-all disabled:opacity-50"
                  >
                    {downloadLoading ? "Processing request..." : "Download & Email Catalogue"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
