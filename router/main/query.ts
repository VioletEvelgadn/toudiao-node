// @ts-ignore
import Router from 'koa-router'
import fs from 'fs/promises'
import qn from '../../config/qn'
import upload from '../../middleware/upload'
import flq from '../../SQLConnect'
import validator from '../../middleware/validator'
import {wzRules, wzxqRules, plRules, fbRules, ssRules} from '../../rules/dishRules'

//文章
const wz = flq.from('wz')

//用户
const yh = flq.from('muser')

//评论
const pl = flq.from('comment')

//收藏
const sc = flq.from('sc')

//粉丝
const fans = flq.from('fans')

//历史
const ls = flq.from('ls')


const router = new Router({prefix: '/query'})

// const db = flq.from('dishes_data')
//     .where({ uid, cid , onsale: state, name: { com: 'LIKE', val: `%${name}%` } }).
//     limit({ page, size: pageSize })
//     .order({ rank: 1 })

//获取全部文章
router.get('/obtain', validator(wzRules), async (ctx) => {
    const {page = 1, size = 10, className = '', tatle = ''} = ctx.query
    //总页数
    let totalPage: number = 0
    let flq = wz.where({
        sh: '1',
        tatle: {com: 'LIKE', val: `%${tatle}%`},
        className: {com: 'LIKE', val: `%${className}%`}
    }).limit({page: Number(page), size: Number(size)})
    const {total, data} = await flq.findRows()
    totalPage = Math.ceil(total / Number(size))
    // 循环文章查询文章作者并将图片隔出来
    for (let i = 0; i < data.length; i++) {
        const res = await yh.where({id: data[i].lid}).first()
        data[i].userName = res.userName
        const res2 = data[i].wztp.split('!z_h!')
        // console.log(res2.includes(''))
        data[i].wztp = res2.includes('') ? [] : res2
    }
    ctx.success({data, pageable: {totalPage, total}})
})

//获取文章详情
router.get('/details', validator(wzxqRules), async (ctx) => {
    const {uid, id = 0} = ctx.query
    // 获取文章
    const [data] = await wz.where({uid: Number(uid)}).find()
    let res4 = []
    if (id != 0) {
        // 添加历史
        // 添加历史
        const res = await ls.where({lid: Number(uid), yid: Number(id)}).first()
        if (!res) {
            await ls.value({lid: Number(uid), yid: Number(id)}).add()
        }
        //获取收藏
        const t  = await sc.where({ lid: Number(uid), yid: Number(id) }).find()
        data.sc = t.length ? 1 : 0
        res4 = await fans.where({yid: Number(id), bid: data.lid}).find()
    }
    //获取作者粉丝查看是否关注
    //获取作者
    const [res2] = await yh.where({id: data.lid}).find()
    //获取评论
    const data2 = await pl.where({lid: Number(uid)}).find()
    //通过评论id获取评论人
    for (let i = 0; i < data2.length; i++) {
        const [res] = await yh.where({id: data2[i].yid}).find()
        data2[i].userName = res.userName
        data2[i].photo = res.photo
        data2[i].fans = res.fans
    }
    data.wztp = data.wztp.split('!z_h!')
    data.userName = res2.userName
    data.photo = res2.photo
    data.pl = data2
    if (id == 0) {
        data.gz = '关注'
    } else if (data.lid == id) {
        data.gz = '自己'
    } else {
        data.gz = res4.length ? '已关注' : '关注'
    }
    ctx.success(data)
})

//后台管获取全部文章
router.get('/obtain2', validator(ssRules), async (ctx) => {
    const {className = '', tatle = '', page = 1, size = 10, time} = ctx.query
    //总页数
    // console.log(time)
    let totalPage: number = 0
    let flq = wz.where({
        tatle: {com: 'LIKE', val: `%${tatle}%`},
        className: {com: 'LIKE', val: `%${className}%`}
    }).limit({page: Number(page), size: Number(size)})
    if(time) {
        flq = flq.where({
            time: <string>time
        }, 'AND', '>')
    }
    //获取文章
    const {total, data} = await flq.findRows()
    totalPage = Math.ceil(total / Number(size))
    //根据文章获取作者
    for (let i = 0; i < data.length; i++) {
        const [res] = await yh.where({id: data[i].lid}).find()
        data[i].wztp = data[i].wztp.split('!z_h!') ? data[i].wztp.split('!z_h!') : []
        data[i].userName = res.userName
    }
    ctx.success({data, pageable: {totalPage, total}})
})

//获取作者接口
router.get('/author', async (ctx) => {
    // 获取参数
    const {uid, id = ''} = ctx.query
    //根据文章查作者
    const {lid} = await wz.where({uid: Number(uid)}).first()
    // 查看是否关注
    const arr = await fans.where({bid: lid, yid: Number(id)}).first()
    // 获取作者详情
    const {photo, userName, introduce, fans: fs, dynamic, follow} = await yh.where({id: lid}).first()
    const data: Array<object> = []
    if (id) {
        data.push({photo, userName, introduce, fs, dynamic, follow, gz: arr ? '已关注' : '关注'})
    } else {
        data.push({photo, userName, introduce, fs, dynamic, follow, gz: '关注'})
    }
    ctx.success(data)
})

//获取全部评论
// router.get('/comment', validator(plRules), async (ctx) =>{
//     const { lid } = ctx.query
//     const data = await pl.where({ lid: Number(lid) }).find()
//         for (let i = 0 ; i < data.length ; i++){
//             const  [res]  = await yh.where({ id:  data[i].yid}).find()
//             data[i].userName = res.userName
//             data[i].photo = res.photo
//             data[i].fans = res.fans
//         }
//     ctx.success(data)
// })

//获取全部分类
// router.get('/class', async (ctx) =>{
//         const data = await fl.find()
//         ctx.success(data)
// })

// * 上传图片 【单图上传】
router.post('/upload', upload.single('ys'), async (ctx) => {
    if ( !ctx.file ) return ctx.error('ys不能为空', 203)
    // 1. 将本地图片上传到七牛云中
    const url = await qn.upload(ctx.file)
    // 2. 删除本地图片
    await fs.rm(ctx.file.path)
    // 3. 响应图片URL
    ctx.success(url)
})

export default router.routes()
