#!/bin/bash

echo "This operation is not transactional, BEGIN BY DELETE old raspberry certificate\n"
ssh ${RASPI_NAME}@${RASPI_IP} "cd ${RASPI_PATH}/multi-host-hyperledger-network/fabric-dev-servers-multipeer/composer && rm -rf crypto-config"

echo "Copy the certificate to the raspberry"
echo "scp -r crypto-config composer-* ${RASPI_NAME}@${RASPI_IP}:${RASPI_PATH}/multi-host-hyperledger-network/fabric-dev-servers-multipeer/composer"
scp -r crypto-config composer-* ${RASPI_NAME}@${RASPI_IP}:${RASPI_PATH}/multi-host-hyperledger-network/fabric-dev-servers-multipeer/composer