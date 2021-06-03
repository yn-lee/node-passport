# NodeJS - passport 패키지 사용하여 로그인 구현 👀

### 기본 환경

```
npm i express body-parser ejs mongoose
```

##### (참고) [Passport](https://www.passportjs.org/docs/authenticate/, "passport.js link")

passport 사용 및 session 유지 위해 npm 설치

```
npm i passport express-session passport-local-mongoose passport-google-oauth20 mongoose-findorcreate
```

- passport-local-mongoose :
  Passport-Local Mongoose is a [Mongoose](http://mongoosejs.com/) [plugin](http://mongoosejs.com/docs/plugins.html) that simplifies building username and password login with [Passport](http://passportjs.org/).
  참고 : (https://github.com/saintedlama/passport-local-mongoose)

- passport-google-oauth20 :
  Google을 사용하여 인증
  [Google cloud platform](https://console.cloud.google.com/) 에서 프로젝트 생성 후
  Strategy 에 제공해야하는 클라이언트 ID와 클라이언트 비밀번호를 발급 받고
  .env 에 환경변수로 지정해서 사용

- mongoose-findorcreate :
  Simple plugin for [Mongoose](https://github.com/LearnBoost/mongoose) which adds a findOrCreate method to models.

```
User.findOrCreate({ googleId: profile.id },
					function(err,user){ return cb(err,user);});
//	조회 후에 없는 값이면 생성하고, 있는 값이면 그 값을 가져옴
```

---
