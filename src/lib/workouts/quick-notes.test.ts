import {
  appendGlobalSessionContext,
  appendNoteLine,
  formatExerciseQuickNote,
  getUsedSessionQuickNoteValues,
} from "@/lib/workouts/quick-notes"

describe("quick note helpers", () => {
  it("appends a line over an empty note", () => {
    expect(appendNoteLine("", "Pecho plano con barra - [Subir peso]")).toBe(
      "Pecho plano con barra - [Subir peso]"
    )
  })

  it("appends a line after existing note text", () => {
    expect(
      appendNoteLine("Texto existente.", "Pecho plano con barra - [Subir peso]")
    ).toBe("Texto existente.\n\nPecho plano con barra - [Subir peso]")
  })

  it("formats exercise chips and optional detail", () => {
    expect(
      formatExerciseQuickNote(
        "Pecho plano con barra",
        ["subir peso", "repetir peso"],
        "Última serie salió lenta."
      )
    ).toBe(
      "Pecho plano con barra - [Subir peso] [Repetir peso] - Última serie salió lenta."
    )
  })

  it("formats a text-only exercise note", () => {
    expect(
      formatExerciseQuickNote("Sentadilla con KB", [], "Rodilla derecha")
    ).toBe("Sentadilla con KB - Rodilla derecha.")
  })

  it("groups global context under one session line", () => {
    const note = appendGlobalSessionContext("", "dormí poco")

    expect(appendGlobalSessionContext(note, "fatiga alta")).toBe(
      "Sesión - [Dormí poco] [Fatiga alta]"
    )
  })

  it("removes a global context value when it is already used", () => {
    expect(
      appendGlobalSessionContext(
        "Sesión - [Dormí poco] [Fatiga alta]",
        "dormí poco"
      )
    ).toBe("Sesión - [Fatiga alta]")
  })

  it("removes the session line when the last global context value is toggled off", () => {
    expect(
      appendGlobalSessionContext(
        "Texto manual.\n\nSesión - [Dormí poco]",
        "dormí poco"
      )
    ).toBe("Texto manual.")
  })

  it("reads used session quick note values from the session line", () => {
    expect(
      getUsedSessionQuickNoteValues(
        "Texto manual.\n\nSesión - [Dormí poco] [Fatiga alta]"
      )
    ).toEqual(new Set(["dormí poco", "fatiga alta"]))
  })
})
