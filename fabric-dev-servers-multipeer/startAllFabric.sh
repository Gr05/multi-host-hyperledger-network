#!/bin/bash
./startFabric.sh
ssh pi@10.41.24.170 'cd hyperledger/fabric-dev && ./startFabric-Peer2.sh'
