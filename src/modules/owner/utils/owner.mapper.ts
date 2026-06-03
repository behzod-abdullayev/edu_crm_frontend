import { format } from 'date-fns';
import {
  BranchDto,
  UserDto,
  StaffDto,
  BranchRevenue,
  PaymentMethodShare,
  TopStudent,
} from '../types/owner.types';

export interface BranchDisplayRow {
  id: string;
  name: string;
  address: string;
  managerName: string;
  studentCount: number;
  monthlyRevenue: string;
  status: string;
}

export interface UserDisplayRow {
  id: string;
  name: string;
  email: string;
  role: string;
  branchName: string;
  status: string;
  lastLogin: string;
}

export interface StaffDisplayRow {
  id: string;
  name: string;
  role: string;
  branchName: string;
  salary: string;
  contractStatus: string;
  hireDate: string;
}

export function mapBranchDtoToRow(dto: BranchDto): BranchDisplayRow {
  return {
    id: dto.id,
    name: dto.name,
    address: dto.address,
    managerName: dto.managerName ?? 'Unassigned',
    studentCount: dto.studentCount,
    monthlyRevenue: `${dto.monthlyRevenue.toLocaleString()} ${dto.currency}`,
    status: dto.status,
  };
}

export function mapUserDtoToRow(dto: UserDto): UserDisplayRow {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    role: dto.role,
    branchName: dto.branchName ?? 'All Branches',
    status: dto.status,
    lastLogin: dto.lastLogin
      ? format(new Date(dto.lastLogin), 'dd MMM yyyy HH:mm')
      : 'Never',
  };
}

export function mapStaffDtoToRow(dto: StaffDto): StaffDisplayRow {
  return {
    id: dto.id,
    name: dto.name,
    role: dto.role,
    branchName: dto.branchName,
    salary: `${dto.salary.toLocaleString()} ${dto.currency}`,
    contractStatus: dto.contractStatus,
    hireDate: format(new Date(dto.hireDate), 'dd MMM yyyy'),
  };
}

export function mapBranchRevenueToPie(
  data: BranchRevenue[]
): { name: string; value: number }[] {
  return data.map((b) => ({ name: b.branchName, value: b.revenue }));
}

export function mapPaymentMethodsToChart(
  data: PaymentMethodShare[]
): { method: string; share: number }[] {
  return data.map((m) => ({ method: m.method, share: m.percent }));
}

export function mapTopStudentsToBadges(data: TopStudent[]): {
  name: string;
  totalPaid: string;
}[] {
  return data.map((s) => ({
    name: s.studentName,
    totalPaid: `${s.totalPaid.toLocaleString()} ${s.currency}`,
  }));
}
