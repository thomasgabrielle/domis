# PAP-MIS - Public Assistance Program Management Information System

## Overview

PAP-MIS is a comprehensive social protection management system designed to support Public Assistance Programs. The application facilitates the complete lifecycle of beneficiary management, from intake and registration through case management, payments, and monitoring & evaluation.

The system is built to support social workers, program administrators, and managers in delivering assistance to Project Affected Persons (PAP) and vulnerable households. It implements a widely accepted framework for social protection operations with features for household registration, eligibility assessment, benefit enrollment, case management, grievance handling, payment tracking, and comprehensive reporting.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack Architecture
The application follows a monorepo structure with clear separation between client and server code:

**Frontend Stack:**
- React with TypeScript for the UI layer
- Vite as the build tool and dev server
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query (React Query) for server state management and data fetching
- Shadcn UI component library built on Radix UI primitives
- TailwindCSS v4 for styling with custom design tokens
- Form handling via React Hook Form with Zod validation

**Backend Stack:**
- Express.js server with TypeScript
- RESTful API architecture
- Session-based state management
- Drizzle ORM for database operations
- PostgreSQL via Neon serverless database
- Zod for runtime validation and schema generation

**Build & Development:**
- ESBuild for server bundling with selective dependency bundling
- Vite for client-side HMR and development
- Shared TypeScript configuration across client/server
- Path aliases for clean imports (`@/`, `@shared/`, `@assets/`)

### Database Schema Design

The data model follows social protection program requirements with these core entities:

**Users Table:**
- Role-based access (case workers, administrators)
- Department and status tracking
- Authentication credentials

**Households Table:**
- Unique household codes (HH-YYYY-XXX format) and Application IDs (APP-YYYY-XXX format)
- Location hierarchy: province → district → village
- GPS coordinates for mapping
- Vulnerability scoring (0-100 scale)
- Program status tracking (pending_assessment, enrolled, ineligible)
- Social worker assignment
- Temporal tracking (registration, enrollment, last assessment dates)
- Assessment workflow step tracking (coordinator → director → permanent_secretary → minister → completed)
- Step-specific decision/comments fields for audit trail
- Recommendation fields (amount allocation, duration, transfer modality, complementary activities)

**Household Members Table:**
- Demographic information (name, DOB, gender)
- Relationship to household head
- National ID and disability status
- Child-specific fields (education, school enrollment)
- Employment status tracking

**Assessments Table:**
- Linked to households and assessors
- Vulnerability scoring with category breakdowns
- Eligibility determination logic
- JSON field for flexible assessment data storage

**Grievances Table:**
- Category-based classification
- Status workflow (open → investigating → resolved → closed)
- Resolution tracking and notes

**Payments Table:**
- Cycle-based payment tracking
- Multiple disbursement methods (Mobile Money, Bank Transfer, Cash)
- Status tracking with failure handling
- Transaction reference and reconciliation fields

**Programs Table:**
- Multi-program support architecture
- Benefit package definitions
- Active/inactive status management

**Case Activities Table:**
- Activity-based case management
- Follow-up scheduling and tracking
- Multi-type support (visit, call, assessment, review, other)
- Outcome and notes recording

### API Design Patterns

The REST API follows resource-oriented design:

**Household Management:**
- `POST /api/households` - Creates household with members atomically
- `GET /api/households` - Lists all households
- `GET /api/households/:id` - Retrieves household with full member details
- Auto-generates household codes on creation
- Supports bulk member creation in single transaction

**Assessment Workflow:**
- `POST /api/assessments` - Records new assessments
- `GET /api/assessments/household/:id` - Retrieves assessment history
- Automatically updates household vulnerability scores

**Grievance System:**
- `POST /api/grievances` - Submits new grievances
- `GET /api/grievances` - Lists all grievances
- `PATCH /api/grievances/:id/status` - Updates grievance status

**Payment Processing:**
- `POST /api/payments` - Records payment disbursements
- `GET /api/payments` - Lists payment history
- `GET /api/payments/household/:id` - Retrieves household payment records

**Case Management:**
- `POST /api/case-activities` - Logs case worker activities
- `GET /api/case-activities/household/:id` - Retrieves case history

**Program Administration:**
- `POST /api/programs` - Creates assistance programs
- `GET /api/programs` - Lists available programs
- CRUD operations for program management

### Frontend Architecture

**Component Organization:**
- Page-level components in `client/src/pages/`
- Shared layout components in `client/src/components/layout/`
- Reusable UI primitives in `client/src/components/ui/` (Shadcn)
- Custom hooks in `client/src/hooks/`

**State Management Strategy:**
- Server state managed via TanStack Query with query keys
- Form state via React Hook Form
- No global client state management (intentionally simple)
- Optimistic updates for better UX

**Routing Structure:**
- `/` - Dashboard with KPI overview
- `/registration` - Household intake and registration
- `/assessments` - Eligibility determination workflows
- `/cases` - Case management and follow-ups
- `/payments` - Payment disbursement tracking
- `/grievances` - Grievance management system
- `/reports` - Monitoring & Evaluation reports
- `/admin/*` - Administrative functions (users, programs, settings, forms, BI tools, interop)

**Design System:**
- Custom CSS variables for theming
- Neutral color palette (configurable via components.json)
- Custom font pairing: Inter (sans-serif) + Outfit (headings)
- Consistent spacing and elevation system
- Mobile-responsive breakpoint at 768px

### Security Considerations

**Session Management:**
- Connect-pg-simple for PostgreSQL-backed sessions
- HTTP-only session cookies
- Session store configuration for production use

**Data Validation:**
- Zod schemas shared between client and server
- Runtime validation on all API endpoints
- Type-safe database queries via Drizzle

**Environment Configuration:**
- DATABASE_URL required for Postgres connection
- Build-time configuration via environment variables
- Development vs production mode handling

### Integration Points

**Kobo Toolbox Integration:**
- Referenced in requirements for field data collection
- Form structure synchronization needed
- Offline data collection support

**Planned External Systems:**
- BI and reporting tools (admin interface placeholder)
- Data exchange/interoperability system (admin interface placeholder)
- Form builder for dynamic data collection

## External Dependencies

### Database
- **Neon Serverless PostgreSQL** - Primary database via `@neondatabase/serverless` driver
- WebSocket-based connection pooling
- Drizzle ORM for query building and migrations
- Schema defined in `shared/schema.ts`

### UI Component Libraries
- **Radix UI** - Headless component primitives (20+ components including dialogs, dropdowns, tooltips, etc.)
- **Shadcn UI** - Pre-styled component library built on Radix
- **Lucide React** - Icon library
- **Recharts** - Charting library for data visualization

### Form Handling
- **React Hook Form** - Form state management
- **Zod** - Schema validation and type generation
- **@hookform/resolvers** - Zod integration with React Hook Form

### Development Tools
- **Replit-specific plugins** - Vite plugins for development environment, error overlays, and cartographer
- **ESBuild** - Server bundling
- **TypeScript** - Type safety across the stack
- **PostCSS** with **Autoprefixer** - CSS processing

### Session & State
- **Express Session** - Session middleware
- **Connect-pg-simple** - PostgreSQL session store
- **TanStack Query** - Async state management

### Utility Libraries
- **date-fns** - Date manipulation and formatting
- **clsx** + **tailwind-merge** - Conditional className composition
- **class-variance-authority** - Component variant management
- **nanoid** - Unique ID generation

### External Service Integrations (Planned)
- **Kobo Toolbox** - Field data collection and form management
- Business Intelligence tools (TBD)
- External data exchange systems (TBD)