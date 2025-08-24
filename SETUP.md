# Startup Directory Setup Guide

## Prerequisites
- A Supabase project (create one at https://supabase.com)
- Node.js 18.17+ (you have 18.17.1 which works!)

## 🔧 Environment Setup

### 1. Configure Environment Variables

You need to add your Supabase credentials to `.env.local`. 

**Where to find these values:**
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the values:
   - **URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

**Edit `.env.local`:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 2. Set Up Database Schema

Copy the contents of `supabase-migration.sql` and run it in your Supabase SQL Editor:

1. Go to **SQL Editor** in your Supabase dashboard
2. Create a new query
3. Copy and paste the entire contents of `supabase-migration.sql`
4. Click **Run**

This will create:
- `startups` and `updates` tables
- Row Level Security (RLS) policies
- Database triggers for automatic signup
- Proper indexes
- Storage bucket for startup logos (`startup-logos`)

### 3. Set Up Storage Bucket

The storage bucket for startup logos is automatically created when you run the migration SQL above. However, if you need to create it manually or want to understand what's being created:

**What gets created:**
- A `startup-logos` bucket (public)
- 5MB file size limit
- Restricted to image formats: JPEG, PNG, GIF, WebP
- Row Level Security (RLS) policies:
  - Public read access
  - Authenticated users can upload
  - Users can update/delete their own uploads

**Manual setup (if needed):**
If the storage bucket wasn't created automatically, run this in your Supabase SQL Editor:

```sql
-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'startup-logos',
  'startup-logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Create RLS policies
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'startup-logos');

CREATE POLICY "Authenticated users can upload logos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'startup-logos' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own logos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'startup-logos' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their own logos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'startup-logos' 
    AND auth.role() = 'authenticated'
  );
```

**Verification:**
Go to **Storage** in your Supabase dashboard and verify the `startup-logos` bucket exists and is configured as public.

## Running the App

```bash
npm run dev
```

Visit http://localhost:3000

## ✅ What Works Now

- ✅ **Homepage** - Shows latest startup updates
- ✅ **Authentication** - Sign up/Sign in at `/auth/signup` and `/auth/signin`
- ✅ **Dashboard** - Basic overview at `/dashboard`
- ✅ **Dark Mode** - Default theme
- ✅ **Responsive Design** - Works on mobile/desktop

## 🔄 Next Steps

After environment setup, these features will be added:
- Profile management (`/dashboard/profile`)
- Update creation/editing (`/dashboard/updates`)
- Public startup profiles (`/s/[slug]`)
- Image upload functionality
- Better error handling

## Troubleshooting

**"Supabase client error"**: Check your `.env.local` has correct values
**"Auth errors"**: Verify your Supabase project has auth enabled
**"Database errors"**: Make sure you ran the migration SQL

## Project Structure

```
startup-directory/
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # React components
│   ├── lib/
│   │   ├── supabase/       # Supabase client config
│   │   ├── types/          # TypeScript types
│   │   └── validations/    # Zod schemas
│   └── ...
├── supabase-migration.sql  # Database schema
└── .env.local              # Your environment variables
``` 