export type SeedMetricType = "reps" | "weight" | "time"
export type SeedLogType = "none" | "reps" | "weight" | "time"
export type SeedDurationFormat = "seconds" | "mmss"

export type SeedExercise = {
  name: string
  targetType: SeedMetricType
  targetValue: number
  note?: string
  logType: SeedLogType
  durationFormat?: SeedDurationFormat
}

export type SeedExerciseGroup = {
  name: string
  series: number
  exercises: SeedExercise[]
}

export type SeedRoutineSection = {
  name: string
  groups: SeedExerciseGroup[]
}

export type SeedRoutine = {
  name: string
  summary: string
  sections: SeedRoutineSection[]
}

export const workoutSeedData: SeedRoutine[] = [
  {
    name: "Rutina 1",
    summary: "Zona media y fuerza",
    sections: [
      {
        name: "Zona media",
        groups: [
          {
            name: "Zona media",
            series: 3,
            exercises: [
              {
                name: "Twist con disco",
                targetType: "reps",
                targetValue: 15,
                note: "cada lado",
                logType: "weight",
              },
              {
                name: "Twist sin peso",
                targetType: "reps",
                targetValue: 15,
                note: "cada lado",
                logType: "reps",
              },
              {
                name: "Plancha ventral",
                targetType: "time",
                targetValue: 30,
                logType: "time",
              },
            ],
          },
        ],
      },
      {
        name: "Fuerza",
        groups: [
          {
            name: "Pecho plano con barra + Sentadilla con KB",
            series: 3,
            exercises: [
              {
                name: "Pecho plano con barra",
                targetType: "reps",
                targetValue: 10,
                logType: "weight",
              },
              {
                name: "Sentadilla con KB",
                targetType: "reps",
                targetValue: 10,
                logType: "weight",
              },
            ],
          },
          {
            name: "Pecho inclinado mancuernas + Fondo triceps en banco",
            series: 3,
            exercises: [
              {
                name: "Pecho inclinado mancuernas",
                targetType: "reps",
                targetValue: 10,
                logType: "weight",
              },
              {
                name: "Fondo tríceps en banco",
                targetType: "reps",
                targetValue: 10,
                logType: "reps",
              },
            ],
          },
          {
            name: "Apertura en máquina + Silla de cuádriceps",
            series: 3,
            exercises: [
              {
                name: "Apertura en máquina",
                targetType: "reps",
                targetValue: 10,
                logType: "weight",
              },
              {
                name: "Silla de cuádriceps",
                targetType: "reps",
                targetValue: 10,
                logType: "weight",
              },
            ],
          },
        ],
      },
      {
        name: "Cardio",
        groups: [
          {
            name: "Cardio",
            series: 1,
            exercises: [
              {
                name: "Correr",
                targetType: "time",
                targetValue: 900,
                logType: "time",
                durationFormat: "mmss",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Rutina 2",
    summary: "Zona media y fuerza",
    sections: [
      {
        name: "Zona media",
        groups: [
          {
            name: "Zona media",
            series: 3,
            exercises: [
              {
                name: "Bisagra sentado con apoyo de manos",
                targetType: "reps",
                targetValue: 15,
                logType: "reps",
              },
              {
                name: "Bisagra completa",
                targetType: "reps",
                targetValue: 15,
                logType: "reps",
              },
              {
                name: "Cortos",
                targetType: "reps",
                targetValue: 15,
                logType: "reps",
              },
            ],
          },
        ],
      },
      {
        name: "Fuerza",
        groups: [
          {
            name: "Remo bajo + Silla flexora",
            series: 3,
            exercises: [
              {
                name: "Remo bajo",
                targetType: "reps",
                targetValue: 10,
                logType: "weight",
              },
              {
                name: "Silla flexora",
                targetType: "reps",
                targetValue: 10,
                logType: "weight",
              },
            ],
          },
          {
            name: "Percha dorsal + Aductores en máquina",
            series: 3,
            exercises: [
              {
                name: "Percha dorsal",
                targetType: "reps",
                targetValue: 10,
                logType: "weight",
              },
              {
                name: "Aductores en máquina",
                targetType: "reps",
                targetValue: 10,
                logType: "weight",
              },
            ],
          },
          {
            name: "Remo medio en máquina + Bíceps polea baja barra",
            series: 3,
            exercises: [
              {
                name: "Remo medio en máquina",
                targetType: "reps",
                targetValue: 10,
                logType: "weight",
              },
              {
                name: "Bíceps polea baja barra",
                targetType: "reps",
                targetValue: 10,
                logType: "weight",
              },
            ],
          },
        ],
      },
      {
        name: "Cardio",
        groups: [
          {
            name: "Cardio",
            series: 1,
            exercises: [
              {
                name: "Correr",
                targetType: "time",
                targetValue: 900,
                logType: "time",
                durationFormat: "mmss",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Rutina 3",
    summary: "Zona media y fuerza",
    sections: [
      {
        name: "Zona media",
        groups: [
          {
            name: "Zona media",
            series: 3,
            exercises: [
              {
                name: "Lumbares en máquina",
                targetType: "reps",
                targetValue: 10,
                logType: "weight",
              },
              {
                name: "Plancha lateral",
                targetType: "time",
                targetValue: 20,
                note: "cada lado",
                logType: "time",
              },
              {
                name: "Inferiores",
                targetType: "reps",
                targetValue: 20,
                logType: "reps",
              },
            ],
          },
        ],
      },
      {
        name: "Fuerza",
        groups: [
          {
            name: "Estocada estática mancuernas + Press hombro barra",
            series: 3,
            exercises: [
              {
                name: "Estocada estática mancuernas",
                targetType: "reps",
                targetValue: 10,
                logType: "weight",
              },
              {
                name: "Press hombro barra",
                targetType: "reps",
                targetValue: 10,
                logType: "weight",
              },
            ],
          },
          {
            name: "Prensa con pies en V + Vuelo frontal mancuernas",
            series: 3,
            exercises: [
              {
                name: "Prensa con pies en V",
                targetType: "reps",
                targetValue: 10,
                logType: "weight",
              },
              {
                name: "Vuelo frontal mancuernas",
                targetType: "reps",
                targetValue: 10,
                logType: "weight",
              },
            ],
          },
          {
            name: "Biceps mancuernas + Triceps polea alta cuerda",
            series: 3,
            exercises: [
              {
                name: "Bíceps mancuernas",
                targetType: "reps",
                targetValue: 10,
                logType: "weight",
              },
              {
                name: "Tríceps polea alta cuerda",
                targetType: "reps",
                targetValue: 10,
                logType: "weight",
              },
            ],
          },
        ],
      },
      {
        name: "Cardio",
        groups: [
          {
            name: "Cardio",
            series: 1,
            exercises: [
              {
                name: "Correr",
                targetType: "time",
                targetValue: 900,
                logType: "time",
                durationFormat: "mmss",
              },
            ],
          },
        ],
      },
    ],
  },
]
