import Work from '../models/work.js'
import { StatusCodes } from 'http-status-codes'
import validator from 'validator'
import { deleteCloudOne } from '../utils/cloudimg.js'

export const create = async (req, res) => {
  try {
    const created = await Work.create({
      name: req.body.name,
      content: req.body.content,
      category: req.body.category,
      tags: JSON.parse(req.body.tags),
      post: req.body.post,
      statistics: req.body.statistics,
      // 使用上傳的檔案 Cloudinary 網址
      // 支援單檔或多檔上傳
      images: req.files ? req.files.map((file) => file.path) : [],
    })

    // 再查詢並 populate tags
    const work = await Work.findById(created._id).populate('tags', 'name')

    // 取得標籤名稱的陣列
    const tags = work.tags.map((tag) => tag.name)

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: '作品建立成功',
      work: {
        ...work.toObject(),
        tags, // 用名稱陣列取代原本的 tags
      },
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
      .populate('tags') // 取得 tags 的名稱
      .populate('category', ['_id', 'name'])

    // 取得標籤名稱的陣列
    const worksWithEnabledTags = works.map((work) => ({
      ...work.toObject(),
      tags: work.tags.map((tag) => ({ _id: tag._id, name: tag.name, enable: tag.enable })),
    }))

    res.status(StatusCodes.OK).json({
      success: true,
      message: '商品列表取得成功',
      works: worksWithEnabledTags,
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

export const getList = async (req, res) => {
  try {
    console.log('取得商品清單:', req.body)

    const works = await Work.find(
      req.body.series_id ? { category: req.body.series_id } : {},
    ).select('_id name images') // 只選取 _id name images 欄位

    res.status(StatusCodes.OK).json({
      success: true,
      message: `商品清單取得成功`,
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

export const update = async (req, res) => {
  try {
    // 檢查作品 ID 是否有效
    if (!validator.isMongoId(req.params.id)) {
      throw new Error('WORK ID')
    }

    // 先從資料庫中取得作品資料
    const existingWork = await Work.findById(req.params.id).orFail(new Error('WORK NOT FOUND'))

    // 如果有刪除圖片的需求，先處理刪除圖片
    const delimgs = JSON.parse(req.body.deletedImages || '[]')

    if (delimgs.length > 0) {
      for (const url of delimgs) {
        // 確保url在 existingWork.images 中
        if (existingWork.images.includes(url)) {
          // 刪除 Cloudinary 上的圖片
          const id = url.split('/').pop().split('.')[0] // 取得圖片的 public_id
          const publicId = req.body.folder ? req.body.folder + '/' + id : id // 如果有設定資料夾，則加上資料夾名稱

          console.log('刪除圖片的 publicId:', publicId)
          // 呼叫刪除圖片的函式
          deleteCloudOne(publicId)

          // 更新 existingWork.images
          existingWork.images = existingWork.images.filter((image) => image !== url) // 移除已刪除的圖片網址
        }
      }
    }

    console.log('更新後的圖片陣列:', existingWork.images)

    // 如果有上傳新圖片，則合併原有圖片與新上傳的圖片
    const updatedImages =
      req.files.length > 0 || delimgs.length > 0
        ? [...existingWork.images, ...req.files.map((file) => file.path)] // 合併原有圖片與新上傳圖片
        : undefined // 如果沒有新圖片，設為undefined，不會更新

    console.log('更新的圖片:', updatedImages)

    const work = await Work.findByIdAndUpdate(
      req.params.id, // router.patch('/:id' ,在這邊設定req.params.id
      {
        // 使用展開運算符將 req.body 的內容展開
        ...req.body,
        // 更新標籤
        tags: JSON.parse(req.body.tags),
        // 更新圖片
        images: updatedImages,
      },
      {
        new: true, // 是否回傳更新後的資料
        runValidators: true,
      },
    )
      .populate('tags', 'name')
      .orFail(new Error('WORK NOT FOUND'))

    // 回傳時只給 tag 名稱陣列
    const tags = work.tags.map((tag) => tag.name)

    res.status(StatusCodes.OK).json({
      success: true,
      message: '作品更新成功',
      work: {
        ...work.toObject(),
        tags,
      },
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
