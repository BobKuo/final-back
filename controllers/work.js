import Work from '../models/work.js'
import { StatusCodes } from 'http-status-codes'
import validator from 'validator'

export const create = async (req, res) => {
  try {
    const work = await Work.create({
      title: req.body.title,
      content: req.body.content,
      category: req.body.category,
      tags: req.body.tags,
      post: req.body.post,
      // 使用上傳的檔案 Cloudinary 網址
      // 支援單檔或多檔上傳
      images: req.files ? req.files.map((file) => file.path) : [],
    })
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: '作品建立成功',
      work,
    })
  } catch (error) {
    console.log('controllers/work.js create')
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
    const works = await Work.find()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '商品列表取得成功',
      works,
    })
  } catch (error) {
    console.log('controllers/work.js getAll')
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
    const works = await Work.find({ post: true })
    res.status(StatusCodes.OK).json({
      success: true,
      message: '作品列表取得成功',
      works,
    })
  } catch (error) {
    console.log('controllers/work.js get')
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器內部錯誤',
    })
  }
}

export const update = async (req, res) => {
  try {
    // 檢查作品 ID 是否有效
    if (!validator.isMongoId(req.params.id)) {
      throw new Error('WORK ID')
    }

    // 先從資料庫中取得作品資料
    const existingWork = await Work.findById(req.params.id).orFail(new Error('WORK NOT FOUND'))

    const updatedImages = req.files
      ? [...existingWork.images, ...req.files.map((file) => file.path)] // 合併原有圖片與新上傳圖片
      : undefined // 如果沒有新圖片，設為undefined，不會更新

    console.log('更新的圖片:', updatedImages)

    const work = await Work.findByIdAndUpdate(
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
    ).orFail(new Error('WORK NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: '作品更新成功',
      work,
    })
  } catch (error) {
    console.log('controllers/work.js update')
    console.error(error)
    if (error.message === 'WORK ID') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '無效的作品 ID',
      })
    } else if (error.message === 'WORK NOT FOUND') {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '作品不存在',
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

    const work = await Work.findById(req.params.id).orFail(new Error('WORK NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: '作品取得成功',
      work,
    })
  } catch (error) {
    console.log('controllers/work.js getId')
    console.error(error)
    if (error.message === 'WORK ID') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '無效的作品 ID',
      })
    } else if (error.message === 'WORK NOT FOUND') {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '作品不存在',
      })
    } else {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '伺服器內部錯誤',
      })
    }
  }
}
