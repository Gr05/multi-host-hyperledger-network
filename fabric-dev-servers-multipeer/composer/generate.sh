#!/bin/bash
 
 rm -rf crypto-config
 ../../bin/cryptogen generate --config=crypto-config.yaml

 export FABRIC_CFG_PATH=$PWD

 ../../bin/configtxgen -profile ComposerOrdererGenesis -outputBlock composer-genesis.block
 ../../bin/configtxgen -profile ComposerChannel -outputCreateChannelTx composer-channel.tx -channelID composerchannel

 ./push.sh