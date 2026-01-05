# Plan: Admin Command Center & Smart Blog Evolution

## Phase 1: Foundation & Audit Logging [checkpoint: bc5cd80]
- [x] Task: Update `types.ts` to include `LogEntry`, `views` in `BlogPost`, and extended `User` fields. a109072
- [x] Task: Create `services/adminService.ts` (if not exists) or extend it with `logAdminAction` and `getAuditLogs` methods. a109072
- [x] Task: Write unit tests for `adminService` ensuring logs are correctly written to Firestore. a109072
- [x] Task: Implement `logAdminAction` logic using Firestore `addDoc`. a109072
- [x] Task: Conductor - User Manual Verification 'Foundation & Audit Logging' (Protocol in workflow.md) bc5cd80

## Phase 2: Cyber HUD & Growth Analytics [checkpoint: b705cb7]
- [x] Task: Refactor `AdminDashboard.tsx` layout to support the "Cyber HUD" aesthetic (glowing borders, status containers). 7fc197b
- [x] Task: Implement a `SystemStats` utility to calculate growth velocity (users/pets per week). 3a0525e
- [x] Task: Write tests for `SystemStats` utility logic. 3a0525e
- [x] Task: Add the "Growth Analytics" summary cards to the Admin overview using the HUD style. 7fc197b
- [x] Task: Conductor - User Manual Verification 'Cyber HUD & Growth Analytics' (Protocol in workflow.md) b705cb7

## Phase 3: Professional Veterinarian Management [checkpoint: ]
- [x] Task: Create `AddClinicModal.tsx` for manual clinic registration. eb08aff
- [x] Task: Write tests for `AddClinicModal` form submission and data validation. eb08aff
- [ ] Task: Implement the "Verification Workflow" tab in AdminDashboard with "Approve/Reject" actions.
- [ ] Task: Update `adminService` to handle manual registration and verification toggles.
- [ ] Task: Integrate "Persistent Alert Feed" into the Admin header for pending tasks.
- [ ] Task: Conductor - User Manual Verification 'Professional Veterinarian Management' (Protocol in workflow.md)

## Phase 4: Smart Blog Engagement Metrics [checkpoint: ]
- [ ] Task: Create a utility `calculateReadingTime` in `src/utils/blogUtils.ts`.
- [ ] Task: Write tests for `calculateReadingTime` with various text lengths.
- [ ] Task: Update `contentService.ts` to include `incrementPostViews` using Firestore `increment()`.
- [ ] Task: Modify `BlogPostDetail.tsx` to trigger `incrementPostViews` on mount and display "Reading Time".
- [ ] Task: Add "Trending Posts" analytics card to the Admin Dashboard.
- [ ] Task: Conductor - User Manual Verification 'Smart Blog Engagement Metrics' (Protocol in workflow.md)

## Phase 5: Advanced Search & Polish [checkpoint: ]
- [ ] Task: Enhance the user and pet tables in AdminDashboard with search and "Verification Status" filters.
- [ ] Task: Perform a final mobile responsiveness audit for high-density HUD grids.
- [ ] Task: Ensure all administrative actions trigger an `Audit Log` entry.
- [ ] Task: Conductor - User Manual Verification 'Advanced Search & Polish' (Protocol in workflow.md)
