"use client";

import { TherapyService } from "@/lib/api/types";
import {
  CalendarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  ArrowPathIcon,
  ChartBarIcon,
} from "@heroicons/react/20/solid";
import { RoutedDrawer } from "@/components/drawers/routed-drawer";
import { useRouter } from "next/navigation";

type Goal = {
  goal: string;
  progress?: number;
};

type GoalTracking = {
  goals?: Goal[];
};

type Ieps = {
  planDate?: string;
  objectives?: string[];
};

function parseJsonField<T>(field: string | T | null): T | null {
  if (!field) return null;
  if (typeof field === "string") {
    return JSON.parse(field) as T;
  }
  return field;
}

interface TherapyServicesViewDrawerProps {
  therapyService: TherapyService;
  open: boolean;
}

export const TherapyServicesViewDrawer = ({ therapyService }: TherapyServicesViewDrawerProps) => {
  const router = useRouter();

  const goalTrackingValue = !!therapyService.goalTracking ? parseJsonField<GoalTracking>(therapyService.goalTracking) : null;
  const iepsValue = !!therapyService.ieps ? parseJsonField<Ieps>(therapyService.ieps) : null;

  return (
    <RoutedDrawer
      handleOpenClose={() => router.back()}
      headerText="View Therapy Service"
      headerSubtext="Glance over the therapy service details."
      width="extraWide"
    >
      <div className="p-2">
        <div className="lg:flex lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex gap-2 mb-2 items-center">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl sm:tracking-tight">
                Service Details
              </h2>
            </div>
            <p className="text-sm text-gray-500">ID: {therapyService.id}</p>

            <div className="mt-3 flex flex-wrap gap-4">
              {therapyService.student && (
                <div className="flex items-center text-sm text-gray-500">
                  <UserIcon className="mr-1.5 size-5 text-gray-400" />
                  <span className="font-medium">Student: </span>
                  {`${therapyService.student.firstName} ${therapyService.student.lastName}`}
                </div>
              )}

              {therapyService.provider && (
                <div className="flex items-center text-sm text-gray-500">
                  <UserGroupIcon className="mr-1.5 size-5 text-gray-400" />
                  <span className="font-medium">Provider ID: </span>
                  {therapyService.provider.id}
                </div>
              )}

              {therapyService.serviceType && (
                <div className="flex items-center text-sm text-gray-500">
                  <ClipboardDocumentListIcon className="mr-1.5 size-5 text-gray-400" />
                  <span className="font-medium">Service Type: </span>
                  {therapyService.serviceType}
                </div>
              )}

              {therapyService.deliveryMode && (
                <div className="flex items-center text-sm text-gray-500">
                  <ArrowPathIcon className="mr-1.5 size-5 text-gray-400" />
                  <span className="font-medium">Delivery Mode: </span>
                  {therapyService.deliveryMode}
                </div>
              )}

              {therapyService.status && (
                <div className="flex items-center text-sm text-gray-500">
                  <CheckCircleIcon className="mr-1.5 size-5 text-gray-400" />
                  <span className="font-medium">Status: </span>
                  {therapyService.status}
                </div>
              )}

              {therapyService.serviceBeginDate && (
                <div className="flex items-center text-sm text-gray-500">
                  <CalendarIcon className="mr-1.5 size-5 text-gray-400" />
                  <span className="font-medium">Service Begin Date: </span>
                  {new Date(therapyService.serviceBeginDate).toLocaleDateString()}
                </div>
              )}

              {therapyService.sessionDate && (
                <div className="flex items-center text-sm text-gray-500">
                  <CalendarIcon className="mr-1.5 size-5 text-gray-400" />
                  <span className="font-medium">Session Date: </span>
                  {new Date(therapyService.sessionDate).toLocaleDateString()}
                </div>
              )}

              {therapyService.nextMeetingDate && (
                <div className="flex items-center text-sm text-gray-500">
                  <ClockIcon className="mr-1.5 size-5 text-gray-400" />
                  <span className="font-medium">Next Meeting Date: </span>
                  {new Date(therapyService.nextMeetingDate).toLocaleDateString()}
                </div>
              )}

              {therapyService.sessionNotes && (
                <div className="flex items-start text-sm text-gray-500 w-full">
                  <DocumentTextIcon className="mr-1.5 size-5 text-gray-400 mt-0.5" />
                  <div>
                    <span className="font-medium">Session Notes: </span>
                    <p className="mt-1 whitespace-pre-wrap">{therapyService.sessionNotes}</p>
                  </div>
                </div>
              )}

              {!!therapyService.goalTracking && goalTrackingValue?.goals && (
                <div className="text-sm text-gray-500 w-full">
                  <div className="flex items-center mb-2">
                    <ChartBarIcon className="mr-1.5 size-5 text-gray-400" />
                    <span className="font-medium">Goals: </span>
                  </div>
                  <ul className="list-disc pl-5">
                    {goalTrackingValue.goals?.map((goalItem: Goal, index: number) => (
                      <li key={index} className="mb-2">
                        <div>{goalItem.goal}</div>
                        {goalItem.progress !== undefined && (
                          <div className="mt-1">
                            <span className="font-medium">Progress: </span>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${goalItem.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs">{goalItem.progress}%</span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!!therapyService.ieps && iepsValue?.objectives && (
                <div className="text-sm text-gray-500 w-full">
                  <div className="flex items-center mb-2">
                    <DocumentTextIcon className="mr-1.5 size-5 text-gray-400" />
                    <span className="font-medium">IEPs: </span>
                  </div>
                  {iepsValue.planDate && (
                    <div className="mb-2">
                      <span className="font-medium">Plan Date: </span>
                      {new Date(iepsValue.planDate).toLocaleDateString()}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Objectives: </span>
                    <ul className="list-disc pl-5 mt-1">
                      {iepsValue.objectives.map((objective: string, index: number) => (
                        <li key={index}>{objective}</li>
                      ))}
                    </ul>
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