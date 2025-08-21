import { Router } from 'express'
import * as auth from '../middlewares/auth.js'
import * as tag from '../controllers/tag.js'

const router = Router()

router.post('/add', auth.token, auth.admin, tag.create)
router.get('/all', auth.token, auth.admin, tag.getAll)
router.post('/update', auth.token, auth.admin, tag.update)

export default router
