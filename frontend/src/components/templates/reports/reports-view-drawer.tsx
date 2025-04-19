"use client";

import { Report } from "@/lib/api/types";
import {
  CalendarIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  DocumentIcon,
} from "@heroicons/react/20/solid";
import { RoutedDrawer } from "@/components/drawers/routed-drawer";
import { useRouter } from "next/navigation";

interface ReportsViewDrawerProps {
  report: Report;
  open: boolean;
}

export const ReportsViewDrawer = ({ report }: ReportsViewDrawerProps) => {
  const router = useRouter();

  const getReportTypeDisplayName = (type: string) => {
    switch (type) {
      case "PROGRESS":
        return "Progress Report";
      case "ATTENDANCE":
        return "Attendance Report";
      case "BILLING":
        return "Billing Report";
      case "ELIGIBILITY":
        return "Eligibility Report";
      default:
        return type;
    }
  };

  return (
    <RoutedDrawer
      handleOpenClose={() => router.back()}
      headerText="View Report"
      headerSubtext="Review report details and content."
      width="extraWide"
    >
      <div className="p-2">
        <div className="lg:flex lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex gap-2 mb-2 items-center">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl sm:tracking-tight">
                {getReportTypeDisplayName(report.reportType)}
              </h2>
            </div>
            <p className="text-sm text-gray-500">ID: {report.id}</p>

            <div className="mt-3 flex flex-wrap gap-4">
              {report.reportType && (
                <div className="flex items-center text-sm text-gray-500">
                  <DocumentIcon className="mr-1.5 size-5 text-gray-400" />
                  <span className="font-medium">Report Type: </span>
                  {getReportTypeDisplayName(report.reportType)}
                </div>
              )}

              {report.student && (
                <div className="flex items-center text-sm text-gray-500">
                  <UserIcon className="mr-1.5 size-5 text-gray-400" />
                  <span className="font-medium">Student: </span>
                  {`${report.student.firstName} ${report.student.lastName}`}
                </div>
              )}

              {report.school && (
                <div className="flex items-center text-sm text-gray-500">
                  <AcademicCapIcon className="mr-1.5 size-5 text-gray-400" />
                  <span className="font-medium">School: </span>
                  {report.school.name}
                </div>
              )}

              {report.therapyService && (
                <div className="flex items-center text-sm text-gray-500">
                  <ClipboardDocumentListIcon className="mr-1.5 size-5 text-gray-400" />
                  <span className="font-medium">Service Type: </span>
                  {report.therapyService.serviceType}
                </div>
              )}

              {report.createdAt && (
                <div className="flex items-center text-sm text-gray-500">
                  <CalendarIcon className="mr-1.5 size-5 text-gray-400" />
                  <span className="font-medium">Created: </span>
                  {new Date(report.createdAt).toLocaleDateString()}
                </div>
              )}

              {report.content && (
                <div className="text-sm text-gray-500 w-full mt-2">
                  <div className="flex items-center mb-2">
                    <DocumentTextIcon className="mr-1.5 size-5 text-gray-400" />
                    <span className="font-medium">Report Content: </span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-md border border-gray-200 whitespace-pre-wrap">
                    {report.content}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </RoutedDrawer>
  );
};