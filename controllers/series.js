import Series from '../models/series.js'
import { StatusCodes } from 'http-status-codes'
import validator from 'validator'
import { deleteCloudOne } from '../utils/cloudimg.js'

export const create = async (req, res) => {
  try {
    const series = await Series.create({
      name: req.body.name,
      description: req.body.description,
      post: req.body.post,
      // 使用上傳的檔案 Cloudinary 網址
      cover: req.file?.path,
    })

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: '系列建立成功',
      series,
    })
  } catch (error) {
    console.log('controllers/series.js create')
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

// 含沒有上首頁的系列
export const getAll = async (req, res) => {
  try {
    const series = await Series.find().populate('works') // 取得 works

    res.status(StatusCodes.OK).json({
      success: true,
      message: '系列列表取得成功',
      series: series,
    })
  } catch (error) {
    console.log('controllers/series.js getAll')
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
    const series = await Series.find({ post: true })
    res.status(StatusCodes.OK).json({
      success: true,
      message: '系列列表取得成功',
      series,
    })
  } catch (error) {
    console.log('controllers/series.js get')
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器內部錯誤',
    })
  }
}

export const update = async (req, res) => {
  try {
    // 檢查系列 ID 是否有效
    if (!validator.isMongoId(req.params.id)) {
      throw new Error('SERIES ID')
    }

    // 先從資料庫中取得系列資料
    const existingSeries = await Series.findById(req.params.id).orFail(
      new Error('SERIES NOT FOUND'),
    )

    // 如果有刪除圖片的需求，先處理刪除圖片
    const delimg = req.body.deletedImage || ''

    if (delimg) {
      // 刪除 Cloudinary 上的圖片
      const id = delimg.split('/').pop().split('.')[0] // 取得圖片的 public_id
      const publicId = req.body.folder ? req.body.folder + '/' + id : id // 如果有設定資料夾，則加上資料夾名稱

      console.log('刪除圖片的 publicId:', publicId)
      // 呼叫刪除圖片的函式
      deleteCloudOne(publicId)

      // 更新 existingSeries.cover
      existingSeries.cover = ''
    }

    //  如果沒有新圖片，設為undefined，不會更新
    const updatedImage = req.file?.path || existingSeries.cover

    const series = await Series.findByIdAndUpdate(
      req.params.id, // router.patch('/:id' ,在這邊設定req.params.id
      {
        // 使用展開運算符將 req.body 的內容展開
        ...req.body,
        // 更新代表作品
        works: JSON.parse(req.body.works),
        // 更新圖片
        cover: updatedImage,
      },
      {
        new: true, // 是否回傳更新後的資料
        runValidators: true,
      },
    )
      .populate('works', 'name, images')
      .orFail(new Error('Series NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: '系列更新成功',
      series,
    })
  } catch (error) {
    console.log('controllers/series.js update')
    console.error(error)
    if (error.message === 'SERIES ID') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '無效的系列 ID',
      })
    } else if (error.message === 'SERIES NOT FOUND') {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '系列不存在',
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

    const series = await Series.findById(req.params.id).orFail(new Error('SERIES NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: '系列取得成功',
      series,
    })
  } catch (error) {
    console.log('controllers/series.js getId')
    console.error(error)
    if (error.message === 'SERIES ID') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '無效的系列 ID',
      })
    } else if (error.message === 'SERIES NOT FOUND') {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '系列不存在',
      })
    } else {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '伺服器內部錯誤',
      })
    }
  }
}
