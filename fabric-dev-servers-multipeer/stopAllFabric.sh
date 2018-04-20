#!/bin/bash
./stopFabric.sh
ssh ${RASPI_NAME}@${RASPI_IP} "cd ${RASPI_PATH}/multi-host-hyperledger-network/fabric-dev-servers-multipeer && ./stopFabric-Peer2.sh"
