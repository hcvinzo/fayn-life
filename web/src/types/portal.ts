import type { Database } from "./database";

export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

export interface ClientWithAppointments extends Client {
  appointments?: Appointment[];
}

export interface AppointmentWithClient extends Appointment {
  client?: Client;
}

export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  todayAppointments: number;
  weekAppointments: number;
  monthRevenue: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  clientName: string;
  status: Appointment["status"];
}
