export interface NotificationChannelSettings {
  whatsapp: {
    isEnabled: boolean;
    accountPhone?: string;
  };
  email: {
    isEnabled: boolean;
    requiresConfig: boolean;
  };
}

export interface NotificationTypeSettings {
  appointmentReminder: {
    isActive: boolean;
    channels: ('whatsapp' | 'email')[];
    hoursBefore: number[];
  };
  postTreatment: {
    isActive: boolean;
    channels: ('whatsapp' | 'email')[];
    daysAfter: number;
  };
  birthday: {
    isActive: boolean;
    channels: ('whatsapp' | 'email')[];
    sendGreeting: boolean;
  };
}

export interface NotificationSettings {
  channels: NotificationChannelSettings;
  types: NotificationTypeSettings;
  lastUpdated?: Date;
}

export interface UpdateNotificationSettingsRequest {
  channels: NotificationChannelSettings;
  types: NotificationTypeSettings;
}

export const REMINDER_HOURS_OPTIONS = [
  { value: 1, label: '1 hora' },
  { value: 2, label: '2 horas' },
  { value: 4, label: '4 horas' },
  { value: 12, label: '12 horas' },
  { value: 24, label: '24 horas' },
  { value: 48, label: '48 horas' },
  { value: 72, label: '72 horas' }
];

export const POST_TREATMENT_DAYS_OPTIONS = [
  { value: 1, label: '1 día' },
  { value: 2, label: '2 días' },
  { value: 3, label: '3 días' },
  { value: 7, label: '1 semana' },
  { value: 14, label: '2 semanas' }
];

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  channels: {
    whatsapp: {
      isEnabled: true,
      accountPhone: undefined
    },
    email: {
      isEnabled: false,
      requiresConfig: false
    }
  },
  types: {
    appointmentReminder: {
      isActive: true,
      channels: ['whatsapp'],
      hoursBefore: [24]
    },
    postTreatment: {
      isActive: false,
      channels: ['whatsapp'],
      daysAfter: 7
    },
    birthday: {
      isActive: false,
      channels: ['whatsapp'],
      sendGreeting: true
    }
  }
};
