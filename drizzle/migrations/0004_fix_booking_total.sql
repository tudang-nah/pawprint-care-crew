CREATE OR REPLACE FUNCTION public.create_booking(_pet uuid, _services uuid[], _surcharges uuid[], _start timestamptz, _note text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.pets; c public.customers; bid uuid; v_total int := 0; sv record; sc record;
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
  FOR sv IN SELECT s.id, s.name FROM public.services s WHERE s.id = ANY(_services) AND s.active LOOP
    INSERT INTO public.booking_items(booking_id, service_id, name, price) VALUES (bid, sv.id, sv.name, public.service_price(sv.id, p.species, p.weight));
  END LOOP;
  IF (SELECT count(*) FROM public.booking_items bi WHERE bi.booking_id = bid) <> (SELECT count(DISTINCT x) FROM unnest(_services) x) THEN RAISE EXCEPTION 'Có dịch vụ không còn phục vụ.'; END IF;
  FOR sc IN SELECT s.name, s.amount FROM public.surcharges s WHERE s.id = ANY(coalesce(_surcharges,'{}')) AND s.active LOOP
    INSERT INTO public.booking_items(booking_id, name, price) VALUES (bid, 'Phụ phí: ' || sc.name, sc.amount);
  END LOOP;
  SELECT coalesce(sum(bi.price),0) INTO v_total FROM public.booking_items bi WHERE bi.booking_id = bid;
  UPDATE public.bookings SET total = v_total WHERE id = bid;
  RETURN bid;
END $$;