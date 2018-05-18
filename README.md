
﻿# Multi-host-hyperledger-network
In addittion of the Version 1.0, the chaincode is instantiated on peer0 directly within the script so you don't need to do it manually and the chaincode installed and instantiated is a chaincode call dev_chaincode which is more looking like the chaincode we want to use on final POC.
## Prerequist
###  On the linux 
Install : 
-  [docker](https://docs.docker.com/install/linux/docker-ce/ubuntu/) v18.03.0 or newer
- [docker-compose](https://docs.docker.com/compose/install/) v1.21.0 or newer
- [go](https://golang.org/dl/) v1.10.1 or newer
- [Node.js](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions) v8.11.1 or newer
- [Python](http://hyperledger-fabric.readthedocs.io/en/latest/prereqs.html#python) v2.7.12 or newer 

Check your version using :

	$ go version  
	$ docker -v  
	$ docker-compose -v  
	$ pip -V  
	$ git --version

### On your Raspberry (ARMV7)
Unable ssh into config param.

Install :
-  [docker](https://docs.docker.com/install/linux/docker-ce/ubuntu/) Arch:linux/armv7 v18.03.0 or newer
- [docker-compose](https://docs.docker.com/compose/install/) Arch:linux/armv7 v1.21.0 or newer
- [go](https://golang.org/dl/) Arch:linux/armv7 v1.10.1 or newer 
- [Node.js](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions) Arch:linux/armv7 v7.10.1 or newer
- [Python](http://hyperledger-fabric.readthedocs.io/en/latest/prereqs.html#python) Arch:linux/armv7 v2.7.9 or newer

Search the name of your raspberry and is IP adress, for the Ip adress you can use `ifconfig`

Make sure that the computer and the raspi are on the same wifi or physical network.
## Clone the repository on Linux AND on your raspi and download the right images.
Open 2 terminal and use one to connect your raspi in SSH: 

	$ ssh [raspi-name]@[raspi-IP]

On your computer :

	$ mkdir ~/hyperledger && cd ~/hyperledger
	$ git clone https://github.com/Gr05/multi-host-hyperledger-network/ -b FabricApp-v1.2
	$ ./downloadx86_64Fabric.sh
On your Raspi : 

	pi$ mkdir ~/hyperledger && cd ~/hyperledger
	pi$ git clone https://github.com/Gr05/multi-host-hyperledger-network/ -b FabricApp-v1.2
	pi$ ./downloadArmv7Fabric.sh
You need to retag some of these images : 

	pi$ docker tag jmotacek/fabric-ccenv:armv7l-1.0.7 hyperledger/fabric-ccenv:arm-1.0.7-snapshot-da14b6ba
	pi$ docker tag jmotacek/fabric-baseos:armv7l-0.3.2 hyperledger/fabric-baseos:arm-0.3.2
## Init the Swarm on the linux and Join it as a manager with the raspi

	$ docker swarm init
	$ docker swarm join-token manager

It will output something like this

	docker swarm join — token SWMTKN-1–3as8cvf3yxk8e7zj98954jhjza3w75mngmxh543llgpo0c8k7z-61zyibtaqjjimkqj8p6t9lwgu 172.16.0.153:2377
We will copy it (the one on your terminal, not the one above) and execute it on Raspi ssh connected terminal to make it join the Linux.

 ### Create a network called ("sqli-net" in my case) on the linux
	 $ docker network create --attachable --driver overlay sqli-net
	

***Attention !*** If you change the name of the network you will have to change the name everywhere it appears (I did it but it's a loose of time).

## Setting up your docker on raspi

	sudo systemctl unmask docker.service sudo systemctl unmask docker.socket sudo systemctl start docker.service
	sudo nano /boot/cmdline.txt

Add `cgroup_enable=memory swapaccount=1` before `elevator=deadline`
and then reboot.

You will still have problem with instantiating chaincode if you don't have this line

	--env CORE_VM_DOCKER_HOSTCONFIG_MEMORY=536870912

on docker run on raspi (I'm not sure if you can change the number I didn't try to). So this is an **IMPORTANT** environnement variable for using hyperledger docker container on Raspberry. If you prefer follow the tutorial I followed, you will need to add this line on each docker run in the raspi. If you clone my repository, and follow this tutorial it's already embbeded.

## Start the Hyperledger network

### Start the CA Server

On a first Linux terminal : 

	$ cd ~/hyperledger/multi-host-hyperledger-network/Build-Multi-Host-Network-Hyperledger/
	$ docker run --rm -it --network="sqli-net" --name ca.example.com -p 7054:7054 -e FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server -e FABRIC_CA_SERVER_CA_NAME=ca.example.com -e FABRIC_CA_SERVER_CA_CERTFILE=/etc/hyperledger/fabric-ca-server-config/ca.org1.example.com-cert.pem -e FABRIC_CA_SERVER_CA_KEYFILE=/etc/hyperledger/fabric-ca-server-config/cec0f280f7092174cc30b05bb78e2eb329862335ad5ed44a290f7eb623a49212_sk -v $(pwd)/crypto-config/peerOrganizations/org1.example.com/ca/:/etc/hyperledger/fabric-ca-server-config -e CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=hyp-net hyperledger/fabric-ca:x86_64-1.0.4 sh -c 'fabric-ca-server start -b admin:adminpw -d'

If you regenerate your crypto tools you will need to change :
`cec0f280f7092174cc30b05bb78e2eb329862335ad5ed44a290f7eb623a49212_sk`
by the new _sk file generated into :
`crypto-config/peerOrganizations/org1.example.com/ca`

### Start Orderer

On a second Linux terminal run : 

	$ cd ~/hyperledger/multi-host-hyperledger-network/Build-Multi-Host-Network-Hyperledger/
	$ docker run --rm -it --network="sqli-net" --name orderer.example.com -p 7050:7050 -e ORDERER_GENERAL_LOGLEVEL=debug -e ORDERER_GENERAL_LISTENADDRESS=0.0.0.0 -e ORDERER_GENERAL_LISTENPORT=7050 -e ORDERER_GENERAL_GENESISMETHOD=file -e ORDERER_GENERAL_GENESISFILE=/var/hyperledger/orderer/orderer.genesis.block -e ORDERER_GENERAL_LOCALMSPID=OrdererMSP -e ORDERER_GENERAL_LOCALMSPDIR=/var/hyperledger/orderer/msp -e ORDERER_GENERAL_TLS_ENABLED=false -e CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=sqli-net -v $(pwd)/channel-artifacts/genesis.block:/var/hyperledger/orderer/orderer.genesis.block -v $(pwd)/crypto-config/ordererOrganizations/example.com/orderers/orderer.example.com/msp:/var/hyperledger/orderer/msp -w /opt/gopath/src/github.com/hyperledger/fabric hyperledger/fabric-orderer:x86_64-1.0.4 orderer

### Start the couchDB0 for Peer0
In a third terminal on your Linux run :

	$ cd ~/hyperledger/multi-host-hyperledger-network/Build-Multi-Host-Network-Hyperledger/
	$ docker run --rm -it --network="sqli-net" --name couchdb0 -p 5984:5984 -e COUCHDB_USER= -e COUCHDB_PASSWORD= -e CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=sqli-net hyperledger/fabric-couchdb:x86_64-1.0.4

### Start the Peer0
In a last terminal on the computer run : 

	$ cd ~/hyperledger/multi-host-hyperledger-network/Build-Multi-Host-Network-Hyperledger/
	$ docker run --rm -it --link orderer.example.com:orderer.example.com --network="sqli-net" --name peer0.org1.example.com -p 8051:7051 -p 8053:7053 -e CORE_LEDGER_STATE_STATEDATABASE=CouchDB -e CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS=couchdb0:5984 -e CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME= -e CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD= -e CORE_PEER_ADDRESSAUTODETECT=true -e CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock -e CORE_LOGGING_LEVEL=DEBUG -e CORE_PEER_NETWORKID=peer0.org1.example.com -e CORE_NEXT=true -e CORE_PEER_ENDORSER_ENABLED=true -e CORE_PEER_ID=peer0.org1.example.com -e CORE_PEER_PROFILE_ENABLED=true -e CORE_PEER_COMMITTER_LEDGER_ORDERER=orderer.example.com:7050 -e CORE_PEER_GOSSIP_IGNORESECURITY=true -e CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=sqli-net -e CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer0.org1.example.com:7051 -e CORE_PEER_TLS_ENABLED=false -e CORE_PEER_GOSSIP_USELEADERELECTION=false -e CORE_PEER_GOSSIP_ORGLEADER=true -e CORE_VM_DOCKER_HOSTCONFIG_MEMORY=536870912 -e CORE_PEER_LOCALMSPID=Org1MSP -v /var/run/:/host/var/run/ -v $(pwd)/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp:/etc/hyperledger/fabric/msp -w /opt/gopath/src/github.com/hyperledger/fabric/peer hyperledger/fabric-peer:x86_64-1.0.4 peer node start

### Start the couchDB1 for Peer1
In a ***raspberry terminal*** run :

	pi$ cd ~/hyperledger/multi-host-hyperledger-network/Build-Multi-Host-Network-Hyperledger/
	pi$ docker run --rm -it --network="sqli-net" --name couchdb1 -p 6984:5984 -e COUCHDB_USER= -e COUCHDB_PASSWORD= -e CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=sqli-net jmotacek/fabric-couchdb:armv7l-1.0.7

### Start the Peer1
In a second raspberry terminal run : 

	pi$ cd ~/hyperledger/multi-host-hyperledger-network/Build-Multi-Host-Network-Hyperledger/
	pi$ docker run --rm -it --network="sqli-net" --link orderer.example.com:orderer.example.com --link peer0.org1.example.com:peer0.org1.example.com --name peer1.org1.example.com -p 9051:7051 -p 9053:7053 --env CORE_VM_DOCKER_HOSTCONFIG_MEMORY=536870912 -e CORE_LEDGER_STATE_STATEDATABASE=CouchDB -e CORE_LEDGER_STATE_COUCHDBCONFIG_COUCHDBADDRESS=couchdb1:5984 -e CORE_LEDGER_STATE_COUCHDBCONFIG_USERNAME= -e CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD= -e CORE_PEER_ADDRESSAUTODETECT=true -e CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock -e CORE_LOGGING_LEVEL=DEBUG -e CORE_PEER_NETWORKID=peer1.org1.example.com -e CORE_NEXT=true -e CORE_PEER_ENDORSER_ENABLED=true -e CORE_PEER_ID=peer1.org1.example.com -e CORE_PEER_PROFILE_ENABLED=true -e CORE_PEER_COMMITTER_LEDGER_ORDERER=orderer.example.com:7050 -e CORE_PEER_GOSSIP_ORGLEADER=true -e CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer1.org1.example.com:7051 -e CORE_PEER_GOSSIP_IGNORESECURITY=true -e CORE_PEER_LOCALMSPID=Org1MSP -e CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=sqli-net -e CORE_PEER_GOSSIP_BOOTSTRAP=peer0.org1.example.com:7051 -e CORE_PEER_GOSSIP_USELEADERELECTION=false -e CORE_PEER_TLS_ENABLED=false -v /var/run/:/host/var/run/ -v $(pwd)/crypto-config/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/msp:/etc/hyperledger/fabric/msp -w /opt/gopath/src/github.com/hyperledger/fabric/peer jmotacek/fabric-peer:armv7l-1.0.7 peer node start

### Start the CLI on the Raspberry and install chaincode on both peers.
In a last terminal on the raspberry run : 

	pi$ cd ~/hyperledger/multi-host-hyperledger-network/Build-Multi-Host-Network-Hyperledger/
	pi$ docker run --rm -it --network="sqli-net" --name cli -p 12051:7051 -p 12053:7053 -e GOPATH=/opt/gopath -e CORE_PEER_LOCALMSPID=Org1MSP --env CORE_VM_DOCKER_HOSTCONFIG_MEMORY=536870912 -e CORE_PEER_TLS_ENABLED=false -e CORE_VM_DOCKER_HOSTCONFIG_MEMORY=536870912 -e CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock -e CORE_LOGGING_LEVEL=DEBUG -e CORE_PEER_ID=cli -e CORE_PEER_ADDRESS=peer0.org1.example.com:7051 -e CORE_PEER_NETWORKID=cli -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp -e CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=sqli-net  -v /var/run/:/host/var/run/ -v $(pwd)/chaincode/:/opt/gopath/src/github.com/hyperledger/fabric/examples/chaincode/go -v $(pwd)/crypto-config:/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ -v $(pwd)/scripts:/opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/ -v $(pwd)/channel-artifacts:/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts -w /opt/gopath/src/github.com/hyperledger/fabric/peer jmotacek/fabric-tools:armv7l-1.0.7 /bin/bash -c './scripts/script.sh && ./scripts/useChaincode.sh'
 

You should see the `--env CORE_VM_DOCKER_HOSTCONFIG_MEMORY=536870912` I spoke about on the two last commands. You can also remark that the docker images used are not the same (Because of the problem we talk about at the begining).

### Understand what does useChaincode
The command above should take approximatively 1 or 2 minutes depending on the raspberry, crating the chaincode container is quietly long on the raspi. 
If you want you can look at what *useChaincode* does. Mostly I wrote the chaincode so that it populate with 3 Houses initialise with a balancePower amount to 0 for 2 of these three and 200 for "House1". So executing this script ***inside the cli*** you will : 
- Query the ledger using the peer0  (the one hosted by the computer)
- Make a "maj" invoke updating the "House1" by adding 10 credits using the peer0
- Waiting 10 seconds to be sur that the modification is propagated to the peer1
- Query the ledger again using peer1 (the one on the raspberry) to see the modifications

For sur you can exec it lonely after this step runing : 

	pi$ cd ~/hyperledger/multi-host-hyperledger-network/Build-Multi-Host-Network-Hyperledger/
	pi$ docker run --rm -it --network="sqli-net" --name cli -p 12051:7051 -p 12053:7053 -e GOPATH=/opt/gopath -e CORE_PEER_LOCALMSPID=Org1MSP --env CORE_VM_DOCKER_HOSTCONFIG_MEMORY=536870912 -e CORE_PEER_TLS_ENABLED=false -e CORE_VM_DOCKER_HOSTCONFIG_MEMORY=536870912 -e CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock -e CORE_LOGGING_LEVEL=DEBUG -e CORE_PEER_ID=cli -e CORE_PEER_ADDRESS=peer0.org1.example.com:7051 -e CORE_PEER_NETWORKID=cli -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp -e CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=sqli-net  -v /var/run/:/host/var/run/ -v $(pwd)/chaincode/:/opt/gopath/src/github.com/hyperledger/fabric/examples/chaincode/go -v $(pwd)/crypto-config:/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ -v $(pwd)/scripts:/opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/ -v $(pwd)/channel-artifacts:/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts -w /opt/gopath/src/github.com/hyperledger/fabric/peer jmotacek/fabric-tools:armv7l-1.0.7 /bin/bash -c './scripts/useChaincode.sh'

# Run the MeteorApp

Now you have your blockchain running so to query the House1 and the see the result of the `useChaincode.sh` script let's run our really basic Meteor App

Open a new terminal (Yes the 8th !!) :

	$ cd  ~/hyperledger/multi-host-hyperledger-network/Build-Multi-Host-Network-Hyperledger/basicMeteoApp
	$ npm install
	$ meteor

Then Open the file :

> server/main.js

and replace all the IP by yours ("10.41.24.170" raspi for me, "10.41.24.236" pc for me)
You should now go on `localhost:3000` and look at the yellow square "état du compteur" see that the value is 210.

If you use exec `useChaincode.sh` in the cli like explain just beside, the value should be updated to 220 when refreshing 


# NEXT 
- Use event to render the update of the value no need refresh.
- Improved use of the enroll admin and register user, maybe put buttons to be sure it's done on the good order to avoid crash.
- Create some services to update the blockchain with the App

# The error you could face :

Note that I tried to change the chaincode file, but that failed to install without changing the name of the chaincode or the version and when i tried to instantiate it, it still have ancient chaincode install and instantiate failed. So be careful about this.

### Bad retag : 
> Error: Error endorsing chaincode: rpc error: code = Unknown desc =
> Error starting container: Failed to generate platform-specific docker
> build: Failed to pull
> hyperledger/fabric-ccenv:arm-1.0.7-snapshot-da14b6ba: API error (404):
> {"message":"manifest for
> **hyperledger/fabric-ccenv:arm-1.0.7-snapshot-da14b6ba** not found"}
>
In my case I faced this error this it's why I retaged my image with this name. If you have the same problem but with a different name, retag you image using the right name in my case that was : 

	pi$ docker tag jmotacek/fabric-ccenv:armv7l-1.0.7 hyperledger/fabric-ccenv:arm-1.0.7-snapshot-da14b6ba	 

After this modification if you retry you could have this error : 

> Error: Error endorsing chaincode: rpc error: code = Unknown desc =
> Error starting container: manifest for
> **hyperledger/fabric-baseos:arm-0.3.2** not found

If you see this error it's the same than just above, retag your image :

	pi$ docker tag jmotacek/fabric-baseos:armv7l-0.3.2 hyperledger/fabric-baseos:arm-0.3.2
