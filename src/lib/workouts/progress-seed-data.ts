export type ProgressSeedSessionTemplate = {
  daysAgo: number
  note?: string
  values: number[]
}

export type ProgressSeedScenario = {
  caseId: string
  exerciseName: string
  expectedOutcome: string
  sessions: ProgressSeedSessionTemplate[]
}

export const workoutProgressSeedScenarios: ProgressSeedScenario[] = [
  {
    caseId: "C2",
    exerciseName: "Pecho plano con barra",
    expectedOutcome: "Single session state for weight tracking.",
    sessions: [
      {
        daysAgo: 4,
        note: "Reference single-session case.",
        values: [35, 37.5, 40],
      },
    ],
  },
  {
    caseId: "C3",
    exerciseName: "Twist sin peso",
    expectedOutcome: "Short history without trend badge.",
    sessions: [
      {
        daysAgo: 70,
        values: [12, 12, 12],
      },
      {
        daysAgo: 56,
        values: [13, 13, 13],
      },
      {
        daysAgo: 42,
        values: [13, 13, 13],
      },
      {
        daysAgo: 21,
        values: [14, 14, 14],
      },
      {
        daysAgo: 7,
        note: "Short-history case before trend is available.",
        values: [15, 15, 15],
      },
    ],
  },
  {
    caseId: "C4",
    exerciseName: "Remo bajo",
    expectedOutcome: "Upward trend with six sessions.",
    sessions: [
      {
        daysAgo: 84,
        values: [37.5, 40, 40],
      },
      {
        daysAgo: 63,
        values: [40, 42.5, 42.5],
      },
      {
        daysAgo: 49,
        values: [42.5, 45, 45],
      },
      {
        daysAgo: 28,
        values: [47.5, 50, 50],
      },
      {
        daysAgo: 14,
        values: [50, 52.5, 52.5],
      },
      {
        daysAgo: 3,
        note: "Strong finish for the upward-trend case.",
        values: [52.5, 55, 55],
      },
    ],
  },
  {
    caseId: "C5",
    exerciseName: "Fondo tríceps en banco",
    expectedOutcome: "Stable trend with enough history.",
    sessions: [
      {
        daysAgo: 75,
        values: [15, 15, 15],
      },
      {
        daysAgo: 61,
        values: [16, 15, 15],
      },
      {
        daysAgo: 47,
        values: [15, 15, 15],
      },
      {
        daysAgo: 33,
        values: [15, 15, 15],
      },
      {
        daysAgo: 19,
        values: [16, 15, 15],
      },
      {
        daysAgo: 5,
        note: "Stable trend case.",
        values: [15, 15, 15],
      },
    ],
  },
  {
    caseId: "C6",
    exerciseName: "Plancha ventral",
    expectedOutcome: "Downward trend for time tracking.",
    sessions: [
      {
        daysAgo: 72,
        values: [60, 60, 60],
      },
      {
        daysAgo: 58,
        values: [62, 62, 62],
      },
      {
        daysAgo: 44,
        values: [64, 64, 64],
      },
      {
        daysAgo: 30,
        values: [58, 58, 58],
      },
      {
        daysAgo: 16,
        values: [56, 56, 56],
      },
      {
        daysAgo: 2,
        note: "Deload week for the downward-trend case.",
        values: [54, 54, 54],
      },
    ],
  },
  {
    caseId: "C7",
    exerciseName: "Silla de cuádriceps",
    expectedOutcome:
      "Old record outside the recent range and multiple sessions without improvement.",
    sessions: [
      {
        daysAgo: 130,
        values: [37.5, 40, 40],
      },
      {
        daysAgo: 120,
        values: [42.5, 45, 45],
      },
      {
        daysAgo: 110,
        note: "Historical personal record.",
        values: [47.5, 50, 50],
      },
      {
        daysAgo: 25,
        values: [47.5, 49, 49],
      },
      {
        daysAgo: 18,
        values: [47.5, 49, 49],
      },
      {
        daysAgo: 11,
        values: [47.5, 48, 48],
      },
      {
        daysAgo: 6,
        values: [47.5, 48, 48],
      },
      {
        daysAgo: 1,
        note: "Plateau case with no recent improvement.",
        values: [46.5, 47, 47],
      },
    ],
  },
  {
    caseId: "C8",
    exerciseName: "Plancha lateral",
    expectedOutcome: "History only visible in the all-time range.",
    sessions: [
      {
        daysAgo: 520,
        values: [20, 20, 20],
      },
      {
        daysAgo: 480,
        values: [22, 22, 22],
      },
      {
        daysAgo: 430,
        values: [25, 25, 25],
      },
      {
        daysAgo: 390,
        note: "Old history case for empty recent ranges.",
        values: [30, 30, 30],
      },
    ],
  },
]
