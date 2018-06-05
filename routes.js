module.exports = function (app, config){
  app.get('/', function(req, res) {
    res.send(':)');
  });

  app.post('/actions', function(req, res) {
    console.log('body');
    console.log(req.body);
    res.send(':)');
  });
};
