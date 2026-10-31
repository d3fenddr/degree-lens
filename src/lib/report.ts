import type { Analysis, Course } from './types';
export async function downloadReport(analyses: Analysis[], courses: Course[]) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit:'mm', format:'a4' });
  const width = 190; let y = 18;
  function line(text:string, size=10, bold=false, gap=6){
    doc.setFont('helvetica',bold?'bold':'normal'); doc.setFontSize(size);
    const parts = doc.splitTextToSize(text,width) as string[];
    for(const part of parts){if(y>277){doc.addPage();y=18}doc.text(part,10,y);y+=gap}
  }
  doc.setTextColor(23,59,102);line('DegreeLens',20,true,9);doc.setTextColor(23,43,77);line('Coursework comparison report',15,true,8);line(`Generated ${new Date().toLocaleDateString('en-GB')} | ${courses.length} entered courses`,10,false,10);
  line('Preliminary evidence comparison. This is not an admissions decision.',10,true,10);
  for(const analysis of analyses){
    line(`${analysis.program.university} — ${analysis.program.name}`,13,true,8);
    line(`Source verified ${analysis.program.verified || 'Catalog'}: ${analysis.program.sourceUrl || analysis.program.officialProgramUrl || ''}`,8,false,7);
    for(const coverage of analysis.coverage){line(`${coverage.rule.label}: ${coverage.ects} / ${coverage.rule.minimum} ECTS — ${coverage.status}`,10,true,6);for(const match of coverage.matches)line(`  ${courses.find(c=>c.id===match.courseId)?.title||'Course'}: ${match.ects} ECTS`,9,false,5)}
    if (analysis.program.conditions && analysis.program.conditions.length) {
      line('Conditions needing separate review',10,true,7);
      for(const condition of analysis.program.conditions) line(`• ${condition}`,9,false,5);
    }
    if(analysis.warnings.length){line('Unresolved evidence',10,true,7);for(const warning of analysis.warnings)line(`• ${warning}`,9,false,5)}
    if (analysis.program.note) line(analysis.program.note,9,false,8);
  }
  line('Credits count only after user confirmation. Local credits require an explicit verified ECTS equivalent. Subject mapping is selected by the user; university staff may evaluate coursework differently.',9,false,6);
  line('DegreeLens is independent of the universities and does not guarantee admission.',9,true,6);
  doc.save('DegreeLens-coursework-report.pdf');
}
