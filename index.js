import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import { StatusCodes } from 'http-status-codes'
import cors from 'cors'
import userRoute from './routes/user.js'
import productRouter from './routes/product.js'
import './passport.js'

mongoose
  .connect(process.env.DB_URL)
  .then(() => {
    console.log('資料庫連線成功')
    // 避免查詢攻擊
    mongoose.set('sanitizeFilter', true)
  })
  .catch((error) => {
    console.log('資料庫連線失敗')
    console.error('資料庫連線失敗', error)
  })

const app = express()

// 跨域: 不限來源
app.use(cors())

app.use(express.json())
app.use((error, req, res, _next) => {
  res.status(StatusCodes.BAD_REQUEST).json({
    success: false,
    message: 'JSON 格式錯誤',
  })
})

// 路由
app.use('/user', userRoute)
app.use('/product', productRouter)

// 處理未定義的路由
app.all(/.*/, (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: '找不到該路由',
  })
})

app.listen(process.env.PORT || 4000, () => {
  console.log('伺服器啟動')
})
