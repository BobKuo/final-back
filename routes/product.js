import { Router } from 'express'
import * as auth from '../middlewares/auth.js'
import * as product from '../controllers/product.js'
import upload from '../middlewares/upload.js'

const router = Router()

router.post('/', auth.token, auth.admin, upload, product.create)
router.get('/all', auth.token, auth.admin, product.getAll)
router.get('/:id', product.getId)
router.get('/', product.get)
router.patch('/:id', auth.token, auth.admin, upload, product.update)

export default router
