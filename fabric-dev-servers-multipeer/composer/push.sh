#!/bin/bash
echo "scp -r crypto-config composer-* ${RASPI_NAME}@${RASPI_IP}:${RASPI_PATH}/multi-host-hyperledger-network/fabric-dev-servers-multipeer/composer"

scp -r crypto-config composer-* ${RASPI_NAME}@${RASPI_IP}:${RASPI_PATH}/multi-host-hyperledger-network/fabric-dev-servers-multipeer/composer