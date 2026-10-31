import { describe, expect, it } from 'vitest';
import { analyze, normalizeTitle, suggestTopics, verifiedCredits } from './engine';
import { demoCourses, demoNames } from './demo';
import { parseTranscriptPages } from './extract';
import { programs } from './programs';
import type { Course } from './types';
const program = (id:string) => programs.find(p=>p.id===id)!;
const course = (title:string, credits:number, selectedTopic:Course['selectedTopic'], type:Course['type']='lecture'):Course => ({id:title,title,credits,creditSystem:'ECTS',verifiedEcts:credits,semester:'1',type,description:'',selectedTopic,confirmed:true});
describe('course evidence',()=>{
  it('normalizes and suggests multilingual topics',()=>{expect(normalizeTitle('  Lineäre   Algebra ')).toBe('lineare algebra');expect(suggestTopics({title:'Wahrscheinlichkeitstheorie',description:''})).toContain('stochastics')});
  it('does not infer ECTS from local credit units',()=>{expect(verifiedCredits({...course('Physics',6,'math'),creditSystem:'local',verifiedEcts:null})).toBeNull()});
  it('parses decimal separators but leaves extracted credits unconfirmed',()=>{const rows=parseTranscriptPages(['Linear Algebra 5,5 ECTS\nStatistics 6.0 CP\nTotal 11.5']);expect(rows).toHaveLength(2);expect(rows[0].credits).toBe(5.5);expect(rows[0].confirmed).toBe(false)});
});
describe('allocation',()=>{
  it('never doubles a course across sibling categories',()=>{const a=analyze([course('Probability',6,'stochastics')],program('reg-ds'));expect(a.relevantEcts).toBe(6);expect(a.coverage.filter(x=>x.matches.length).reduce((s,x)=>s+x.ects,0)).toBe(6)});
  it('counts stochastics inside the Hamburg math total',()=>{const a=analyze([course('Probability',6,'stochastics')],program('hamburg-dsai'));expect(a.coverage.find(x=>x.rule.id==='hh-math')?.ects).toBe(6);expect(a.coverage.find(x=>x.rule.id==='hh-stoch')?.ects).toBe(6);expect(a.relevantEcts).toBe(6)});
  it('does not treat programming as Bonn algorithm theory',()=>{const a=analyze([course('Programming',20,'programming')],program('bonn-ai'));expect(a.coverage.find(x=>x.rule.id==='bonn-theory')?.ects).toBe(0)});
  it('excludes internships from Bonn software category',()=>{const a=analyze([course('Software Engineering Internship',20,'practical','internship')],program('bonn-ai'));expect(a.relevantEcts).toBe(0)});
  it('recalculates when a confirmed course changes',()=>{const c=course('Programming',6,'programming');expect(analyze([c],program('reg-ds')).coverage.find(x=>x.rule.id==='rds-prog')?.ects).toBe(6);expect(analyze([{...c,credits:3}],program('reg-ds')).coverage.find(x=>x.rule.id==='rds-prog')?.ects).toBe(3)});
  it('does not count unconfirmed local credits',()=>{const a=analyze([{...course('Linear Algebra',6,'math'),creditSystem:'local',verifiedEcts:null}],program('hamburg-dsai'));expect(a.relevantEcts).toBe(0)});
  it('marks an unresolved matching course for review',()=>{const a=analyze([{...course('Linear Algebra',6,'math'),confirmed:false}],program('hamburg-dsai'));expect(a.coverage.find(x=>x.rule.id==='hh-math')?.status).toBe('Needs review')});
  it('keeps human conditions separate',()=>{const a=analyze(demoCourses('Mixed Data Science'),program('bonn-ai'));expect(a.program.conditions.some(x=>x.includes('scientific bachelor thesis'))).toBe(true)});
  it('gives deterministic, distinct demo outcomes',()=>{const totals=demoNames.map(name=>analyze(demoCourses(name),program('reg-cs')).coverage.map(c=>c.ects));expect(new Set(totals.map(x=>x.join(','))).size).toBe(3)});
});
