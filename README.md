# Multi-host-hyperledger-network

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

Authorize ssh connection on your raspi (By default authorized on raspberry pi 3)

Search the name of your raspberry and is IP adress, for the Ip adress you can use `ifconfig`

Make sure that the computer and the raspi are on the same wifi or physical network.
## Clone the repository on Linux AND on your raspi and download the right images.
Open 2 terminal and use one to connect your raspi in SSH: 

	$ ssh [raspi-name]@[raspi-IP]

On your computer :

	$ mkdir ~/hyperledger && cd ~/hyperledger
	$ git clone https://github.com/Gr05/multi-host-hyperledger-network/ -b FabricApp-v1.0
	$ ./downloadx86_64Fabric.sh
On your Raspi : 

	pi$ mkdir ~/hyperledger && cd ~/hyperledger
	pi$ git clone https://github.com/Gr05/multi-host-hyperledger-network/ -b FabricApp-v1.0
	pi$ ./downloadArmv7Fabric.sh
You need to retag some of these images : 

	pi$ docker tag jmotacek/fabric-ccenv:armv7l-1.0.7 hyperledger/fabric-ccenv:arm-1.0.7-snapshot-da14b6ba
	pi$ docker tag jmotacek/fabric-baseos:armv7l-1.0.7 hyperledger/fabric-baseos:arm-0.3.2
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
	pi$ docker run --rm -it --network="sqli-net" --name cli -p 12051:7051 -p 12053:7053 -e GOPATH=/opt/gopath -e CORE_PEER_LOCALMSPID=Org1MSP --env CORE_VM_DOCKER_HOSTCONFIG_MEMORY=536870912 -e CORE_PEER_TLS_ENABLED=false -e CORE_VM_DOCKER_HOSTCONFIG_MEMORY=536870912 -e CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock -e CORE_LOGGING_LEVEL=DEBUG -e CORE_PEER_ID=cli -e CORE_PEER_ADDRESS=peer0.org1.example.com:7051 -e CORE_PEER_NETWORKID=cli -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp -e CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=sqli-net  -v /var/run/:/host/var/run/ -v $(pwd)/chaincode/:/opt/gopath/src/github.com/hyperledger/fabric/examples/chaincode/go -v $(pwd)/crypto-config:/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ -v $(pwd)/scripts:/opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/ -v $(pwd)/channel-artifacts:/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts -w /opt/gopath/src/github.com/hyperledger/fabric/peer jmotacek/fabric-tools:armv7l-1.0.7 /bin/bash -c './scripts/script.sh'

You should see the `--env CORE_VM_DOCKER_HOSTCONFIG_MEMORY=536870912` I spoke about on the two last commands. You can also remark that the docker images used are not the same (Because of the problem we talk about at the begining).

### Instantiate the chaincode
There is more risk to have bug during the instantiation of the chaincode on the peer1 (hosted buy the raspberry) the we will try on this one. On the terminal used to start the CLI, run this command : 

	pi$ cd ~/hyperledger/multi-host-hyperledger-network/Build-Multi-Host-Network-Hyperledger/
	pi$ docker run --rm -it --network="sqli-net" --name cli -p 12051:7051 -p 12053:7053 -e GOPATH=/opt/gopath -e CORE_PEER_LOCALMSPID=Org1MSP --env CORE_VM_DOCKER_HOSTCONFIG_MEMORY=536870912 -e CORE_PEER_TLS_ENABLED=false -e CORE_VM_DOCKER_HOSTCONFIG_MEMORY=536870912 -e CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock -e CORE_LOGGING_LEVEL=DEBUG -e CORE_PEER_ID=cli -e CORE_PEER_ADDRESS=peer0.org1.example.com:7051 -e CORE_PEER_NETWORKID=cli -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp -e CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=sqli-net  -v /var/run/:/host/var/run/ -v $(pwd)/chaincode/:/opt/gopath/src/github.com/hyperledger/fabric/examples/chaincode/go -v $(pwd)/crypto-config:/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ -v $(pwd)/scripts:/opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/ -v $(pwd)/channel-artifacts:/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts -w /opt/gopath/src/github.com/hyperledger/fabric/peer jmotacek/fabric-tools:armv7l-1.0.7 /bin/bash 

If there is no error, you should see something like this : 

    root@0c8dacaeeba0:/opt/gopath/src/github.com/hyperledger/fabric/peer
And then run : 

	CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
	CORE_PEER_LOCALMSPID="Org1MSP"
	CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
	CORE_PEER_ADDRESS=peer1.org1.example.com:7051
	peer chaincode instantiate -o orderer.example.com:7050 -C mychannel -n mycc -v 1.0 -c '{"Args":["init","a","100","b","200"]}' -P "OR ('Org1MSP.member','Org2MSP.member')"

If there is no error, you should see a new container created on your raspberry using `docker ps` with a name looking like this : 

	peer1.org1.example.com-peer1.org1.example.com-mycc-1.0-a5b0dac3d6f43166484914bf6652a7247e63d2caf7c999ff8f708f3e466721a3

If there is no container like this, that's should mean that there is an error somewhere in the logs or maybe direclty shown on the cli logs. Please refer to the part dedicated from the possible error.

### TEST Your chaincode 
At this moment the chaincode is installed on both peers and instantiated only on the peer1. But you should be able to use it on each peer and i let you try do this.
Still in the cli run :

	CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
	CORE_PEER_LOCALMSPID="Org1MSP"
	CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
	CORE_PEER_ADDRESS=peer0.org1.example.com:7051
	peer chaincode query -C mychannel -n mycc -c '{"Args":["query","a"]}'

This is only a query on the Peer0 to ask the value of 'a', you should see : `Query Result: 100`
And also a new container created on your PC using `docker ps` looking like this :

    peer0.org1.example.com-peer0.org1.example.com-mycc-1.0-2d219accebe7455911a539a51653cab28ed302fec2d7add1e1ec4e79f02a146f

Because to execute chaincode the peer0 need to create his own chaincode container if it haven't it. This can work only if the chaincode is already installed on both peers and instantiated on at least one. If that doesn't work there is a big likelihood that is because instantiation failed on peer0.

You can then try to make a transaction (On CLI) :

	peer chaincode invoke -o orderer.example.com:7050 -C mychannel -n mycc -c '{"Args":["invoke","a","b","10"]}'
	peer chaincode query -C mychannel -n mycc -c '{"Args":["query","a"]}'

You should see `Query Result: 90`, because the first command line made a transaction giving 10 from 'a' to 'b'. The invoke args depend on the chaincode and how you implemented it.

# NEXT 
Congratulation you have very basic chaincode working on network you created between PC and Raspberry. The next step could be to script this all making a stacks or try to write his own chaincode and use it on the channel "mychannel".
