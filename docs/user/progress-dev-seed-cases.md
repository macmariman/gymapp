# Development seed cases for exercise progress

The development seed now creates deterministic workout history to cover the main exercise progress states without changing the routine structure.

## Seeded cases

| Case | Exercise               | Log type | Sessions | Expected outcome                                     |
| ---- | ---------------------- | -------- | -------- | ---------------------------------------------------- |
| C1   | Twist con disco        | weight   | 0        | Empty state                                          |
| C2   | Pecho plano con barra  | weight   | 1        | Single-point chart and no trend badge                |
| C3   | Twist sin peso         | reps     | 5        | Short history without trend                          |
| C4   | Remo bajo              | weight   | 6        | Upward trend                                         |
| C5   | Fondo tríceps en banco | reps     | 6        | Stable trend                                         |
| C6   | Plancha ventral        | time     | 6        | Downward trend                                       |
| C7   | Silla de cuádriceps    | weight   | 8        | Old record and multiple sessions without improvement |
| C8   | Plancha lateral        | time     | 4        | Recent ranges empty, all-time range populated        |

## Notes

- Weight-tracking cases can be used to validate the `Volumen` metric and its helper message.
- Notes are included in selected sessions so the history card can render them.
- The seed keeps the current routine and exercise catalog intact. It only adds workout sessions and set logs.
- Cross-routine aggregation is intentionally not seeded yet because the current routine structure does not reuse the same movement across routines.
