# MangaZ - Project Overview

MangaZ is a modern manga reading platform built with React, Vite, and Supabase. It features a sleek, dark-themed UI and a comprehensive set of features for both readers and administrators.

## Core Features

- **Manga Discovery**: Browse latest releases, hot series, and search through a rich library of manga.
- **Chapter Reader**: A fast and responsive reading experience with automatic chapter navigation and scroll-to-top functionality.
- **User Accounts**: Authentication powered by Supabase, allowing users to maintain a library and track their reading progress.
- **Coin System**: Users can earn or purchase coins to unlock premium content. Integration with Stripe for secure payments.
- **Admin Panel**: A powerful dashboard for managing manga titles, uploading chapters, and configuring site-wide settings.
- **Discord Integration**: Automated notifications for new chapter releases via Discord webhooks.

## Technical Stack

- **Frontend**: React (18+), Vite, Tailwind CSS, shadcn/ui.
- **State Management**: TanStack Query (React Query) for data fetching and caching.
- **Routing**: React Router DOM (v6).
- **Icons & UI**: Lucide React, Radix UI primitives.
- **Backend/Database**: Supabase (PostgreSQL, Auth, Edge Functions).

## Project Structure

- `src/components`: Reusable UI components including breadcrumbs, buttons, modals, and the Navbar/Footer.
- `src/pages`: Main application pages (Index, MangaInfo, ChapterReader, AdminPanel, etc.).
- `src/hooks`: Custom React hooks for site settings, auth, and data fetching.
- `src/contexts`: Context providers for Auth and Theme management.
- `src/integrations/supabase`: Supabase client configuration and generated database types.
- `supabase/functions`: Edge functions for server-side logic (Stripe, Discord notifications).

## Local Development Highlights

- **Fast Refresh**: Powered by Vite and SWC for an instant development experience.
- **Type Safety**: Built with TypeScript for robust development.
- **Scalable UI**: Using Tailwind CSS and shadcn/ui for consistent and responsive design.
