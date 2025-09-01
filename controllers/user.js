import User from '../models/user.js'
import { StatusCodes } from 'http-status-codes'
import jwt from 'jsonwebtoken'
import validator from 'validator'
import Product from '../models/product.js'
import Work from '../models/work.js'

export const create = async (req, res) => {
  try {
    await User.create({
      account: req.body.account,
      email: req.body.email,
      password: req.body.password,
    })

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: '',
    })
  } catch (error) {
    console.log('controllers/user.js create')
    console.error(error)

    if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.errors[key].message,
      })
    } else if (error.name === 'MongoServerError' && error.code === 11000) {
      res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: '使用者已存在',
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '伺服器內部錯誤',
      })
    }
  }
}

export const login = async (req, res) => {
  try {
    // https://github.com/auth0/node-jsonwebtoken?tab=readme-ov-file#jwtsignpayload-secretorprivatekey-options-callback
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7 days' })
    req.user.tokens.push(token)
    await req.user.save()

    //
    res.status(StatusCodes.OK).json({
      success: true,
      message: '登入成功',
      user: {
        account: req.user.account,
        role: req.user.role,
        cartTotal: req.user.cartTotal,
        token,
      },
    })
  } catch (error) {
    console.log('controllers/user.js login')
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器內部錯誤',
    })
  }
}

export const profile = (req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    user: {
      account: req.user.account,
      role: req.user.role,
      cartTotal: req.user.cartTotal,
    },
  })
}

export const refresh = async (req, res) => {
  try {
    const i = req.user.tokens.indexOf(req.token)
    // 重新產生token並取代
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7 days' })
    req.user.tokens[i] = token
    await req.user.save()

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      token,
    })
  } catch (error) {
    console.log('controllers/user.js refresh')
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器內部錯誤',
    })
  }
}

export const logout = async (req, res) => {
  try {
    // 從 tokens 中移除當前的 token
    req.user.tokens = req.user.tokens.filter((token) => token !== req.token)
    await req.user.save()

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
    })
  } catch (error) {
    console.log('controllers/user.js logout')
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器內部錯誤',
    })
  }
}

export const cart = async (req, res) => {
  try {
    // 驗證請求的商品 ID
    if (!validator.isMongoId(req.body.product)) {
      throw new Error('PRODUCT ID')
    }
    // 檢查商品是否存在
    await Product.findOne({ _id: req.body.product }).orFail(new Error('PRODUCT NOT FOUND'))

    // 檢查購物車中是否已經有該商品
    // 購物車內的 product 資料型態是 ObjectId，使用 .toString() 轉換為字串進行比較
    const i = req.user.cart.findIndex((item) => item.product.toString() === req.body.product)
    // 如果購物車中已經有該商品，則增加數量
    if (i > -1) {
      req.user.cart[i].quantity += req.body.quantity
      if (req.user.cart[i].quantity < 1) {
        // 如果數量小於 1，則從購物車中移除該商品
        req.user.cart.splice(i, 1)
      }
    }
    // 如果購物車中沒有該商品，且數量 > 0，則新增商品到購物車
    else if (req.body.quantity > 0) {
      req.user.cart.push({
        product: req.body.product,
        quantity: req.body.quantity,
      })
    }
    // 保存
    await req.user.save()

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: req.user.cartTotal,
    })
  } catch (error) {
    console.error(error)
    if (error.message === 'USER ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '使用者 ID 格式錯誤',
      })
    } else if (error.message === 'PRODUCT ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '商品 ID 格式錯誤',
      })
    } else if (error.message === 'PRODUCT NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '商品不存在',
      })
    } else if (error.message === 'USER NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '使用者不存在',
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '伺服器內部錯誤',
      })
    }
  }
}

export const getCart = async (req, res) => {
  try {
    // email account        --> 只取 email 和 account 欄位
    // -password -email     --> 除了 password 和 email 以外的欄位
    const user = await User.findById(req.user._id, 'cart')
      // .populate(ref欄位, 指定取的欄位)
      // 關聯 cart.product 的 ref 指定的 collection，只取 name 欄位
      // .populate('cart.product', 'name')
      .populate('cart.product')
      .orFail(new Error('USER NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: user.cart,
    })
  } catch (error) {
    if (error.message === 'USER ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '使用者 ID 格式錯誤',
      })
    } else if (error.message === 'USER NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '使用者不存在',
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '伺服器內部錯誤',
      })
    }
  }
}

export const addFavorite = async (req, res) => {
  try {
    // 驗證請求的作品 ID
    if (!validator.isMongoId(req.body.work)) {
      throw new Error('WORK ID')
    }
    // 檢查作品是否存在
    await Work.findOne({ _id: req.body.work }).orFail(new Error('WORK NOT FOUND'))

    // 檢查收藏夾中是否已經有該作品
    const i = req.user.favorites.findIndex((item) => item.toString() === req.body.work)

    // 如果收藏夾中沒有該作品, 則新增作品到收藏夾
    if (i < 0) {
      req.user.favorites.push(req.body.work)
      // 保存
      await req.user.save()
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
    })
  } catch (error) {
    console.error(error)
    if (error.message === 'USER ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '使用者 ID 格式錯誤',
      })
    } else if (error.message === 'PRODUCT ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '作品 ID 格式錯誤',
      })
    } else if (error.message === 'WORK NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '作品不存在',
      })
    } else if (error.message === 'USER NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '使用者不存在',
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '伺服器內部錯誤',
      })
    }
  }
}

export const getFavorites = async (req, res) => {
  try {
    // email account        --> 只取 email 和 account 欄位
    // -password -email     --> 除了 password 和 email 以外的欄位
    const user = await User.findById(req.user._id, 'favorites')
      // .populate(ref欄位, 指定取的欄位)
      // 關聯 favorites.work 的 ref 指定的 collection，只取 name 欄位
      // .populate('favorites.work', 'name')
      .populate('favorites.work')
      .orFail(new Error('USER NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: user.cart,
    })
  } catch (error) {
    if (error.message === 'USER ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '使用者 ID 格式錯誤',
      })
    } else if (error.message === 'USER NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '使用者不存在',
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '伺服器內部錯誤',
      })
    }
  }
}
