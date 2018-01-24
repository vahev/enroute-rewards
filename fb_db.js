var firebase = require('firebase');
var config = require('./config.json')

firebase.initializeApp(config.firebase);

function processExchange(from_user, to_user, coin_quantity) {

  var from_user_valid = true;
  var to_user_valid = true;
  var valid_exchange = true;

  var from_user_balance = 0;
  var to_user_balance = 0;

  // TO USER
  firebase.database().ref('users/' + to_user).once('value', function(snapshot) {

    if (snapshot.val() === null) {
      to_user_valid = false;
    }

  }).then(function() {

    if (!to_user_valid) {

      firebase.database().ref('users/' + to_user).set({
        coins: 5,
        total_coins: 0
      });

    }

  });

  // FROM USER
  firebase.database().ref('users/' + from_user).once('value', function(snapshot) {

    if (snapshot.val() === null) {
      from_user_valid = false;
    }

  }).then(function() {

    if (!from_user_valid) {

      firebase.database().ref('users/' + from_user).set({
        coins: 5,
        total_coins: 0
      });

    }

  }).then(function() {

    firebase.database().ref('users/' + from_user + '/coins').once('value', function(snapshot) {

      if (snapshot.val() < coin_quantity) {
        valid_exchange = false;
      } else {
        from_user_balance = snapshot.val() - coin_quantity;
      }

    }).then(function() {

      if (valid_exchange) {
        firebase.database().ref('users/' + from_user + '/coins').set(from_user_balance);
      }

    });

  }).then(function() {

    firebase.database().ref('users/' + to_user + '/total_coins').once('value', function(snapshot) {

      if (valid_exchange) {
        to_user_balance = snapshot.val() + coin_quantity;
      }

    }).then(function() {

      if (valid_exchange) {
        firebase.database().ref('users/' + to_user + '/total_coins').set(to_user_balance);
      }

    }).then(function() {

      if (valid_exchange) {

        var transID = firebase.database().ref().child('transactions').push().key;

        firebase.database().ref('transactions/' + transID).set({
          from: from_user,
          to: to_user,
          quantity: coin_quantity,
          date: firebase.database.ServerValue.TIMESTAMP
        });

      }

    });

  });

}

function getCurrentCoins(from_user) {

  return firebase.database().ref('users/' + from_user + '/coins').once('value');

}

function resetCoins() {

  firebase.database().ref('users/').once('value', function(snapshot) {

    var keys = Object.keys(snapshot.val());

    for (i=0; i<keys.length; i++) {
        firebase.database().ref('users/' + keys[i] + '/coins').set(5);
    }

  });

}

module.exports = {
  processExchange,
  getCurrentCoins,
  resetCoins
}
