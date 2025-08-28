import { Schema, model } from 'mongoose'

const schema = new Schema(
  {
    name: {
      type: String,
      required: [true, '標題是必填的'],
      trim: true,
      minlength: [1, '標題至少需要 1 個字元'],
      maxlength: [10, '標題最多只能有 10 個字元'],
      unique: true, // 名稱必須唯一
    },
    description: {
      type: String,
      maxlength: [100, '內容最多只能有 100 個字元'],
    },
    cover: {
      type: String,
    },
    works: [
      {
        type: Schema.Types.ObjectId,
        ref: 'works',
        default: [],
      },
    ],
    post: {
      type: Boolean,
      default: true,
      required: [true, '是否上首頁是必填的'],
    },
  },
  { versionKey: false, timestamps: true },
)

export default model('series', schema)
