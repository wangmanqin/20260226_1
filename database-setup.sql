-- Create chat history table
create table if not exists chat_history (
  id uuid default gen_random_uuid() primary key,
  user_email text not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table chat_history enable row level security;

-- Create policy for users to access their own chat history
create policy "Users can view their own chat history"
  on chat_history
  for select
  using (auth.uid()::text = user_email);

-- Create policy for users to insert their own chat history
create policy "Users can insert their own chat history"
  on chat_history
  for insert
  with check (auth.uid()::text = user_email);

-- Create policy for users to delete their own chat history
create policy "Users can delete their own chat history"
  on chat_history
  for delete
  using (auth.uid()::text = user_email);

-- Create index for faster queries
create index idx_chat_history_user_email on chat_history(user_email);
create index idx_chat_history_created_at on chat_history(created_at);