// @ts-ignore
import Router from 'koa-router'
import authRouter from './admin/auth'
import authRouter2 from  './main/auth'
import queryRouter from  './main/query'
import ptionRouter from "./zh/ption";
import sidRouter from "./zh/side";

const router = new Router()

//添加验证
router.use('/admin', authRouter)

//小程序验证
router.use('/main', authRouter2)
router.use('/main', queryRouter)

//加密验证
router.use('/zh', ptionRouter)
router.use('/zh', sidRouter)




export default router
