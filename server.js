const express = require("express");
const app = express();
const mongoose = require("mongoose");
const session = require("express-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

// Session:
app.use(session({
  secret: "LEET",
  resave: false,
  saveUninitialized: true,
  cookie: {maxAge: 60000}
}));
// Flash
const flash = require("express-flash");
app.use(flash());

// Rest of imports
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
mongoose.connect("mongodb://localhost/login_reg_2"); // db

// Schema:
var UserSchema = new mongoose.Schema({
  email: {type: String, required: true, unique: true, match: [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'Please fill a valid email address']},
  first_name: {type: String, required: true},
  last_name: {type: String, required: true},
  password: {type: String, required: true},
  birthday: {type: Date, required: true}
});
mongoose.model("User", UserSchema);
var User = mongoose.model("User");

// Routes:
app.get("/", function(req, res){
  res.render("index");
});

app.get("/success", function(req, res){
  if(req.session.user_id) {
      User.findOne({_id: req.session.user_id}, function(err, user){
          if(err) {
              res.redirect("/");
          }
          else {
              res.render("show", {user: user});
          }
      });
  }
  else {
      res.redirect("/");
  }
});

app.post("/users", function(req, res){
  var user = new User();
  var user_fields = ["email", "first_name", "last_name", "birthday"];
  for(var i=0; i<user_fields.length; i++) {
      user[user_fields[i]] = req.body[user_fields[i]];
  }
  console.log(user)
  bcrypt.hash(req.body.password, 10, function(err, hash){
      if(err) {
        res.redirect("/");
      }
      else {
        console.log("hash:", hash)
          user.password = hash;
          user.save(function(err){ 
            console.log("attempting save")
              if(err) {
                console.log("User Already Exists!")
                req.flash("error", "User Already Exists")
                res.redirect("/");
              }
              else {
                console.log("success")
                  req.session.user_id = user._id;
                  res.redirect("/success");
              }
          });
      }
  });
});

app.post("/sessions", function(req, res){
  User.findOne({email: req.body.email}, function(err, user){
      if(err) {
          res.redirect("/");
      }
      else {
        if(user){ // Means user was found
          console.log("found user with email " + user.email);
          bcrypt.compare(req.body.password, user.password, function(err, result){
              if(result) {
                  req.session.user_id = user._id;
                  res.redirect("/success");
              }
              else {

                console.log("Wrong Password!")
                req.flash("error", "Wrong Password!")
                res.redirect("/");
              }
          });
        }
        else{ // User not found
          console.log("User Not Found!")
          req.flash("error", "User Not found")
          res.redirect("/")
        } 
      }
  });

  app.post("/logout", function(req, res){
    req.session.user_id = null;
    res.redirect("/")
  });

});


// Listening
app.listen(8000);


