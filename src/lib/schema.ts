import { z } from 'zod';

export const courseSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(120),
  credits: z.number().finite().positive().max(60),
  creditSystem: z.enum(['ECTS', 'UK CATS', 'US Semester Hours', 'local']),
  verifiedEcts: z.number().finite().positive().max(60).nullable(),
  semester: z.string().max(20),
  type: z.enum(['lecture', 'seminar', 'lab', 'internship', 'thesis', 'project']),
  description: z.string().max(300),
  selectedTopic: z.enum(['math', 'stochastics', 'theory', 'systems', 'practical', 'data', 'programming', 'cs', '']),
  confirmed: z.boolean(),
  page: z.number().optional(),
  grade: z.string().optional(),
  reviewStatus: z.enum(['valid', 'suspicious-credit', 'potential-grade', 'duplicate-title', 'unconfirmed-conversion']).optional(),
  reviewWarning: z.string().optional(),
});
