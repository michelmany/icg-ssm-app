import type { components, paths } from "./schema";

export type Error =
  components["responses"]["GenericErrorResponse"]["content"]["application/json"];

export type PaginationParams = "perPage" | "page";
export type SortParams = "sortBy" | "orderBy";

export type User = components["schemas"]["User"];
export type UserListParams = Omit<
  NonNullable<paths["/users"]["get"]["parameters"]["query"]>,
  PaginationParams | SortParams
>;

export type School = components["schemas"]["School"];
export type SchoolListParams = Omit<
  NonNullable<paths["/schools"]["get"]["parameters"]["query"]>,
  PaginationParams | SortParams
>;

export type Student = components["schemas"]["Student"];
export type StudentListParams = Omit<
  NonNullable<paths["/students"]["get"]["parameters"]["query"]>,
  PaginationParams | SortParams
>;

export type Provider = components["schemas"]["Provider"];
export type ProviderListParams = Omit<
  NonNullable<paths["/providers"]["get"]["parameters"]["query"]>,
  PaginationParams | SortParams
>;

export type Therapist = components["schemas"]["Therapist"];
export type TherapistListParams = Omit<
  NonNullable<paths["/therapists"]["get"]["parameters"]["query"]>,
  PaginationParams | SortParams
>;

export type TherapyService = components["schemas"]["TherapyService"];
export type TherapyServiceListParams = Omit<
  NonNullable<paths["/therapy-services"]["get"]["parameters"]["query"]>,
  PaginationParams | SortParams
>;

export type Report = components["schemas"]["Report"];
export type ReportListParams = Omit<
  NonNullable<paths["/reports"]["get"]["parameters"]["query"]>,
  PaginationParams | SortParams
>;

export type Role = components["schemas"]["Role"];

export const UserRole = {
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  THERAPIST: "THERAPIST",
  PROVIDER: "PROVIDER",
  SUPERVISOR: "SUPERVISOR",
};

export type UserWithPermissions = components["schemas"]["UserWithPermissions"];
export type Permission = UserWithPermissions["permissions"][number];
