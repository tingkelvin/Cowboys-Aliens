// const getConfig = (req, res) => {
//   res.send("Get Configuration Route")
// }

// module.exports = { getConfig }

const path = require("path");
const Config = require('../models/config');
const Swal = require('sweetalert2');

const config_get = (req, res) => {
  // res.sendFile(path.join(__dirname, "../../frontend/views/index.html"));
  Config.find().sort({ createdAt: -1 })
    .then(result => {
      res.render('index', { configs: result, title: 'Configuration' });
    })
    .catch(err => {
      console.log(err);
    });
}

const config_details = (req, res) => {
  const id = req.params.id;
  Config.findById(id)
    .then(result => {
      res.send(JSON.stringify(result));
    })
    .catch(err => {
      console.log(err);
    });
}

const config_post = (req, res) => {
  const config = new Config(req.body);
  config.save()
    .then(result => {
      res.redirect('/');
      // Swal.fire('Saved successfully!');
    })
    .catch(err => {
      console.log(err);
    });
}

module.exports = {
  config_get,
  config_details,
  config_post
}
