"use client";

import { RoutedDrawer } from "@/components/drawers/routed-drawer";
import { ReportForm } from "@/components/forms/report-form/report-form";
import { reportSchemaValues } from "@/components/forms/report-form/report-schema";
import { updateReport } from "@/lib/actions/reports/update-reports";
import { Report, School, Student, TherapyService } from "@/lib/api/types";
import { useRouter } from "next/navigation";

interface ReportsEditDrawerProps {
  report: Report;
  schools: School[];
  students: Student[];
  therapyServices: TherapyService[];
}

export const ReportsEditDrawer = ({
  report,
  schools,
  students,
  therapyServices,
}: ReportsEditDrawerProps) => {
  const router = useRouter();

  const handleUpdateReport = async (values: reportSchemaValues) => {
    const { success, message } = await updateReport(report.id, values);
    if (success) {
      router.back();
    } else {
      throw new Error(message);
    }
  };

  return (
    <RoutedDrawer
      handleOpenClose={() => router.back()}
      headerText="Edit report"
      headerSubtext="Fill out the report details."
      width="wide"
    >
      <ReportForm
        report={report}
        schools={schools}
        students={students}
        therapyServices={therapyServices}
        onSubmit={handleUpdateReport}
      />
    </RoutedDrawer>
  );
};