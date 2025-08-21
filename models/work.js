import { Schema, model } from 'mongoose'

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
    },
    content: {
      type: String,
      maxlength: [500, '內容最多只能有 500 個字元'],
    },
    category: {
      type: String,
      required: [true, '分類是必填的'],
      enum: {
        values: [
          '普迪系列',
          '幾何動物系列',
          '字母系列',
          '白日夢系列',
          '動物喝茶系列',
          '注音系列',
          '365日常系列',
          '其他',
        ],
        message: '請選擇有效的分類',
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
