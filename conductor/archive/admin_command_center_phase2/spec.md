# Specification: Admin Command Center Phase 2 & Multilingual CMS

## 1. Overview
This track focuses on elevating the administrative capabilities of Paw Print. We will implement a comprehensive User Management system, a System Health Dashboard, and a full-featured Blog CMS that leverages Gemini to automatically translate content into all supported languages.

## 2. Functional Requirements

### 2.1 User Management Dashboard
- **User List:** Display a paginated, searchable list of all users with columns for Name, Email, Role, and Status.
- **Role Management:** Super Admins must be able to promote/demote users (e.g., User -> Vet, User -> Shelter).
- **Account Actions:** Ability to suspend/ban users or reset their active sessions.
- **Security:** Ensure strict RBAC checks (Super Admin only).

### 2.2 Multilingual Blog CMS
- **CRUD Operations:** Create, Read, Update, and Delete blog posts.
- **Rich Text Editor:** Integrate a lightweight WYSIWYG editor (e.g., TipTap or Quill) for post content.
- **Auto-Translation:**
    - When saving a post, trigger a background process (or immediate Gemini call) to translate the Title and Content into all supported languages (es, fr, de, it, zh, etc.).
    - Store translations in a sub-collection or map field within the `blog_posts` document.
- **Preview:** Ability to preview the post in different languages before publishing.

### 2.3 System Health Analytics
- **Metrics:** Display real-time (or near real-time) counts for:
    - Total Users
    - Active Pets (Lost/Found/Adoption)
    - Total Donations
- **Charts:** Visual representation of user growth and donation trends over the last 30 days.

## 3. Technical Constraints
- **State Management:** Use `onSnapshot` for real-time updates in the dashboard.
- **Translation:** Use `geminiService.ts` for content translation. Ensure `responseMimeType: "application/json"` is used to get structured translated objects.
- **Validation:** Use Zod schemas for all admin actions.

## 4. User Experience
- **Admin Layout:** Use a sidebar navigation specific to the Admin Dashboard.
- **Feedback:** Success toasts for all actions; specialized error handling for failed translations.
