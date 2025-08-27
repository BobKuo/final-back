import { Router } from 'express'
import * as auth from '../middlewares/auth.js'
import * as series from '../controllers/series.js'
import { uploadImgs } from '../middlewares/upload.js'

const router = Router()

router.post('/add', auth.token, auth.admin, uploadImgs, series.create)
// 要先宣告 /all , 才能宣告 /:id, 否則 /all 會被視為 id=all
router.get('/all', auth.token, auth.admin, series.getAll)
router.get('/:id', series.getId)
router.get('/', series.get)

//:id 這邊設定 req.params.id
router.patch('/:id', auth.token, auth.admin, uploadImgs, series.update)

export default router
