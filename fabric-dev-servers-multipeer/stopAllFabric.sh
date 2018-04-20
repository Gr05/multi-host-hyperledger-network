#!/bin/bash
./stopFabric.sh
ssh pi@10.41.24.170 'cd hyperledger/multi-host-hyperledger-network/fabric-dev-servers-multipeer && ./stopFabric-Peer2.sh'
