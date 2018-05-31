import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';
import './energieDashboard.html';


'use strict';
/*
 * Chaincode query
 */

Template.energieDashboard.onCreated(function dashboardOnCreated(){
    Meteor.call('queryChaincode', (err, res) => {
        if (err){
            alert(err)
        }
        else{
            Session.set("counter", res.Production - res.Consumption);
            Session.set("Prod", res.Production);
            Session.set("Consume", res.Consumption);
        }
    });
}); 

Template.energieDashboard.helpers({
    counter: function(){
        return Session.get( "counter" );
    },
    prod: function(){
        return Session.get( "Prod" );
    },
    consume: function(){
        return Session.get( "Consume" );
    }
});

Template.energieDashboard.events({
    'click .displayBalance': function (){
        Meteor.call('queryChaincode', (err, res) => {
            if (err){
                alert(err)
            }
            else{
                Session.set("counter", res.Production - res.Consumption);
                Session.set("Prod", res.Production);
                Session.set("Consume", res.Consumption);
            }
        });
    },

    'click .display-config' : function(){
        Meteor.call('displayConfig')
    }
})


/*
var event = contract.balanceMajed({}, function(error, result) {
    if (!error) {
        if(result.args.account == web3.eth.coinbase){
            Session.set("counter", parseInt(result.args.balanceAfterMaj));
        }
		console.log(
            "\n Account Dashboard: " + web3.eth.coinbase +
			"\n Account Majed: " + result.args.account +
			"\n Balance Before MaJ: " + result.args.balanceBeforeMaj +
			"\n Amount of the MaJ: " + result.args.amountMaj +
			"\n Actual Balance:" + result.args.balanceAfterMaj +
			"\n"
            );
        console.log(Session.get('counter'))
    }
});*/


