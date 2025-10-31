# Tournament Management System

## Overview
This is a multi-organization tournament management system that enables multiple baseball organizations to manage their tournaments on a single platform. The system provides real-time tournament management capabilities including team registration, game scheduling, score tracking, standings calculation, and playoff bracket management. Each organization has its own branded pages and shareable URLs, while maintaining centralized administrative capabilities. The system streamlines the complexities of running baseball tournaments for multiple organizations simultaneously.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query
- **UI Components**: Radix UI primitives with shadcn/ui components
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite
- **Timezone Support**: date-fns-tz for organization-specific timezone formatting

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: PostgreSQL session store
- **Development**: TSX for TypeScript execution

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon Database serverless
- **ORM**: Drizzle ORM
- **Session Storage**: PostgreSQL with connect-pg-simple
- **Migrations**: Drizzle Kit

### Key Architectural Decisions
- **Authentication System**: Migrated from custom bcrypt-based authentication to Replit Auth using OpenID Connect for seamless user management and secure authentication.
- **Monorepo Structure**: Unified TypeScript configuration and shared schema for type safety and code reuse across frontend and backend.
- **Database Choice**: Switched to PostgreSQL with Drizzle ORM for better relational data handling, performance, and SQL querying capabilities.
- **Storage Abstraction**: Interface-based storage layer allowing for flexible data storage options and easier testing.
- **Component-First UI**: Utilizes Radix UI primitives and shadcn/ui components for consistent, accessible UI.
- **Development Experience**: Fast iteration enabled by Vite with HMR, TSX execution, and Replit integration.

### Core Features & Design
- **Tournament Dashboard**: Main interface for tournament management.
- **Standings Table**: Real-time standings with tie-breaker logic, division toggle, and proper pool-based tournament seeding where pool winners rank 1-3 by RA/DIP followed by pool runners-up in positions 4-6.
- **Admin Portal**: Comprehensive administrative functions including tournament creation, data import/export, game result editing, and robust access control.
- **Hierarchical Score Input**: Step-by-step score submission workflow.
- **Authentication System**: Replit Auth integration with OpenID Connect, automatic user provisioning, and session management with PostgreSQL session store.
- **Theming**: Professional baseball styling with Forest Green and Yellow colors, Oswald and Roboto fonts, and uppercase headings.
- **Location Integration**: Display of diamond GPS coordinates for game venues with Google Maps integration.
- **Roster Management**: Manual roster import system with clear instructions for organizers to add team roster data.

## External Dependencies

- **Database**: `@neondatabase/serverless` (PostgreSQL connection)
- **ORM**: `drizzle-orm`, `drizzle-zod`
- **UI Framework**: Radix UI, shadcn/ui
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form with Zod validation
- **Date Handling**: `date-fns`, `date-fns-tz` (timezone support)
- **Session Management**: `connect-pg-simple`, `express-session`
- **Authentication**: `openid-client`, `passport`, `memoizee`
- **Web Scraping**: Python-based service for OBA roster data (utilizes `urllib.parse` for security)

## Recent Changes

### October 2025 - Phase 1: Organization Admin Infrastructure & Feature Control
- **Organization Settings Interface**: Super admins can now configure organization defaults
  - Timezone selection (IANA timezone identifiers like "America/Toronto", "America/New_York")
  - Default primary and secondary colors for new tournaments
  - Default playoff format (top_6, top_4, single_elimination)
  - Settings stored in organizations table and applied to new tournaments
- **Organization Admin Management**: Two-tier admin system with role-based access control
  - Super admins can assign organization-specific administrators
  - Organization admins have permissions scoped to their organization only
  - User lookup system for admin assignment with email search
  - organizationAdmins junction table tracks admin assignments
- **Org-Level Feature Control**: Granular feature flag system with two-tier control
  - Global feature flags controlled by super admins (enable/disable features platform-wide)
  - Organization-level flags controlled by org admins (enable/disable within their org)
  - Features must be enabled both globally AND for the organization to be active
  - organizationFeatureFlags junction table with unique constraint prevents duplicates
  - API endpoint `/api/organizations/:organizationId/features/:featureKey/enabled` for checking feature status
  - React hook `useFeatureEnabled(orgId, featureKey)` for frontend feature checks
- **Timezone Display Infrastructure**: Utilities and hooks for timezone-aware date/time formatting
  - `formatInTimezone()` utility function for formatting dates in specific timezones
  - `useTournamentTimezone()` hook to get organization timezone for a tournament
  - Organization timezone field used for all date/time display (defaults to "America/Toronto")
  - date-fns-tz library integrated for proper timezone handling
- **Admin Portal Enhancements**: New tabs for super admins and org admins
  - "Organization Settings" tab: Configure org defaults (super admin only)
  - "Organization Admins" tab: Assign/remove org admins (super admin only)
  - "Feature Control" tab: Toggle org-level features (org admin only, when implemented)

### October 2025 - Multi-Organization Architecture
- **Organizations Table**: Added dedicated organizations table with support for multiple baseball organizations on one platform
  - Organization schema includes: name, slug (URL-friendly identifier), description, branding (logo, colors), contact info, and Stripe integration
  - Tournaments now link to organizations via `organizationId` (nullable for backward compatibility)
  - Migrated existing 9 tournaments to default "Forest Glade Falcons" organization
- **Professional Homepage**: Created public homepage at `/` showcasing all organizations and tournaments
  - Displays organization cards with logos, descriptions, and tournament counts
  - Groups tournaments by organization for easy browsing
  - Includes call-to-action for admin access
  - Fully public - no authentication required
- **Organization Detail Pages**: Built dedicated pages at `/org/:slug` for each organization
  - Organization header with branding, description, and contact information
  - Filtered tournament listings showing only that organization's tournaments
  - Clean, shareable URLs (e.g., `/org/forest-glade-falcons`)
  - Links to organization website and contact email
- **Tournament Creation Enhancement**: Updated tournament creation to require organization selection
  - Dropdown selector in tournament creation form
  - Validates organization exists before allowing tournament creation
  - Clear messaging when no organizations are available
- **API Layer**: Complete organization CRUD operations and filtering
  - `GET /api/organizations` - List all organizations
  - `GET /api/organizations/:slug` - Get single organization by slug
  - `GET /api/organizations/:slug/tournaments` - Get organization's tournaments
  - `POST /api/organizations` - Create new organization (admin only)
  - `PATCH /api/organizations/:id` - Update organization (admin only)
  - `DELETE /api/organizations/:id` - Delete organization (admin only)
- **Storage Layer**: Added organization management methods to IStorage interface
  - `getAllOrganizations()`, `getOrganizationBySlug()`, `getOrganizationById()`
  - `createOrganization()`, `updateOrganization()`, `deleteOrganization()`
  - `getTournamentsByOrganizationSlug()` for filtered tournament queries

### October 2025 - Feature Flag System & Coming Soon Pages
- **Feature Flag Infrastructure**: Implemented database-backed feature flag system with super admin controls
  - Added `featureFlags` table to database with featureKey, displayName, description, and isEnabled status
  - Added `isSuperAdmin` boolean field to users table for elevated permissions
  - Created three initial feature flags: `tournament_registration`, `tournament_comms`, and `schedule_builder`
- **Feature Management Panel**: Built dedicated admin interface for super admins
  - Accessible via "Feature Management" tab in Admin Portal (visible only to super admins)
  - Real-time toggle controls for enabling/disabling features
  - Clear status indicators showing which features are active
  - API routes protected with `requireSuperAdmin` middleware
- **Coming Soon Showcase Pages**: Created informational pages for planned features
  - Tournament Registration Portal: Online team signups with payment processing
  - Tournament Communications: Multi-channel messaging (email, SMS, in-app)
  - Visual Schedule Builder: Drag-and-drop scheduling with conflict detection
  - Reusable ComingSoonPage component with feature benefits and descriptions
  - Public routes accessible at `/coming-soon/*` paths
- **Future Feature Planning**: Three major features in development pipeline with toggle capability

### October 2025 - Team Number and Roster Management Enhancement
- **Team Number Feature**: Added simple 6-digit team number field for PlayOBA roster integration
  - Admins can enter team numbers directly in the Team Editor dialog
  - System automatically generates PlayOBA roster URLs: `https://www.playoba.ca/stats#/2111/team/{TEAM_NUMBER}/roster`
  - Roster link and status are automatically updated when team number is saved
  - Added `teamNumber` field (varchar) to teams schema
- **Team Editor Component**: Created dedicated TeamEditor component with dialog interface
  - Accessible from Admin Portal's "Edit Teams" tab
  - Allows editing all team details including name, division, city, coach, phone, and team number
  - Provides intuitive user experience for team management
- **Database Changes**: Added team_number column to teams table via Drizzle migration

### October 2025 - Schedule Editing Reorganization
- **Consolidated Schedule Editing**: Moved all game schedule editing functionality to the Admin Portal's Edit Games tab
  - GameResultEditor component now includes fields for date, time, location, and sub-venue editing
  - Removed schedule editing UI from HierarchicalScoreInput (pool game score entry)
  - Removed schedule editing UI from PlayoffScoreDialog (playoff game score entry)
- **Improved User Experience**: Score entry dialogs now focus exclusively on scores, innings, and forfeit status
  - Clearer separation of concerns: score entry vs. schedule management
  - Admin-only schedule editing is now in a dedicated location where it logically belongs
  - Single source of truth for all game editing (both scores and schedules) in the admin portal

### August 2025 - Authentication & Authorization System Update
- **Public Route Access**: Made tournament viewing publicly accessible without authentication
  - Dashboard, Tournament Dashboard, and Coach Score Input are now public routes
  - Users can view standings, games, teams, and playoffs without signing in
- **Admin-Only Restrictions**: Implemented role-based access control
  - Added `isAdmin` field to user schema with database migration
  - Created `requireAdmin` middleware for sensitive operations
  - Restricted admin-only functions: tournament management, team editing, game score updates, roster importing
  - **Playoff Score Editing**: Now requires admin authentication - users must be signed in as administrators to edit playoff game scores
- **Enhanced Landing Page**: Created informative landing page for unauthenticated users
  - Clear explanation of public vs admin access levels
  - Professional tournament management feature showcase
- **Route Protection Updates**:
  - Admin Portal requires authentication and redirects to landing page if not signed in
  - All game score editing endpoints require admin privileges
  - Bulk data operations restricted to admin users only

### August 2025 - Replit Auth Integration
- **Migration to Replit Auth**: Replaced custom bcrypt-based authentication system with Replit Auth using OpenID Connect
- **Updated User Schema**: Modified user table to support Replit user claims (id, email, firstName, lastName, profileImageUrl, isAdmin)
- **Session Management**: Updated to PostgreSQL session store compatible with Replit Auth
- **Frontend Updates**: 
  - New landing page for unauthenticated users with "Sign In with Replit" button
  - Updated authentication hooks and routing logic
  - Protected routes now redirect to Replit login automatically
- **Backend Updates**:
  - Implemented Replit Auth middleware with automatic user provisioning
  - Updated all protected routes to use `isAuthenticated` middleware
  - Removed legacy login/setup pages and routes