psql -c 'drop database sensorwebtest;' -U postgres 2> /dev/null || :
psql -c 'create database sensorwebtest;' -U postgres 2> /dev/null || :
psql -c 'create extension postgis;' -U postgres sensorwebtest 2> /dev/null || :
