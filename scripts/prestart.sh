psql -c 'create database sensorweb;' -U postgres 2> /dev/null || :
psql -c 'create extension postgis;' -U postgres sensorweb 2> /dev/null || :
