#!/bin/bash

echo "******ENABLING POSTGIS******"
gosu postgres psql --user $POSTGRES_USER -c "CREATE EXTENSION postgis;"
gosu postgres psql --user $POSTGRES_USER -c "CREATE EXTENSION postgis_topology;"

#echo "******CREATING DOCKER DATABASE******"
#gosu postgres psql --user $POSTGRES_USER < /docker-entrypoint-initdb.d/db_schema_create_v2.sql
#echo ""