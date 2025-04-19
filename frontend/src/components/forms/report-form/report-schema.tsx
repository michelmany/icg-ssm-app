import { ReportType } from "@/types/reports";
import { z } from "zod";

export const reportSchema = z.object({
  schoolId: z.string().uuid("Please select a school."),
  studentId: z.string().uuid("Please select a student."),
  therapyServiceId: z.string().uuid("Please select a therapy service."),
  reportType: z.nativeEnum(ReportType, {
    errorMap: () => ({ message: "Please select a report type." }),
  }),
  content: z.string().min(10, "Content must be at least 10 characters."),
});

export type reportSchemaValues = z.infer<typeof reportSchema>;