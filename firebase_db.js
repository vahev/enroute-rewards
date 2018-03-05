var firebase = require('firebase'),
    config   = require('./config.json');

firebase.initializeApp(config.firebase);

function processExchange(from_user, to_user, coin_quantity) {

  var from_user_valid = true,
      to_user_valid = true,
      valid_exchange = true;

  var from_user_balance = 0,
      to_user_balance = 0;

  // TO USER
  firebase.database().ref('users/' + to_user)
    .once('value', function(snapshot) {
      if (snapshot.val() === null) {
        to_user_valid = false;
      }
    })
    .then(function() {
      // Creating a new user
      if (!to_user_valid) {
        firebase.database().ref('users/' + to_user).set({
          coins: 5,
          total_coins: 0
        });
      }
    });

  // FROM USER
  firebase.database().ref('users/' + from_user)
  .once('value', function(snapshot) {
    if (snapshot.val() === null) {
      from_user_valid = false;
    }
  })
  .then(function() {
    if (!from_user_valid) {
      firebase.database().ref('users/' + from_user)
        .set({
          coins: 5,
          total_coins: 0
        });
    }
  })
  .then(function() {
    firebase.database().ref('users/' + from_user + '/coins')
      .once('value', function(snapshot) {
        if (snapshot.val() < coin_quantity) {
          valid_exchange = false;
        } else {
          from_user_balance = snapshot.val() - coin_quantity;
        }
      }).then(function() {
        if (valid_exchange) {
          firebase.database().ref('users/' + from_user + '/coins')
            .set(from_user_balance);
        }
      });
  })
  .then(function() {
    firebase.database().ref('users/' + to_user + '/total_coins')
    .once('value', function(snapshot) {
      if (valid_exchange) {
        to_user_balance = snapshot.val() + coin_quantity;
      }
    })
    .then(function() {
      if (valid_exchange) {
        firebase.database().ref('users/' + to_user + '/total_coins')
          .set(to_user_balance);
      }
    })
    .then(function() {
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

function getUser(user) {
  user_valid = false;
  return new Promise(function(resolve, reject) {
    firebase.database().ref('users/' + user)
      .once('value', function(snapshot) {
        user_valid = (snapshot.val() === null);
      })
      .then(function() {
        // Creating a new user
        if (!user_valid) {
          firebase.database().ref('users/' + user)
            .set({
              coins: 5,
              total_coins: 0
            })
            .then(function (
              resolve();
            ));
        } else {
          resolve();
        }
      });
  });
}

function getCurrentCoins(from_user) {
  return new Promise(function(resolve, reject) {
    getUser(from_user)
      .then(function() {
        firebase.database().ref('users/' + from_user + '/coins')
          .once('value', function(snapshot) {
            resolve(snapshot);
          })
          .catch(function (error) {
            reject(error);
          });
      });
  });
}

function getUsers() {
  return firebase.database().ref('users/').once('value');
}

function resetCoins() {
  firebase.database().ref('users/').once('value', function(snapshot) {
    var keys = Object.keys(snapshot.val());
    for (i=0; i<keys.length; i++) {
      firebase.database().ref('users/' + keys[i] + '/coins')
        .set(5);
    }
  });
}

module.exports = {
  processExchange: processExchange,
  getCurrentCoins: getCurrentCoins,
  getUsers: getUsers,
  resetCoins: resetCoins
}
