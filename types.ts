export type Role = 'user' | 'model';

export interface Message {
  role: Role;
  content: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}
