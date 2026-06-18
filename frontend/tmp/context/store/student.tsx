"use client";
import { type StudentStore, createStudentStore } from "@lib/storage";
import { type PropsWithChildren, createContext, useContext, useRef } from "react";
import { useStore } from "zustand";

export type StudentStoreApi = ReturnType<typeof createStudentStore>;

const StudentStoreContext = createContext<StudentStoreApi | undefined>(undefined);

export const StudentStoreProvider = ({ children }: PropsWithChildren) => {
  const storeRef = useRef<StudentStoreApi>(null);

  if (!storeRef.current) {
    storeRef.current = createStudentStore();
  }

  return <StudentStoreContext.Provider value={storeRef.current}>{children}</StudentStoreContext.Provider>;
};

export const useStudentStore = <T,>(selector: (store: StudentStore) => T): T => {
  const studentStoreContext = useContext(StudentStoreContext);

  if (!studentStoreContext) {
    throw new Error("useStudentStore must be used within <StudentStoreProvider />");
  }

  return useStore(studentStoreContext, selector);
};
