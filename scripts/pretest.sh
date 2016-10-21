psql -c 'drop database sensorwebtest;' -U postgres 2> /dev/null || :
psql -c 'create database sensorwebtest;' -U postgres 2> /dev/null || :
