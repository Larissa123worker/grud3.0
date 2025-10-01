export interface Campaign {
  id: string;
  name: string;
  from_email: string;
  created_at: string;
  is_active: boolean;
}

export interface CampaignEmail {
  id: string;
  campaign_id: string;
  sequence_number: number;
  subject: string;
  html_content: string;
  delay_hours: number;
  created_at: string;
}

export interface ScheduledEmail {
  id: string;
  user_trial_id: string;
  campaign_email_id: string;
  recipient_email: string;
  recipient_name: string;
  scheduled_for: string;
  sent_at: string | null;
  status: 'pending' | 'sent' | 'failed';
  error_message: string | null;
  created_at: string;
}

export interface UserTrial {
  id: string;
  email: string;
  name: string;
  created_at: string;
}
