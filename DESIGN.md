# Service Operations Portal Design System

## Purpose

This document defines the visual and interaction rules for the portal. New pages should reuse these patterns instead of introducing page-specific shells, navigation behavior, or unrelated color systems.

The interface should feel calm, modern, operational, and trustworthy. It prioritizes readable information density over decorative dashboard widgets.

## Application shell

- The application fills the viewport edge to edge using `100vw` and `100dvh`.
- The page background is the near-white canvas `#FAFCFB`.
- The optional dark theme uses layered navy surfaces rather than black: `#101A2C` for the canvas and `#18253A` for primary cards and navigation.
- The sidebar and top navigation remain fixed while the page content scrolls.
- The welcome and action header appears only on the Dashboard.
- Main content uses a responsive 12-column grid.
- Page content uses `16px` horizontal padding on small screens and `32px` on medium screens and above.
- Business pages render inside the shared shell; they must not create a second application frame.

## Sidebar

The sidebar has two states:

1. Collapsed: `64px` wide on small screens and `80px` wide from the `sm` breakpoint.
2. Expanded: `256px` wide with module labels and user details.

Expanding the sidebar overlays the main content. It must never resize or horizontally shift the active page. The sidebar closes when the user:

- Selects a destination.
- Clicks outside the sidebar.
- Presses Escape.
- Uses the collapse control in the expanded sidebar.

Every logo, navigation icon, user avatar, and logout icon stays on one fixed horizontal centerline in both states. Expansion reveals labels to the right of this fixed icon rail; it must not reposition the icons.

The sidebar is pure white in light mode and a raised navy surface in dark mode. The logout action appears above the profile at the bottom of the rail and always uses a red destructive treatment.

The selected route uses an emerald background, white icon and label, and an indicator placed inside the absolute right edge of the sidebar. Indicators must not use negative offsets that create horizontal navigation overflow. Routes that a user cannot access will eventually be omitted based on centralized RBAC decisions. Hiding a route will remain a usability feature, not an authorization boundary.

Current navigation order:

1. Dashboard
2. Clients
3. CRM
4. HRM
5. VMS
6. BMS
7. Vault
8. Internal Chat
9. Marketing
10. Accounts
11. Admin Console

## Color palette

| Purpose | Color |
| --- | --- |
| Primary action | Emerald 500 / `#10B981` |
| Primary hover | Emerald 600 / `#059669` |
| Primary tint | Emerald 50 / `#ECFDF5` |
| Application canvas | `#FAFCFB` |
| Card surface | White / `#FFFFFF` |
| Primary text | Slate 800 / `#1E293B` |
| Secondary text | Slate 600 / `#475569` |
| Muted text | Slate 400 / `#94A3B8` |
| Divider | Slate 100 / `#F1F5F9` |
| Destructive or unread indicator | Rose 500 / `#F43F5E` |

Emerald is reserved for primary actions, active navigation, focus states, and positive status. Module pages may use small secondary accent colors, but they should not replace the primary portal identity.

The top-right utility area contains only the color-mode toggle and a live local date/time display. Theme preference is stored in the browser and restored before the interface paints to avoid a light/dark flash.

## Typography

- Use the system sans-serif stack currently defined in `globals.css`.
- Page titles are bold with slightly tightened letter spacing.
- Section titles use semibold weight.
- Body and table text use `14px` by default.
- Supporting labels use `12px` with slate-muted colors.
- Table headings use compact uppercase labels with increased tracking.

## Surfaces and controls

- Primary page containers use `16px` corner radii.
- Buttons use `12px` corner radii.
- Inputs use `12px` corner radii and a visible emerald focus ring.
- Cards use low-contrast slate rings and soft shadows instead of heavy borders.
- Interactive controls must have hover and keyboard focus states.
- Icons use the Lucide line-icon set, normally at `18px` with a stroke width near `1.8`.

## Responsive behavior

- The application shell does not horizontally overflow the viewport.
- Wide tables scroll inside their own container on small screens.
- Toolbars stack vertically on small screens and align horizontally when space permits.
- Folder grids use one column on small screens, two columns at `sm`, and four columns at `xl`.
- Controls must retain a practical touch target even when their icon is visually smaller.

## Page patterns

### Dashboard

The Dashboard retains the shared welcome header and empty 12-column grid. Dashboard widgets will be designed in a later milestone.

### Clients

The Clients page uses a searchable data-table layout. Search applies across client ID, name, country, type, KAM, SPOC, and user-since values. The table columns are:

- Client ID
- Client name
- Country
- Type
- KAM (Key Account Manager)
- SPOC (Single Point of Contact)
- User since

The current records are presentation-only sample data. Database-backed records, editing, pagination, and authorization will be added later.

### HRM

The HRM page follows the searchable list pattern used by Clients. Its employee table displays:

- Employee ID
- Name
- Designation
- Date of joining
- Date of birth

Employee records are presentation-only sample data until database access and permission checks are implemented.

### Internal Chat

Internal Chat uses a minimal two-pane layout. People appear in the left column, and the active conversation opens in the right pane. No conversation is selected on initial load. The narrow responsive layout keeps avatars visible while hiding secondary person details.

The current chat is a presentation prototype. Message persistence, delivery, presence, and permission-aware contact visibility will be implemented later.

### Vault

The Vault takes structural inspiration from file-management products such as Google Drive while retaining the portal's own emerald design language. It uses a breadcrumb-style toolbar and a responsive folder grid.

Initial folders are:

- Documents
- Receipts
- Certificates
- Bills

The folders are currently visual placeholders. Folder visibility and file operations must later be enforced through the central authorization service.

### Placeholder list modules

CRM, VMS, BMS, and Accounts currently use lightweight searchable list placeholders. They share the same responsive table component as Clients and HRM so search, empty states, row spacing, overflow behavior, and future loading states remain consistent.

Marketing is the exception. Its placeholder is an asset-category grid for Posts, Blogs, Flyers, Brochures, Image Assets, and Content.

### Admin Console

Admin Console is the landing page for user accounts, clients, assignments, roles and permissions, and audit records. Its overview cards link to searchable data views, and role rows expand to show their exact permission assignments. The Users and Clients views use a shared expandable creation panel, compact status actions, inline validation feedback, and soft lifecycle changes rather than destructive deletion. It is intended only for internal Admin and CEO/CTO users; both navigation visibility and every direct route require centralized access authorization, and each data service independently checks its own resource permission.

## Shared components

`src/components/shared/searchable-data-table.tsx` is the canonical presentation component for list-style module pages. It owns:

- Search input and client-side filtering for static prototypes.
- Result counts and singular/plural labels.
- Responsive horizontal table scrolling.
- Semantic column headings and row rendering.
- Empty search results.
- Shared identity and pill cells.

Module components provide their records, search text, columns, and cell content. They should not copy the table shell.

## Future module direction

| Module | List or landing page | Future detail and workflow scope |
| --- | --- | --- |
| CRM | Client relationship list | Client profile, tasks, emails, and communication records |
| HRM | Employee list | Employee profile, attendance, documents, letters, and monthly appraisal |
| Accounts | Ledger-oriented list | Invoices, estimates, bills, GST reports, finance reports, and call-outs |
| Marketing | Content-category landing page | Posts, blogs, flyers, brochures, image assets, and content |
| Vault | Folder and document browser | Permission-controlled documents |

The supplied broader scope also mentions VMP and vendor profiles with RFP, quote upload, award, and decline workflows. VMP remains intentionally absent from the current navigation following the owner's earlier removal instruction; restore it only after explicit confirmation.

## Accessibility

- Every icon-only control needs an accessible label.
- The active navigation route uses `aria-current="page"`.
- The menu button exposes its expanded state and controlled sidebar.
- Keyboard focus must always be visible.
- Color must not be the only indicator of state.
- Tables must use semantic headings and remain readable with horizontal scrolling.

## Implementation boundaries

- Shared shell components live in `src/components/layout`.
- Shared list and table presentation lives in `src/components/shared`.
- Page-specific presentation components live in a folder named for their module.
- Canonical navigation labels, paths, and icons live in `portal-navigation.ts`.
- The interface must not contain authorization logic based on role names.
- Client-specific records must not be fetched or exposed until server-side client scope and permission checks are implemented.
