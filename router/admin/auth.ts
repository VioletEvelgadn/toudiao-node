// @ts-ignore
import Router from 'koa-router'
import flq from  '../../SQLConnect'
import jsonwebtoken from "jsonwebtoken";
import {secretKey} from "../../config";
import validator from '../../middleware/validator'
import { userRules } from '../../rules/dishRules'


const shop_user = flq.from('user')


const router = new Router({ prefix: '/auth' })

//后台登录
router.post('/login', validator(userRules), async (ctx) =>{
    const { phone, password } = ctx.request.body
    const  data = await shop_user.where({phone,password } ).find()
    if( !data.length ) return ctx.success('', '电话或密码错误', 203)
    // await shop_user.value( { iphone, password } ).add()
    //获取toke
    const token = jsonwebtoken.sign({ uid: data[0].uid }, secretKey, { expiresIn: '7d' })
    ctx.success(token)
})

export default router.routes()
