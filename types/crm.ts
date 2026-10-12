export type CallType = "Inbound" | "Outbound" | "Missed";

export type CallStatus =
  | "Connected"
  | "Pending Callback"
  | "Interested"
  | "Closed / Won"
  | "Not Interested";

export interface CallLog {
  id: string;
  customerName: string;
  phoneNumber: string;
  callType: CallType;
  duration: string; // e.g. "04:35"
  status: CallStatus;
  notes: string;
  agentEmail: string;
  agentName: string;
  createdAt: any; // Firebase server timestamp
}

export type CRMSection =
  | "call-logs"
  | "callbacks"
  | "analytics"
  | "customers"
  | "superadmin";
