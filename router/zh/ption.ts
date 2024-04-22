// @ts-ignore
import Router from 'koa-router'
//用户
import flq from "../../SQLConnect";
import validator from "../../middleware/validator";
import {fbRules, wzRules, yzRules} from "../../rules/dishRules";
import {yhRules} from "../../rules/ptionRules";

import fs from 'fs/promises'
import qn from '../../config/qn'
import upload from "../../middleware/upload";
//文章
const wz = flq.from('wz')

//用户
const yh = flq.from('muser')

//评论
const pla = flq.from('comment')

//粉丝表
const fans = flq.from('fans')

//收藏表
const sc = flq.from('sc')

//历史
const ls = flq.from('ls')

const router = new Router({prefix: '/ption'})

//发布文章
router.post('/release', validator(fbRules), async (ctx) => {
    // content 内容 wztp 图片 lid 作者id classid 分类id tatle 标题
    //获取当前时间
    let time = new Date()
    const {id} = ctx.state.user
    if (!id) return ctx.success('', '请登录', 204)
    const {content, wztp = [], className, tatle} = ctx.request.body
    try {
        await wz.value({
            content,
            wztp: wztp.join('!z_h!'),
            lid: id,
            className,
            tatle,
            time: time.toLocaleDateString()
        }).add()
        const {dynamic} = await yh.where({id}).first()
        await yh.where({id}).set({dynamic: Number(dynamic) + 1}).update()
        ctx.success('发布成功')
    } catch (e) {
        console.log(e)
        ctx.success('发布失败')
    }
})

//修改文章
router.post('/release2', validator(yzRules), async (ctx) => {
//        获取参数
    const {id} = ctx.state.user
    const {uid, content, wztp, className, tatle} = ctx.request.body
    const  { lid } = await wz.where({ uid }).first()
    if( lid !== id ) return ctx.error('您无法修改别人的文章', 203)
    try {
        await wz.where({uid}).set({content, wztp: wztp.join('!z_h!'), className, tatle}).update()
        ctx.success('', '修改成功')
    } catch (e) {
        ctx.success('', '修改失败')
    }
})

//获取用户接口
router.get('/user', async (ctx) => {
    // 获取参数
    const {id} = ctx.state.user
    //发送获取用户sq
    const [data] = await yh.where({id}).find()
    ctx.success(data)
})

//修改用户接口
router.post('/user', validator(yhRules), async (ctx) => {
    // 获取参数
    const {id} = ctx.state.user
    // userName 用户名 introduce 签名 birthday 生日 gender 性别
    const {userName, introduce, birthday, gender} = ctx.request.body
    //发送获取用户sq
    try {
        await yh.where({id}).set({userName, introduce, birthday, gender}).update()
        ctx.success('', '修改成功')
    } catch (e) {
        console.log(e)
        ctx.success('', '修改失败')
    }
})

//修改用户头像接口
router.post('/photo', upload.single('yy'), async (ctx) => {
    // 获取参数
    const {id} = ctx.state.user
    // 1. 将本地图片上传到七牛云中
    const url = await qn.upload(ctx.file)
    // 2. 删除本地图片
    await fs.rm(ctx.file.path)
    //2.1 将图片存入后台保存
    await yh.where({id}).set({photo: url}).update()
    // 3. 响应图片URL
    ctx.success(url, '修改头像成功')
})

//发布评论
router.post('/comment', async (ctx) => {
    //获取参数
    const {id} = ctx.state.user
    const {lid, content} = ctx.request.body
    //获取评论时间
    let time = new Date()
    try {
        await pla.value({lid, content, yid: id, time: time.toLocaleDateString()}).add()
        const [{pl}] = await wz.where({uid: lid}).find()
        await wz.where({uid: lid}).set({pl: Number(pl) + 1}).update()
        ctx.success(null, '发布成功')
    } catch (e) {
        ctx.success(null, '评论发布失败')
    }
})

//点击关注接口
router.post('/follow', async (ctx) => {
    //获取参数
    const {id} = ctx.state.user
    const {lid} = ctx.request.body
    if (id == lid) return ctx.success(null, '你无法关注你自己')
    //查询是否已经关注过了
    const data = await fans.where({yid: id, bid: lid}).find()
    if (data.length) {
        const {affectedRows} = await fans.where({yid: id, bid: lid}).remove()
        if (affectedRows) {
            //用户关注数减一
            let [{follow}] = await yh.where({id}).find()
            await yh.where({id}).set({follow: follow - 1}).update()
            //作者粉丝数减一
            let [{fans: fans2}] = await yh.where({id: lid}).find()
            await yh.where({id: lid}).set({fans: fans2 - 1}).update()
            ctx.success(null, '取消关注成功')
        } else {
            ctx.success(null, '取消关注失败')
        }
    } else {
        try {
            await fans.value({yid: id, bid: lid}).add()
            //用户关注数加一
            let [{follow}] = await yh.where({id: id}).find()
            await yh.where({id}).set({follow: follow + 1}).update()
            //作者粉丝数加一
            let [{fans: fans2}] = await yh.where({id: lid}).find()
            await yh.where({id: lid}).set({fans: fans2 + 1}).update()
            ctx.success(null, '关注成功')
        } catch (e) {
            ctx.success(null, '关注失败')
        }
    }
})


//获取粉丝接口 bid
router.get('/getfans', async (ctx) => {
    //获取参数
    const {id} = ctx.state.user
    const data = await fans.where({bid: id}).find()
    if (!data.length) return ctx.success('', '您还没有粉丝')
    let res = []
    for (let i = 0; i < data.length; i++) {
        const [{id: uid, userName, photo, fans}] = await yh.where({id: data[i].yid}).find()
        //获取作者粉丝查看是否关注
        res.push({id: uid, userName, photo, fans})
    }
    for (let i = 0; i < res.length; i++) {
        const res2 = await fans.where({yid: id, bid: res[i].id}).find()
        res[i].gz = res2.length ? '已关注' : '关注'
    }
    ctx.success(res)
})

//获取关注数接口 yid
router.get('/getfollow', async (ctx) => {
    //获取参数
    const {id} = ctx.state.user
    //获取所有关注者id
    const data = await fans.where({yid: id}).find()
    if (!data.length) return ctx.success('', '您还没有喜欢的作者')
    let res = []
    for (let i = 0; i < data.length; i++) {
        const [{id, userName, photo, fans}] = await yh.where({id: data[i].bid}).find()
        res.push({id, userName, photo, fans})
    }
    for (let i = 0; i < res.length; i++) {
        const res2 = await fans.where({yid: id, bid: res[i].id}).find()
        res[i].gz = res2.length ? '已关注' : '关注'
    }
    ctx.success(res)
})

//获取作品接口
router.get('/works', async (ctx) => {
    //获取参数
    const {id} = ctx.state.user
    const data = await wz.where({lid: 4}).find()
    const res: Array<any> = data.map(item => {
        return {
            tatle: item.tatle,
            wztp: item.wztp.split('!z_h!'),
            class: item.className,
            time: item.time,
            uid: item.uid
        }
    })
    ctx.success(res)
})

//获取数据接口
router.get('/hdata', async (ctx) => {
    //获取参数
    const {id} = ctx.state.user
    const {fans, follow } = await yh.where({id}).first()
    const data: object = {fans, pl: follow}
    ctx.success(data)
})

//文章收藏接口
router.post('/collection', async (ctx) => {
    //获取参数
    const {id} = ctx.state.user
    const {uid} = ctx.request.body
    const p: object = await sc.where({lid: uid, yid: id}).first()
    //取消收藏
    if (p) {
        const {affectedRows} = await sc.where({lid: uid, yid: id}).remove()
        if (affectedRows) {
            const {sq} = await wz.where({uid}).first()
            await wz.where({uid}).set({sq: Number(sq) - 1}).update()
            ctx.success('', '取消收藏成功')
        } else {
            ctx.success('', '取消收藏失败')
        }
    } else {
        //收藏
        await sc.value({lid: uid, yid: id}).add()
        const {sq} = await wz.where({uid}).first()
        await wz.where({uid}).set({sq: Number(sq) + 1}).update()
        ctx.success('', '收藏成功')
    }
})

//我的收藏
router.get('/obtain', async (ctx) => {
    //获取参数
    const { id } = ctx.state.user
    const {page = 1, size = 10} = ctx.query
    const {total, data} = await sc.where({yid: id}).limit({page: Number(page), size: Number(size)}).findRows()
    const totalPage = Math.ceil(total / Number(size))
    let arr:Array<any> = []
    //根据联动id查询文章
    for (let i = 0; i < data.length; i++) {
        const res = await wz.where({uid: data[i].lid}).first()
        const {userName} = await yh.where({id: res.lid}).first()
        const y = await sc.where({lid: data[i].lid, yid: id}).first()
        arr.push({
            tatle: res.tatle,
            uid: res.uid,
            sq: res.sq,
            wztp: res.wztp.split('!z_h!') ? res.wztp.split('!z_h!') : [],
            pl: res.pl,
            sc: y ? 1 : 0,
            time: res.time,
            name: userName,
            like: 1
        })
    }
    ctx.success( {data: arr, pageable: {totalPage, total}},'获取收藏成功')
})

//历史记录
router.get('/history', async (ctx) => {
//    获取参数
    const {id} = ctx.state.user
    const {page = 1, size = 10} = ctx.query
    const {total, data} = await ls.where({yid: id}).limit({page: Number(page), size: Number(size)}).findRows()
    //数据
    let add: Array<any> = []
    const totalPage = Math.ceil(total / Number(size))
//    获取所有历史
    for (let i = 0; i < data.length; i++) {
        const res = await wz.where({uid: data[i].lid}).first()
        const {userName} = await yh.where({id: res.lid}).first()
        const y = await sc.where({lid: data[i].lid, yid: id}).first()
        add.push({
            tatle: res.tatle,
            uid: res.uid,
            sq: res.sq,
            wztp: res.wztp.split('!z_h!') ? res.wztp.split('!z_h!') : [],
            pl: res.pl,
            time: res.time,
            name: userName,
            like: y ? 1 : 0
        })
    }
    ctx.success({data: add, pageable: {totalPage, total}}, '获取历史成功')
})

//删除文章
router.post('/delete', validator(wzRules), async (ctx) => {
    // 获取参数
    const {uid} = ctx.request.body as { uid: number }
    try {
        const {lid} = await wz.where({ uid }).first()
        const {affectedRows} = await wz.where({ uid }).remove()
        if (!affectedRows) return ctx.error('菜品ID有误', 202)
        const {dynamic} = await yh.where({id: lid}).first()
        await yh.where({id: lid}).set({dynamic: dynamic - 1}).update()
        ctx.success('', '删除成功')
    } catch (e) {
        ctx.error('菜品ID有误', 202)
    }
})

//获取作品
router.get('/zp', async (ctx) => {
    //    获取参数
    const {id} = ctx.state.user
    const {page = 1, size = 10} = ctx.query
    const {total, data} = await wz.where({lid: id}).limit({page: Number(page), size: Number(size)}).findRows()
    const totalPage = Math.ceil(total / Number(size))
    const {userName} = await yh.where({id}).first()
    const add = data.map(item => {
        return {
            tatle: item.tatle,
            wztp: item.wztp.split('!z_h!')[0] ? item.wztp.split('!z_h!') : [],
            uid: item.uid,
            sq: item.sq,
            pl: item.pl,
            time: item.time,
            name: userName
        }
    })
    ctx.success({data: add, pageable: {totalPage, total}}, '获取作品成功')
})

export default router.routes()
