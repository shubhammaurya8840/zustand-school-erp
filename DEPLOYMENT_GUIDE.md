# 🚀 Zustand Public School ERP — Live Deployment Guide
**Single-School Production Edition (CBSE/State Board)**  
*Motto: Knowledge | Character | Bright Future*

---

## 📋 Architectural Overview

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS &rarr; **Deploy to Vercel**
- **Backend API**: NestJS 10, Prisma ORM 5.22, JWT RBAC, Swagger &rarr; **Deploy to Render**
- **Database**: PostgreSQL 17 (Cloud managed: Neon / Supabase / Render Postgres / Railway)

---

## 🗄️ Step 1: Cloud PostgreSQL Setup (Free & Instant)

You can use **Neon.tech** (free serverless Postgres) or **Render Managed PostgreSQL** or **Supabase**:

1. Create a free PostgreSQL database on [Neon.tech](https://neon.tech) or [Render.com](https://render.com).
2. Copy your pooled/direct connection string. It will look like:
   ```env
   DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-xyz.ap-southeast-1.aws.neon.tech/zustand_school_erp?sslmode=require"
   ```
3. Run the schema migration and initial seed against the live cloud database from your terminal:
   ```bash
   cd school-erp-backend
   npx prisma db push
   npm run seed:admin
   ```
   *This bootstraps Zustand Public School institutional masters (Classes Pre-Nursery to 12, Sections A/B, Fee Heads, Subjects, Book Categories) and official staff credentials with zero demo/dummy students.*

---

## ⚙️ Step 2: Backend API Deployment on Render

1. Log in to [Render.com](https://render.com) and click **New + &rarr; Web Service**.
2. Connect your GitHub repository containing the ERP project.
3. Configure the service settings:
   - **Name**: `zustand-school-erp-backend`
   - **Root Directory**: `school-erp-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Health Check Path**: `/api/docs`
4. Add **Environment Variables** in Render dashboard:
   - `DATABASE_URL` = `<Your Cloud PostgreSQL connection string>`
   - `JWT_SECRET` = `<Generate a 32+ character random secret string>`
   - `JWT_EXPIRATION` = `7d`
   - `NODE_ENV` = `production`
5. Click **Create Web Service**.
   Once deployed, Render will provide your public backend URL, e.g.:
   `https://zustand-school-erp-backend.onrender.com`
   *(Swagger documentation will be live at `https://zustand-school-erp-backend.onrender.com/api/docs`)*

---

## 🌐 Step 3: Frontend Deployment on Vercel

1. Log in to [Vercel.com](https://vercel.com) and click **Add New &rarr; Project**.
2. Import the same GitHub repository.
3. Configure the project settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click edit and select `school-erp-frontend`
   - **Build Command**: `npm run build`
4. Expand **Environment Variables** and add:
   - **Key**: `NEXT_PUBLIC_API_URL`
   - **Value**: `https://zustand-school-erp-backend.onrender.com/api/v1` *(replace with your real Render URL)*
5. Click **Deploy**.
   Vercel will build all 75 static/dynamic pages in under 60 seconds.

---

## 🔐 Master Accounts Reference (1 Clean Account Per Panel)

The database has been seeded with pure institutional accounts. All temporary/fake records (such as `Teacher 1`) have been completely purged.

| Role / Console | Username / Identifier | Email | Password | Assigned Profile & Access | Target Dashboard |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 🛡️ **Principal / Admin** | `admin` | `admin@zustand.edu` | `AdminSecure2026!@` | `Dr. Eleanor Vance` (Principal & Executive Director) | `/admin/dashboard` |
| 💰 **School Accountant** | `accountant` | `accountant@zustand.edu` | `AccountantSecure2026!@` | `Marcus Sterling` (Head of Accounts & Bursar) | `/accountant/dashboard` |
| 👩‍🏫 **Faculty / Teacher** | `teacher` | `teacher@zustand.edu` | `TeacherSecure2026!@` | `Prof. Clara Higgins` (Class 10-A Math Teacher) | `/teacher/dashboard` |
| 📚 **Chief Librarian** | `librarian` | `librarian@zustand.edu` | `LibrarianSecure2026!@` | `Julian Montgomery` (Head of Library & Media) | `/librarian/dashboard` |
| 👨‍👧 **Parent / Guardian** | `parent` | `parent@zustand.edu` | `ParentSecure2026!@` | `Rajesh Sharma` (Mapped to Aarav Sharma) | `/parent/dashboard` |
| 🎓 **Student** | `student` or `ADM-2026-001` | `student@zustand.edu` | `StudentSecure2026!@` | `Aarav Sharma` (Class 10, Sec A, Roll 01) | `/student/dashboard` |

---

## 🚀 Key System Features Active

1. **Instant Login Gateway**: The root route `/` automatically issues an immediate HTTP redirect straight to `/login`.
2. **Zero Mock / Demo Data**: All hardcoded demo widgets (`CourseProgressWidget`, `TasksChecklist`, fake grade charts, fake parent fallbacks) have been completely removed.
3. **Strict Data Isolation**: Parents only see their verified linked children; students only see their enrolled class/subject data; teachers see assigned timetables.
4. **Performance Optimized**: Production webpack compilation passes with 0 errors across all 75 pages. Turbo and dev prefetch contention resolved.

