var firebase = require('firebase'),
    config   = require('./config.json');

const default_user = {
  coins: 5,
  total_coins: 0
};

firebase.initializeApp(config.firebase);

function sendTokens(giverId, receiversIds, tokenQuantity, eachTransaction) {
  var i = 0;
  return new Promise(function(resolve, reject) {
    receiversIds.forEach(function(receiverId) {
      getUser(receiverId).then(function(receiver) {

        getUserTokens(giverId).transaction(function(tokens) {
          return tokens - tokenQuantity;
        });

        getUserTotalTokens(receiverId).transaction(function(tokens) {
          return tokens + tokenQuantity;
        });

        var transactions = firebase.database().ref('transactions'),
            newTransaction = transactions.push();

        newTransaction.set({
            from: giverId,
            to: receiverId,
            quantity: tokenQuantity,
            date: firebase.database.ServerValue.TIMESTAMP
          })
          .then(function() {
            var newTransactionPath = newTransaction.toString();
            eachTransaction(receiverId);
            i++;
            if (i >= receiversIds.length) {
              resolve();
            }
          });
      });
    });
  });

    //   firebase.database().ref('users/' + from_user + '/coins')
    //     .once('value', function(snapshot) {
    //       if (snapshot.val() < coin_quantity) {
    //         valid_exchange = false;
    //       } else {
    //         from_user_balance = snapshot.val() - coin_quantity;
    //       }
    //     }).then(function() {
    //       if (valid_exchange) {
    //         firebase.database().ref('users/' + from_user + '/coins')
    //           .set(from_user_balance);
    //       }
    //     });
    // })
    // .then(function() {
    //   firebase.database().ref('users/' + to_user + '/total_coins')
    //   .once('value', function(snapshot) {
    //     if (valid_exchange) {
    //       to_user_balance = snapshot.val() + coin_quantity;
    //     }
    //   })
    //   .then(function() {
    //     if (valid_exchange) {
    //       firebase.database().ref('users/' + to_user + '/total_coins')
    //         .set(to_user_balance);
    //     }
    //   })
    //   .then(function() {
    //     if (valid_exchange) {
    //       var transID = firebase.database().ref().child('transactions').push().key;
    //       firebase.database().ref('transactions/' + transID).set({
    //         from: from_user,
    //         to: to_user,
    //         quantity: coin_quantity,
    //         date: firebase.database.ServerValue.TIMESTAMP
    //       });
    //     }
    //   });
    // });
}

function getUser(user) {
  var ref = firebase.database().ref('users/' + user);
  return new Promise(function(resolve, reject) {
    ref.once('value', function(snapshot) {
      if (snapshot.val() !== null) {
        resolve(snapshot.val());
      } else {
        ref.set(default_user).then(function (){
          console.log('User created successfully');
          resolve(default_user);
        });
      }
    })
    .catch(function (error) {
      reject(error);
    });
  });
}

function getUserTokens(user) {
  return firebase.database().ref('users/' + user + '/coins');
}

function getUserTotalTokens(user) {
  return firebase.database().ref('users/' + user + '/total_coins');
}

function getUsers() {
  return firebase.database().ref('users/').once('value');
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
  sendTokens: sendTokens,
  getUserTokens: getUserTokens,
  getUser: getUser,
  getUsers: getUsers,
  resetCoins: resetCoins
}
