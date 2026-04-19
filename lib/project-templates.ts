/**
 * lib/project-templates.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Static template data sourced from IPCPMS mds/seed-task.md.
 * Embedded as a compile-time constant — no filesystem access at runtime.
 */

// ─── Allowed values ───────────────────────────────────────────────────────────

export const COURSE_CODES = ["MTE 302", "MTE 403", "MTE 599"] as const
export type CourseCode = (typeof COURSE_CODES)[number]

export const PROJECT_TYPES = [
  "Embedded Systems",
  "Robotics",
  "Industrial Automation",
  "Capstone",
] as const
export type ProjectType = (typeof PROJECT_TYPES)[number]

// ─── Task templates (from seed-task.md) ──────────────────────────────────────

export const TASK_TEMPLATES: Record<string, string[]> = {
  "Embedded Systems": [
    "System Requirements & Component Selection",
    "Circuit Schematic Capture",
    "PCB Layout Design (Altium/Proteus/KiCAD)",
    "BOM (Bill of Materials) Generation",
    "Firmware Logic Development (C/C++/MicroPython/Arduino)",
    "Power Consumption Optimization & Analysis",
    "Hardware Assembly & Soldering",
    "System Debugging & Oscilloscope Testing",
  ],
  "Robotics": [
    "Kinematic Modeling & Mathematical Analysis",
    "Chassis Mechanical Design (SolidWorks)",
    "Motor Driver & Actuator Configuration",
    "BOM (Bill of Materials) Generation",
    "Sensor Integration (IMU, LiDAR, Ultrasonic)",
    "SLAM Algorithm Implementation",
    "Path Planning & Navigation Simulation (Gazebo/ROS 2)",
    "Real-time Control Loop Tuning (PID)",
    "Field Performance Testing & Data Logging",
  ],
  "Industrial Automation": [
    "I/O Mapping & Wiring Diagrams",
    "PLC Logic Programming (Ladder/Structured Text)",
    "HMI (Human-Machine Interface) Design",
    "BOM (Bill of Materials) Generation",
    "Safety Interlock & Emergency Stop Verification",
    "SCADA Integration & Real-time Monitoring",
    "Sensor Calibration (Pressure, Flow, Temperature)",
    "Control Panel Assembly & Layout",
    "System Commissioning & Stress Testing",
  ],
  "Capstone": [
    "Detailed Project Proposal & Approval",
    "Literature Review & Comparative Study",
    "BOM (Bill of Materials) Generation",
    "Comprehensive System Architecture Design",
    "Component Prototyping",
    "Full System Integration",
    "Performance Evaluation & Result Analysis",
    "Technical Thesis Writing & Formatting 1",
    "Technical Thesis Writing & Formatting 2",
    "Final Project Defense & Presentation Preparation",
  ],
}

// ─── Professional auto-descriptions ──────────────────────────────────────────

export const PROJECT_DESCRIPTIONS: Record<string, string> = {
  "Embedded Systems":
    "A microcontroller-based hardware and firmware development project covering schematic capture, PCB layout, BOM generation, C/C++ firmware development, and oscilloscope-verified system testing.",
  "Robotics":
    "An autonomous systems project encompassing kinematic modelling, mechanical design, sensor fusion (IMU, LiDAR), SLAM implementation, ROS 2 simulation, and PID-tuned real-time control loops.",
  "Industrial Automation":
    "A factory-scale automation project covering PLC ladder-logic programming, HMI design, SCADA integration, safety interlock verification, and full system commissioning and stress testing.",
  "Capstone":
    "A comprehensive capstone engineering project spanning formal proposal approval, literature review, system architecture design, full integration, performance analysis, and final thesis defence preparation.",
}

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Returns the ordered task title list for a given project type,
 * or an empty array if the type has no template.
 */
export function getTasksForType(projectType: string): string[] {
  return TASK_TEMPLATES[projectType] ?? []
}

/**
 * Returns a professional auto-description for a project type,
 * or undefined if none exists (caller should use user input or leave blank).
 */
export function getDescriptionForType(projectType: string): string | undefined {
  return PROJECT_DESCRIPTIONS[projectType]
}
