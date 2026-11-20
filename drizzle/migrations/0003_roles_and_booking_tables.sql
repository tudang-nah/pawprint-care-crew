CREATE TYPE public.app_role AS ENUM ('admin','staff','customer');
CREATE TYPE public.booking_status AS ENUM ('pending','confirmed','caring','completed','cancelled');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
CREATE OR REPLACE FUNCTION public.is_team(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','staff'))
$$;
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN public.has_role(auth.uid(),'admin') THEN 'admin'
              WHEN public.has_role(auth.uid(),'staff') THEN 'staff'
              WHEN auth.uid() IS NULL THEN NULL ELSE 'customer' END
$$;
CREATE POLICY roles_read ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- keep old profile policies working with the new roles
CREATE OR REPLACE FUNCTION public.care_has_access(admin_only boolean DEFAULT false)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN admin_only THEN public.has_role(auth.uid(),'admin') ELSE public.is_team(auth.uid()) END
$$;

CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.care_role;
BEGIN
  SELECT role INTO r FROM public.care_members WHERE email = lower(NEW.email);
  INSERT INTO public.user_roles(user_id, role)
  VALUES (NEW.id, CASE WHEN r = 'admin' THEN 'admin'::public.app_role WHEN r = 'member' THEN 'staff'::public.app_role ELSE 'customer'::public.app_role END)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_role AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.assign_default_role();

INSERT INTO public.user_roles(user_id, role)
SELECT u.id, CASE WHEN m.role = 'admin' THEN 'admin'::public.app_role WHEN m.role = 'member' THEN 'staff'::public.app_role ELSE 'customer'::public.app_role END
FROM auth.users u LEFT JOIN public.care_members m ON m.email = lower(u.email)
ON CONFLICT DO NOTHING;

CREATE TABLE public.settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  slot_capacity int NOT NULL DEFAULT 3 CHECK (slot_capacity BETWEEN 1 AND 100),
  open_hour int NOT NULL DEFAULT 8 CHECK (open_hour BETWEEN 0 AND 23),
  close_hour int NOT NULL DEFAULT 18 CHECK (close_hour BETWEEN 1 AND 24),
  cancel_hours int NOT NULL DEFAULT 12 CHECK (cancel_hours BETWEEN 0 AND 168)
);
GRANT SELECT ON public.settings TO anon, authenticated;
GRANT UPDATE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY settings_read ON public.settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY settings_admin ON public.settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.settings(id, slot_capacity) SELECT true, GREATEST(1, LEAST(100, COALESCE((data->'capacity'->>'spa')::int, 3))) FROM public.care_state LIMIT 1;
INSERT INTO public.settings(id) VALUES (true) ON CONFLICT DO NOTHING;

CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  phone text NOT NULL DEFAULT '' CHECK (length(phone) <= 30),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 80),
  species text NOT NULL DEFAULT 'Chó' CHECK (species IN ('Chó','Mèo','Khác')),
  breed text NOT NULL DEFAULT '' CHECK (length(breed) <= 80),
  weight numeric(6,2) NOT NULL DEFAULT 0 CHECK (weight >= 0 AND weight <= 200),
  notes text NOT NULL DEFAULT '' CHECK (length(notes) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 120),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 500),
  image_url text NOT NULL DEFAULT '' CHECK (length(image_url) <= 500),
  duration_min int NOT NULL DEFAULT 60 CHECK (duration_min BETWEEN 5 AND 1440),
  base_price int NOT NULL DEFAULT 0 CHECK (base_price >= 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.price_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  species text NOT NULL CHECK (species IN ('Chó','Mèo','Khác')),
  min_kg numeric(6,2) NOT NULL DEFAULT 0 CHECK (min_kg >= 0),
  max_kg numeric(6,2) CHECK (max_kg IS NULL OR max_kg > min_kg),
  price int NOT NULL CHECK (price >= 0)
);
CREATE TABLE public.surcharges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 80),
  amount int NOT NULL CHECK (amount >= 0),
  active boolean NOT NULL DEFAULT true
);
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  pet_id uuid REFERENCES public.pets(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  pet_name text NOT NULL,
  species text NOT NULL,
  start_at timestamptz NOT NULL,
  status public.booking_status NOT NULL DEFAULT 'pending',
  total int NOT NULL DEFAULT 0,
  note text NOT NULL DEFAULT '' CHECK (length(note) <= 1000),
  staff_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX bookings_start_idx ON public.bookings(start_at);
CREATE TABLE public.booking_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  name text NOT NULL,
  price int NOT NULL CHECK (price >= 0)
);
CREATE TABLE public.staff_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  day date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL CHECK (end_time > start_time)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers, public.pets, public.services, public.price_rules, public.surcharges, public.staff_shifts TO authenticated;
GRANT SELECT ON public.bookings, public.booking_items TO authenticated;
GRANT SELECT ON public.services, public.price_rules, public.surcharges TO anon;
GRANT ALL ON public.customers, public.pets, public.services, public.price_rules, public.surcharges, public.bookings, public.booking_items, public.staff_shifts TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surcharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_shifts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.staff_sees_customer(_customer uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.bookings WHERE customer_id = _customer AND staff_id = auth.uid())
$$;
CREATE OR REPLACE FUNCTION public.owns_customer(_customer uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.customers WHERE id = _customer AND user_id = auth.uid())
$$;

CREATE POLICY customers_read ON public.customers FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.staff_sees_customer(id));
CREATE POLICY customers_insert ON public.customers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY customers_update ON public.customers FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY customers_delete ON public.customers FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY pets_read ON public.pets FOR SELECT TO authenticated USING (public.owns_customer(customer_id) OR public.has_role(auth.uid(),'admin') OR public.staff_sees_customer(customer_id));
CREATE POLICY pets_insert ON public.pets FOR INSERT TO authenticated WITH CHECK (public.owns_customer(customer_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY pets_update ON public.pets FOR UPDATE TO authenticated USING (public.owns_customer(customer_id) OR public.has_role(auth.uid(),'admin')) WITH CHECK (public.owns_customer(customer_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY pets_delete ON public.pets FOR DELETE TO authenticated USING (public.owns_customer(customer_id) OR public.has_role(auth.uid(),'admin'));

CREATE POLICY services_read ON public.services FOR SELECT TO anon, authenticated USING (active OR public.is_team(auth.uid()));
CREATE POLICY services_admin ON public.services FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY price_rules_read ON public.price_rules FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY price_rules_admin ON public.price_rules FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY surcharges_read ON public.surcharges FOR SELECT TO anon, authenticated USING (active OR public.is_team(auth.uid()));
CREATE POLICY surcharges_admin ON public.surcharges FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY bookings_read ON public.bookings FOR SELECT TO authenticated USING (public.owns_customer(customer_id) OR public.has_role(auth.uid(),'admin') OR staff_id = auth.uid());
CREATE POLICY booking_items_read ON public.booking_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (public.owns_customer(b.customer_id) OR public.has_role(auth.uid(),'admin') OR b.staff_id = auth.uid())));

CREATE POLICY shifts_read ON public.staff_shifts FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY shifts_admin ON public.staff_shifts FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- price for a service given pet species and weight
CREATE OR REPLACE FUNCTION public.service_price(_service uuid, _species text, _weight numeric)
RETURNS int LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT price FROM public.price_rules WHERE service_id = _service AND species = _species AND _weight >= min_kg AND (max_kg IS NULL OR _weight < max_kg) ORDER BY min_kg DESC LIMIT 1),
    (SELECT base_price FROM public.services WHERE id = _service))
$$;

CREATE OR REPLACE FUNCTION public.check_slot(_start timestamptz, _ignore uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.settings; used int; h int; local_ts timestamp;
BEGIN
  SELECT * INTO s FROM public.settings WHERE id FOR UPDATE;
  local_ts := _start AT TIME ZONE 'Asia/Ho_Chi_Minh';
  h := extract(hour FROM local_ts);
  IF extract(minute FROM local_ts) <> 0 OR h < s.open_hour OR h >= s.close_hour THEN RAISE EXCEPTION 'Khung giờ không hợp lệ.'; END IF;
  IF _start <= now() THEN RAISE EXCEPTION 'Vui lòng chọn thời gian trong tương lai.'; END IF;
  SELECT count(*) INTO used FROM public.bookings WHERE start_at = _start AND status <> 'cancelled' AND id IS DISTINCT FROM _ignore;
  IF used >= s.slot_capacity THEN RAISE EXCEPTION 'Khung giờ này vừa kín chỗ, bạn chọn giờ khác nhé.'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.slot_usage(_from date, _to date)
RETURNS TABLE(start_at timestamptz, used int) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT b.start_at, count(*)::int FROM public.bookings b
  WHERE b.status <> 'cancelled' AND (b.start_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date BETWEEN _from AND _to
  GROUP BY b.start_at
$$;

CREATE OR REPLACE FUNCTION public.create_booking(_pet uuid, _services uuid[], _surcharges uuid[], _start timestamptz, _note text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.pets; c public.customers; bid uuid; total int := 0; sv record; sc record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Vui lòng đăng nhập.'; END IF;
  SELECT * INTO p FROM public.pets WHERE id = _pet;
  SELECT * INTO c FROM public.customers WHERE id = p.customer_id;
  IF p.id IS NULL OR NOT (c.user_id = auth.uid() OR public.is_team(auth.uid())) THEN RAISE EXCEPTION 'Không tìm thấy bé.'; END IF;
  IF coalesce(array_length(_services,1),0) = 0 THEN RAISE EXCEPTION 'Vui lòng chọn ít nhất một dịch vụ.'; END IF;
  IF length(coalesce(_note,'')) > 1000 THEN RAISE EXCEPTION 'Ghi chú quá dài.'; END IF;
  PERFORM public.check_slot(_start, NULL);
  INSERT INTO public.bookings(customer_id, pet_id, customer_name, pet_name, species, start_at, note)
  VALUES (c.id, p.id, c.name, p.name, p.species, _start, coalesce(_note,'')) RETURNING id INTO bid;
  FOR sv IN SELECT id, name FROM public.services WHERE id = ANY(_services) AND active LOOP
    INSERT INTO public.booking_items(booking_id, service_id, name, price) VALUES (bid, sv.id, sv.name, public.service_price(sv.id, p.species, p.weight));
  END LOOP;
  IF (SELECT count(*) FROM public.booking_items WHERE booking_id = bid) <> (SELECT count(DISTINCT x) FROM unnest(_services) x) THEN RAISE EXCEPTION 'Có dịch vụ không còn phục vụ.'; END IF;
  FOR sc IN SELECT name, amount FROM public.surcharges WHERE id = ANY(coalesce(_surcharges,'{}')) AND active LOOP
    INSERT INTO public.booking_items(booking_id, name, price) VALUES (bid, 'Phụ phí: ' || sc.name, sc.amount);
  END LOOP;
  SELECT coalesce(sum(price),0) INTO total FROM public.booking_items WHERE booking_id = bid;
  UPDATE public.bookings SET total = total WHERE id = bid;
  RETURN bid;
END $$;

CREATE OR REPLACE FUNCTION public.change_my_booking(_booking uuid, _new_start timestamptz)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.bookings; hrs int;
BEGIN
  SELECT * INTO b FROM public.bookings WHERE id = _booking FOR UPDATE;
  IF b.id IS NULL OR NOT (public.owns_customer(b.customer_id) OR public.has_role(auth.uid(),'admin')) THEN RAISE EXCEPTION 'Không tìm thấy lịch.'; END IF;
  IF b.status NOT IN ('pending','confirmed') THEN RAISE EXCEPTION 'Lịch này không thể thay đổi nữa.'; END IF;
  SELECT cancel_hours INTO hrs FROM public.settings WHERE id;
  IF NOT public.has_role(auth.uid(),'admin') AND b.start_at - now() < make_interval(hours => hrs) THEN RAISE EXCEPTION 'Chỉ được huỷ hoặc đổi lịch trước % giờ.', hrs; END IF;
  IF _new_start IS NULL THEN
    UPDATE public.bookings SET status = 'cancelled' WHERE id = _booking;
  ELSE
    PERFORM public.check_slot(_new_start, _booking);
    UPDATE public.bookings SET start_at = _new_start, status = 'pending' WHERE id = _booking;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_booking_status(_booking uuid, _status public.booking_status)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.bookings;
BEGIN
  SELECT * INTO b FROM public.bookings WHERE id = _booking FOR UPDATE;
  IF b.id IS NULL OR NOT (public.has_role(auth.uid(),'admin') OR (public.has_role(auth.uid(),'staff') AND b.staff_id = auth.uid())) THEN RAISE EXCEPTION 'Bạn không có quyền với lịch này.'; END IF;
  IF NOT (
    (b.status = 'pending' AND _status IN ('confirmed','cancelled')) OR
    (b.status = 'confirmed' AND _status IN ('caring','cancelled')) OR
    (b.status = 'caring' AND _status IN ('completed','cancelled'))
  ) THEN RAISE EXCEPTION 'Không thể chuyển sang trạng thái này.'; END IF;
  UPDATE public.bookings SET status = _status WHERE id = _booking;
END $$;

CREATE OR REPLACE FUNCTION public.assign_booking(_booking uuid, _staff uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Chỉ admin được phân công.'; END IF;
  IF _staff IS NOT NULL AND NOT public.is_team(_staff) THEN RAISE EXCEPTION 'Người này không phải cộng sự.'; END IF;
  UPDATE public.bookings SET staff_id = _staff WHERE id = _booking;
END $$;

CREATE OR REPLACE FUNCTION public.list_team()
RETURNS TABLE(user_id uuid, email text, role text, display_name text) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_team(auth.uid()) THEN RAISE EXCEPTION 'Không có quyền.'; END IF;
  RETURN QUERY SELECT u.id, u.email::text, (CASE WHEN bool_or(r.role='admin') THEN 'admin' ELSE 'staff' END)::text, coalesce(max(p.display_name),'')
  FROM auth.users u JOIN public.user_roles r ON r.user_id = u.id AND r.role IN ('admin','staff')
  LEFT JOIN public.profiles p ON p.user_id = u.id GROUP BY u.id, u.email ORDER BY u.email;
END $$;

CREATE OR REPLACE FUNCTION public.set_user_role(_email text, _role public.app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Chỉ admin được cấp quyền.'; END IF;
  SELECT id INTO uid FROM auth.users WHERE lower(email) = lower(trim(_email));
  IF uid IS NULL THEN RAISE EXCEPTION 'Chưa có tài khoản với email này. Hãy nhờ họ đăng ký trước.'; END IF;
  IF uid = auth.uid() AND _role <> 'admin' THEN RAISE EXCEPTION 'Bạn không thể tự hạ quyền của mình.'; END IF;
  DELETE FROM public.user_roles WHERE user_id = uid;
  INSERT INTO public.user_roles(user_id, role) VALUES (uid, _role);
END $$;

REVOKE EXECUTE ON FUNCTION public.check_slot(timestamptz, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.slot_usage(date, date) TO anon, authenticated;

-- migrate existing team data
INSERT INTO public.customers(id, name, phone)
SELECT (x->>'id')::uuid, x->>'name', left(coalesce(x->>'phone',''),30) FROM public.care_state, jsonb_array_elements(data->'customers') x;
INSERT INTO public.pets(id, customer_id, name, species, breed, weight, notes)
SELECT (x->>'id')::uuid, (x->>'customerId')::uuid, x->>'name',
  CASE WHEN x->>'species' IN ('Chó','Mèo') THEN x->>'species' ELSE 'Khác' END,
  left(coalesce(x->>'breed',''),80), LEAST(200, coalesce((x->>'weight')::numeric,0)), left(coalesce(x->>'notes',''),1000)
FROM public.care_state, jsonb_array_elements(data->'pets') x;
INSERT INTO public.services(id, name, base_price, duration_min)
SELECT (x->>'id')::uuid, x->>'name', (x->>'price')::int, CASE WHEN x->>'kind' = 'boarding' THEN 1440 ELSE 60 END
FROM public.care_state, jsonb_array_elements(data->'services') x;
INSERT INTO public.bookings(id, customer_id, pet_id, customer_name, pet_name, species, start_at, status, total)
SELECT (x->>'id')::uuid, (SELECT id FROM public.customers WHERE id::text = x->>'customerId'), (SELECT id FROM public.pets WHERE id::text = x->>'petId'),
  x->>'customerName', x->>'petName', x->>'species', ((x->>'start') || ' 09:00')::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh',
  (CASE x->>'status' WHEN 'booked' THEN 'confirmed' ELSE x->>'status' END)::public.booking_status, (x->>'price')::int
FROM public.care_state, jsonb_array_elements(data->'bookings') x;
INSERT INTO public.booking_items(booking_id, name, price)
SELECT (x->>'id')::uuid, x->>'serviceName', (x->>'price')::int FROM public.care_state, jsonb_array_elements(data->'bookings') x;

COMMENT ON TABLE public.care_state IS 'DEPRECATED: replaced by customers, pets, services, bookings tables';
COMMENT ON TABLE public.care_members IS 'DEPRECATED: roles now live in user_roles; kept for default role on signup';