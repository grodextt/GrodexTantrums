# MangaZ

MangaZ is a premium manga reading platform built with React, Vite, and Supabase.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

### Installation

1.  **Clone the repository**:
    ```sh
    git clone <your-repository-url>
    cd MangaZ
    ```

2.  **Install dependencies**:
    ```sh
    npm install
    # or
    bun install
    ```

3.  **Environment Variables**:
    Create a `.env` file in the root directory (or use the existing one) and provide your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your-supabase-url
    VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
    ```

4.  **Start the development server**:
    ```sh
    npm run dev
    ```

The application will be available at `http://localhost:8080`.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **State Management**: TanStack Query
- **Routing**: React Router

## 📂 Project Structure

For a detailed overview of the project structure and features, please refer to [MangaZ-Info.md](./MangaZ-Info.md).

## 🔨 Scripts

- `npm run dev`: Start development server.
- `npm run build`: Build for production.
- `npm run lint`: Run ESLint.
- `npm run preview`: Preview production build.
- `npm run test`: Run Vitest tests.

## 📄 License

This project is for demonstration purposes. Refer to the UI for DMCA and terms of service.
