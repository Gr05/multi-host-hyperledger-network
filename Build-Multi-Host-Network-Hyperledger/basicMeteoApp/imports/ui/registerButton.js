import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import './registerButton.html';

Template.registerButton.events ({
    'click .enrollButtonORG1' : function(){
        Meteor.call('enrollAdmin', 'ca1.example.com', "http://localhost:7054", 'adminOrg1', 'Org1MSP')
    },

    'click .registerButtonORG1' : function(){
        Meteor.call('registerUser', 'ca1.example.com', "http://localhost:7054", 'adminOrg1', 'Org1MSP', 'user1' )
    },

    'click .enrollButtonORG2' : function(){
        Meteor.call('enrollAdmin', 'ca2.example.com', "http://localhost:8054", 'adminOrg2', 'Org2MSP')
    },

    'click .registerButtonORG2' : function(){
        Meteor.call('registerUser', 'ca2.example.com', "http://localhost:8054", 'adminOrg2', 'Org2MSP', 'user2' )
    }
})