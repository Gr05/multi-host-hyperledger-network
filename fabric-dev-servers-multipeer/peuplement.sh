#!/bin/bash

echo "Creating Citizen 1 .. "
composer participant add -c admin@sqli-network -d '{ "$class": "org.example.sqlinetwork.Citizen", "citizenId": "1000",  "firstName": "citizen",  "lastName": "1" }'
composer identity issue -c admin@sqli-network -f cards/citizen1.card -u citizen1 -a "org.example.sqlinetwork.Citizen#1000"
composer card import -f cards/citizen1.card

echo "Creating Citizen 2 ... "
composer participant add -c admin@sqli-network -d '{ "$class": "org.example.sqlinetwork.Citizen", "citizenId": "2000",  "firstName": "citizen",  "lastName": "2" }'
composer identity issue -c admin@sqli-network -f cards/citizen2.card -u citizen2 -a "org.example.sqlinetwork.Citizen#2000"
composer card import -f cards/citizen2.card

echo "Creating SIG ..."
composer participant add -c admin@sqli-network -d '{ "$class": "org.example.sqlinetwork.Citizen", "citizenId": "42",  "firstName": "SIG",  "lastName": "ADMIN" }'
composer identity issue -c admin@sqli-network -f cards/sig.card -u sig -a "org.example.sqlinetwork.Citizen#42"
composer card import -f cards/sig.card

composer card list

echo "Creating Houses ...."
composer transaction submit --card admin@sqli-network -d '{"$class": "org.hyperledger.composer.system.AddAsset","registryType": "Asset","registryId": "org.example.sqlinetwork.House", "targetRegistry" : "resource:org.hyperledger.composer.system.AssetRegistry#org.example.sqlinetwork.House", "resources": [{"$class": "org.example.sqlinetwork.House","houseId": "1000","homer": "resource:org.example.sqlinetwork.Citizen#1000","adress": "11 rue de la paix", "balance": 0}]}'
composer transaction submit --card admin@sqli-network -d '{"$class": "org.hyperledger.composer.system.AddAsset","registryType": "Asset","registryId": "org.example.sqlinetwork.House", "targetRegistry" : "resource:org.hyperledger.composer.system.AssetRegistry#org.example.sqlinetwork.House", "resources": [{"$class": "org.example.sqlinetwork.House","houseId": "2000","homer": "resource:org.example.sqlinetwork.Citizen#2000","adress": "12 Avenue de la république", "balance": 0}]}'
