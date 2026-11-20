-- Local Jimbot happy-path seed: Quezon City verified businesses + saved itineraries.
-- Runs after migrations on `supabase db reset`. Safe to re-run (fixed UUIDs + upserts).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Demo accounts (local only)
-- traveler@bitinary.local / password123
-- owner@bitinary.local    / password123
-- ---------------------------------------------------------------------------
do $$
declare
  traveler_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1';
  owner_id    uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1';
begin
  -- Traveler
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000',
    traveler_id,
    'authenticated',
    'authenticated',
    'traveler@bitinary.local',
    crypt('password123', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"QC Traveler"}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now()),
    '', '', '', ''
  )
  on conflict (id) do nothing;

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) values (
    traveler_id,
    traveler_id,
    jsonb_build_object('sub', traveler_id::text, 'email', 'traveler@bitinary.local', 'email_verified', true),
    'email',
    traveler_id::text,
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (id) do nothing;

  -- Business owner
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000',
    owner_id,
    'authenticated',
    'authenticated',
    'owner@bitinary.local',
    crypt('password123', gen_salt('bf')),
    timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"QC Business Owner"}'::jsonb,
    timezone('utc', now()),
    timezone('utc', now()),
    '', '', '', ''
  )
  on conflict (id) do nothing;

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) values (
    owner_id,
    owner_id,
    jsonb_build_object('sub', owner_id::text, 'email', 'owner@bitinary.local', 'email_verified', true),
    'email',
    owner_id::text,
    timezone('utc', now()),
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (id) do nothing;

  -- handle_new_user creates traveler profiles; seed may set business role (bypass escalation trigger)
  alter table public.profiles disable trigger profiles_prevent_role_escalation;

  update public.profiles
  set role = 'traveler', name = 'QC Traveler', nickname = 'QC Traveler', city = 'Quezon City'
  where id = traveler_id;

  update public.profiles
  set role = 'business', name = 'QC Business Owner', nickname = 'QC Owner', city = 'Quezon City'
  where id = owner_id;

  alter table public.profiles enable trigger profiles_prevent_role_escalation;
end $$;

-- ---------------------------------------------------------------------------
-- Verified live Quezon City businesses (city must match Jimbot ilike filters)
-- ---------------------------------------------------------------------------
insert into public.businesses (
  id, owner_id, name, business_type, price_range,
  address, city, latitude, longitude,
  about, specialties, languages, live, live_at, verification_status, contact_name
) values
  (
    '11111111-1111-1111-1111-111111111101',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'Maginhawa Food Garden',
    'kainan',
    '₱₱',
    '123 Maginhawa St, Teachers Village',
    'Quezon City',
    14.6465, 121.0532,
    'Sharing plates at lunch — sisig, kare-kare, at cold calamansi.',
    array['family','lunch','filipino'],
    array['Tagalog','English'],
    true, timezone('utc', now()), 'verified', 'Ate Nora'
  ),
  (
    '11111111-1111-1111-1111-111111111102',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'Barako Corner Tomas Morato',
    'kapihan',
    '₱',
    '45 Scout Tobias cor. Tomas Morato',
    'Quezon City',
    14.6378, 121.0341,
    'Kapeng barako, pandesal, at quiet morning seats.',
    array['coffee','breakfast','tipid'],
    array['Tagalog','English'],
    true, timezone('utc', now()), 'verified', 'Kuya Ben'
  ),
  (
    '11111111-1111-1111-1111-111111111103',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'Quezon Memorial Circle Trails',
    'pasyalan',
    '₱',
    'Elliptical Road, Quezon City',
    'Quezon City',
    14.6515, 121.0494,
    'Park walks, museum stop, and open green space for half-day trips.',
    array['park','family','outdoors'],
    array['Tagalog','English'],
    true, timezone('utc', now()), 'verified', 'QC Parks'
  ),
  (
    '11111111-1111-1111-1111-111111111104',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'Cubao Expo Night Bites',
    'kainan',
    '₱',
    'General Romulo Ave, Cubao',
    'Quezon City',
    14.6198, 121.0536,
    'Street-food style dinner stops around Cubao Expo.',
    array['street food','dinner','tipid'],
    array['Tagalog','English'],
    true, timezone('utc', now()), 'verified', 'Mang Rene'
  ),
  (
    '11111111-1111-1111-1111-111111111105',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'UP Diliman Lagoon Loop',
    'pasyalan',
    '₱',
    'University of the Philippines Diliman',
    'Quezon City',
    14.6549, 121.0645,
    'Campus stroll around the sunken garden and lagoon.',
    array['walk','campus','outdoors'],
    array['Tagalog','English'],
    true, timezone('utc', now()), 'verified', 'UP Tours'
  ),
  (
    '11111111-1111-1111-1111-111111111106',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'Katipunan Ramen House',
    'kainan',
    '₱₱',
    '317 Katipunan Ave, Loyola Heights',
    'Quezon City',
    14.6352, 121.0741,
    'Ramen and side dishes for rainy QC evenings.',
    array['ramen','dinner','friends'],
    array['Tagalog','English'],
    true, timezone('utc', now()), 'verified', 'Chef Migs'
  ),
  (
    '11111111-1111-1111-1111-111111111107',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'Sikatuna Slow Brew',
    'kapihan',
    '₱₱',
    '88 Sikatuna Village',
    'Quezon City',
    14.6401, 121.0588,
    'Specialty pour-overs and quiet work tables.',
    array['coffee','work','wifi'],
    array['Tagalog','English'],
    true, timezone('utc', now()), 'verified', 'Lia'
  ),
  (
    '11111111-1111-1111-1111-111111111108',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'La Mesa Eco Park Lookout',
    'pasyalan',
    '₱₱',
    'Payscale Road, Fairview',
    'Quezon City',
    14.7162, 121.0765,
    'Nature trails and picnic spots near the reservoir.',
    array['nature','family','hike'],
    array['Tagalog','English'],
    true, timezone('utc', now()), 'verified', 'Eco Desk'
  ),
  (
    '11111111-1111-1111-1111-111111111109',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'Sikatuna Garden Hotel',
    'hotel',
    '₱₱',
    '12 Anonas, Sikatuna Village',
    'Quezon City',
    14.6412, 121.0572,
    'Simple overnight rooms near Sikatuna and Maginhawa.',
    array['hotel','overnight','quiet'],
    array['Tagalog','English'],
    true, timezone('utc', now()), 'verified', 'Front Desk'
  ),
  (
    '11111111-1111-1111-1111-111111111110',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'Morato Hostel QC',
    'hostel',
    '₱',
    '88 Tomas Morato',
    'Quezon City',
    14.6355, 121.0334,
    'Budget beds for one-night QC stays.',
    array['hostel','budget','overnight'],
    array['Tagalog','English'],
    true, timezone('utc', now()), 'verified', 'Host Desk'
  )
on conflict (id) do update set
  name = excluded.name,
  business_type = excluded.business_type,
  price_range = excluded.price_range,
  address = excluded.address,
  city = excluded.city,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  about = excluded.about,
  specialties = excluded.specialties,
  live = true,
  verification_status = 'verified',
  updated_at = timezone('utc', now());

-- ---------------------------------------------------------------------------
-- Demo menu_items (owner-posted prices) so Jimbot can estimate meal/cafe costs
-- ---------------------------------------------------------------------------
delete from public.menu_items
where business_id in (
  '11111111-1111-1111-1111-111111111101',
  '11111111-1111-1111-1111-111111111102',
  '11111111-1111-1111-1111-111111111104',
  '11111111-1111-1111-1111-111111111106',
  '11111111-1111-1111-1111-111111111107'
);

insert into public.menu_items (business_id, name, price, category, sort_order) values
  ('11111111-1111-1111-1111-111111111101', 'Sisig plate', 280, 'mains', 0),
  ('11111111-1111-1111-1111-111111111101', 'Kare-kare', 350, 'mains', 1),
  ('11111111-1111-1111-1111-111111111101', 'Calamansi juice', 80, 'drinks', 2),
  ('11111111-1111-1111-1111-111111111102', 'Kapeng barako', 90, 'drinks', 0),
  ('11111111-1111-1111-1111-111111111102', 'Pandesal set', 120, 'food', 1),
  ('11111111-1111-1111-1111-111111111104', 'Isaw skewers', 60, 'street', 0),
  ('11111111-1111-1111-1111-111111111104', 'Fishball cup', 50, 'street', 1),
  ('11111111-1111-1111-1111-111111111104', 'BBQ plate', 150, 'street', 2),
  ('11111111-1111-1111-1111-111111111106', 'Shoyu ramen', 280, 'mains', 0),
  ('11111111-1111-1111-1111-111111111106', 'Miso ramen', 320, 'mains', 1),
  ('11111111-1111-1111-1111-111111111106', 'Gyoza', 180, 'sides', 2),
  ('11111111-1111-1111-1111-111111111107', 'Pour-over', 180, 'drinks', 0),
  ('11111111-1111-1111-1111-111111111107', 'Cold brew', 160, 'drinks', 1);

-- ---------------------------------------------------------------------------
-- Saved Quezon City itineraries for every traveler profile (incl. your signup)
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
  itin1 uuid;
  itin2 uuid;
begin
  for r in
    select id from public.profiles where role = 'traveler'
  loop
    -- Stable-ish ids per user so re-seed upserts cleanly
    itin1 := md5(r.id::text || ':qc-day-food')::uuid;
    itin2 := md5(r.id::text || ':qc-half-day')::uuid;

    insert into public.itineraries (id, user_id, title, subtitle, budget, area, is_saved)
    values
      (
        itin1,
        r.id,
        '1 araw food trip QC',
        'Maginhawa → Cubao → Katipunan',
        2500,
        'Quezon City',
        true
      ),
      (
        itin2,
        r.id,
        'Half-day QC greens',
        'Circle trails + Diliman loop + kape',
        1200,
        'Quezon City',
        true
      )
    on conflict (id) do update set
      title = excluded.title,
      subtitle = excluded.subtitle,
      budget = excluded.budget,
      area = excluded.area,
      is_saved = true,
      updated_at = timezone('utc', now());

    delete from public.itinerary_stops where itinerary_id in (itin1, itin2);

    insert into public.itinerary_stops (itinerary_id, business_id, stop_time, name, kind, cost, note, sort_order)
    values
      (itin1, '11111111-1111-1111-1111-111111111102', '09:00 AM', 'Barako Corner Tomas Morato', 'Kape', 180, 'Breakfast coffee', 0),
      (itin1, '11111111-1111-1111-1111-111111111101', '12:00 PM', 'Maginhawa Food Garden', 'Pagkain', 450, 'Lunch sharing plates', 1),
      (itin1, '11111111-1111-1111-1111-111111111104', '06:00 PM', 'Cubao Expo Night Bites', 'Pagkain', 350, 'Dinner bites', 2),
      (itin1, '11111111-1111-1111-1111-111111111106', '08:00 PM', 'Katipunan Ramen House', 'Pagkain', 480, 'Optional late ramen', 3),
      (itin2, '11111111-1111-1111-1111-111111111103', '09:30 AM', 'Quezon Memorial Circle Trails', 'Aktibidad', 0, 'Morning walk', 0),
      (itin2, '11111111-1111-1111-1111-111111111105', '11:30 AM', 'UP Diliman Lagoon Loop', 'Aktibidad', 0, 'Campus stroll', 1),
      (itin2, '11111111-1111-1111-1111-111111111107', '01:00 PM', 'Sikatuna Slow Brew', 'Kape', 220, 'Cool down coffee', 2);
  end loop;
end $$;
