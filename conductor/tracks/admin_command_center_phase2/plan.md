# Implementation Plan: Admin Command Center Phase 2 & Multilingual CMS

## Phase 1: User Management Core
- [x] Task: Create `UserManagementTable` Component [0c514d5]
    - [x] Sub-task: Build the UI with search and pagination.
    - [x] Sub-task: Create `adminService.getUsers()` and `adminService.updateUserRole()`.
    - [x] Sub-task: Implement `adminService.toggleUserStatus()` (Ban/Unban).
- [x] Task: Integration & RBAC [0c514d5]
    - [x] Sub-task: Integrate the table into `AdminDashboard.tsx`.
    - [x] Sub-task: Verify `useAuth` correctly restricts access to Super Admins.

## Phase 2: Multilingual Blog CMS
- [x] Task: Blog Editor UI [3fa71af]
    - [ ] Sub-task: Create `BlogPostEditor` component with a rich text editor.
    - [ ] Sub-task: Add form fields for Title, Tags, and Cover Image.
- [x] Task: Auto-Translation Integration [c9c9a88]
    - [ ] Sub-task: Update `geminiService.ts` with `translateContent(text: string, targetLangs: string[])`.
    - [ ] Sub-task: Implement the "Save & Translate" flow in `contentService.createBlogPost()`.
    - [ ] Sub-task: Update `BlogPost` type definition to support localized content.
- [x] Task: Public Blog Update [25f412c]
    - [ ] Sub-task: Update public `Blog.tsx` to display the post in the user's current language (falling back to English).

## Phase 3: System Health & Polish
- [ ] Task: Analytics Dashboard
    - [ ] Sub-task: Create `SystemHealth` component with charts (using Recharts or Chart.js).
    - [ ] Sub-task: Implement `adminService.getSystemStats()` to aggregate counts.
- [ ] Task: Conductor - User Manual Verification 'Admin Command Center Phase 2' (Protocol in workflow.md)
