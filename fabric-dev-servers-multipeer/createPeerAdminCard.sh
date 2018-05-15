#!/bin/bash

# Exit on first error
set -e
# Grab the current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo
# check that the composer command exists at a version >v0.14
if hash composer 2>/dev/null; then
    composer --version | awk -F. '{if ($2<15) exit 1}'
    if [ $? -eq 1 ]; then
        echo 'Sorry, Use createConnectionProfile for versions before v0.15.0' 
        exit 1
    else
        echo Using composer-cli at $(composer --version)
    fi
else
    echo 'Need to have composer-cli installed at v0.15 or greater'
    exit 1
fi

# need to get the certificate 
PRIVATE_KEY="${DIR}"/composer/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/1a06f2c87526444a952831c61b5a2ce6aef5beeb897299e8772fdb484c8a0d42_sk
CERT="${DIR}"/composer/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/Admin@org1.example.com-cert.pem

if composer card list -n PeerAdmin@sqli-network > /dev/null; then
    composer card delete -n PeerAdmin@sqli-network
fi
if composer card list -n admin@sqli-network > /dev/null; then
    composer card delete -n admin@sqli-network
fi
composer card create -p ./connection.json -u PeerAdmin -c "${CERT}" -k "${PRIVATE_KEY}" -r PeerAdmin -r ChannelAdmin --file /tmp/PeerAdmin@sqli-network.card
composer card import --file /tmp/PeerAdmin@sqli-network.card 

echo "Hyperledger Composer PeerAdmin card has been imported"
composer card list


composer runtime install -c PeerAdmin@sqli-network -n sqli-network
composer network start -c PeerAdmin@sqli-network -a sqli-network@0.0.1.bna -A admin -S adminpw -f cards/admin@sqli-network.card
composer card import -f cards/admin@sqli-network.card