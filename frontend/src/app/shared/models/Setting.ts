export interface Setting {
  id: string;
  label: string;
  value: string;
  key: string;
  description?: string;
}

export interface CreateSetting extends Omit<Setting, 'id'> {}
