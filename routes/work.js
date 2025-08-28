import { Router } from 'express'
import * as auth from '../middlewares/auth.js'
import * as work from '../controllers/work.js'
import { uploadImgs } from '../middlewares/upload.js'

const router = Router()

router.post('/add', auth.token, auth.admin, uploadImgs, work.create)
// 要先宣告 /all , 才能宣告 /:id, 否則 /all 會被視為 id=all
router.get('/all', auth.token, auth.admin, work.getAll)
router.get('/list', auth.token, auth.admin, work.getList)
router.get('/:id', work.getId)
router.get('/', work.get)

//:id 這邊設定 req.params.id
router.patch('/:id', auth.token, auth.admin, uploadImgs, work.update)

export default router
