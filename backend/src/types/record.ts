// Типы для IP записей
export interface IpRecord {
  id: number;
  mses: number[];
  date: string;
  from_source: string;
  letter: string;
  domain: string;
  ip: string;
  mask: string | null;
  country: string;
  owner: string;
  mse_method: string;
  note_in: string;
  soib_infr: string;
  date_in: string;
  who_in: string;
  note_out: string;
  date_out: string;
  who_out: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateIpRecordRequest {
  mses?: number[];
  date?: string;
  from_source?: string;
  letter?: string;
  domain?: string;
  ip?: string;
  country?: string;
  owner?: string;
  mse_method?: string;
  note_in?: string;
  soib_infr?: string;
  date_in?: string;
  who_in?: string;
  note_out?: string;
  date_out?: string;
  who_out?: string;
}

// Типы для IOC записей
export interface IocRecord {
  id: number;
  mses: number[];
  date: string;
  from_source: string;
  letter: string;
  indicator: string;
  encoding: string;
  status_opentip: string;
  status_virustotal: string;
  note_in: string;
  date_in: string;
  who_in: string;
  note_out: string;
  date_out: string;
  who_out: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateIocRecordRequest {
  mses?: number[];
  date?: string;
  from_source?: string;
  letter?: string;
  indicator?: string;
  encoding?: string;
  status_opentip?: string;
  status_virustotal?: string;
  note_in?: string;
  date_in?: string;
  who_in?: string;
  note_out?: string;
  date_out?: string;
  who_out?: string;
}

// Типы для White IP записей
export interface WhiteIpRecord {
  id: number;
  mses: number[];
  date: string;
  from_source: string;
  letter: string;
  ip: string;
  mse_method: string;
  note_in: string;
  soib_infr: string;
  date_in: string;
  who_in: string;
  note_out: string;
  date_out: string;
  who_out: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateWhiteIpRecordRequest {
  mses?: number[];
  date?: string;
  from_source?: string;
  letter?: string;
  ip?: string;
  mse_method?: string;
  note_in?: string;
  soib_infr?: string;
  date_in?: string;
  who_in?: string;
  note_out?: string;
  date_out?: string;
  who_out?: string;
}