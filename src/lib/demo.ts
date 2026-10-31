import type { Course, Topic } from './types';

const rows: Record<string, [string, number, Topic][]> = {
  'Mixed Data Science': [
    ['Linear Algebra', 6, 'math'], ['Calculus and Analysis', 6, 'math'], ['Probability Theory', 6, 'stochastics'], ['Statistics', 6, 'stochastics'], ['Programming in Python', 6, 'programming'], ['Data Structures and Algorithms', 6, 'theory'], ['Database Systems', 6, 'practical'], ['Machine Learning', 6, 'data'], ['Data Science', 6, 'data'], ['Software Engineering', 6, 'practical'], ['Operating Systems', 6, 'systems'], ['Computer Networks', 6, 'systems'], ['Bachelor Thesis', 12, 'cs'],
  ],
  'Mathematics heavy': [
    ['Linear Algebra I', 9, 'math'], ['Linear Algebra II', 9, 'math'], ['Real Analysis', 9, 'math'], ['Numerical Mathematics', 6, 'math'], ['Probability Theory', 9, 'stochastics'], ['Mathematical Statistics', 9, 'stochastics'], ['Optimization', 6, 'math'], ['Programming in Python', 6, 'programming'], ['Algorithms', 6, 'theory'], ['Machine Learning', 6, 'data'], ['Bachelor Thesis', 12, 'math'],
  ],
  'Computer Science heavy': [
    ['Algorithms and Data Structures', 9, 'theory'], ['Automata Theory', 6, 'theory'], ['Complexity Theory', 6, 'theory'], ['Programming in Java', 9, 'programming'], ['Software Engineering', 9, 'practical'], ['Database Systems', 6, 'practical'], ['Operating Systems', 6, 'systems'], ['Computer Architecture', 6, 'systems'], ['Computer Networks', 6, 'systems'], ['Linear Algebra', 6, 'math'], ['Probability Theory', 6, 'stochastics'], ['Bachelor Thesis', 12, 'cs'],
  ],
};

export const demoNames = Object.keys(rows);
export function demoCourses(name: string): Course[] {
  return (rows[name] ?? rows['Mixed Data Science']).map(([title, credits, selectedTopic], index) => ({
    id: `demo-${index}`, title, credits, creditSystem: 'ECTS', verifiedEcts: credits, semester: String(Math.floor(index / 3) + 1), type: title.includes('Thesis') ? 'thesis' : 'lecture', description: '', selectedTopic, confirmed: true,
  }));
}
