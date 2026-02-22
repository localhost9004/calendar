export interface ContestEntry {
  platform: string;
  external_id: string;
  title: string;
  url: string;
  event_type: string;
  start_time: string;
  end_time?: string;
  is_online?: boolean;
  location?: string;
  tags?: string[];
  status?: string;
}