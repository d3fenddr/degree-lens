'use client';
import { createContext, useContext, useMemo, useState } from 'react';
import { analyze } from '../lib/engine';
import { demoCourses } from '../lib/demo';
import { programs } from '../lib/programs';
import type { Course } from '../lib/types';
type State = { courses: Course[]; setCourses: (courses: Course[]) => void; selected: string[]; setSelected: (ids: string[]) => void; profile: string; loadDemo: (name: string) => void; clear: () => void; analyses: ReturnType<typeof analyze>[] };
const Context = createContext<State | null>(null);
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selected, setSelected] = useState<string[]>(['reg-ds']);
  const [profile, setProfile] = useState('');
  const analyses = useMemo(() => selected.map(id => programs.find(p => p.id === id)).filter((p): p is NonNullable<typeof p> => Boolean(p)).map(p => analyze(courses, p)), [courses, selected]);
  function loadDemo(name: string) { setCourses(demoCourses(name)); setProfile(name); }
  function clear() { setCourses([]); setSelected(['reg-ds']); setProfile(''); }
  return <Context.Provider value={{ courses, setCourses, selected, setSelected, profile, loadDemo, clear, analyses }}>{children}</Context.Provider>;
}
export function useWorkspace() { const value = useContext(Context); if (!value) throw new Error('WorkspaceProvider is missing'); return value; }
