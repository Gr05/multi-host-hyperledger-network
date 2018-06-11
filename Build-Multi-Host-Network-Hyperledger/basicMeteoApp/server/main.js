import { Meteor } from 'meteor/meteor';
//import { Fabric_Client } from 'fabric-client';

Meteor.startup(() => {
  //enrollAdmin().then(() => registerUser());
});

Meteor.methods({
   queryChaincode(house){
    var Fabric_Client = require('fabric-client');
    // 
    var fabric_client = new Fabric_Client();

    // setup the fabric network
    var channel = fabric_client.newChannel('mychannel');
    var peer1 = fabric_client.newPeer('grpc://localhost:8051');
    var peer2 = fabric_client.newPeer('grpc://10.41.24.170:9051');
    channel.addPeer(peer1);
    channel.addPeer(peer2);
 
    //
    //Cette variable est inutile 
    //var member_user = null;
    var store_path = '/home/lguerry/hyperledger/multi-host-hyperledger-network/Build-Multi-Host-Network-Hyperledger/basicMeteoApp/hfc-key-store';
    console.log('Store path:'+store_path);
    var tx_id = null;

    //create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
    var promise =
    Fabric_Client.newDefaultKeyValueStore({ path: store_path
    }).then((state_store) => {
      // assign the store to the fabric client
      fabric_client.setStateStore(state_store);
      var crypto_suite = Fabric_Client.newCryptoSuite();
      // use the same location for the state store (where the users' certificate are kept)
      // and the crypto store (where the users' keys are kept)
      var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
      crypto_suite.setCryptoKeyStore(crypto_store);
      fabric_client.setCryptoSuite(crypto_suite);

      // get the enrolled user from persistence, this user will sign all requests
      return fabric_client.getUserContext('user1', true);
    }).then((user_from_store) => {
      if (user_from_store && user_from_store.isEnrolled()) {
        console.log('Successfully loaded user1 from persistence');
        //member_user = user_from_store;
      } else {
        throw new Error('Failed to get user1.... run registerUser.js');
      }

      

      // queryCar chaincode function - requires 1 argument, ex: args: ['CAR4'],
      // queryAllCars chaincode function - requires no arguments , ex: args: [''],
      const request = {
        //targets : --- letting this default to the peers assigned to the channel
        chaincodeId: 'mycc',
        fcn: 'query',
        args: [house]
      };

      // send the query proposal to the peer
      return channel.queryByChaincode(request);
    }).then((query_responses) => {
      console.log("Query has completed, checking results");
      // query_responses could have more than one  results if there multiple peers were used as targets
      if (query_responses && query_responses.length != 0) {
        for (var i = 0 ; i < query_responses.length; i++){
          if (query_responses[0] instanceof Error) {
            console.error("error from query = ", query_responses[0]);
          } else {
            console.log("Response for peer", i + 1 , "is ", query_responses[i].toString());
          }
        }
        var res = JSON.parse(query_responses[0]).Production - JSON.parse(query_responses[0]).Consumption
        console.log(res);
        return JSON.parse(query_responses[0]); 
      } else {
        console.log("No payloads were returned from query");
      }
    }).catch((err) => {
      console.error('Failed to query successfully :: ' + err);
    });
    return promise
  },

  enrollAdmin(){
    'use strict';
    /*
    * Enroll the admin user
    */
    
    var Fabric_Client = require('fabric-client');
    var Fabric_CA_Client = require('fabric-ca-client');
    
    //
    var fabric_client = new Fabric_Client();
    var fabric_ca_client = null;
    var admin_user = null;
    //var member_user = null;
    // store path = '$BASIC_METEOR_APP_DIR/.meteor/local/build/programs/server/hfc-key-store
    var store_path = '/home/lguerry/hyperledger/multi-host-hyperledger-network/Build-Multi-Host-Network-Hyperledger/basicMeteoApp/hfc-key-store';
    console.log(' Store path:'+store_path);
    
    var promise = 
    Fabric_Client.newDefaultKeyValueStore({ path: store_path
    }).then((state_store) => {
        // assign the store to the fabric client
        fabric_client.setStateStore(state_store);
        var crypto_suite = Fabric_Client.newCryptoSuite();
        // use the same location for the state store (where the users' certificate are kept)
        // and the crypto store (where the users' keys are kept)
        var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
        crypto_suite.setCryptoKeyStore(crypto_store);
        fabric_client.setCryptoSuite(crypto_suite);
        var	tlsOptions = {
          trustedRoots: [],
          verify: false
        };
        // be sure to change the http to https when the CA is running TLS enabled
        fabric_ca_client = new Fabric_CA_Client('http://10.41.24.236:7054', tlsOptions , 'ca1.example.com', crypto_suite);
    
        // first check to see if the admin is already enrolled
        return fabric_client.getUserContext('admin', true);
    }).then((user_from_store) => {
        if (user_from_store && user_from_store.isEnrolled()) {
            console.log('Successfully loaded admin from persistence');
            admin_user = user_from_store;
            return null;
        } else {
            // need to enroll it with CA server
            return fabric_ca_client.enroll({
              enrollmentID: 'admin',
              enrollmentSecret: 'adminpw'
            }).then((enrollment) => {
              console.log('Successfully enrolled admin user "admin"');
              return fabric_client.createUser(
                  {username: 'admin',
                      mspid: 'Org2MSP', 
                      cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }
                  });
            }).then((user) => {
              admin_user = user;
              return fabric_client.setUserContext(admin_user);
            }).catch((err) => {
              console.error('Failed to enroll and persist admin. Error: ' + err.stack ? err.stack : err);
              throw new Error('Failed to enroll admin');
            });
        }
    }).then(() => {
        console.log('Assigned the admin user to the fabric client ::' + admin_user.toString());
    }).catch((err) => {
        console.error('Failed to enroll admin: ' + err);
    });
    return promise
  },

  registerUser(){
    'use strict';
    /*
    * Register and Enroll a user
    */
    
    var Fabric_Client = require('fabric-client');
    var Fabric_CA_Client = require('fabric-ca-client');
    
    //
    var fabric_client = new Fabric_Client();
    var fabric_ca_client = null;
    var admin_user = null;
    //var member_user = null;
    var store_path = '/home/lguerry/hyperledger/multi-host-hyperledger-network/Build-Multi-Host-Network-Hyperledger/basicMeteoApp/hfc-key-store';
    console.log(' Store path:'+store_path);
    var promise =
    // create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
    Fabric_Client.newDefaultKeyValueStore({ path: store_path
    }).then((state_store) => {
        // assign the store to the fabric client
        fabric_client.setStateStore(state_store);
        var crypto_suite = Fabric_Client.newCryptoSuite();
        // use the same location for the state store (where the users' certificate are kept)
        // and the crypto store (where the users' keys are kept)
        var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
        crypto_suite.setCryptoKeyStore(crypto_store);
        fabric_client.setCryptoSuite(crypto_suite);
        // be sure to change the http to https when the CA is running TLS enabled
        fabric_ca_client = new Fabric_CA_Client('http://10.41.24.236:7054', null , '', crypto_suite);
    
        // first check to see if the admin is already enrolled
        return fabric_client.getUserContext('admin', true);
    }).then((user_from_store) => {
        if (user_from_store && user_from_store.isEnrolled()) {
            console.log('Successfully loaded admin from persistence');
            admin_user = user_from_store;
        } else {
            throw new Error('Failed to get admin.... run enrollAdmin.js');
        }
    
        // at this point we should have the admin user
        // first need to register the user with the CA server
        return fabric_ca_client.register({enrollmentID: 'user1', affiliation: 'org1.department1', role: 'client'}, admin_user);
    }).then((secret) => {
        // next we need to enroll the user with CA server
        console.log('Successfully registered user1 - secret:'+ secret);
    
        return fabric_ca_client.enroll({enrollmentID: 'user1', enrollmentSecret: secret});
    }).then((enrollment) => {
      console.log('Successfully enrolled member user "user1" ');
      return fabric_client.createUser(
        {username: 'user1',
        mspid: 'Org1MSP',
        cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }
        });
    }).then((user) => {
        //member_user = user;
    
        return fabric_client.setUserContext(user);
    }).then(()=>{
        console.log('User1 was successfully registered and enrolled and is ready to intreact with the fabric network');
    
    }).catch((err) => {
        console.error('Failed to register: ' + err);
      if(err.toString().indexOf('Authorization') > -1) {
        console.error('Authorization failures may be caused by having admin credentials from a previous CA instance.\n' +
        'Try again after deleting the contents of the store directory '+store_path);
      }
    });
    return promise
  },

  getHistory(house){
    var Fabric_Client = require('fabric-client');
    // 
    var fabric_client = new Fabric_Client();

    // setup the fabric network
    var channel = fabric_client.newChannel('mychannel');
    var peer1 = fabric_client.newPeer('grpc://localhost:8051');
    var peer2 = fabric_client.newPeer('grpc://10.41.24.170:9051');
    channel.addPeer(peer1);
    channel.addPeer(peer2);
 
    //
    var member_user = null;
    var store_path = '/home/lguerry/hyperledger/multi-host-hyperledger-network/Build-Multi-Host-Network-Hyperledger/basicMeteoApp/hfc-key-store';
    console.log('Store path:'+store_path);
    var tx_id = null;

    //create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
    var promise =
    Fabric_Client.newDefaultKeyValueStore({ path: store_path
    }).then((state_store) => {
      // assign the store to the fabric client
      fabric_client.setStateStore(state_store);
      var crypto_suite = Fabric_Client.newCryptoSuite();
      // use the same location for the state store (where the users' certificate are kept)
      // and the crypto store (where the users' keys are kept)
      var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
      crypto_suite.setCryptoKeyStore(crypto_store);
      fabric_client.setCryptoSuite(crypto_suite);

      // get the enrolled user from persistence, this user will sign all requests
      return fabric_client.getUserContext('user1', true);
    }).then((user_from_store) => {
      if (user_from_store && user_from_store.isEnrolled()) {
        console.log('Successfully loaded user1 from persistence');
        //member_user = user_from_store; 
      } else {
        throw new Error('Failed to get user1.... run registerUser.js');
      }

      

      // queryCar chaincode function - requires 1 argument, ex: args: ['CAR4'],
      // queryAllCars chaincode function - requires no arguments , ex: args: [''],
      const request = {
        //targets : --- letting this default to the peers assigned to the channel
        chaincodeId: 'mycc',
        fcn: 'getHistory',
        args: [house]
      };

      // send the query proposal to the peer
      return channel.queryByChaincode(request);
    }).then((query_responses) => {
      console.log("Query has completed, checking results");
      // query_responses could have more than one  results if there multiple peers were used as targets
      if (query_responses && query_responses.length != 0) {
        for (var i = 0 ; i < query_responses.length; i++){
          if (query_responses[0] instanceof Error) {
            console.error("error from query = ", query_responses[0]);
          } else {
            console.log("Response for peer", i + 1 , "is ", query_responses[i].toString());
          }
        }
        var res = JSON.parse(query_responses[0])
        console.log(res);
        return JSON.parse(query_responses[0]); 
      } else {
        console.log("No payloads were returned from query");
      }
    }).catch((err) => {
      console.error('Failed to query successfully :: ' + err);
    });
    return promise
  },

  displayConfig(){
    var Fabric_Client = require('fabric-client');
    // 
    var fabric_client = new Fabric_Client();

    var store_path = '/home/lguerry/hyperledger/multi-host-hyperledger-network/Build-Multi-Host-Network-Hyperledger/basicMeteoApp/hfc-key-store';

    // setup the fabric network
    var channel = fabric_client.newChannel('mychannel');
    var peer1 = fabric_client.newPeer('grpc://localhost:8051');
    var peer2 = fabric_client.newPeer('grpc://10.41.24.170:9051');
    channel.addPeer(peer1);
    channel.addPeer(peer2);
    Fabric_Client.newDefaultKeyValueStore({ path: store_path
    }).then((state_store) => {
      // assign the store to the fabric client
      fabric_client.setStateStore(state_store);
      var crypto_suite = Fabric_Client.newCryptoSuite();
      // use the same location for the state store (where the users' certificate are kept)
      // and the crypto store (where the users' keys are kept)
      var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
      crypto_suite.setCryptoKeyStore(crypto_store);
      fabric_client.setCryptoSuite(crypto_suite);
      return fabric_client.getUserContext('user1', true);
    }).then(() => {
      return channel.initialize()
    }).then(() => {
      return channel.getOrganizations()
    }).then((result) => console.log(result))
  },  

  otherMethod(){
  }
});