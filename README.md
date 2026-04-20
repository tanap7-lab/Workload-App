# Workload App

A professional, high-fidelity Team Effort and Workload Tracking application built with React, Express, and SQLite. This application provides a premium dashboard for managing team capacity, individual task distribution, and high-quality report generation.

## 🚀 Key Features

- **Dynamic Workload Dashboard**: Real-time visualization of team effort, capacity (FTE), and focus hours.
- **Advanced Analytics**: Detailed charts for effort distribution and multi-week performance trends.
- **Professional PDF Export**: A custom, Playwright-powered PDF generation skill that produces searchable, pixel-perfect reports.
- **Multi-Page Reports**: Automatically generates PDFs containing both the Dashboard and Analytics sections.
- **SQLite Persistence**: Robust backend storage for team members and workload tasks.
- **Intelligent Navigation**: Easily navigate between weeks or jump back to the current context.

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4, Recharts, Framer Motion (Motion).
- **Backend**: Node.js, Express, Better-SQLite3.
- **Tools**: Playwright (for PDF generation), XLSX (for data export).

## 📦 Getting Started

### Prerequisites

- Node.js (v18+)
- NPM or PNPM

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Install the PDF engine (Playwright):
   ```bash
   npx playwright install chromium
   ```

### Development

Start the development server (runs both Vite and Express):
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

## 📄 PDF Export Skill

The project includes a standalone PDF export skill that can be used via the UI or directly from the CLI.

### CLI Usage
```bash
npm run export-pdf "http://localhost:3000" my_report.pdf
```

### How it Works
The server-side PDF generator uses Playwright to navigate to a specialized "Print Mode" of the application (`?print=true`). This mode optimizes the layout by:
- Hiding interactive elements (Sidebars, Headers, Modals).
- Expanding sections into a printable vertical flow.
- Inserting automatic page breaks between the Dashboard and Analytics sections.

## 🗄️ Database
The application uses an automatic SQLite database initialization system (`database.ts`). The database stores:
- `team_members`: Metadata, roles, and capacity.
- `weekly_tasks`: Individual effort logs categorized by priority and type.

---
Designed for **Aumovio SE**.
