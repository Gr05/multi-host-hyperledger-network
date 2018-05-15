#!/bin/bash
./startFabric.sh
ssh ${RASPI_NAME}@${RASPI_IP} "cd ${RASPI_PATH}/multi-host-hyperledger-network/fabric-dev-servers-multipeer && ./startFabric-Peer2.sh"
