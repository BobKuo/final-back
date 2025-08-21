import Tag from '../models/tag.js'
import { StatusCodes } from 'http-status-codes'
import validator from 'validator'

export const create = async (req, res) => {
  try {
    const tag = await Tag.create({
      name: req.body.name,
      type: req.body.type,
      enable: req.body.enable,
    })

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: '標籤建立成功',
      tag,
    })
  } catch (error) {
    console.log('controllers/tag.js create')
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

export const getAll = async (req, res) => {
  try {
    const tags = await Tag.find()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '標籤列表取得成功',
      tags,
    })
  } catch (error) {
    console.log('controllers/tag.js getAll')
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器內部錯誤',
    })
  }
}

export const update = async (req, res) => {
  try {
    console.log('controllers/tag.js update')

    // console.log(req.body)
    // req.body 是一個陣列
    // [
    // { name: 'tag1', type: '插畫作品', enable: true },
    // { name: 'tag2', type: '插畫作品', enable: false }
    // ]

    const tags = req.body

    if (!Array.isArray(tags)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '請提供標籤的陣列',
      })
    }

    // 從資料庫中取得所有標籤
    const existingTags = await Tag.find()
    const tagIdsFromDB = existingTags.map((tag) => tag._id.toString())

    // 找出需要刪除的標籤（存在於資料庫但不存在於前端）
    const tagIdsFromClient = tags
      .filter((tag) => validator.isMongoId(tag._id)) // 只取有效的 ObjectId
      .map((tag) => tag._id.toString())
    const tagsToDelete = tagIdsFromDB.filter((id) => !tagIdsFromClient.includes(id))

    // 使用 Promise.all 同時處理更新和新增
    await Promise.all(
      tags.map(async (tag) => {
        if (validator.isMongoId(tag._id)) {
          // 如果 _id 是有效的 ObjectId，執行更新
          await Tag.findByIdAndUpdate(tag._id, tag)
        } else {
          // 如果 _id 不是有效的 ObjectId，執行新增
          await Tag.create({
            name: tag.name,
            type: tag.type,
            enable: tag.enable,
          })
        }
      }),
    )

    // 刪除資料庫中不存在於前端的標籤
    await Promise.all(
      tagsToDelete.map(async (id) => {
        await Tag.findByIdAndDelete(id)
      }),
    )

    res.status(StatusCodes.OK).json({
      success: true,
      message: '標籤更新、新增或刪除成功',
    })
  } catch (error) {
    console.log('controllers/tag.js enable')
    console.error(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '伺服器內部錯誤',
    })
  }
}
