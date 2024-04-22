import { Rules } from 'async-validator'

//文章验证
export const wzRules: Rules = {
    // uid: { required: true, message: '分类不能为空' }
}

//文章详情
export const wzxqRules: Rules = {
    uid: { required: true, message: 'uid不能为空' }
}

//全部评论
export const plRules: Rules = {
    lid: { required: true, message: '联动id不能为空' }
}

//发布文章验证
export const fbRules: Rules = {
    content: { required: true, message: '内容不能为空' },
    className: { required: true, message: '分类名不能为空' },
    tatle: { required: true, message: '标题不能为空' }
}

//权限验证
export const qxRules: Rules = {
    uid: { required: true, message: '用户uid不能为空' },
    roles: { required: true, message: '路由权限不能为空' }
}


//搜索文章验证
export const ssRules: Rules = {
    // tatle: { required: true, message: '搜索表不能为空' }
}

//手机号验证
export const jhRules: Rules = {
    phone:[
        { required: true, message: '手机号不能为空' },
        { pattern: /1[23456789]\d{9}/, message: '手机号不符合规则'}
    ]
}
//新增发布者验证
export const xzRules: Rules = {
    phone:[
        { required: true, message: '手机号不能为空' },
        { pattern: /1[23456789]\d{9}/, message: '手机号不符合规则'}
    ],
    password: [
        { required: true, message: '密码不能为空' }
    ]
}

//修改用户信息
export const xiugRules: Rules = {
    password: { required: true, message: '密码不能为空' },
    userName: { required: true, message: '用户名不能为空' }
}

//登录验证
export const dlRules: Rules = {
    phone:[
        { required: true, message: '手机号不能为空' },
        { pattern: /1[23456789]\d{9}/, message: '手机号不符合规则'}
    ],
    code2:{ required: true, message: '验证码不能为空' }
}

//后台登录验证
export const userRules: Rules = {
    phone:[
        { required: true, message: '手机号不能为空' },
        { pattern: /1[23456789]\d{9}/, message: '手机号不符合规则'}
    ],
    password:{ required: true, message: '密码不能为空' }
}

//修改文章验证
//uid, content, wztp, className, tatle
export const yzRules: Rules = {
    uid: { required: true, message: 'uid不能为空' },
    content: { required: true, message: ' 内容不能能为空' },
    className: { required: true, message: '分类不能为空' },
    tatle: { required: true, message: '标题不能为空' }


}
