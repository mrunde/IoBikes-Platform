CREATE TABLE iobdata (
    id SERIAL PRIMARY KEY,
    ip text,
    data jsonb
);

# der Datenbanknutzer braucht Rechte sowohl auf der iobdata als auch iobdata_id_seq Tabelle

# iob=# \d iobdata
#                          Table "public.iobdata"
#  Column |  Type   |                      Modifiers
# --------+---------+------------------------------------------------------
#  id     | integer | not null default nextval('iobdata_id_seq'::regclass)
#  ip     | text    |
#  data   | jsonb   |
