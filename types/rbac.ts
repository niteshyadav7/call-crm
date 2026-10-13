export type UserRole = "superadmin" | "admin" | "manager" | "agent" | "customer";
export type UserStatus = "approved" | "pending" | "rejected";

export type Permission =
  | "roles:manage"
  | "users:approve"
  | "users:manage_roles"
  | "crm:create"
  | "crm:edit"
  | "crm:delete"
  | "crm:view_all";

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem?: boolean;
  badgeColor: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  customRoleId?: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  lastSyncAt?: string | null;
  totalSyncedCalls?: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface SyncedCallLog {
  id: string;
  ownerUid: string;
  ownerName: string;
  ownerEmail: string;
  number: string;
  normalizedNumber?: string;
  contactName: string;
  type: number; // 1 = Incoming, 2 = Outgoing, 3 = Missed
  duration: number; // in seconds
  timestamp: number; // epoch ms
  simSlot: number; // 0 = SIM 1, 1 = SIM 2, 2 = WhatsApp
  isWhatsapp?: boolean;
  syncedAt?: any;
}

export const SYSTEM_ROLES: RoleDefinition[] = [
  {
    id: "superadmin",
    name: "Super Admin",
    description: "Complete authority over CRM, roles, users, approvals, and system settings",
    permissions: [
      "roles:manage",
      "users:approve",
      "users:manage_roles",
      "crm:create",
      "crm:edit",
      "crm:delete",
      "crm:view_all",
    ],
    isSystem: true,
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  },
  {
    id: "admin",
    name: "Admin",
    description: "Can approve team members and manage CRM operations",
    permissions: [
      "users:approve",
      "users:manage_roles",
      "crm:create",
      "crm:edit",
      "crm:delete",
      "crm:view_all",
    ],
    isSystem: true,
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  },
  {
    id: "manager",
    name: "Sales Manager",
    description: "Team supervisor with lead creation and pipeline edit privileges",
    permissions: ["crm:create", "crm:edit", "crm:view_all"],
    isSystem: true,
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
  {
    id: "agent",
    name: "Call Agent",
    description: "Standard CRM representative. Can create calls & leads once approved by Super Admin",
    permissions: ["crm:create", "crm:edit"],
    isSystem: true,
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  {
    id: "customer",
    name: "Customer / Client",
    description: "Client portal viewer with limited self-service permissions",
    permissions: [],
    isSystem: true,
    badgeColor: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  },
];

// Initial bootstrap emails that automatically inherit superadmin
export const BOOTSTRAP_SUPERADMIN_EMAILS = [
  "superadmin@gmail.com",
];
