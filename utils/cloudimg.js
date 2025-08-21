import { v2 as cloudinary } from 'cloudinary'

export const deleteCloudOne = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    console.log('圖片刪除結果:', result)
    return result
  } catch (error) {
    console.error('刪除圖片失敗:', error)
    throw error
  }
}
