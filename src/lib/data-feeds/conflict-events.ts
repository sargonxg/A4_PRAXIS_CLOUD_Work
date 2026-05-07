export interface ConflictEvent {
  event_id_cnty?: string;
  data_id?: string | number;
  event_date: string;
  event_type: string;
  actor1?: string;
  actor2?: string;
  location?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  fatalities: number;
  notes?: string;
  source?: string;
}
