# 🌌 Grodex Tantrums

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-green.svg)](https://supabase.com)
[![Next.js](https://img.shields.io/badge/Frontend-Vite-blue.svg)](https://vitejs.dev)

**Grodex Tantrums** is a premium, high-performance Manga/Manhwa/Manhua reading platform built for speed, security, and an unparalleled user experience. Featuring a sleek glassmorphic design and a robust administrative suite.

---

## ✨ Key Features

### 📖 For Readers
- **Ultimate Reading Experience**: Modern, lightning-fast chapter reader with vertical/horizontal scroll modes and customizable zoom.
- **Premium Content Gating**: Support for Coin and Token-based chapter unlocks.
- **Advanced Subscription System**: Flexible plans (Free, Pro, Premium) with automatic perk distribution.
- **User Engagement**: Comments, likes, bookmarks, and detailed reading history.
- **IP Protection**: Built-in DDoS resilience and IP-based rate limiting.
- **Daily Rewards**: Secure daily check-in system with coin/token awards.

### 🛠 For Administrators
- **Comprehensive Dashboard**: Real-time stats for site views, revenue, and storage usage.
- **Centralized Content Management**: 
  - One-click Manga and Chapter creation.
  - Support for multiple storage providers (Supabase, ImgBB, Cloudflare R2, Google Blogger CDN).
  - Bulk image uploading and automatic optimization.
- **Advanced Discord Integration**: Automated notifications for new releases with customizable templates and role pings.
- **Security Control**: IP blocking, role management, and granular permission controls.
- **Site Branding**: Dynamic theme customization directly from the admin panel.

---

## 🏗 Technology Stack

- **Frontend**: Vite + React + TypeScript
- **Styling**: Tailwind CSS + Shadcn UI + Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Image Hosting**: Hybrid solution supporting Blogger API, ImgBB, and R2.
- **Payments**: Integrated support for USDT, PayPal, Razorpay, and Stripe.

---

## 🛡 Security & Resilience

- **RLS (Row Level Security)**: Granular access control at the database level.
- **Hardened Edge Functions**: Serverless logic with JWT verification and admin-only execution policies.
- **Global CDN**: Low-latency image delivery via Google and Cloudflare edge networks.
- **Automated Gating**: Chapters automatically transition from Premium to Free based on administrative timing rules.

---

## 🎨 Branding & Design

Grodex Tantrums utilizes a **Deep Space Dark Mode** aesthetic:
- **Primary Color**: `#9b87f5` (Vibrant Indigo)
- **Background**: `#0a0a0a` with subtle glassmorphic overlays.
- **Typography**: Inter / Outfit for a modern, readable interface.

---

*Built with ❤️ by the Grodex Team.*
