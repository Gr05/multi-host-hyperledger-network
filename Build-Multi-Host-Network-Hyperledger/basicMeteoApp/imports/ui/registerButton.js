import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import './registerButton.html';

Template.registerButton.events ({
    'click .enrollButton' : function(){
        Meteor.call('enrollAdmin')
    },

    'click .registerButton' : function(){
        Meteor.call('registerUser')
    }
})