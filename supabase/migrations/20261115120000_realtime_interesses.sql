-- =============================================================================
-- Realtime: o produtor fica sabendo na hora quando uma empresa manifesta interesse
-- (contador no menu e listas atualizam sozinhos).
--
-- O Realtime aplica o RLS de public.interests a INSERT e UPDATE ("interesse:
-- participantes leem"): só quem participa da negociação recebe. DELETE não passa
-- pelo RLS e chega a todos os inscritos só com o id; o app ignora os que não são
-- do produtor (components/app/interesses-ao-vivo.tsx).
-- =============================================================================
alter publication supabase_realtime add table public.interests;
