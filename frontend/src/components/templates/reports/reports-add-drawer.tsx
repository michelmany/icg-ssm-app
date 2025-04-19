"use client";

import { RoutedDrawer } from "@/components/drawers/routed-drawer";
import { ReportForm } from "@/components/forms/report-form/report-form";
import { reportSchemaValues } from "@/components/forms/report-form/report-schema";
import { createReport } from "@/lib/actions/reports/create-reports";
import { School, Student, TherapyService } from "@/lib/api/types";
import { useRouter } from "next/navigation";

interface ReportsAddDrawerProps {
  schools: School[];
  students: Student[];
  therapyServices: TherapyService[];
}

export const ReportsAddDrawer = ({
  schools,
  students,
  therapyServices,
}: ReportsAddDrawerProps) => {
  const router = useRouter();

  const handleCreateReport = async (values: reportSchemaValues) => {
    const { success, message } = await createReport(values);
    if (success) {
      router.back();
    } else {
      throw new Error(message);
    }
  };

  return (
    <RoutedDrawer
      handleOpenClose={() => router.back()}
      headerText="Create a new report"
      headerSubtext="Fill out the report details."
      width="wide"
    >
      <ReportForm
        schools={schools}
        students={students}
        therapyServices={therapyServices}
        onSubmit={handleCreateReport}
      />
    </RoutedDrawer>
  );
};