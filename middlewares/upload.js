import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import { StatusCodes } from 'http-status-codes'

// 設定 cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// 上傳設定
const upload = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'products', // 上傳到 cloudinary 的資料夾名稱
    },
  }),
  // req = 請求資訊
  // file = 檔案資訊
  // callback(錯誤, 是否允許上傳)
  fileFilter(req, file, callback) {
    console.log('上傳檔案資訊:', file)
    if (['image/jpeg', 'image/png'].includes(file.mimetype)) {
      // 如果檔案類型是 JPEG 或 PNG，允許上傳
      callback(null, true)
    } else {
      callback(null, false)
    }
  },
  limits: {
    fileSize: 1024 * 1024, // 限制檔案大小為 1MB
  },
})

export const uploadOne = (req, res, next) => {
  upload.single('image')(req, res, (error) => {
    // 處理上傳錯誤
    if (error) {
      console.error('上傳錯誤:', error)
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '檔案上傳失敗，請確保檔案類型為 JPEG 或 PNG，且大小不超過 1MB',
      })
    }
    // 如果沒有上傳檔案，回傳錯誤
    // if (!req.file) {
    //   return res.status(StatusCodes.BAD_REQUEST).json({
    //     success: false,
    //     message: '請上傳檔案',
    //   })
    // }
    // 繼續下一步
    console.log('上傳成功:', req.file)
    next()
  })
}

export const uploadImgs = (req, res, next) => {
  upload.array('images', 5)(req, res, (error) => {
    // 處理上傳錯誤
    if (error) {
      console.error('上傳錯誤:', error)
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '檔案上傳失敗，請確保檔案類型為 JPEG 或 PNG，且大小不超過 1MB',
      })
    }
    // 如果沒有上傳檔案，回傳錯誤
    if (!req.files || req.files.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '請上傳至少一個檔案',
      })
    }
    // 繼續下一步
    console.log('上傳成功:', req.files)
    next()
  })
}
