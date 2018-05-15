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

## Clone the repository on Linux AND on your raspi
On your computer :

	$ mkdir ~/hyperledger && cd ~/hyperledger
	$ git clone https://github.com/Gr05/multi-host-hyperledger-network/

On your Raspi : 

	pi$ mkdir ~/hyperledger && cd ~/hyperledger
	pi$ git clone https://github.com/Gr05/multi-host-hyperledger-network/
## Set the ENV environnement on the linux
On your linux set the environnement variable
- RASPI_NAME : the name of your raspi ("pi" for me)
- RASPI_IP : your raspberry ip ("10.41.24.170" for me)
- RASPI_PATH : the path to the folder where you clone the repository in the raspi ("/home/pi/hyperledger" for me)

Open your 

> ~/.bashrc

	$ gedit ~/.bashrc

and add these lines at the end of the file : 

	#export for multi-host-hyperledger-network
	export RASPI_NAME=<your raspi name> #pi
	export RASPI_IP=<your raspi ip> #10.41.24.170
	export RASPI_PATH=/home/$RASPI_NAME/hyperledger

## Last steps 
The last step consist in changing the ip used to host the orderer so : 

	$ gedit fabric-dev-servers-multipeer/composer/configtx.yaml	

change thes lines : 

	Addresses:
	- orderer.example.com:7050
	- 10.41.24.236:7050
to adapt with you pc ip :

	Addresses:
	- orderer.example.com:7050
	- <your pc ip>:7050
 
you have to do the same into startFabric-peer2.sh **in your raspi**:

	pi$ gedit fabric-dev-servers-multipeer/composer/startFabric-peer2.sh

change :

	docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer2.org1.example.com peer channel fetch config -o 10.41.24.236:7050 -c composerchannel
to adapt with your ip : 

	docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@org1.example.com/msp" peer2.org1.example.com peer channel fetch config -o <your pc ip>:7050 -c composerchannel

Finally go in your pc teminal and if all you config is good the following command script should work : 

	$ cd ~/hyperledger/multi-host-hyperledger-network/fabric-dev-servers-multipeer/composer/
	$ ./generate.sh
	$ ./push.sh	
You should give your raspi password for ssh connection. Don't panic if nothing happen when you use you keyboard linux doesn't show password entries.

## Start your network

	$ cd ~/hyperledger/multi-host-hyperledger-network/fabric-dev-servers-multipeer/
	$ ./startAllFabric.sh
You should give your raspi password for ssh connection like just before.
And then your network is running and your peers are connected .

## Stop your network 
	$ cd ~/hyperledger/multi-host-hyperledger-network/fabric-dev-servers-multipeer/
	$ ./stopAllFabric.sh
You should give your raspi password for ssh connection like just before.
And then your network is down.
