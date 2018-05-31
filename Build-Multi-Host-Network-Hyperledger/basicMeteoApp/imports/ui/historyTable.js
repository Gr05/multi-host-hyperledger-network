import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import './historyTable.html';

Template.historyTable.onCreated( function historyOnCreated(){
    Meteor.call('getHistory', (err, res) => {
        if (err){
            alert(err)
        }
        else{
            Session.set("history", res);
        }
    });
});

Template.historyTable.helpers({
    transactionHistory: function(){
        return Session.get('history');
        // return [{value : '1', text : 'one'}, {value : '2', text : 'two'}, {text : 'three', value : '3'}];     
    }
});
