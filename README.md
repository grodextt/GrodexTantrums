# MangaZ V1 - Professional Manga & Scanlation Platform 📚

MangaZ is a next-generation, high-performance manga reading and scanlation management platform. Designed with a "Premium-First" philosophy, it combines a sleek, distraction-free reader with a robust monetization engine and an enterprise-grade admin dashboard.

![MangaZ Platform Banner](file:///C:/Users/Dreqi/.gemini/antigravity/brain/f6e40157-3048-460f-a058-2736199c9448/subscribe_page_demo_1775504126638.webp)

---

## 🌟 Vision & Design
MangaZ isn't just a reader; it's an ecosystem for scanlation groups and content creators. Built with **React**, **Vite**, and **Tailwind CSS**, it leverages **Supabase** for a serverless yet powerful backend, ensuring lightning-fast performance across any device.

- **Mobile Optimized**: A fluid, responsive UI designed for reading on the go.
- **Micro-Animations**: Subtle hover effects and transitions built with Framer Motion and Lucide icons.
- **Dark Mode Native**: A curated "High-Contrast Dark" theme that prioritizes reader comfort.

---

## 🚀 Key Features

### 📖 Immersive Reading Experience
- **Advanced Reader Settings**: Toggle between Long Strip, Single Page, and Double Page modes. Includes greyscale mode, dimming controls, and custom strip margins.
- **Reading Progress**: Automatically tracks your last read chapter and page.
- **Smart Early Access**: Dynamic badges that automatically transition from "Early Access" to "Free" based on adjustable release timers.
- **Library Management**: One-click bookmarking with a dedicated user dashboard to track your collection.

### 💰 Monetization & Economy System
- **Cryptomus Integration**: Fully integrated white-labeled crypto payment gateway. Accept **USDT (BEP-20/BSC)** and other cryptocurrencies with zero-redirect checkout.
- **Tiered Subscriptions**: Customizable subscription plans (e.g., Weekly, Monthly, Yearly) with custom names, prices, and benefit descriptions.
- **Coin System**: A virtual currency system for unlocking individual premium chapters. Support for custom currency names and icons.
- **In-Site Checkout**: Professional payment modals with dynamically generated QR codes and real-time transaction polling.

### 🛡️ Enterprise-Grade Admin Panel
- **Manga Management**: Effortless title creation, chapter uploads, and metadata editing.
- **Multi-Cloud Storage**: Integrated support for **Google Cloud (Blogger)**, **Imgur**, and **Supabase Storage** for unlimited horizontal scaling.
- **User Economy Controls**: Manually grant subscriptions, adjust balances, and manage user roles (Admin, Moderator, Subscriber).
- **Discord Webhooks**: Automatically notify your community when new chapters are published.
- **System Logs**: Comprehensive logging for transactions and user activities via Supabase.

---

## 📸 Platform Showcases

### 💳 Seamless Payments
The platform features a native, white-labeled checkout experience. No more redirecting users to confusing third-party sites—everything stays within MangaZ.

![Cryptomus Checkout Modal](file:///C:/Users/Dreqi/.gemini/antigravity/brain/f6e40157-3048-460f-a058-2736199c9448/media__1775597218430.png)

### 💎 Premium Membership
Offering tiers of access to your readers has never been easier. The subscription system is fully synced with the UI, including custom badges in comments and the navbar.

![Subscription Page](file:///C:/Users/Dreqi/.gemini/antigravity/brain/f6e40157-3048-460f-a058-2736199c9448/subscribe_page_bottom_1775504175116.png)

---

## 🏗️ Technical Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Backend** | Supabase (Auth, DB, Storage) |
| **Logic** | Deno-based Edge Functions |
| **Payments** | Cryptomus API |
| **Deployment** | Cloudflare Pages (Frontend) |

---

## 🔧 Installation & Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Supabase Account**: For database and backend logic.
- **Cryptomus Account**: For payment processing.

### 2. Local Setup
```bash
# Clone the repository
git clone https://github.com/akuzenaiarts-cloud/MangaZ.git
cd MangaZ

# Install dependencies
npm install

# Setup environment variables (.env)
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key

# Run development server
npm run dev
```

### 3. Edge Functions Deployment
To enable payments and background tasks, deploy the edge functions:
```bash
supabase functions deploy create-subscription-order
supabase functions deploy subscription-webhook
supabase functions deploy cryptomus-purchase
supabase functions deploy cryptomus-webhook
```

---

## 🛠️ Optimization & Production
MangaZ is pre-configured for **Cloudflare Pages**. It includes a specialized `_redirects` file to handle SPA routing and is optimized for low-latency delivery.

- **Build Command**: `npm run build`
- **Output Directory**: `dist`

---

## 📜 Updates & Changelog

### Version 1.1 (Current)
- **NEW**: Migrated from NOWPayments to Cryptomus for superior crypto integration.
- **NEW**: In-site Checkout Modal with QR Code generation.
- **NEW**: Admin Manual Subscription Granting through User Management.
- **FIX**: Dynamic Early Access badge logic for automatic chapter release.
- **IMPROVEMENT**: Synced subscriber and moderator badges in the comments section.

---

## ⚖️ License
This project is licensed under the MIT License. Portions of the UI are powered by [shadcn/ui](https://ui.shadcn.com/).

**Repository ownership**: [akuzenaiarts-cloud/MangaZ](https://github.com/akuzenaiarts-cloud/MangaZ)
