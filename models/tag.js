import { Schema, model } from 'mongoose'
import Work from './work.js'

const schema = new Schema(
  {
    name: {
      type: String,
      required: [true, '名稱是必填的'],
      unique: true,
      trim: true,
      minlength: [1, '名稱至少需要 1 個字元'],
      maxlength: [10, '名稱最多只能有 10 個字元'],
    },
    type: {
      type: String,
      required: [true, '類型是必填的'],
      enum: {
        values: ['數位檔案', '實體商品', '插畫作品', '日記分類', '其他'],
        message: '請選擇有效的類型',
      },
    },
    enable: {
      type: Boolean,
      default: true,
      required: [true, '是否啟用是必填的'],
    },
  },
  { versionKey: false, timestamps: true },
)

// 刪除標籤時，從所有相關的作品中移除該標籤
schema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    // 從所有包含該 tag 的 works 中移除
    await Work.updateMany(
      { tags: doc._id }, // 條件：tags 陣列中包含該 tag 的 _id
      { $pull: { tags: doc._id } }, // 從 tags 陣列中移除該 tag 的 _id
    )
    console.log(`Tag ${doc._id} 已從相關的 works 中移除`)
  }
})

export default model('tags', schema)
