import { Rules } from 'async-validator'

export const yhRules: Rules = {
    userName: { required: true, message: '用户名不能为空' },
    introduce: { required: true, message: '个性签名不能为空' },
    gender: { required: true, message: '性别不能为空' },
    birthday: { required: true, message: '生日不能为空' }
}
