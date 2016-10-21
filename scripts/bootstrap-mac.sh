#!/bin/bash

#
# Check if Homebrew is installed.
#
which -s brew
if [[ $? != 0 ]] ; then
echo "Installing Homebrew"
# Install Homebrew
# https://github.com/mxcl/homebrew/wiki/installation
/usr/bin/ruby -e "$(curl -fsSL https://raw.github.com/gist/323731)"
fi

#
# Install PostGIS if needed.
#
if brew list -1 | grep -q "^postgis\$"; then
echo "Package postgis is installed"
else
echo "Package postgis is not installed. Installing..."
brew update
brew install postgis
fi

#
# Start postgres.
#
pg_ctl -D /usr/local/var/postgres start &>/dev/null

#
# Make sure postgres role and users' database exists.
#
createuser -s postgres &>/dev/null
createdb `whoami` &>/dev/null

psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';" &>/dev/null
psql -U postgres -c "CREATE DATABASE sensorweb OWNER postgres;" &>/dev/null

echo "Done"
