export interface TaskCompletionPoint {
  date: string
  created: number
  completed: number
}

export interface MilestoneRadialItem {
  milestoneId: string
  title: string
  percentComplete: number
  status: "UPCOMING" | "IN_PROGRESS" | "ACHIEVED" | "MISSED"
  fill: string
}

export interface HeatmapCell {
  userId: string
  userName: string
  day: string
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
  projectsDelta: number
  tasksDelta: number
}
