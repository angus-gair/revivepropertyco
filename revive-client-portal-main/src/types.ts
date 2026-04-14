import { type LucideIcon } from 'lucide-react';

export interface DocumentVersion {
  version: number;
  timestamp: string;
  status: 'ACTION REQUIRED' | 'APPROVED' | 'IN REVIEW' | 'READY TO HIRE';
  amount?: string;
  note: string;
}

export interface Document {
  id: string;
  projectName: string;
  type: 'QUOTE' | 'SOW' | 'MANIFEST' | 'IMAGE';
  name: string;
  url?: string;
  issueDate: string;
  status: 'ACTION REQUIRED' | 'APPROVED' | 'IN REVIEW' | 'READY TO HIRE';
  amount?: string;
  currentVersion: number;
  history: DocumentVersion[];
}

export interface Stat {
  label: string;
  value: string;
  subtext: string;
  actionRequired?: boolean;
}

export interface LineItem {
  code?: string;
  description: string;
  subDescription?: string;
  unit: number;
  rate: number;
  gst?: string;
  total: number;
}
