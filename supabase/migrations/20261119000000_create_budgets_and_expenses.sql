begin;

create table public.budgets (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  income_cents integer not null default 0 check (income_cents >= 0),
  needs_cents integer not null default 0 check (needs_cents >= 0),
  invest_cents integer not null default 0 check (invest_cents >= 0),
  fun_cents integer not null default 0 check (fun_cents >= 0),
  edu_cents integer not null default 0 check (edu_cents >= 0),
  primary key (user_id, month)
);

create table public.expenses (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id uuid not null default gen_random_uuid(),
  kind text not null check (kind in ('recurring', 'upcoming')),
  name text not null check (btrim(name) <> ''),
  amount_cents integer not null check (amount_cents >= 0),
  payment_day integer check (payment_day between 1 and 31),
  active boolean,
  due_date date,
  category text check (category in ('needs', 'invest', 'fun', 'edu')),
  description text,
  budget_month date generated always as (
    due_date - (extract(day from due_date)::integer - 1)
  ) stored,
  size text generated always as (
    case when amount_cents < 10000 then 'small' else 'big' end
  ) stored,
  primary key (user_id, id),
  foreign key (user_id, budget_month) references public.budgets (user_id, month),
  check (
    (kind = 'recurring' and active is not null and due_date is null
      and category is null and description is null)
    or
    (kind = 'upcoming' and due_date is not null and category is not null
      and payment_day is null and active is null)
  )
);

create index expenses_budget_idx on public.expenses (user_id, budget_month);

alter table public.budgets enable row level security;
alter table public.expenses enable row level security;

revoke all on public.budgets, public.expenses from public, anon, authenticated;
grant select, insert, update, delete on public.budgets, public.expenses to authenticated;

create policy own_budgets on public.budgets
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy own_expenses on public.expenses
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- The expense and its destination month are saved in the same transaction.
-- SECURITY INVOKER keeps budget creation subject to the caller's RLS policy.
create function public.ensure_expense_budget()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.kind = 'upcoming' and new.due_date is not null then
    insert into public.budgets (user_id, month)
    values (new.user_id, new.due_date - (extract(day from new.due_date)::integer - 1))
    on conflict (user_id, month) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.ensure_expense_budget() from public, anon, authenticated;

create trigger ensure_expense_budget
before insert or update of user_id, kind, due_date on public.expenses
for each row execute function public.ensure_expense_budget();

commit;
