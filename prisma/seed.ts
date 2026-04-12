import { PrismaClient, Role, ProjectStatus, TaskStatus, TaskPriority, MilestoneStatus } from "@prisma/client"
import bcrypt from "bcryptjs"
import { subDays, addDays } from "date-fns"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting seed...")

  // Clean existing data
  await prisma.activityLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.groupMessage.deleteMany()
  await prisma.groupMember.deleteMany()
  await prisma.group.deleteMany()
  await prisma.message.deleteMany()
  await prisma.conversationMember.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.taskTag.deleteMany()
  await prisma.task.deleteMany()
  await prisma.milestone.deleteMany()
  await prisma.projectFile.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.project.deleteMany()
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.verificationToken.deleteMany()
  await prisma.user.deleteMany()

  // ──────────────── USERS ────────────────
  const hashedPasswords = await Promise.all([
    bcrypt.hash("Admin@1234", 12),
    bcrypt.hash("Alice@1234", 12),
    bcrypt.hash("Bob@1234", 12),
    bcrypt.hash("Carol@1234", 12),
    bcrypt.hash("Dave@1234", 12),
  ])

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@ipcpms.app",
      passwordHash: hashedPasswords[0],
      role: Role.ADMIN,
      department: "Administration",
      bio: "System administrator for IPCPMS",
      emailVerified: new Date(),
    },
  })

  const alice = await prisma.user.create({
    data: {
      name: "Alice Manager",
      email: "alice@ipcpms.app",
      passwordHash: hashedPasswords[1],
      role: Role.MANAGER,
      department: "Mechatronics Engineering",
      bio: "Project lead for automation systems",
      emailVerified: new Date(),
    },
  })

  const bob = await prisma.user.create({
    data: {
      name: "Bob Manager",
      email: "bob@ipcpms.app",
      passwordHash: hashedPasswords[2],
      role: Role.MANAGER,
      department: "Electrical Engineering",
      bio: "Energy systems specialist",
      emailVerified: new Date(),
    },
  })

  const carol = await prisma.user.create({
    data: {
      name: "Carol Member",
      email: "carol@ipcpms.app",
      passwordHash: hashedPasswords[3],
      role: Role.MEMBER,
      department: "Mechatronics Engineering",
      bio: "Hardware design enthusiast",
      emailVerified: new Date(),
    },
  })

  const dave = await prisma.user.create({
    data: {
      name: "Dave Member",
      email: "dave@ipcpms.app",
      passwordHash: hashedPasswords[4],
      role: Role.MEMBER,
      department: "Agricultural Engineering",
      bio: "Irrigation and control systems",
      emailVerified: new Date(),
    },
  })

  const allUsers = [admin, alice, bob, carol, dave]

  // ──────────────── PROJECTS ────────────────
  const project1 = await prisma.project.create({
    data: {
      name: "Steel Mill Automation",
      description: "Design and implementation of an automated control system for a steel mill production line, including PLC programming, SCADA integration, and real-time monitoring dashboards.",
      status: ProjectStatus.ACTIVE,
      startDate: subDays(new Date(), 60),
      endDate: addDays(new Date(), 30),
      coverColor: "#2563eb",
    },
  })

  const project2 = await prisma.project.create({
    data: {
      name: "Campus Energy Monitor",
      description: "Development of a smart energy monitoring system for FUNAAB campus buildings, featuring IoT sensors, real-time power consumption tracking, and analytics for energy optimization.",
      status: ProjectStatus.PLANNING,
      startDate: addDays(new Date(), 7),
      endDate: addDays(new Date(), 120),
      coverColor: "#059669",
    },
  })

  const project3 = await prisma.project.create({
    data: {
      name: "Crop Irrigation Control",
      description: "An automated drip irrigation system controlled by soil moisture sensors, weather data integration, and a mobile-friendly dashboard for remote farm management.",
      status: ProjectStatus.COMPLETED,
      startDate: subDays(new Date(), 120),
      endDate: subDays(new Date(), 10),
      coverColor: "#d97706",
    },
  })

  const projects = [project1, project2, project3]

  // ──────────────── PROJECT MEMBERS ────────────────
  const memberAssignments = [
    { projectId: project1.id, userId: alice.id, role: Role.MANAGER },
    { projectId: project1.id, userId: carol.id, role: Role.MEMBER },
    { projectId: project1.id, userId: dave.id, role: Role.MEMBER },
    { projectId: project1.id, userId: admin.id, role: Role.ADMIN },
    { projectId: project2.id, userId: bob.id, role: Role.MANAGER },
    { projectId: project2.id, userId: carol.id, role: Role.MEMBER },
    { projectId: project2.id, userId: admin.id, role: Role.ADMIN },
    { projectId: project3.id, userId: alice.id, role: Role.MANAGER },
    { projectId: project3.id, userId: dave.id, role: Role.MEMBER },
    { projectId: project3.id, userId: bob.id, role: Role.MEMBER },
    { projectId: project3.id, userId: admin.id, role: Role.ADMIN },
  ]

  for (const member of memberAssignments) {
    await prisma.projectMember.create({ data: member })
  }

  // ──────────────── TASKS ────────────────
  const taskDefinitions: Array<{
    title: string
    description: string
    status: TaskStatus
    priority: TaskPriority
    projectId: string
    assigneeId: string
    creatorId: string
    dueDate: Date
    completedAt?: Date
    position: number
  }> = [
    // Project 1: Steel Mill Automation (5 tasks)
    { title: "PLC Program Architecture", description: "Design the overall PLC program structure including I/O mapping, function blocks, and communication protocols.", status: TaskStatus.DONE, priority: TaskPriority.HIGH, projectId: project1.id, assigneeId: alice.id, creatorId: alice.id, dueDate: subDays(new Date(), 30), completedAt: subDays(new Date(), 32), position: 0 },
    { title: "SCADA Dashboard Design", description: "Create HMI screens for the SCADA system showing real-time process variables, alarms, and trends.", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, projectId: project1.id, assigneeId: carol.id, creatorId: alice.id, dueDate: addDays(new Date(), 7), position: 0 },
    { title: "Motor Drive Integration", description: "Configure and test variable frequency drives for conveyor belt motors with speed feedback loops.", status: TaskStatus.IN_REVIEW, priority: TaskPriority.MEDIUM, projectId: project1.id, assigneeId: dave.id, creatorId: alice.id, dueDate: addDays(new Date(), 3), position: 0 },
    { title: "Safety System Implementation", description: "Implement emergency stop circuits, safety interlocks, and SIL-rated safety functions.", status: TaskStatus.TODO, priority: TaskPriority.CRITICAL, projectId: project1.id, assigneeId: carol.id, creatorId: alice.id, dueDate: addDays(new Date(), 14), position: 1 },
    { title: "Communication Protocol Testing", description: "Test Modbus TCP/IP and Profinet communication between PLCs, drives, and SCADA servers.", status: TaskStatus.BLOCKED, priority: TaskPriority.MEDIUM, projectId: project1.id, assigneeId: dave.id, creatorId: alice.id, dueDate: addDays(new Date(), 10), position: 0 },

    // Project 2: Campus Energy Monitor (5 tasks)
    { title: "IoT Sensor Specification", description: "Select and specify current transformers, voltage sensors, and data acquisition modules for each campus building.", status: TaskStatus.TODO, priority: TaskPriority.HIGH, projectId: project2.id, assigneeId: bob.id, creatorId: bob.id, dueDate: addDays(new Date(), 21), position: 0 },
    { title: "Database Schema Design", description: "Design the time-series database schema for storing energy consumption data with appropriate indexing.", status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, projectId: project2.id, assigneeId: carol.id, creatorId: bob.id, dueDate: addDays(new Date(), 28), position: 1 },
    { title: "API Design Document", description: "Create OpenAPI specification for the energy data REST API including authentication and rate limiting.", status: TaskStatus.IN_PROGRESS, priority: TaskPriority.MEDIUM, projectId: project2.id, assigneeId: bob.id, creatorId: bob.id, dueDate: addDays(new Date(), 14), position: 0 },
    { title: "Dashboard Wireframes", description: "Design wireframes for the energy monitoring dashboard with real-time graphs and historical analysis views.", status: TaskStatus.TODO, priority: TaskPriority.LOW, projectId: project2.id, assigneeId: carol.id, creatorId: bob.id, dueDate: addDays(new Date(), 35), position: 2 },
    { title: "Network Architecture Plan", description: "Plan the campus network topology for IoT sensor connectivity including LoRaWAN gateway placement.", status: TaskStatus.TODO, priority: TaskPriority.HIGH, projectId: project2.id, assigneeId: bob.id, creatorId: bob.id, dueDate: addDays(new Date(), 14), position: 3 },

    // Project 3: Crop Irrigation Control (5 tasks)
    { title: "Soil Moisture Sensor Calibration", description: "Calibrate capacitive soil moisture sensors for different soil types found in FUNAAB experimental farms.", status: TaskStatus.DONE, priority: TaskPriority.HIGH, projectId: project3.id, assigneeId: dave.id, creatorId: alice.id, dueDate: subDays(new Date(), 60), completedAt: subDays(new Date(), 62), position: 0 },
    { title: "Valve Controller PCB Design", description: "Design the PCB for the solenoid valve controller with solar power management circuit.", status: TaskStatus.DONE, priority: TaskPriority.HIGH, projectId: project3.id, assigneeId: bob.id, creatorId: alice.id, dueDate: subDays(new Date(), 45), completedAt: subDays(new Date(), 47), position: 1 },
    { title: "Weather API Integration", description: "Integrate OpenWeatherMap API for rain prediction to optimize irrigation scheduling algorithms.", status: TaskStatus.DONE, priority: TaskPriority.MEDIUM, projectId: project3.id, assigneeId: dave.id, creatorId: alice.id, dueDate: subDays(new Date(), 30), completedAt: subDays(new Date(), 28), position: 0 },
    { title: "Mobile Dashboard Development", description: "Build a responsive mobile-first dashboard for farmers to monitor and control irrigation remotely.", status: TaskStatus.DONE, priority: TaskPriority.MEDIUM, projectId: project3.id, assigneeId: bob.id, creatorId: alice.id, dueDate: subDays(new Date(), 20), completedAt: subDays(new Date(), 18), position: 1 },
    { title: "Field Test Report", description: "Document results from the 2-week field test at FUNAAB Teaching & Research Farm, Alabata.", status: TaskStatus.DONE, priority: TaskPriority.LOW, projectId: project3.id, assigneeId: dave.id, creatorId: alice.id, dueDate: subDays(new Date(), 12), completedAt: subDays(new Date(), 11), position: 0 },
  ]

  for (const task of taskDefinitions) {
    await prisma.task.create({ data: task })
  }

  // ──────────────── MILESTONES ────────────────
  const milestoneDefinitions: Array<{
    title: string
    description: string
    status: MilestoneStatus
    dueDate: Date
    projectId: string
  }> = [
    // Project 1
    { title: "Design Phase Complete", description: "All architecture documents, P&IDs, and wiring diagrams finalized", status: MilestoneStatus.ACHIEVED, dueDate: subDays(new Date(), 30), projectId: project1.id },
    { title: "Factory Acceptance Test", description: "Complete FAT at the vendor's facility with client witness", status: MilestoneStatus.IN_PROGRESS, dueDate: addDays(new Date(), 14), projectId: project1.id },
    { title: "Site Commissioning", description: "On-site installation, commissioning, and handover to operations team", status: MilestoneStatus.UPCOMING, dueDate: addDays(new Date(), 30), projectId: project1.id },

    // Project 2
    { title: "Requirements Gathering", description: "Complete stakeholder interviews and system requirements document", status: MilestoneStatus.UPCOMING, dueDate: addDays(new Date(), 14), projectId: project2.id },
    { title: "Prototype Deployment", description: "Deploy monitoring system in 2 pilot buildings", status: MilestoneStatus.UPCOMING, dueDate: addDays(new Date(), 60), projectId: project2.id },
    { title: "Campus-Wide Rollout", description: "Full deployment across all campus buildings with training", status: MilestoneStatus.UPCOMING, dueDate: addDays(new Date(), 120), projectId: project2.id },

    // Project 3
    { title: "Hardware Prototype", description: "Working prototype of sensor node and valve controller", status: MilestoneStatus.ACHIEVED, dueDate: subDays(new Date(), 90), projectId: project3.id },
    { title: "Software Integration", description: "Complete integration of firmware, backend, and mobile app", status: MilestoneStatus.ACHIEVED, dueDate: subDays(new Date(), 45), projectId: project3.id },
    { title: "Final Presentation", description: "Project defense and demonstration to examination panel", status: MilestoneStatus.ACHIEVED, dueDate: subDays(new Date(), 10), projectId: project3.id },
  ]

  for (const milestone of milestoneDefinitions) {
    await prisma.milestone.create({ data: milestone })
  }

  // ──────────────── GROUPS (project-linked) ────────────────
  const group1 = await prisma.group.create({
    data: {
      name: "Steel Mill Automation Team",
      description: "Team channel for the Steel Mill Automation project",
      projectId: project1.id,
      members: {
        create: [
          { userId: alice.id, isAdmin: true },
          { userId: carol.id },
          { userId: dave.id },
          { userId: admin.id },
        ],
      },
    },
  })

  const group2 = await prisma.group.create({
    data: {
      name: "Campus Energy Monitor Team",
      description: "Team channel for the Campus Energy Monitor project",
      projectId: project2.id,
      members: {
        create: [
          { userId: bob.id, isAdmin: true },
          { userId: carol.id },
          { userId: admin.id },
        ],
      },
    },
  })

  const group3 = await prisma.group.create({
    data: {
      name: "Crop Irrigation Control Team",
      description: "Team channel for the Crop Irrigation Control project",
      projectId: project3.id,
      members: {
        create: [
          { userId: alice.id, isAdmin: true },
          { userId: dave.id },
          { userId: bob.id },
          { userId: admin.id },
        ],
      },
    },
  })

  // ──────────────── GROUP MESSAGES ────────────────
  const groupMessages = [
    { content: "Welcome to the Steel Mill Automation project channel! Let's use this for all project-related discussions.", groupId: group1.id, senderId: alice.id, createdAt: subDays(new Date(), 55) },
    { content: "I've uploaded the initial P&ID diagrams to the project files. Please review when you get a chance.", groupId: group1.id, senderId: carol.id, createdAt: subDays(new Date(), 50) },
    { content: "The PLC program architecture is looking good. Let's schedule a review meeting for next week.", groupId: group1.id, senderId: alice.id, createdAt: subDays(new Date(), 40) },
    { content: "Hey team! I've started setting up the IoT sensor lab for our energy monitoring project.", groupId: group2.id, senderId: bob.id, createdAt: subDays(new Date(), 5) },
    { content: "Great work on the Crop Irrigation project everyone! The field tests went really well.", groupId: group3.id, senderId: alice.id, createdAt: subDays(new Date(), 15) },
    { content: "Thanks Alice! The soil moisture readings were very accurate. Farmers were impressed.", groupId: group3.id, senderId: dave.id, createdAt: subDays(new Date(), 14) },
  ]

  for (const msg of groupMessages) {
    await prisma.groupMessage.create({ data: msg })
  }

  // ──────────────── DIRECT CONVERSATIONS ────────────────
  const conversation1 = await prisma.conversation.create({
    data: {
      lastMessageAt: subDays(new Date(), 1),
      members: {
        create: [
          { userId: alice.id },
          { userId: carol.id },
        ],
      },
    },
  })

  const conversation2 = await prisma.conversation.create({
    data: {
      lastMessageAt: subDays(new Date(), 2),
      members: {
        create: [
          { userId: bob.id },
          { userId: dave.id },
        ],
      },
    },
  })

  const directMessages = [
    { content: "Hey Carol, how's the SCADA dashboard coming along?", conversationId: conversation1.id, senderId: alice.id, createdAt: subDays(new Date(), 3) },
    { content: "It's going well! I've finished the process overview screen. Working on the trend displays now.", conversationId: conversation1.id, senderId: carol.id, createdAt: subDays(new Date(), 3) },
    { content: "Awesome! Can you show me a preview in our next standup?", conversationId: conversation1.id, senderId: alice.id, createdAt: subDays(new Date(), 2) },
    { content: "Sure thing! I'll have the alarm management page ready too.", conversationId: conversation1.id, senderId: carol.id, createdAt: subDays(new Date(), 1) },
    { content: "Dave, do you have experience with LoRaWAN sensor networks?", conversationId: conversation2.id, senderId: bob.id, createdAt: subDays(new Date(), 5) },
    { content: "Yes! I used LoRa modules in the irrigation project. They worked great for long-range, low-power comms.", conversationId: conversation2.id, senderId: dave.id, createdAt: subDays(new Date(), 4) },
    { content: "Perfect. Would you mind helping with the gateway placement plan for the campus project?", conversationId: conversation2.id, senderId: bob.id, createdAt: subDays(new Date(), 3) },
    { content: "Happy to help! Let's meet at the engineering lab on Thursday.", conversationId: conversation2.id, senderId: dave.id, createdAt: subDays(new Date(), 2) },
  ]

  for (const msg of directMessages) {
    await prisma.message.create({ data: msg })
  }

  // ──────────────── ACTIVITY LOGS (30 days) ────────────────
  const actions = ["created_task", "completed_task", "sent_message", "uploaded_file"]
  const details: Record<string, string[]> = {
    created_task: ["Created new task for review", "Added task to backlog", "Created high-priority task"],
    completed_task: ["Marked task as done", "Completed milestone task", "Finished code review task"],
    sent_message: ["Sent a DM", "Posted in group chat", "Shared project update"],
    uploaded_file: ["Uploaded design document", "Added test results PDF", "Shared schematic file"],
  }

  for (let day = 0; day < 30; day++) {
    const date = subDays(new Date(), day)
    const numActivities = Math.floor(Math.random() * 6) + 1

    for (let i = 0; i < numActivities; i++) {
      const user = allUsers[Math.floor(Math.random() * allUsers.length)]
      const project = projects[Math.floor(Math.random() * projects.length)]
      const action = actions[Math.floor(Math.random() * actions.length)]
      const detailOptions = details[action]
      const detail = detailOptions[Math.floor(Math.random() * detailOptions.length)]

      await prisma.activityLog.create({
        data: {
          userId: user.id,
          projectId: project.id,
          action,
          detail,
          createdAt: new Date(date.getTime() + Math.random() * 86400000),
        },
      })
    }
  }

  // ──────────────── SUMMARY ────────────────
  const userCount = await prisma.user.count()
  const projectCount = await prisma.project.count()
  const taskCount = await prisma.task.count()
  const milestoneCount = await prisma.milestone.count()
  const groupCount = await prisma.group.count()

  console.log(`✅ Seeded: ${userCount} users, ${projectCount} projects, ${taskCount} tasks, ${milestoneCount} milestones, ${groupCount} groups`)
  console.log(`📧 Login with: admin@ipcpms.app / Admin@1234`)
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
