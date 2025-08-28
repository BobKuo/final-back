import { Schema, model } from 'mongoose'
import Series from './series.js'

const statisticsSchema = new Schema(
  {
    views: {
      type: Number,
      required: [true, '點擊數是必填的'],
      min: [0, '點擊數不能為負數'],
    },
    likes: {
      type: [Schema.Types.ObjectId],
      ref: 'users',
      required: [true, '使用者 ID 是必填的'],
    },
  },
  { versionKey: false },
)

const schema = new Schema(
  {
    name: {
      type: String,
      required: [true, '標題是必填的'],
      trim: true,
      minlength: [1, '標題至少需要 1 個字元'],
      maxlength: [100, '標題最多只能有 100 個字元'],
      unique: true, // 名稱必須唯一
    },
    content: {
      type: String,
      maxlength: [500, '內容最多只能有 500 個字元'],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'series',
      required: [true, '分類是必填的'],
      validate: {
        validator: async function (value) {
          // 檢查 category 是否存在於 series 集合的 name 欄位中
          const series = await Series.findById(value)
          return !!series // 如果找到對應的 series，則驗證通過
        },
        message: '分類必須是有效的系列名稱',
      },
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: 'tags',
      },
    ],
    post: {
      type: Boolean,
      default: true,
      required: [true, '是否張貼是必填的'],
    },
    statistics: {
      type: statisticsSchema,
      default: { views: 0, likes: [] },
      required: [true, '統計資料是必填的'],
    },
    images: {
      type: [String],
      required: [true, '作品圖片是必填的'],
    },
  },
  { versionKey: false, timestamps: true },
)

export default model('works', schema)
