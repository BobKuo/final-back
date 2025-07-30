import { Schema, Error, model } from 'mongoose'
import validator from 'validator'
import bcrypt from 'bcrypt'

const cartSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'products',
      required: [true, '商品 ID 是必填的'],
    },
    quantity: {
      type: Number,
      required: [true, '數量必填'],
      min: [1, '數量最少為 1'],
    },
  },
  { versionKey: false },
)

const schema = new Schema(
  {
    account: {
      type: String,
      required: [true, '帳號是必填的'],
      minlength: [4, '帳號至少需要 4 個字元'],
      maxlength: [20, '帳號最多只能有 20 個字元'],
      unique: true,
      trim: true,
      validate: {
        validator(value) {
          return validator.isAlphanumeric(value)
        },
        message: '帳號只能包含英文字母和數字',
      },
    },
    email: {
      type: String,
      required: [true, '電子郵件是必填的'],
      unique: true,
      trim: true,
      validate: {
        validator(value) {
          return validator.isEmail(value)
        },
        message: '請輸入有效的電子郵件地址',
      },
    },
    cart: {
      type: [cartSchema],
    },
    tokens: {
      type: [String],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, '密碼是必填的'],
    },
  },
  {
    versionKey: false,
    timestamps: true,
  },
)

schema.pre('save', function (next) {
  const user = this
  if (user.isModified('password')) {
    if (user.password.length < 4 || user.password.length > 20) {
      // 用跟 mongoose 的 schema 驗證錯誤一樣的錯誤格式
      const error = new Error.ValidationError()
      error.addError(
        'password',
        new Error.ValidatorError({ message: '密碼長度必須在 4 到 20 個字元之間' }),
      )
      // 繼續處理，把錯誤傳出去
      // mongoose 遇到錯誤就不會存資料庫
      next(error)
      return
    } else {
      user.password = bcrypt.hashSync(user.password, 10)
    }
  }

  // 限制有效 token 數量
  if (user.isModified('tokens') && user.tokens.length > 3) {
    user.tokens.shift()
  }

  // 繼續處理
  next()
})

// 虛擬的動態欄位: mongoose在findById取資料時 會產生cartTotal的欄位
// 盡量用 function 不要用箭頭
// .get() 欄位資料的產生方式
schema.virtual('cartTotal').get(function () {
  // this = 現在要保存的資料
  const user = this
  return user.cart.reduce((total, item) => {
    return total + item.quantity
  }, 0)
})

export default model('users', schema)
