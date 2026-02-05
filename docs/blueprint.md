# **App Name**: Canteen Control Center

## Core Features:

- Firebase Authentication: Implement secure Firebase login with Google or email; store user roles in Firestore; redirect based on role; protect routes with role-based guards.
- Dashboard: Display break status (active/inactive), active passes count, issued this break count, and today's total; list active passes in real-time using Firestore listeners.
- Create Pass: Issue canteen passes with student name/ID and reason; automatically expire passes at break end; disable button and show message when no break is active.
- Active Passes: Real-time display of active passes with student, reason, issued by, time left, and status; auto countdown timer; color-coded status; revoke button.
- Logs: Store a permanent, immutable audit trail of all passes; include date range filter, member filter, name search, status filter, pagination, and CSV export.
- Notifications: Supervisors can send announcements to members via real-time toast popups and bell icon with unread count; maintain notification history panel.
- Break Scheduler: Supervisors can set daily break times, the system automatically enables/disables pass issuing and expires all passes based on timestamps.

## Style Guidelines:

- Primary color: Deep indigo (#3F51B5) for a trustworthy and professional feel.
- Background color: Light gray (#F5F5F5), creating a clean and spacious backdrop.
- Accent color: Teal (#009688) for interactive elements and highlights, ensuring clear affordances for interactive UI elements.
- Body and headline font: 'Inter', a grotesque-style sans-serif known for its modern, objective, and neutral appearance, making it suitable for both headlines and body text in an enterprise software setting.
- Use minimal, consistent icons from a library like Feather or Lucide.
- Implement a responsive layout with sidebar navigation on desktop and bottom navigation on mobile; use rounded corners (2xl) and consistent spacing for a polished look.
- Apply subtle Framer Motion animations for page transitions, card fades/slides, hover scale effects, status color transitions, and toast slide-ins to enhance user experience.