-- ============================================
-- Supabase Database Setup for AI Chat
-- ============================================

-- 1. Create conversations table
-- 存储用户的所有对话
create table if not exists conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  user_email text not null,
  title text not null,
  model text default 'deepseek-chat',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Create messages table
-- 存储对话中的所有消息
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  tokens_used int default 0,
  created_at timestamptz default now()
);

-- 3. Create user settings table
-- 存储用户的个性化设置
create table if not exists user_settings (
  user_id uuid references auth.users not null primary key,
  model text default 'deepseek-chat',
  temperature float default 0.7,
  max_tokens int default 2048,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================

alter table conversations enable row level security;
alter table messages enable row level security;
alter table user_settings enable row level security;

-- ============================================
-- RLS Policies for Conversations
-- ============================================

-- Users can view their own conversations
create policy "Users can view their own conversations"
  on conversations
  for select
  using (auth.uid() = user_id);

-- Users can insert their own conversations
create policy "Users can insert their own conversations"
  on conversations
  for insert
  with check (auth.uid() = user_id);

-- Users can update their own conversations
create policy "Users can update their own conversations"
  on conversations
  for update
  using (auth.uid() = user_id);

-- Users can delete their own conversations
create policy "Users can delete their own conversations"
  on conversations
  for delete
  using (auth.uid() = user_id);

-- ============================================
-- RLS Policies for Messages
-- ============================================

-- Users can view their own messages
create policy "Users can view their own messages"
  on messages
  for select
  using (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

-- Users can insert messages in their own conversations
create policy "Users can insert messages in their own conversations"
  on messages
  for insert
  with check (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

-- Users can delete their own messages
create policy "Users can delete their own messages"
  on messages
  for delete
  using (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

-- ============================================
-- RLS Policies for User Settings
-- ============================================

-- Users can view their own settings
create policy "Users can view their own settings"
  on user_settings
  for select
  using (auth.uid() = user_id);

-- Users can insert their own settings
create policy "Users can insert their own settings"
  on user_settings
  for insert
  with check (auth.uid() = user_id);

-- Users can update their own settings
create policy "Users can update their own settings"
  on user_settings
  for update
  using (auth.uid() = user_id);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Conversations indexes
create index if not exists idx_conversations_user_id on conversations(user_id);
create index if not exists idx_conversations_updated_at on conversations(updated_at);
create index if not exists idx_conversations_user_email on conversations(user_email);

-- Messages indexes
create index if not exists idx_messages_conversation_id on messages(conversation_id);
create index if not exists idx_messages_created_at on messages(created_at);
create index if not exists idx_messages_role on messages(role);

-- User settings indexes
create index if not exists idx_user_settings_user_id on user_settings(user_id);

-- ============================================
-- Triggers for Automatic Updates
-- ============================================

-- Update updated_at timestamp on conversations
create or replace function update_updated_at_column()
returns trigger as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$ language plpgsql;

create trigger update_conversations_updated_at
  before update on conversations
  for each row
  execute function update_updated_at_column();

create trigger update_user_settings_updated_at
  before update on user_settings
  for each row
  execute function update_updated_at_column();

-- ============================================
-- Sample Data (Optional)
-- ============================================

-- Insert default user settings for new users
-- This function can be called from a trigger when a new user is created

-- ============================================
-- Views for Easy Queries
-- ============================================

-- View to get conversation with last message
create or replace view conversation_list as
select 
  c.id as conversation_id,
  c.user_id,
  c.user_email,
  c.title,
  c.model,
  c.created_at,
  c.updated_at,
  m.content as last_message,
  m.created_at as last_message_at
from conversations c
left join LATERAL (
  select content, created_at
  from messages
  where messages.conversation_id = c.id
  order by created_at desc
  limit 1
) m on true
order by c.updated_at desc;

-- View to get conversation with message count
create or replace view conversation_stats as
select 
  c.id as conversation_id,
  c.user_id,
  c.user_email,
  c.title,
  c.model,
  c.created_at,
  c.updated_at,
  count(m.id) as message_count,
  coalesce(sum(m.tokens_used), 0) as total_tokens
from conversations c
left join messages m on m.conversation_id = c.id
group by c.id, c.user_id, c.user_email, c.title, c.model, c.created_at, c.updated_at
order by c.updated_at desc;