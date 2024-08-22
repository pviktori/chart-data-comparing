export interface SettingDto {
  id: string;
  label: string;
  value: string;
  key: string;
  description?: string;
}

export interface CreateSettingDto extends Omit<SettingDto, 'id'> {}
