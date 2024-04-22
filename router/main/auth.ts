// @ts-ignore
import Router from 'koa-router'
import jsonwebtoken from 'jsonwebtoken'
import tooCode from '../../toocode/code'
import validator from '../../middleware/validator'
import { jhRules, dlRules } from '../../rules/dishRules'
import { secretKey } from '../../config'

import flq from  '../../SQLConnect'

const shop_user = flq.from('muser')


const router = new Router({ prefix: '/auth' })

//小程序登录
router.post('/login', validator(dlRules), async (ctx) =>{
    // 1. 解析参数
    // const { code, encryptedData, iv , code2, phone } = ctx.request.body password
    const { code2, phone } = ctx.request.body
    // console.log(encryptedData, iv)
    //1.1 验证验证码是否正确
    if( !tooCode.has(phone, code2)) return  ctx.success( null, '验证码错误', 202 )
    const res = await shop_user.where({ phone }).first()
    if( res ) {
        if ( res.state == 1 ) return  ctx.success('', '该用户已被禁用', 204)
        // 加密头.数据.加密签名
        const token = jsonwebtoken.sign({ id: res.id }, secretKey, { expiresIn: '7d' })
        ctx.success(token)
    }else {
        await shop_user.value({ phone, userName: '用户' + phone } ).add()
        const [res] = await shop_user.where({ phone }).find()
        // 加密头.数据.加密签名
        const token = jsonwebtoken.sign({ id: res.id }, secretKey, { expiresIn: '7d' })
        ctx.success(token)
    }

})

//获取验证码
router.post('/phone', validator(jhRules), async (ctx) =>{
    const { phone } = ctx.request.body
        ctx.success(tooCode.add(phone))
})

export default router.routes()
