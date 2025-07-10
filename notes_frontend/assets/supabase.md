# Supabase Integration for Notes App

## Table: notes

This app expects a `notes` table in Supabase with the following columns:

| Column Name | Type       | Notes                              |
|-------------|------------|------------------------------------|
| id          | uuid       | Primary key, auto-generated        |
| title       | text       | Required                           |
| content     | text       | Optional                           |
| created_at  | timestamp  | Defaults to now(), required        |
| updated_at  | timestamp  | Defaults to now(), updates on edit |

### SQL for Table Creation

```sql
create table notes (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);
```

Enable Row Level Security (RLS) and add public (anon) access for select, insert, update, delete for demo/dev purposes.

```sql
alter table notes enable row level security;

create policy "Public read, write" on notes
  for all
  using (true)
  with check (true);
```

## Environment Variables

These values are already set in the React app config:

- SUPABASE_URL: https://mzxyorlnbfdkneiezgjz.supabase.co
- SUPABASE_KEY: [provided anon key]

## Usage

The app performs all CRUD operations on the `notes` table for the logged-in (anon) user.
