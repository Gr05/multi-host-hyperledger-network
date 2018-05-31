#!/bin/bash

CHANNEL_NAME="$1"
DELAY="$2"
: ${CHANNEL_NAME:="mychannel"}
: ${CHAINCODE_NAME:="mycc"}
: ${CHAINCODE_VERSION:="1.1"}
: ${TIMEOUT:="60"}


setGlobals () {

	if [ $1 -eq 0 -o $1 -eq 1 ] ; then
		if [ $1 -eq 0 ]; then
			CORE_PEER_ADDRESS=peer0.org1.example.com:7051
			CORE_PEER_LOCALMSPID="Org1MSP"
			CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
			CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
		else
			CORE_PEER_ADDRESS=peer0.org2.example.com:7051
			CORE_PEER_LOCALMSPID="Org2MSP"
			CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
			CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp

		fi
	fi

	env |grep CORE
}

verifyResult () {
	if [ $1 -ne 0 ] ; then
		echo "!!!!!!!!!!!!!!! "$2" !!!!!!!!!!!!!!!!"
    echo "========= ERROR !!! FAILED to execute End-2-End Scenario ==========="
		echo
   		exit 1
	fi
}

chaincodeQuery () {
  PEER=$1
  echo "===================== Querying on PEER$PEER on channel '$CHANNEL_NAME'... ===================== "
  setGlobals $PEER
  peer chaincode query -C $CHANNEL_NAME -n $CHAINCODE_NAME -c '{"Args":["query","House1"]}' >&log.txt
  echo
  cat log.txt
	echo "===================== Query on PEER$PEER on channel '$CHANNEL_NAME' is finished ===================== "
}

chaincodeInvokeProd () {
	PEER=$1
	setGlobals $PEER
	# while 'peer chaincode' command can get the orderer endpoint from the peer (if join was successful),
	# lets supply it directly as we know it using the "-o" option
	peer chaincode invoke -o orderer.example.com:7050 -C $CHANNEL_NAME -n $CHAINCODE_NAME -c '{"Args":["produce","House1","3"]}' >&log.txt
	res=$?
	cat log.txt
	verifyResult $res "Invoke execution on PEER$PEER failed "
	echo "===================== Invoke Prod on PEER$PEER on channel '$CHANNEL_NAME' is finished ===================== "
	echo
}

chaincodeInvokeCons () {
	PEER=$1
	setGlobals $PEER
	# while 'peer chaincode' command can get the orderer endpoint from the peer (if join was successful),
	# lets supply it directly as we know it using the "-o" option
	peer chaincode invoke -o orderer.example.com:7050 -C $CHANNEL_NAME -n $CHAINCODE_NAME -c '{"Args":["consume","House1","10"]}' >&log.txt
	res=$?
	cat log.txt
	verifyResult $res "Invoke execution on PEER$PEER failed "
	echo "===================== Invoke Cons on PEER$PEER on channel '$CHANNEL_NAME' is finished ===================== "
	echo
}

getHistory () {
	PEER=$1
	setGlobals $PEER
	# while 'peer chaincode' command can get the orderer endpoint from the peer (if join was successful),
	# lets supply it directly as we know it using the "-o" option
	peer chaincode invoke -o orderer.example.com:7050 -C $CHANNEL_NAME -n $CHAINCODE_NAME -c '{"Args":["getHistory","House1"]}' >&log.txt
	res=$?
	cat log.txt
	verifyResult $res "Invoke execution on PEER$PEER failed "
	echo "===================== Invoke getHistory on PEER$PEER on channel '$CHANNEL_NAME' is finished ===================== "
	echo
}

#Query on chaincode on Peer0/Org1
echo "Querying chaincode on org1/peer0..."
chaincodeQuery 0

#Invoke on chaincode on Peer0/Org1
echo "Sending invoke transaction on org1/peer0..."
chaincodeInvokeProd 0
sleep 3
chaincodeInvokeCons 1
sleep 3
getHistory 0

exit 0 