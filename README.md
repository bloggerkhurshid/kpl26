# KPL - Khoraghat Premier League (Season 03)

Welcome to the official repository for the **Khoraghat Premier League**. 
This is a modern, full-stack Next.js web application built to manage player registrations, team auctions, and dynamic highlights for the KPL tournament.

## 🚀 Features

- **Public Facing Website**: A stunning Dark/Gold IPL-themed landing page.
- **Player Registration**: Complete registration flow for local and foreign players with dynamic base pricing.
- **Payments Integration**: Integrated with both Razorpay and Cashfree payment gateways.
- **Dynamic Highlights**: Fully dynamic photo gallery that pulls directly from the database.
- **Premium Admin Panel**: 
  - Manage incoming player registrations (Approve, Disable).
  - Built-in Live Auction system (Base price, Sold price, Live bidding view).
  - Dynamic Gateway Settings (Switch between Razorpay/Cashfree and update API keys).
  - Upload Photos directly to the Highlights gallery using Base64.
  - Complete Dark/Gold aesthetic matching the public site.

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, SSR)
- **Styling**: Vanilla CSS (`globals.css` & `admin.css`)
- **Database / Auth**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Icons**: Lucide React
- **Payments**: Razorpay Node & Cashfree JS

## 📦 Getting Started Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/bloggerkhurshid/kpl26.git
   cd kpl26
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory and add your Supabase credentials, Admin password, and default gateway keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ADMIN_PASSWORD=your_secure_admin_password
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the site.

## 🚀 Deployment (Netlify)

This is a **Server-Side Rendered (SSR)** Next.js application, which means you cannot deploy it via manual drag-and-drop.

1. Connect this GitHub repository to your Netlify account.
2. Netlify will automatically detect the Next.js framework.
3. Add your Environment Variables in the Netlify Dashboard (Site Settings > Environment Variables).
4. Deploy!

---

*Designed & Developed for the Khoraghat Premier League.*
