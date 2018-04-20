#!/bin/bash
./startFabric.sh
ssh pi@10.41.24.170 'cd hyperledger/fabric-samples-1.0.x/fabric-dev-servers-multipeer && ./startFabric-Peer2.sh'
