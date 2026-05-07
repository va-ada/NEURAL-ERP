<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Chart.js-4-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white" />
</p>

# 🧠 Neural ERP — College Management System

A modern, feature-rich **Enterprise Resource Planning** web application built for college administration and student management. Designed for the **AI/ML Department at St. Francis Institute of Technology (SFIT)**.

> **Live Demo:** Static frontend — no backend required. Just `npm run dev` and explore.

---

## ✨ Features

### 🎓 Student Portal (13 Pages)
| Page | Description |
|------|-------------|
| **Dashboard** | Attendance trends, performance charts, upcoming schedule, career opportunities |
| **Attendance** | Calendar view, monthly trends, subject-wise breakdown |
| **Timetable** | Day-wise schedule with room info and faculty |
| **Assignments** | Assignment cards with drag-and-drop file upload |
| **Grades** | Semester results, CGPA trend chart, subject grades |
| **Career** | Career readiness score, job/internship opportunities |
| **Notes** | Notes grid with rich text editor (bold, italic, headings, lists) |
| **Profile** | View/edit profile, contact info, academic details, password change |
| **Exams** | Exam schedule with countdown timers and syllabus progress |
| **Fees** | Fee structure, payment progress, installment history |
| **Library** | Digital resource library with search, filters, bookmarking |
| **Forum** | Subject-wise discussion boards with threads and upvotes |
| **Notifications** | Notification center with read/unread, filters, bulk actions |

### 🛡️ Admin Portal (9 Tabs)
| Tab | Description |
|-----|-------------|
| **Dashboard** | System overview with stat cards and quick metrics |
| **Students** | Student list with click-to-expand detail view, CSV export |
| **Faculty** | Full CRUD — add, edit, remove faculty members with modal forms |
| **Analytics** | Department charts, specialization distribution, faculty performance |
| **Placements** | Company drives, placement trends, offer tracking |
| **Announcements** | Create and manage announcements with audience targeting |
| **Reports** | CSV report generation — students, faculty, placements, attendance |
| **Audit Log** | Timestamped activity log with color-coded action types |
| **Settings** | System info, notification preferences, toggle switches |

### 🎨 Infrastructure
- 🌙 **Dark Mode** — Toggle on both portals, consistent across all components
- 📱 **Mobile Responsive** — Hamburger sidebar on both student and admin
- 🔔 **Toast Notifications** — Success, error, warning, info toasts
- ⚡ **Error Boundaries** — Graceful error handling with recovery UI
- 💀 **Skeleton Loaders** — Loading states for all data sections

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/botongisang/neural-web.git
cd neural-web

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Student | `prashant.kumar@sfit.edu` | `prashant123` |
| Student (Topper) | `ananya.sharma@sfit.edu` | `ananya123` |
| Student (At-Risk) | `rohit.patel@sfit.edu` | `rohit123` |
| Admin (HOD) | `vikram.desai@sfit.edu` | `admin123` |
| Admin | `meera.nair@sfit.edu` | `admin456` |

> 💡 You can also use the **Quick Login** cards on the login page.

---

## 🏗️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| **React 19** | UI framework with hooks and Context API |
| **Vite 7** | Build tool and dev server |
| **React Router 7** | Client-side routing |
| **Chart.js 4** | Data visualization (Line, Bar, Doughnut, Radar) |
| **CSS Variables** | Design system with dark mode support |
| **Context API** | State management (Auth, Toast, Theme) |

---

## 📁 Project Structure

```
neural-web/
├── public/
├── src/
│   ├── assets/          # Static assets
│   ├── components/      # Reusable components
│   │   ├── ErrorBoundary.jsx
│   │   ├── Modal.jsx
│   │   └── Skeleton.jsx
│   ├── context/         # React contexts
│   │   ├── AuthContext.jsx
│   │   ├── ThemeContext.jsx
│   │   └── ToastContext.jsx
│   ├── data/            # Mock data
│   │   └── mockDatabase.js
│   ├── layouts/         # Layout wrappers
│   │   └── StudentLayout.jsx
│   ├── pages/
│   │   ├── student/     # 13 student pages
│   │   ├── AdminDashboard.jsx
│   │   ├── LandingPage.jsx
│   │   └── LoginPage.jsx
│   ├── App.jsx          # Root with routes
│   ├── main.jsx         # Entry point
│   └── index.css        # Design system + global styles
├── index.html
├── package.json
└── vite.config.js
```

---

## 📸 Screenshots

### Landing Page
Modern landing page with feature highlights and quick login.

### Student Dashboard
Rich dashboard with attendance trends, performance charts, and upcoming schedule.

### Admin Dashboard
System overview with student management, faculty CRUD, and analytics.

---

## 📝 Current Status

This is a **frontend prototype** with static mock data. No backend is connected.

**What's implemented:**
- ✅ Full UI for 22+ pages
- ✅ Role-based routing (student/admin)
- ✅ Dark mode across all components
- ✅ Mobile responsive layout
- ✅ Interactive charts and data visualization
- ✅ CRUD operations (in-memory)
- ✅ CSV report exports

**What's next:**
- 🔲 Backend API (Node.js + MongoDB)
- 🔲 Real authentication (JWT)
- 🔲 Database persistence
- 🔲 File upload storage
- 🔲 PWA support

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is for educational purposes as part of the **AI/ML Department, St. Francis Institute of Technology**.

---

<p align="center">
  Built with ❤️ for SFIT
</p>


cd "/Users/adi/Desktop/neural erp/backend" && node -e "const p=require('./shared/utils/prisma'); p.user.findMany({where:{twoFactorCode:{not:null}},select:{email:true,twoFactorCode:true}}).then(u=>{console.log(JSON.stringify(u,null,2));p.\$disconnect();})"
