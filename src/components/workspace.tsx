'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import { analyze } from '../lib/engine';
import { demoCourses } from '../lib/demo';
import { programs } from '../lib/programs';
import type { Course } from '../lib/types';
import { DEFAULT_PREFERENCES, getShortlistIds, toggleShortlist, type UserPreferences } from '../lib/matching';

export type AcademicBackground = {
  previousDegreeLevel: string;
  previousDegreeField: string;
  degreeStatus: 'completed' | 'in_progress' | 'unknown';
};

type State = {
  courses: Course[];
  setCourses: (courses: Course[]) => void;
  selected: string[];
  setSelected: (ids: string[]) => void;
  profile: string;
  loadDemo: (name: string) => void;
  clear: () => void;
  analyses: ReturnType<typeof analyze>[];
  preferences: UserPreferences;
  setPreferences: (prefs: UserPreferences) => void;
  academicBackground: AcademicBackground;
  setAcademicBackground: (bg: AcademicBackground) => void;
  shortlistIds: string[];
  toggleShortlist: (id: string) => void;
};

const Context = createContext<State | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selected, setSelected] = useState<string[]>(['reg-ds']);
  const [profile, setProfile] = useState('');
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [academicBackground, setAcademicBackground] = useState<AcademicBackground>({
    previousDegreeLevel: 'Bachelor',
    previousDegreeField: '',
    degreeStatus: 'completed'
  });
  const [shortlistIds, setShortlistIds] = useState<string[]>(() => getShortlistIds());

  const analyses = useMemo(
    () => selected.map(id => programs.find(p => p.id === id)).filter((p): p is NonNullable<typeof p> => Boolean(p)).map(p => analyze(courses, p)),
    [courses, selected]
  );

  function loadDemo(name: string) {
    setCourses(demoCourses(name));
    setProfile(name);
    if (name === 'Mixed Data Science') {
      setAcademicBackground({
        previousDegreeLevel: 'Bachelor',
        previousDegreeField: 'Data Science & Mathematics',
        degreeStatus: 'completed'
      });
      setPreferences({
        ...DEFAULT_PREFERENCES,
        preferredDisciplines: ['Data Science', 'Artificial Intelligence', 'Computer Science'],
        intendedDegreeLevel: 'Master'
      });
    } else if (name === 'Math Intensive' || name === 'Mathematics heavy') {
      setAcademicBackground({
        previousDegreeLevel: 'Bachelor',
        previousDegreeField: 'Mathematics',
        degreeStatus: 'completed'
      });
      setPreferences({
        ...DEFAULT_PREFERENCES,
        preferredDisciplines: ['Mathematics', 'Statistics', 'Data Science'],
        intendedDegreeLevel: 'Master'
      });
    } else if (name === 'Applied Informatics' || name === 'Computer Science heavy') {
      setAcademicBackground({
        previousDegreeLevel: 'Bachelor',
        previousDegreeField: 'Computer Science',
        degreeStatus: 'completed'
      });
      setPreferences({
        ...DEFAULT_PREFERENCES,
        preferredDisciplines: ['Computer Science', 'Software Engineering'],
        intendedDegreeLevel: 'Master'
      });
    }
  }

  function handleToggleShortlist(id: string) {
    const res = toggleShortlist(id);
    setShortlistIds(res.ids);
  }

  function clear() {
    setCourses([]);
    setSelected(['reg-ds']);
    setProfile('');
    setPreferences(DEFAULT_PREFERENCES);
    setAcademicBackground({
      previousDegreeLevel: 'Bachelor',
      previousDegreeField: '',
      degreeStatus: 'completed'
    });
  }

  return (
    <Context.Provider
      value={{
        courses,
        setCourses,
        selected,
        setSelected,
        profile,
        loadDemo,
        clear,
        analyses,
        preferences,
        setPreferences,
        academicBackground,
        setAcademicBackground,
        shortlistIds,
        toggleShortlist: handleToggleShortlist
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useWorkspace() {
  const value = useContext(Context);
  if (!value) throw new Error('WorkspaceProvider is missing');
  return value;
}
