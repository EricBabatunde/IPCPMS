# AI Coding Prompt — Integrated Project Collaboration and Progress Management System
### MTE 504 (Software Engineering) | Federal University of Agriculture, Abeokuta (FUNAAB)
### Stack: Next.js 14 App Router · TypeScript · Prisma · PostgreSQL · NextAuth v5 · Pusher · Recharts · PWA

---

## ⚠️ PRIME DIRECTIVES — READ FIRST, VIOLATE NONE

1. **No placeholders.** Every function, route, component, and hook must be fully implemented. No `// TODO`, `// implement later`, or stub returns.
2. **No substitutions.** If a library is named below, use exactly that library at exactly that version. Do not swap alternatives.
3. **No hardcoded secrets.** All credentials come from environment variables only.
4. **No `any`.** TypeScript strict mode is on. Every value must be typed — props, API responses, Prisma results, Pusher payloads.
5. **No static chart data.** Every chart fetches from its API endpoint. Recharts renders real DB data.
6. **No skipped states.** Every async component needs a skeleton loader, an empty state UI, and an error boundary fallback.
7. **`tsc --noEmit` must pass.** Zero TypeScript errors before generation is considered complete.

---

## 1. PROJECT OVERVIEW

**System Name:** Integrated Project Collaboration and Progress Management System (IPCPMS)

**Purpose:** A production-grade, full-stack web platform enabling academic and engineering project teams to collaborate in real time — tracking milestones, managing tasks on a Kanban board, communicating via direct and group messaging, and visualizing project health through an analytics dashboard with Power BI / Tableau-quality charts.

**Academic Context:** This fulfills the MTE 504 capstone software project requirement for Mechatronics Engineering at FUNAAB. The codebase must demonstrate clean architecture, separation of concerns, documented API design, and industry-standard engineering practices suitable for academic evaluation.

**User Roles:**

| Role | Permissions |
|---|---|
| `ADMIN` | Full system access; manage all users, projects, and settings |
| `MANAGER` | Create/edit/delete projects they own; manage project members and tasks |
| `MEMBER` | View and contribute to assigned projects; create/update own tasks |
| `SUPERVISOR` | Read-only access to all dashboards and analytics; cannot modify data |

---

## 2. EXACT PACKAGE VERSIONS — USE THESE, NO OTHERS

Initialize the project with:
```bash
npx create-next-app@14 ipcpms --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

Then install the following exact packages:

```bash
# Core
npm install next@14.2.5 react@18.3.1 react-dom@18.3.1

# Auth
npm install next-auth@5.0.0-beta.19 bcryptjs@2.4.3
npm install -D @types/bcryptjs

# Database
npm install prisma@5.16.1 @prisma/client@5.16.1

# Real-time
npm install pusher@5.2.0 pusher-js@8.4.0-rc2

# UI
npm install @radix-ui/react-avatar @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-popover @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-sheet @radix-ui/react-slot @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-tooltip
npm install class-variance-authority clsx tailwind-merge lucide-react next-themes sonner

# Charts
npm install recharts@2.12.7

# Forms & Validation
npm install react-hook-form@7.52.1 @hookform/resolvers@3.9.0 zod@3.23.8

# Server state
npm install @tanstack/react-query@5.51.1 @tanstack/react-query-devtools@5.51.1

# Client state
npm install zustand@4.5.4

# Drag and drop (Kanban)
npm install @dnd-kit/core@6.1.0 @dnd-kit/sortable@8.0.0 @dnd-kit/utilities@3.2.2

# File uploads
npm install uploadthing@6.13.2 @uploadthing/react@6.7.2

# Email
npm install resend@3.4.0

# PWA — use the maintained fork, NOT next-pwa
npm install @ducanh2912/next-pwa@10.2.5 workbox-webpack-plugin@7.1.0

# Dates & utilities
npm install date-fns@3.6.0
npm install -D @types/node @types/react @types/react-dom typescript tailwindcss-animate
```

Add to `package.json` scripts:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  }
}
```

---

## 3. ENVIRONMENT VARIABLES

**`.env.example`** (commit this — never commit `.env`):
```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/ipcpms"

# NextAuth v5 — NOTE: AUTH_SECRET, not NEXTAUTH_SECRET
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"

# Google OAuth (optional — set up at console.cloud.google.com)
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""

# Pusher — get from pusher.com dashboard
PUSHER_APP_ID=""
PUSHER_SECRET=""
PUSHER_KEY=""
PUSHER_CLUSTER="mt1"
NEXT_PUBLIC_PUSHER_KEY=""
NEXT_PUBLIC_PUSHER_CLUSTER="mt1"

# UploadThing — get from uploadthing.com
UPLOADTHING_SECRET=""
UPLOADTHING_APP_ID=""

# Resend — get from resend.com
RESEND_API_KEY=""
RESEND_FROM_EMAIL="noreply@ipcpms.app"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 4. COMPLETE FILE STRUCTURE

Every file listed here must be created. None are optional.

```
/
├── app/
│   ├── layout.tsx                          ← Root layout: fonts, ThemeProvider, Providers
│   ├── page.tsx                            ← Root redirect → /dashboard if authed, /login if not
│   ├── not-found.tsx                       ← Global 404 page
│   ├── error.tsx                           ← Global error boundary (client component)
│   ├── loading.tsx                         ← Global loading fallback
│   │
│   ├── (auth)/
│   │   ├── layout.tsx                      ← Centered card layout for auth pages
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx         ← Reads ?token= from searchParams
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx                      ← Sidebar + Topbar shell
│   │   ├── dashboard/
│   │   │   ├── page.tsx                    ← Analytics overview (Server Component)
│   │   │   └── loading.tsx                 ← Dashboard skeleton
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── [projectId]/
│   │   │       ├── page.tsx                ← Project overview tab
│   │   │       ├── loading.tsx
│   │   │       ├── error.tsx
│   │   │       ├── tasks/page.tsx          ← Kanban board
│   │   │       ├── milestones/page.tsx
│   │   │       ├── members/page.tsx
│   │   │       ├── files/page.tsx
│   │   │       └── settings/page.tsx
│   │   ├── messages/
│   │   │   ├── layout.tsx                  ← Two-panel messaging layout
│   │   │   ├── page.tsx                    ← Conversation list default state
│   │   │   └── [conversationId]/
│   │   │       └── page.tsx
│   │   ├── groups/
│   │   │   └── [groupId]/
│   │   │       └── page.tsx
│   │   ├── team/page.tsx
│   │   ├── notifications/page.tsx
│   │   └── profile/
│   │       ├── page.tsx
│   │       └── [userId]/page.tsx           ← View other user's profile
│   │
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/route.ts
│       ├── projects/
│       │   ├── route.ts                    ← GET list / POST create
│       │   └── [projectId]/
│       │       ├── route.ts                ← GET / PATCH / DELETE
│       │       └── members/
│       │           └── route.ts            ← POST add member / DELETE remove
│       ├── tasks/
│       │   ├── route.ts                    ← GET / POST
│       │   └── [taskId]/
│       │       ├── route.ts                ← GET / PATCH / DELETE
│       │       └── comments/route.ts       ← GET / POST comments
│       ├── milestones/
│       │   ├── route.ts
│       │   └── [milestoneId]/route.ts
│       ├── messages/
│       │   ├── route.ts                    ← GET conversations / POST start DM
│       │   └── [conversationId]/
│       │       └── route.ts                ← GET history / POST send
│       ├── groups/
│       │   ├── route.ts                    ← GET / POST
│       │   └── [groupId]/
│       │       ├── route.ts
│       │       ├── messages/route.ts
│       │       └── members/route.ts
│       ├── pusher/
│       │   └── auth/route.ts               ← Private + Presence channel auth
│       ├── uploadthing/route.ts
│       ├── analytics/route.ts              ← Query-param router for all chart data
│       ├── notifications/
│       │   ├── route.ts
│       │   └── [notificationId]/route.ts
│       └── users/
│           ├── route.ts                    ← Search users
│           └── [userId]/route.ts
│
├── auth.ts                                 ← NextAuth v5 config (ROOT level, not in lib/)
│
├── components/
│   ├── ui/                                 ← All shadcn/ui components (generate with CLI)
│   ├── providers.tsx                       ← Client: QueryClientProvider + Toaster + ThemeProvider
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── ForgotPasswordForm.tsx
│   │   └── ResetPasswordForm.tsx
│   ├── dashboard/
│   │   ├── Sidebar.tsx
│   │   ├── MobileSidebar.tsx
│   │   ├── Topbar.tsx
│   │   ├── NotificationBell.tsx
│   │   └── ActivityFeed.tsx
│   ├── charts/
│   │   ├── ChartCard.tsx                   ← Shared wrapper (title, subtitle, loading state)
│   │   ├── TaskCompletionChart.tsx
│   │   ├── MilestoneProgressChart.tsx
│   │   ├── TeamActivityHeatmap.tsx
│   │   ├── ProjectStatusPieChart.tsx
│   │   ├── BurndownChart.tsx
│   │   └── MemberContributionBarChart.tsx
│   ├── projects/
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectGrid.tsx
│   │   ├── CreateProjectModal.tsx
│   │   └── ProjectStatusBadge.tsx
│   ├── tasks/
│   │   ├── KanbanBoard.tsx                 ← Uses @dnd-kit
│   │   ├── KanbanColumn.tsx
│   │   ├── TaskCard.tsx
│   │   ├── TaskDetailSheet.tsx             ← Slide-over panel
│   │   ├── CreateTaskModal.tsx
│   │   └── TaskPriorityBadge.tsx
│   ├── milestones/
│   │   ├── MilestoneList.tsx
│   │   ├── MilestoneItem.tsx
│   │   └── CreateMilestoneModal.tsx
│   ├── messaging/
│   │   ├── ConversationList.tsx
│   │   ├── MessageThread.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── MessageInput.tsx
│   │   ├── GroupMemberList.tsx
│   │   ├── CreateGroupModal.tsx
│   │   └── TypingIndicator.tsx
│   └── shared/
│       ├── UserAvatar.tsx                  ← Avatar with fallback initials
│       ├── ConfirmDialog.tsx               ← Reusable destructive action dialog
│       ├── EmptyState.tsx                  ← Empty list/error state with icon + message
│       ├── PageHeader.tsx                  ← Page title + breadcrumb + action button
│       ├── DataTable.tsx                   ← Reusable table with sort/filter
│       └── FileIcon.tsx                    ← File type icon resolver
│
├── hooks/
│   ├── useMessages.ts                      ← Pusher subscription + message history
│   ├── useGroupMessages.ts
│   ├── usePresence.ts                      ← Online/offline status
│   ├── useTyping.ts                        ← Typing indicator logic
│   └── useNotifications.ts                 ← Real-time notification badge
│
├── lib/
│   ├── prisma.ts                           ← Singleton PrismaClient
│   ├── pusher.ts                           ← Server Pusher instance
│   ├── pusher-client.ts                    ← Client Pusher singleton
│   ├── uploadthing.ts                      ← UploadThing file router
│   ├── resend.ts                           ← Resend client + email templates
│   ├── utils.ts                            ← cn(), formatDate(), calculateProgress()
│   └── validations/
│       ├── auth.ts                         ← loginSchema, registerSchema, resetPasswordSchema
│       ├── project.ts                      ← createProjectSchema, updateProjectSchema
│       ├── task.ts                         ← createTaskSchema, updateTaskSchema
│       ├── milestone.ts
│       ├── message.ts
│       └── group.ts
│
├── store/
│   └── useAppStore.ts                      ← Zustand: sidebar state, active project, UI flags
│
├── types/
│   ├── index.ts                            ← Re-exports all shared types
│   ├── analytics.ts                        ← All chart data response types
│   ├── messaging.ts                        ← Message, Conversation, GroupMessage types
│   └── next-auth.d.ts                      ← Augment Session with id, role, department
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── public/
│   ├── manifest.json
│   └── icons/
│       ├── icon-192x192.png
│       └── icon-512x512.png
│
├── auth.ts                                 ← NextAuth v5 root config
├── middleware.ts                           ← Route protection using NextAuth v5
├── next.config.mjs                         ← next-pwa + image domains config
├── tailwind.config.ts
└── tsconfig.json                           ← "strict": true, paths alias "@/*": ["./*"]
```

---

## 5. AUTHENTICATION — NEXTAUTH v5 (AUTH.JS)

### Root `auth.ts` (project root, NOT inside `/lib`):

```ts
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { loginSchema } from "@/lib/validations/auth"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })
        if (!user || !user.passwordHash) return null

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!valid) return null

        return user
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.department = user.department
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.department = token.department as string
      }
      return session
    },
  },
})
```

### `middleware.ts`:

```ts
import { auth } from "@/auth"
import { NextResponse } from "next/server"

const publicRoutes = ["/login", "/register", "/forgot-password", "/reset-password"]

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isPublicRoute = publicRoutes.some((r) => req.nextUrl.pathname.startsWith(r))

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }
  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }
  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.json).*)"],
}
```

### `types/next-auth.d.ts`:

```ts
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      department: string | null
    } & DefaultSession["user"]
  }
}
```

### Auth Features to Implement Fully:

1. **Registration** — hash password with `bcrypt.hash(password, 12)`, create user, send verification email via Resend
2. **Login** — Credentials + Google OAuth; show validation errors inline on form
3. **Forgot Password** — generate a `VerificationToken`, email reset link to user via Resend
4. **Reset Password** — validate token (check expiry), hash new password, delete used token
5. **Password Policy** — enforced in Zod: min 8 chars, 1 uppercase, 1 number, 1 special char

### `lib/validations/auth.ts` (define all schemas here):

```ts
import { z } from "zod"

const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[0-9]/, "Must contain a number")
  .regex(/[^A-Za-z0-9]/, "Must contain a special character")

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email(),
  department: z.string().optional(),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
```

---

## 6. DATABASE SCHEMA — `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  MANAGER
  MEMBER
  SUPERVISOR
}

enum ProjectStatus {
  PLANNING
  ACTIVE
  ON_HOLD
  COMPLETED
  CANCELLED
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  DONE
  BLOCKED
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum MilestoneStatus {
  UPCOMING
  IN_PROGRESS
  ACHIEVED
  MISSED
}

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  emailVerified DateTime?
  image         String?
  passwordHash  String?
  role          Role      @default(MEMBER)
  department    String?
  bio           String?
  lastActiveAt  DateTime  @default(now())
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts              Account[]
  sessions              Session[]
  projectMembers        ProjectMember[]
  assignedTasks         Task[]                   @relation("TaskAssignee")
  createdTasks          Task[]                   @relation("TaskCreator")
  comments              Comment[]
  sentMessages          Message[]
  conversationMembers   ConversationMember[]
  groupMembers          GroupMember[]
  sentGroupMessages     GroupMessage[]
  notifications         Notification[]
  activityLogs          ActivityLog[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Project {
  id          String        @id @default(cuid())
  name        String
  description String?       @db.Text
  status      ProjectStatus @default(PLANNING)
  startDate   DateTime
  endDate     DateTime?
  coverColor  String        @default("#2563eb")
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  members      ProjectMember[]
  tasks        Task[]
  milestones   Milestone[]
  files        ProjectFile[]
  activityLogs ActivityLog[]
  group        Group?
}

model ProjectMember {
  id        String   @id @default(cuid())
  projectId String
  userId    String
  role      Role     @default(MEMBER)
  joinedAt  DateTime @default(now())

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([projectId, userId])
}

model Task {
  id          String       @id @default(cuid())
  title       String
  description String?      @db.Text
  status      TaskStatus   @default(TODO)
  priority    TaskPriority @default(MEDIUM)
  position    Int          @default(0)       // for Kanban column ordering
  projectId   String
  assigneeId  String?
  creatorId   String
  dueDate     DateTime?
  completedAt DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  project  Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignee User?     @relation("TaskAssignee", fields: [assigneeId], references: [id])
  creator  User      @relation("TaskCreator", fields: [creatorId], references: [id])
  comments Comment[]
  tags     TaskTag[]
}

model TaskTag {
  id     String @id @default(cuid())
  taskId String
  label  String
  color  String @default("#2563eb")

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
}

model Comment {
  id        String   @id @default(cuid())
  content   String   @db.Text
  taskId    String
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  task   Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  author User @relation(fields: [authorId], references: [id])
}

model Milestone {
  id          String          @id @default(cuid())
  title       String
  description String?         @db.Text
  status      MilestoneStatus @default(UPCOMING)
  dueDate     DateTime
  projectId   String
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model ProjectFile {
  id         String   @id @default(cuid())
  name       String
  url        String
  size       Int
  mimeType   String
  projectId  String
  uploaderId String?
  uploadedAt DateTime @default(now())

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

// ──────────────── MESSAGING ────────────────

model Conversation {
  id            String   @id @default(cuid())
  lastMessageAt DateTime @default(now())
  createdAt     DateTime @default(now())

  members  ConversationMember[]
  messages Message[]
}

model ConversationMember {
  id             String   @id @default(cuid())
  conversationId String
  userId         String
  joinedAt       DateTime @default(now())

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([conversationId, userId])
}

model Message {
  id             String   @id @default(cuid())
  content        String   @db.Text
  conversationId String
  senderId       String
  fileUrl        String?
  fileType       String?
  createdAt      DateTime @default(now())

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender       User         @relation(fields: [senderId], references: [id])
}

model Group {
  id          String   @id @default(cuid())
  name        String
  description String?
  projectId   String?  @unique
  createdAt   DateTime @default(now())

  project  Project?       @relation(fields: [projectId], references: [id])
  members  GroupMember[]
  messages GroupMessage[]
}

model GroupMember {
  id       String   @id @default(cuid())
  groupId  String
  userId   String
  isAdmin  Boolean  @default(false)
  joinedAt DateTime @default(now())

  group Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([groupId, userId])
}

model GroupMessage {
  id        String   @id @default(cuid())
  content   String   @db.Text
  groupId   String
  senderId  String
  fileUrl   String?
  fileType  String?
  createdAt DateTime @default(now())

  group  Group @relation(fields: [groupId], references: [id], onDelete: Cascade)
  sender User  @relation(fields: [senderId], references: [id])  // ← Fixed: relation to User added
}

// ──────────────── SYSTEM ────────────────

model Notification {
  id        String   @id @default(cuid())
  userId    String
  title     String
  body      String
  type      String   // "task_assigned" | "message" | "milestone" | "project_invite"
  read      Boolean  @default(false)
  link      String?
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, read])
}

model ActivityLog {
  id        String   @id @default(cuid())
  userId    String
  projectId String?
  action    String   // "created_task" | "completed_task" | "sent_message" | "uploaded_file"
  detail    String?
  createdAt DateTime @default(now())

  user    User     @relation(fields: [userId], references: [id])
  project Project? @relation(fields: [projectId], references: [id])

  @@index([projectId, createdAt])
  @@index([userId, createdAt])
}
```

---

## 7. REAL-TIME MESSAGING — PUSHER

### `lib/pusher.ts` (server):
```ts
import Pusher from "pusher"

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})
```

### `lib/pusher-client.ts` (client — singleton pattern):
```ts
import PusherClient from "pusher-js"

let pusherInstance: PusherClient | null = null

export function getPusherClient(): PusherClient {
  if (!pusherInstance) {
    pusherInstance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/pusher/auth",
    })
  }
  return pusherInstance
}
```

### `app/api/pusher/auth/route.ts` — handles BOTH private and presence channels:
```ts
import { auth } from "@/auth"
import { pusherServer } from "@/lib/pusher"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

  const body = await req.text()
  const params = new URLSearchParams(body)
  const socketId = params.get("socket_id")!
  const channelName = params.get("channel_name")!

  // Presence channels require user data
  if (channelName.startsWith("presence-")) {
    const presenceData = {
      user_id: session.user.id,
      user_info: { name: session.user.name, image: session.user.image },
    }
    const auth = pusherServer.authorizeChannel(socketId, channelName, presenceData)
    return NextResponse.json(auth)
  }

  // Private channels
  const auth = pusherServer.authorizeChannel(socketId, channelName)
  return NextResponse.json(auth)
}
```

### Channel Naming Convention:
| Channel | Type | Purpose |
|---|---|---|
| `private-conversation-{conversationId}` | Private | Direct messages |
| `private-group-{groupId}` | Private | Group messages |
| `presence-user-{userId}` | Presence | Online/offline detection |
| `private-notifications-{userId}` | Private | Real-time notification push |

### Pusher Events to Implement:
| Event Name | Payload | Direction |
|---|---|---|
| `new-message` | `{ id, content, senderId, senderName, senderImage, createdAt, fileUrl?, fileType? }` | Server → Client |
| `new-group-message` | same shape | Server → Client |
| `client-typing` | `{ userId, userName }` | Client → Client (no server) |
| `client-stop-typing` | `{ userId }` | Client → Client |
| `new-notification` | `{ id, title, body, type, link }` | Server → Client |

### Message Send Flow (both DM and Group):
1. Client POSTs message content to API route
2. API validates session + body (Zod)
3. API saves to DB via Prisma
4. API triggers Pusher event with full message object
5. API creates `ActivityLog` entry
6. API creates `Notification` for recipient(s) and triggers `new-notification` event
7. Returns `{ success: true, data: message }` to sender

### Messaging UI Features:
- **Infinite scroll** — load 30 messages at a time; on scroll-to-top, fetch next page via `cursor`-based pagination
- **Optimistic UI** — append message immediately to UI before server confirms; rollback on error
- **Typing indicators** — debounced; stop typing after 2s of inactivity
- **File attachments** — images render inline; other files show download card
- **Unread counts** — badge on conversation list item; clear on open
- **Auto-scroll** — scroll to bottom on new message only if user was already at bottom

---

## 8. ANALYTICS DASHBOARD — POWER BI / TABLEAU STYLE

### Design Rules (enforce strictly):
- Background: `#f8fafc` (slate-50), sidebar: `#0f172a` (slate-900)
- Chart cards: white background, `rounded-xl`, `shadow-sm`, `border border-slate-200`
- Chart color palette (use in this order): `["#2563eb", "#7c3aed", "#059669", "#d97706", "#dc2626", "#0891b2"]`
- All charts: `ResponsiveContainer width="100%" height={300}` (or specified height)
- All charts: animated on mount (`isAnimationActive={true}`, `animationDuration={800}`)
- All charts: custom `<Tooltip>` with white card, border, and formatted values
- KPI cards: icon (Lucide) + metric label + value + trend indicator (↑↓ with color)

### `types/analytics.ts` — define all response shapes:
```ts
export interface TaskCompletionPoint {
  date: string        // "2024-11-01"
  created: number
  completed: number
}

export interface MilestoneRadialItem {
  milestoneId: string
  title: string
  percentComplete: number  // 0–100, based on days elapsed vs. total duration
  status: "UPCOMING" | "IN_PROGRESS" | "ACHIEVED" | "MISSED"
  fill: string
}

export interface HeatmapCell {
  userId: string
  userName: string
  day: string            // "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"
  activityCount: number
}

export interface ProjectStatusItem {
  status: string
  count: number
  fill: string
}

export interface BurndownPoint {
  date: string
  ideal: number
  actual: number
}

export interface ContributionItem {
  userId: string
  userName: string
  tasksCompleted: number
  commentsPosted: number
  filesUploaded: number
  messagesSent: number
}

export interface DashboardKPIs {
  totalProjects: number
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  projectsDelta: number   // % change from last month
  tasksDelta: number
}
```

### `GET /api/analytics` — response format per `type` query param:
- `?type=kpis` → `DashboardKPIs`
- `?type=task-completion&projectId=&days=30` → `TaskCompletionPoint[]`
- `?type=milestones&projectId=` → `MilestoneRadialItem[]`
- `?type=heatmap&projectId=` → `HeatmapCell[]`
- `?type=project-status` → `ProjectStatusItem[]`
- `?type=burndown&projectId=` → `BurndownPoint[]`
- `?type=contributions&projectId=` → `ContributionItem[]`
- `?type=activity-feed&projectId=&limit=10` → `ActivityLog[]` with user relation

### Chart Implementations:

#### 1. `TaskCompletionChart.tsx`
```
Type: ComposedChart
- Area for "created" (fill: #dbeafe, stroke: #2563eb, opacity 0.6)
- Line for "completed" (stroke: #059669, strokeWidth: 2, dot: false)
- XAxis: tickFormatter using date-fns format(date, "MMM d")
- YAxis: integer ticks only
- CartesianGrid: strokeDasharray="3 3" stroke="#e2e8f0"
- Legend at bottom
- Tooltip: shows date + created count + completed count
```

#### 2. `MilestoneProgressChart.tsx`
```
Type: RadialBarChart
- innerRadius="30%" outerRadius="80%"
- Each RadialBar: data={[{ value: percentComplete }]}, fill from MilestoneRadialItem.fill
- Center label (foreignObject): overall % of milestones achieved
- Custom Legend: milestone titles with colored dots
```

#### 3. `TeamActivityHeatmap.tsx`
```
Custom implementation (not standard Recharts):
- Grid of divs: rows = team members, columns = Mon–Sun
- Cell background: interpolate between #f1f5f9 (0) and #1d4ed8 (max count)
- function getHeatColor(count: number, max: number): string — returns hsl blue scale
- Tooltip on hover: "{userName} — {count} activities on {day}"
- Member names on Y axis, day labels on X axis
```

#### 4. `ProjectStatusPieChart.tsx`
```
Type: PieChart
- Pie: innerRadius={60} outerRadius={100} paddingAngle={4}
- Center: total project count (use <text> inside SVG)
- Animated: animationBegin={0} animationDuration={800}
- renderCustomizedLabel: show percentage outside arc
- Legend: below chart, horizontal layout
```

#### 5. `BurndownChart.tsx`
```
Type: ComposedChart
- Line "ideal": stroke="#94a3b8" strokeDasharray="6 3" strokeWidth={2}
- Line "actual": stroke="#2563eb" strokeWidth={2}
- ReferenceArea: between actual and ideal when actual > ideal, fill="#fee2e2" opacity={0.4}
- XAxis: project date range
- Tooltip: shows date + ideal remaining + actual remaining
```

#### 6. `MemberContributionBarChart.tsx`
```
Type: BarChart layout="vertical"
- Stacked bars: tasksCompleted, commentsPosted, filesUploaded, messagesSent
- Each bar stack a different color from palette
- XAxis: type="number"
- YAxis: type="category" dataKey="userName" width={120}
- LabelList on last stack: shows total
- Legend at top
```

### Dashboard Page Layout — exact grid:
```tsx
// Row 1: KPIs
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <KPICard title="Total Projects" icon={FolderKanban} />
  <KPICard title="Total Tasks" icon={CheckSquare} />
  <KPICard title="Completed" icon={CheckCircle} />
  <KPICard title="Overdue" icon={AlertCircle} color="red" />
</div>

// Row 2: Task Completion (2/3) + Project Status Donut (1/3)
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  <ChartCard className="lg:col-span-2"><TaskCompletionChart /></ChartCard>
  <ChartCard><ProjectStatusPieChart /></ChartCard>
</div>

// Row 3: Burndown (1/2) + Milestone Radial (1/2)
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <ChartCard><BurndownChart /></ChartCard>
  <ChartCard><MilestoneProgressChart /></ChartCard>
</div>

// Row 4: Heatmap (full width)
<ChartCard className="col-span-full"><TeamActivityHeatmap /></ChartCard>

// Row 5: Contribution (2/3) + Activity Feed (1/3)
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  <ChartCard className="lg:col-span-2"><MemberContributionBarChart /></ChartCard>
  <ActivityFeed />
</div>
```

---

## 9. KANBAN BOARD — `@dnd-kit`

The Tasks page (`/projects/[projectId]/tasks`) renders a full drag-and-drop Kanban board.

### Columns (in order):
| Column | TaskStatus | Color |
|---|---|---|
| To Do | `TODO` | slate |
| In Progress | `IN_PROGRESS` | blue |
| In Review | `IN_REVIEW` | amber |
| Done | `DONE` | green |
| Blocked | `BLOCKED` | red |

### Implementation Requirements:
- Use `DndContext` + `SortableContext` from `@dnd-kit/core` and `@dnd-kit/sortable`
- `useSortable` hook on each `TaskCard`
- `useDroppable` on each `KanbanColumn`
- On drag end: optimistically update task status in UI, then PATCH `/api/tasks/[taskId]` with new `status` and `position`
- On PATCH failure: revert to original status with toast error
- Each `TaskCard` shows: title, priority badge (color-coded), assignee avatar, due date (red if overdue), tag chips
- Click `TaskCard` → opens `TaskDetailSheet` (shadcn Sheet from right side) with full description, edit form, comment thread

---

## 10. API ROUTES — FULL SPECIFICATION

All route handlers must follow this pattern:
```ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // ... business logic

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("[ROUTE_NAME_GET]", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
```

### Route Details:

| Method | Path | Auth Required | Body Schema | Notes |
|---|---|---|---|---|
| GET | `/api/projects` | ✅ | — | Only projects where user is a member |
| POST | `/api/projects` | ✅ MANAGER/ADMIN | `createProjectSchema` | Also creates linked Group + GroupMember |
| GET | `/api/projects/[id]` | ✅ member | — | Include members, task counts, milestones |
| PATCH | `/api/projects/[id]` | ✅ MANAGER/ADMIN | `updateProjectSchema` | Recalculate progress |
| DELETE | `/api/projects/[id]` | ✅ ADMIN only | — | Cascade deletes all related data |
| GET | `/api/tasks?projectId=` | ✅ member | — | Grouped by status for Kanban |
| POST | `/api/tasks` | ✅ member | `createTaskSchema` | Log activity, notify assignee |
| PATCH | `/api/tasks/[id]` | ✅ member | `updateTaskSchema` | Set completedAt when status=DONE |
| DELETE | `/api/tasks/[id]` | ✅ MANAGER/ADMIN | — | |
| GET | `/api/tasks/[id]/comments` | ✅ member | — | Ordered by createdAt ASC |
| POST | `/api/tasks/[id]/comments` | ✅ member | `{ content: string }` | Log activity |
| GET | `/api/milestones?projectId=` | ✅ member | — | Ordered by dueDate ASC |
| POST | `/api/milestones` | ✅ MANAGER/ADMIN | `createMilestoneSchema` | |
| PATCH | `/api/milestones/[id]` | ✅ MANAGER/ADMIN | `updateMilestoneSchema` | |
| GET | `/api/messages` | ✅ | — | Conversations with last message + unread count |
| POST | `/api/messages` | ✅ | `{ recipientId: string }` | Find or create conversation |
| GET | `/api/messages/[id]` | ✅ participant | `?cursor=&limit=30` | Cursor pagination, newest-first |
| POST | `/api/messages/[id]` | ✅ participant | `{ content, fileUrl?, fileType? }` | Trigger Pusher + notify |
| GET | `/api/groups` | ✅ | — | Groups user is member of |
| POST | `/api/groups` | ✅ | `createGroupSchema` | |
| GET | `/api/groups/[id]/messages` | ✅ member | `?cursor=&limit=30` | Cursor pagination |
| POST | `/api/groups/[id]/messages` | ✅ member | `{ content, fileUrl?, fileType? }` | Trigger Pusher |
| POST | `/api/groups/[id]/members` | ✅ group admin | `{ userId: string }` | |
| DELETE | `/api/groups/[id]/members` | ✅ group admin | `{ userId: string }` | |
| GET | `/api/analytics` | ✅ | `?type=&projectId=` | Route to correct query |
| GET | `/api/notifications` | ✅ | `?unreadOnly=true` | |
| PATCH | `/api/notifications/[id]` | ✅ owner | — | Set read=true |
| GET | `/api/users` | ✅ | `?search=&limit=10` | For adding members, starting DMs |

---

## 11. PWA CONFIGURATION — USE `@ducanh2912/next-pwa`

> ⚠️ DO NOT use `next-pwa` (shadowwalker). It has unresolved App Router issues. Use `@ducanh2912/next-pwa` which is the actively maintained fork.

### `next.config.mjs`:
```mjs
import withPWAInit from "@ducanh2912/next-pwa"

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
})

export default withPWA({
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "uploadthing.com" },
      { protocol: "https", hostname: "utfs.io" },
    ],
  },
})
```

### `public/manifest.json`:
```json
{
  "name": "IPCPMS — Project Collaboration System",
  "short_name": "IPCPMS",
  "description": "Integrated Project Collaboration and Progress Management System",
  "start_url": "/dashboard",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "categories": ["productivity", "utilities"],
  "icons": [
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

---

## 12. UI/UX REQUIREMENTS

### Component Library:
Initialize shadcn/ui with:
```bash
npx shadcn-ui@latest init
```
Add components: `button card dialog tabs badge avatar dropdown-menu sheet toast skeleton separator scroll-area select label input textarea tooltip popover`

### Theme & Styling:
- Primary: `#2563eb` (blue-600); Destructive: `#dc2626`; Success: `#059669`
- Support **light and dark mode** — implement via `next-themes` + `ThemeProvider` in `components/providers.tsx`
- Theme toggle button in `Topbar.tsx`
- All colors defined as CSS variables in `globals.css` (shadcn/ui convention)

### `components/providers.tsx` (client component — mounts all client-side providers):
```tsx
"use client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60 * 1000, retry: 1 } }
  }))
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        {children}
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
```

### Responsive Layout:
- Sidebar: `w-64` on `lg+`; hidden on mobile with hamburger toggle stored in Zustand
- Topbar: always visible; contains search input, notification bell with badge, theme toggle, user dropdown
- All pages: max-width container with consistent padding (`px-4 md:px-6 lg:px-8`)

### Loading / Error States:
- `loading.tsx` files: full-page skeleton that mirrors the page layout
- `error.tsx` files: centered error card with message + "Try Again" button (`reset()`)
- Empty states: `<EmptyState icon={...} title="..." description="..." action={...} />` — never a blank page

### Toast Conventions (use `sonner`):
```ts
toast.success("Task created")
toast.error("Failed to update project")
toast.promise(mutationFn(), { loading: "Saving...", success: "Saved!", error: "Failed" })
```

---

## 13. SEED DATA — `prisma/seed.ts`

Seed the following. These credentials must work for immediate login after seeding:

| Name | Email | Password | Role |
|---|---|---|---|
| Admin User | admin@ipcpms.app | `Admin@1234` | ADMIN |
| Alice Manager | alice@ipcpms.app | `Alice@1234` | MANAGER |
| Bob Manager | bob@ipcpms.app | `Bob@1234` | MANAGER |
| Carol Member | carol@ipcpms.app | `Carol@1234` | MEMBER |
| Dave Member | dave@ipcpms.app | `Dave@1234` | MEMBER |

Also seed:
- **3 projects**: "Steel Mill Automation" (ACTIVE), "Campus Energy Monitor" (PLANNING), "Crop Irrigation Control" (COMPLETED)
- **15 tasks** spread across projects with varied statuses and priorities
- **3 milestones per project** with varied statuses
- **Activity logs** for last 30 days (for heatmap — generate programmatically with a loop)
- **2 direct conversations** with sample messages
- **Project-linked group chats** with sample group messages (auto-created per project)

Print to console after seed:
```
✅ Seeded: 5 users, 3 projects, 15 tasks, 9 milestones, 3 groups
📧 Login with: admin@ipcpms.app / Admin@1234
```

---

## 14. VALIDATION SCHEMAS — `lib/validations/`

All schemas must export both the Zod schema and its inferred TypeScript type.

**`project.ts`:**
```ts
export const createProjectSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  status: z.nativeEnum(ProjectStatus).default("PLANNING"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  coverColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
})
```

**`task.ts`:**
```ts
export const createTaskSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  status: z.nativeEnum(TaskStatus).default("TODO"),
  priority: z.nativeEnum(TaskPriority).default("MEDIUM"),
  projectId: z.string().cuid(),
  assigneeId: z.string().cuid().optional(),
  dueDate: z.string().datetime().optional(),
})

export const updateTaskSchema = createTaskSchema.partial().extend({
  position: z.number().int().min(0).optional(),
  completedAt: z.string().datetime().nullable().optional(),
})
```

---

## 15. DEPLOYMENT READINESS CHECKLIST

Before marking generation complete, verify all of the following:

- [ ] `tsc --noEmit` passes with zero errors
- [ ] `npm run lint` passes with zero errors  
- [ ] `npx prisma validate` passes on the schema
- [ ] `npx prisma db seed` runs without errors
- [ ] Login with `admin@ipcpms.app / Admin@1234` works
- [ ] Dashboard loads with all 6 charts rendering real data
- [ ] Creating a project auto-creates a linked group chat
- [ ] Sending a DM delivers in real time via Pusher (no page refresh needed)
- [ ] Kanban drag-and-drop persists task status to DB
- [ ] PWA install prompt appears on supported browsers
- [ ] `.env.example` documents every env variable used in the codebase
- [ ] `README.md` includes: prerequisites, env setup, DB setup, seed command, dev command

---

## 16. WHAT NOT TO DO

| ❌ Forbidden | ✅ Instead |
|---|---|
| `pages/` router | App Router only |
| `getServerSideProps` / `getStaticProps` | Server Components + Route Handlers |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | `AUTH_SECRET` / `AUTH_URL` (NextAuth v5) |
| `next-pwa` (shadowwalker) | `@ducanh2912/next-pwa` |
| Socket.io | Pusher only |
| `any` TypeScript type | Explicit types always |
| Hardcoded IDs or secrets | Environment variables |
| Static / mock chart data | All charts fetch from `/api/analytics` |
| Missing loading/empty/error states | Required on every async component |
| Placeholder features or TODO comments | Every feature fully implemented |
| `<form>` HTML element in React | React Hook Form `handleSubmit` with `onClick` |
| Unhandled promise rejections | Every async call wrapped in try/catch |
| Repeated auth checks per route | Shared `requireAuth()` helper in `lib/auth-helpers.ts` |

---

*End of Prompt v2 — Generate the complete, fully-functional application satisfying every requirement above.*
