//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize()); // passport 구동
app.use(passport.session()); // 세션 연결

mongoose.set("useUnifiedTopology", true);
mongoose.set("useCreateIndex", true);
mongoose.connect(process.env.MONGOOSE_DB_URL, { useNewUrlParser: true });

//mongoose schema class 생성
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String, // google oauth 필요
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model("User", userSchema);

//passport 설정
passport.use(User.createStrategy());

/*  Passport 동작 위한 함수  
  - serializeUser :  로그인 성공 시 세션저장
  - deserializeUser : 서버로 들어오는 요청마다 세션 정보를 실제 DB의 데이터와 비교
*/
passport.serializeUser(function (user, done) {
  console.log("user of serializeUser : " + user);
  done(null, user._id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    console.log("user of deserializeUser : " + user);
    done(err, user);
  });
});
//////////////////////////////////////////////////////////////////

//passport google oauth //////////////////////////////////////////
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:8080/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);
//////////////////////////////////////////////////////////////////

// index
app.get("/", function (req, res) {
  res.render("home");
});

// Google oauth 동의화면 호출
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

// Google oauth Callback
app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication
    res.redirect("/secrets");
  }
);

// Login page 이동
app.get("/login", function (req, res) {
  res.render("login");
});

// Register page 이동
app.get("/register", function (req, res) {
  res.render("register");
});

/* Secrets page 이동
   인증여부 확인 
   True - > Secrets content list 보여주깅
*/
app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    User.find({ secret: { $ne: null } }, function (err, foundUsers) {
      if (err) {
        console.log(err);
      } else {
        if (foundUsers) {
          console.log(foundUsers);
          foundUsers.forEach((user) => {
            const secret = user.secret;
          });
          res.render("secrets", { usersWithSecrets: foundUsers });
        }
      }
    });
  } else {
    res.redirect("/login");
  }
});

// Submit input page 이동
app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

// Submit Content 등록
app.post("/submit", function (req, res) {
  const submittedSecret = req.body.secret;

  User.findById(req.user.id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(function () {
          res.redirect("/secrets");
        });
      }
    }
  });
});

// Logout 인증 끊기
app.get("/logout", function (req, res) {
  //req.user프로퍼티 비우고 Login session 없애기
  req.logout();
  res.redirect("/");
});

// Register email & Password 등록
app.post("/register", function (req, res) {
  //passport-local-mongoose package
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    }
  );
});

// Login local 확인
app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  //passport package
  req.logIn(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

// Server start
app.listen(8080, function () {
  console.log("Server started!");
});
