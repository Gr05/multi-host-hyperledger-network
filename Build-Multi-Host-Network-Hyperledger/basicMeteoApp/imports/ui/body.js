import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

import './body.html';
import './energieDashboard.js';
import './registerButton.js';
import './historyTable.js';

Template.body.events({
    'click .opener'(event) {
        // Get the Sidebar
        var mySidebar = document.getElementById("mySidebar");
        
        // Get the DIV with overlay effect
        var overlayBg = document.getElementById("myOverlay");

        if (mySidebar.style.display === 'block') {
            mySidebar.style.display = 'none';
            overlayBg.style.display = "none";
        } else {
            mySidebar.style.display = 'block';
            overlayBg.style.display = "block";
        }
    },
    'click .closer'(event){
         // Get the Sidebar
         var mySidebar = document.getElementById("mySidebar");
        
         // Get the DIV with overlay effect
         var overlayBg = document.getElementById("myOverlay");

         mySidebar.style.display = "none";
         overlayBg.style.display = "none";
    },

    'click .updateHistory'(event){
        Meteor.call('getHistory', (err, res) => {
            if (err){
                alert(err)
            } else {
                Session.set('history', res)
            }
        })
    },
});