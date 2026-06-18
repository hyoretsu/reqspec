import { createStore } from "zustand";
import { persist } from "zustand/middleware";
export { useShallow } from "zustand/react/shallow";

export interface StudentState {
  periodos: string[];
}

export interface StudentActions {
  setPeriodos: (periodos: string[]) => void;
}

export type StudentStore = StudentState & StudentActions;

const defaultState = {
  periodos: [[], [], [], [], [], [], [], []],
} as unknown as StudentState;

export const createStudentStore = (initialState: StudentState = defaultState) => {
  return createStore<StudentStore>()(
    persist(
      set => ({
        ...initialState,
        setPeriodos: periodos => set({ periodos }),
      }),
      { name: "@uniplan:student_store" },
    ),
  );
};
