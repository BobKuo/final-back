import { Schema, model } from 'mongoose'

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

export default model('tags', schema)
