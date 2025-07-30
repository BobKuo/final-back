import passport from 'passport'
import passportLocal from 'passport-local'
import passportJWT from 'passport-jwt'
import bcrypt from 'bcryptjs'
import User from './models/user.js'

// 定義 login 驗證方法
passport.use(
  'login',
  new passportLocal.Strategy(
    {
      usernameField: 'account',
      passwordField: 'password',
    },
    async (account, password, done) => {
      try {
        // 檢查帳號是否存在
        const user = await User.findOne({ $or: [{ account }, { email: account }] }).orFail(
          new Error('USER NOT FOUND'),
        )
        // 檢查密碼是否正確
        if (!bcrypt.compareSync(password, user.password)) {
          throw new Error('PASSWORD')
        }

        // 驗證成功，把使用者資料帶到下一步
        return done(null, user)
      } catch (error) {
        console.log('passport.js login')
        console.error(error)

        // 驗證失敗，把錯誤和訊息帶到下一步
        // done(錯誤, 使用者資料, info)
        if (error.message === 'USER NOT FOUND') {
          return done(null, false, { message: '使用者不存在' })
        } else if (error.message === 'PASSWORD') {
          return done(null, false, { message: '密碼錯誤' })
        } else {
          return done(error)
        }
      }
    },
  ),
)

// 定義 jwt 驗證方法
passport.use(
  'jwt',
  new passportJWT.Strategy(
    {
      jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
      // 把req傳到下面的async function, 才可以拿到 token
      passReqToCallback: true,
      // 忽略過期時間，因為舊換新的時候可以允許過期的 token
      ignoreExpiration: true,
    },

    // req 必須要設定 passReqToCallback 才能使用
    // 因為套件只給解編後的 jwt 內容，不會給原本的 jwt，所以需要自己從 req 裡面拿
    // payload = JWT 的內容 (controller/user.js login 時的 jwt.sign({ _id: req.user._id })
    async (req, payload, done) => {
      try {
        // 從 req 的 headers 裡面拿到 token
        // req.headers.authorization 的格式是 'Bearer token'
        // const token = req.headers.authorization.split(' ')[1]
        const token = passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken()(req)

        // 手動檢查過期
        // payload.exp : 過期時間，秒
        // Date.now() : 毫秒
        const expired = payload.exp * 1000 < Date.now()

        // 請求的路徑
        // http://localhost:4000/user/abcd?aaa=111&bbb=222
        // req.originUrl = /user/abcd?aaa=111&bbb=222
        // req.baseUrl = /user
        // req.path = /abcd
        // req.query = { aaa: '111', bbb: '222' }
        const url = req.baseUrl + req.path

        // 只有 refresh 和 logout 可以允許過期的 token
        if (expired && url !== '/user/refresh' && url !== '/user/logout') {
          throw new Error('TOKEN EXPIRED')
        }

        // 檢查使用者是否存在，並且 tokens 裡面有這個 token
        const user = await User.findOne({ _id: payload._id, tokens: token }).orFail(
          new Error('USER NOT FOUND'),
        )
        return done(null, { user, token })
      } catch (error) {
        console.log('[passport.js] jwt error:', error.message)
        if (error.message === 'USER NOT FOUND') {
          return done(null, false, { message: '使用者不存在或 token 已失效' })
        } else if (error.message === 'TOKEN EXPIRED') {
          return done(null, false, { message: 'token 已過期' })
        } else {
          return done(error)
        }
      }
    },
  ),
)
