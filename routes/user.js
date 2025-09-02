import { Router } from 'express'
import * as user from '../controllers/user.js'
import * as auth from '../middlewares/auth.js'

const router = Router()

router.post('/', user.create)

router.post('/login', auth.login, user.login)
router.get('/profile', auth.token, user.profile)
router.patch('/refresh', auth.token, user.refresh)
router.delete('/logout', auth.token, user.logout)
router.patch('/cart', auth.token, user.cart)
router.get('/cart', auth.token, user.getCart)
router.patch('/favorites', auth.token, user.favorites)
router.get('/favorites', auth.token, user.getFavorites)

export default router
