# MangaZ V1 - Modern Manga Platform 📚

MangaZ is a high-performance, dark-mode-first manga reading platform. It is built as a Single Page Application (SPA) with **React**, **Vite**, and **Tailwind CSS**, and uses **Supabase** as its robust backend infrastructure.

This "V1" release marks a departure from its original prototype. It has been cleaned of all external meta-tag references and is now optimized for scale, clean deployments, and custom hosting.

---

## ⚡ Core Features

### 📖 For Readers:
- **Fast Discovery**: A landing page designed for engagement, featuring trending, latest, and categorized manga.
- **Optimized Reader**: A distraction-free experience with seamless chapter transitions, scroll-to-top, and mobile responsiveness.
- **Personal Library**: User dashboards to track progress and saved titles (powered by Supabase Auth).
- **Premium Content**: Integrated "Coin" and "Gem" system for unlocking early-access content.

### 🛠️ For Administrators:
- **Comprehensive Dashboard**: Full control over your library from title creation to chapter uploads.
- **Multiple Storage Providers**: Support for **Supabase Storage**, **Imgur CDN**, and **Google Cloud/Blogger CDN** for unlimited free image hosting.
- **Discord Integration**: Automatic publication of new releases to your community's Discord channels.
- **Monetization**: Ready-to-use coin packages and payment processing.

---

## 🏗️ Technical Stack

- **Frontend**: 
  - **Framework**: [React 18+](https://reactjs.org/) with [Vite](https://vitejs.dev/)
  - **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
  - **State**: [TanStack Query v5](https://tanstack.com/query/latest) (React Query)
- **Backend / Database**:
  - **Platform**: [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage)
  - **Logic**: [Edge Functions](https://supabase.com/docs/guides/functions) (Deno based)
- **Deployment**:
  - **Frontend**: Optimized for [Cloudflare Pages](https://pages.cloudflare.com/) (SPA redirect rules included)
  - **Backend**: Supabase Edge Functions for global low-latency responses.

---

## 🚀 Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)

### 🛠️ Local Development

1. **Clone the project**:
   ```bash
   git clone https://github.com/akuzenaiarts-cloud/MangaZ.git
   cd MangaZ
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
   ```

4. **Launch Dev Server**:
   ```bash
   npm run dev
   ```

---

## 🌐 Deployment to Cloudflare Pages

MangaZ is pre-configured for Cloudflare Pages:

1. **Build Command**: `npm run build`
2. **Output Directory**: `dist`
3. **Environment**: Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in the Cloudflare Dashboard.
4. **SPA Support**: The project includes a `public/_redirects` file that automatically handles client-side routing on Cloudflare.

---

## 🎓 Support & Project History

This version was moved from a prototype stage to a fully production-ready "V1" by removing all legacy development metadata and optimizing for standalone repository ownership.

**Repository ownership**: [akuzenaiarts-cloud/MangaZ](https://github.com/akuzenaiarts-cloud/MangaZ)
