<div align="center">
  <img src="https://via.placeholder.com/150/000000/FFD700?text=KPL" alt="KPL Logo" width="120" />
  <h1>Khoraghat Premier League (KPL) - Season 03</h1>
  <p><strong>Enterprise-Grade Cricket Tournament Management System</strong></p>

  [![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)](https://supabase.com/)
  [![License](https://img.shields.io/badge/License-Proprietary-blue.svg)](#)
  [![Status](https://img.shields.io/badge/Status-Production_Ready-success)](#)
</div>

---

## 📖 Overview

The **Khoraghat Premier League (KPL)** platform is a modern, highly scalable full-stack web application designed to manage the end-to-end lifecycle of a premier cricket tournament. Built with an enterprise mindset, the system handles dynamic player registrations, integrated payment workflows, real-time live auctioning, and media-rich highlights.

Sporting a premium Dark & Gold aesthetic, the platform delivers an engaging user experience for both the public and administrators.

---

## ✨ Enterprise Features

### 🏏 Public Facing Portal
- **Immersive UI/UX:** A stunning, fully responsive Dark/Gold IPL-themed interface.
- **Dynamic Registration Engine:** Seamless onboarding for both local and international players with dynamic base pricing calculation.
- **Media Gallery:** Fully dynamic, database-driven photo and video highlights.
- **Downloadable Assets:** Automated generation of customized, printable Registration Slips complete with QR/Barcode integration.

### 🛡️ Secure Admin Control Center
- **Player Management Pipeline:** Review, approve, reject, or disable incoming player registrations with real-time state management.
- **Live Auction System:** A robust built-in auction engine to track base prices, manage live bidding wars, and assign sold prices instantly.
- **FinOps & Payment Management:** Dynamic gateway routing allowing administrators to seamlessly switch between **Razorpay** and **Cashfree** on the fly. Update API keys directly from the dashboard without redeployments.
- **Media Management:** Direct Base64 image uploading and processing for the Highlights gallery.
- **Role-Based Access Control (RBAC):** Secure, authenticated admin routes protecting sensitive tournament data.

---

## 🏗️ Architecture & Technology Stack

The application leverages a modern Serverless architecture optimized for high performance, SEO, and edge-level caching.

### Frontend
- **Framework:** [Next.js 14](https://nextjs.org/) (App Router, Server-Side Rendering)
- **Language:** TypeScript / JavaScript
- **Styling:** Vanilla CSS (`globals.css` & `admin.css`) with modular design patterns.
- **Components & Icons:** Custom UI elements, [Lucide React](https://lucide.dev/) for standardized iconography.
- **Image Processing:** HTML2Canvas for dynamic registration slip generation.

### Backend & Infrastructure
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL) - Highly relational data modeling for players, payments, and system configurations.
- **Authentication:** Supabase Auth & custom JWT-based admin routing.
- **Payment Gateways:** 
  - [Razorpay Node SDK](https://razorpay.com/)
  - [Cashfree JS Integration](https://www.cashfree.com/)

---

## 🚀 Getting Started

Follow these instructions to set up the project locally for development and testing.

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v18.17 or higher)
- [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
- A [Supabase](https://supabase.com/) account and project
- Sandbox accounts for Razorpay and/or Cashfree

### 1. Repository Setup
```bash
git clone https://github.com/bloggerkhurshid/kpl26.git
cd kpl26
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory. This file contains critical secrets and should **never** be committed to version control.

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Admin Authentication
ADMIN_PASSWORD=your_secure_admin_password

# Default Payment Gateways (Can be overridden in Admin UI)
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret
```

### 3. Start Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000` to view the public application, and `/admin` for the control center.

---

## 🚢 Deployment Strategy

This application relies on **Server-Side Rendering (SSR)** and dynamic API routes. It cannot be deployed as a static HTML export.

**Recommended Platform:** [Netlify](https://www.netlify.com/) or [Vercel](https://vercel.com/)

1. Link your GitHub repository to your CI/CD provider (Vercel/Netlify).
2. The platform will automatically detect the Next.js build profile (`npm run build`).
3. Securely inject all Environment Variables into the deployment dashboard.
4. Trigger the deployment. The platform will provision serverless functions for all Next.js API routes automatically.

---

## 🔒 Security & Compliance
- **Data Protection:** All passwords and sensitive API keys are stored securely using environment variables and are never exposed to the client.
- **CORS & CSRF:** Handled natively via Next.js middleware and API route protections.
- **Gateway Isolation:** Financial transactions are processed via secure server-to-server calls ensuring compliance with Payment Card Industry (PCI) standards.

---

<div align="center">
  <p><em>Designed, Engineered, and Maintained for the Khoraghat Premier League.</em></p>
</div>
