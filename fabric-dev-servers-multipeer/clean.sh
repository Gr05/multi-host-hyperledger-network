#!/bin/bash

composer card delete -n citizen1@sqli-network
composer card delete -n citizen2@sqli-network
composer card delete -n sig@sqli-network
composer card delete -n admin@sqli-network

rm -rf cards/*.card