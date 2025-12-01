-- Create a new storage bucket for email assets
insert into storage.buckets (id, name, public)
values ('email-assets', 'email-assets', true);

-- Allow public read access to the bucket
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'email-assets' );

-- Allow authenticated users to upload files (e.g. for admin dashboard usage)
create policy "Authenticated Upload"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'email-assets' );
