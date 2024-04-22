// @ts-ignore
import Router from 'koa-router'
import flq from '../../SQLConnect'
import validator from "../../middleware/validator";
import {qxRules, wzRules, wzxqRules, xiugRules, xzRules} from "../../rules/dishRules";
import upload from "../../middleware/upload";
import qn from "../../config/qn";
import fs from "fs/promises";
import number from "async-validator/dist-types/validator/number";

const shop_user = flq.from('user')
const yh = flq.from('muser')
const wz = flq.from('wz')
const qw = flq.from('authority')


const router = new Router({prefix: '/side'})

//获取当前用户
// router.get('/user',  async (ctx) =>{
//         //获取参数
//         const { uid } = ctx.state.user
//         const data = await shop_user.where({ uid }).find()
//         ctx.success(data)
// })

//修改用户头像接口
router.post('/photo', upload.single('yy'), async (ctx) => {
    // 1. 将本地图片上传到七牛云中
    const url = await qn.upload(ctx.file)
    // 2. 删除本地图片
    await fs.rm(ctx.file.path)
    if (ctx.state.user.uid) {
        // 获取参数
        const {uid} = ctx.state.user
        //2.1 将图片存入后台保存
        await shop_user.where({uid}).set({photo: url}).update()
    } else {
        // 获取参数
        const {id} = ctx.state.user
        //2.1 将图片存入后台保存
        await yh.where({id}).set({tx: url}).update()
    }

    // 3. 响应图片URL
    ctx.success('', '修改头像成功')
})



//修改管理者用户信息
router.post('/info', validator(xiugRules), async (ctx) => {
    // 获取参数
    // const {uid} = ctx.state.user
    const {userName, password, photo, uid } = ctx.request.body
    if (uid == 1) ctx.error('超级用户无法修改', 203)
    try {
        await shop_user.where({uid}).set({userName, password, photo}).update()
        ctx.success('', '修改成功')
    } catch (e) {
        console.log(e)
        ctx.error('修改失败', 203)
    }

})

//查询搜索管理者用户接口
router.get('/yh', async (ctx) => {
//        获取参数
    const {
        page = 1,
        size = 10,
        phone = '',
        state = ''
    } = ctx.query as unknown as { page: number, size: number, phone: string, state: string }
    let can = shop_user.where({
        phone: {com: 'LIKE', val: `%${phone}%`},
        state: {com: 'LIKE', val: `%${state}%`}
    }).limit({page, size})
    const {total, data} = await can.findRows()
    const totalPage: number = Math.ceil(total / Number(size))
    for (let i = 0; i < data.length; i++) {
        data[i].roles = data[i].roles.split(',')
        data[i].perms = data[i].perms.split(',')
    }
    ctx.success({data, pageable: {totalPage, total}})
})

//查询搜索发布者用户接口
router.get('/fb', async (ctx) => {
//        获取参数
    const {
        page = 1,
        size = 10,
        phone = '',
        state = ''
    } = ctx.query as unknown as { page: number, size: number, phone: string, state: string }
    let can = yh.where({
        phone: {com: 'LIKE', val: `%${phone}%`},
        state: {com: 'LIKE', val: `%${state}%`}
    }).limit({page, size})
    const {total, data} = await can.findRows()
    const totalPage: number = Math.ceil(total / Number(size))
    ctx.success({data, pageable: {totalPage, total}})
})

//修改发布者用户状态
router.post('/modify', async (ctx) => {
    // 获取参数
    const {id} = ctx.request.body
    console.log(id)
    try {
        const {state} = await yh.where({id}).first()
        console.log(state)
        await yh.where({id}).set({state: state == '1' ? '0' : '1'}).update()
        ctx.success('', '修改成功')
    } catch (e) {
        ctx.error('修改失败', 203)
    }
})

//修改管理者用户状态
router.post('/gl', async (ctx) => {
    // 获取参数
    const {uid} = ctx.request.body
    if (uid == 1) ctx.error('无法禁用超级用户', 203)
    try {
        const {state} = await shop_user.where({uid}).first()
        await shop_user.where({uid}).set({state: state == '1' ? '0' : '1'}).update()
        ctx.success('', '修改成功')
    } catch (e) {
        ctx.error('修改失败', 203)
    }
})

//新增管理者
router.post('/login', validator(xzRules), async (ctx) => {
//      获取参数
    const {phone, password, photo = '' , state = '0' } = ctx.request.body
//        查询是否重复添加
    const res = await shop_user.where({phone}).first()
    if (res) return ctx.success('', ' 手机号重复', 203)
    try {
        if( photo ){
            await shop_user.value({userName: phone, phone, password, state, photo  }).add()
        }else {
            await shop_user.value({userName: phone, phone, password, state  }).add()
        }
        ctx.success('', ' 新增成功')
    } catch (e) {
        ctx.success('', ' 新增失败', 203)
    }
})

//获取全部权限
router.get('/right', async (ctx) => {
    const data = [
        {value: 'roles', label: '后台管理',
            children: [
                { value: 'article', label: '文章板块',
                    children:[
                        { value: 'add-article', label: '新增文章' },
                        { value: 'min-article', label: '文章列表', children: [
                                { value: 'examine', label: '审核文章' },
                                { value: 'delete', label: '删除文章' }
                            ]
                        }
                            ]
                },
                { value: 'Manage-users', label: '用户板块',
                    children:[
                        { value: 'Manage', label: '用户管理', children: [
                                { value: 'prohibit', label: '禁用用户' }
                            ]},
                        { value: 'role', label: '角色管理',
                            children: [
                                { value: 'distribution', label: '分配权限' },
                                { value: 'increase', label: '新增角色' },
                                { value: 'user', label: '修改角色信息' },
                                { value: 'remove', label: '删除角色' }
                            ]
                        },
                    ]
                }
            ]
        }]
    ctx.success(data, '获取权限成功')
})

//获取当前用户权限
router.get('/right2', validator(wzxqRules) ,async ( ctx ) => {
        const { uid } = ctx.query as unknown as { uid: number }
    try {
        const { roles, perms } = await shop_user.where({ uid }).first()
        let data : [] = []
        const add: [] = roles.split(',')
        const arr: [] = perms.split(',')
        data.push( ...add, ...arr)
        ctx.success(data)
    }catch (e) {
        ctx.error('id有误', 203)
    }
})

//分配权限
router.post('/mate', validator(qxRules), async (ctx) => {
    // 获取参数
    const {uid, roles } = ctx.request.body as { uid: number, roles: [], perms: [] }
    if (uid == 1) ctx.error('超级用户无法分配', 203)
        const data =  [ 'roles', 'article', 'add-article', 'min-article', 'Manage-users', 'Manage', 'role' ]
        const arr = roles.filter ( (item,index) => {
            return item == data[index]
        })
    const perms = roles.filter( (item,index) => {
        return item !== data[index]
    })
    try {
        await shop_user.where({uid}).set({roles: arr.join(','), perms: perms.join(',')}).update()
        ctx.success('', '分配成功')
    } catch (e) {
        console.log(e)
        ctx.error('分配失败', 203)
    }
})

//审核接口
router.post('/sh', validator(wzRules), async (ctx) => {
    // 获取参数
    const {uid} = ctx.request.body as { uid: [] }
    // const { sh } = await wz.where({ uid }).first()
    try {
        for (let i = 0; i < uid.length; i++) {
            const {sh} = await wz.where({uid: uid[i]}).first()
            await wz.where({uid: uid[i]}).set({sh: sh == '1' ? '0' : '1'}).update()
        }
        ctx.success('', '审核成功')
    } catch (e) {
        ctx.success(e, '审核失败', 203)
    }
})

//删除用户
router.post('/sc', async  ( ctx ) =>{
    // 获取参数
    const { uid } = ctx.request.body as { uid: [] }
    try {
        for (let i = 0; i < uid.length; i++) {
            const {affectedRows} = await shop_user.where({uid: uid[i]}).remove()
            if (!affectedRows) return ctx.error('ID有误', 202)
        }
        ctx.success('', '删除成功')
    } catch (e) {
        ctx.success(e, '删除失败', 203)
    }
})

//删除文章
router.post('/delete', validator(wzRules), async (ctx) => {
    // 获取参数
    const {uid} = ctx.request.body as { uid: [] }
    try {
        for (let i = 0; i < uid.length; i++) {
            const {lid} = await wz.where({uid: uid[i]}).first()
            const {affectedRows} = await wz.where({uid: uid[i]}).remove()
            if (!affectedRows) return ctx.error('菜品ID有误', 202)
            const {dynamic} = await yh.where({id: lid}).first()
            await yh.where({id: lid}).set({dynamic: dynamic - 1}).update()
        }
        ctx.success('', '删除成功')
    } catch (e) {
        ctx.error('菜品ID有误', 202)
    }
})

//______________________________________发布者接口
//Violet Evelgaden

//获取用户信息
router.get('/user', async (ctx) => {
    //  add-article 新增文章  article 文章列表  user 用户信息 Manage-users 管理用户
    //  examine 审核按钮 increase 新增管理者按钮 distribution 分配权限按钮 delete 删除文章按钮
    // 获取参数
    //查询发布者权限
    if (ctx.state.user.id) {
        const {id} = ctx.state.user
        //发送获取用户sq
        const data = await yh.where({id}).first()
        // const res = ['add-article']
        data.roles = ['add-article', 'user']
        ctx.success(data)
    } else {
        // 查询管理者权限
        const {uid} = ctx.state.user
        //发送获取用户sq
        const data = await shop_user.where({uid}).first()
        data.roles = data.roles.split(',')
        data.perms = data.perms.split(',')
        ctx.success(data)
    }
})

//______________________________________发布者接口

export default router.routes()
