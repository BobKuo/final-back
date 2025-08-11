import Product from '../models/product.js'
import { StatusCodes } from 'http-status-codes'
import validator from 'validator'

export const create = async (req, res) => {
  try {
    const product = await Product.create({
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      category: req.body.category,
      sell: req.body.sell,
      // 使用上傳的檔案 Cloudinary 網址
      // 支援單檔或多檔上傳
      images: req.files ? req.files.map((file) => file.path) : [],
    })
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: '商品建立成功',
      product,
    })
  } catch (error) {
    console.log('controllers/product.js create')
    console.error(error)
    if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.errors[key].message,
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '伺服器內部錯誤',
      })
    }
  }
}

// 含未上架的商品
export const getAll = async (req, res) => {
  try {
    const products = await Product.find()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '商品列表取得成功',
      products,
    })
  } catch (error) {
    console.log('controllers/product.js getAll')
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器內部錯誤',
    })
  }
}

// 僅取得上架的商品
export const get = async (req, res) => {
  try {
    const products = await Product.find({ sell: true })
    res.status(StatusCodes.OK).json({
      success: true,
      message: '商品列表取得成功',
      products,
    })
  } catch (error) {
    console.log('controllers/product.js getAll')
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器內部錯誤',
    })
  }
}

export const update = async (req, res) => {
  try {
    // 檢查商品 ID 是否有效
    if (!validator.isMongoId(req.params.id)) {
      throw new Error('PRODUCT ID')
    }

    // 先從資料庫中取得商品資料
    const existingProduct = await Product.findById(req.params.id).orFail(
      new Error('PRODUCT NOT FOUND'),
    )

    const updatedImages = req.files
      ? [...existingProduct.images, ...req.files.map((file) => file.path)] // 合併原有圖片與新上傳圖片
      : undefined // 如果沒有新圖片，設為undefined，不會更新

    console.log('更新的圖片:', updatedImages)

    const product = await Product.findByIdAndUpdate(
      req.params.id, // router.patch('/:id' ,在這邊設定req.params.id
      {
        // 使用展開運算符將 req.body 的內容展開
        ...req.body,
        // 更新圖片
        images: updatedImages,
      },
      {
        new: true, // 是否回傳更新後的資料
        runValidators: true,
      },
    ).orFail(new Error('PRODUCT NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: '商品更新成功',
      product,
    })
  } catch (error) {
    console.log('controllers/product.js update')
    console.error(error)
    if (error.message === 'PRODUCT ID') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '無效的商品 ID',
      })
    } else if (error.message === 'PRODUCT NOT FOUND') {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '商品不存在',
      })
    } else if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: error.errors[key].message,
      })
    } else {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '伺服器內部錯誤',
      })
    }
  }
}

export const getId = async (req, res) => {
  try {
    // 檢查商品 ID 是否有效
    if (!validator.isMongoId(req.params.id)) {
      throw new Error('PRODUCT ID')
    }

    const product = await Product.findById(req.params.id).orFail(new Error('PRODUCT NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: '商品取得成功',
      product,
    })
  } catch (error) {
    console.log('controllers/product.js getId')
    console.error(error)
    if (error.message === 'PRODUCT ID') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '無效的商品 ID',
      })
    } else if (error.message === 'PRODUCT NOT FOUND') {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '商品不存在',
      })
    } else {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '伺服器內部錯誤',
      })
    }
  }
}
