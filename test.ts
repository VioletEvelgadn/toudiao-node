//导入牛
import qiniu from 'qiniu'
import {qiniu_accessKey, qiniu_bucket, qiniu_secretKey, qiniu_url} from './config'

//上传空间名
const putPolicy = new qiniu.rs.PutPolicy({ scope: qiniu_bucket })
//AK与SK
const mac = new qiniu.auth.digest.Mac(qiniu_accessKey, qiniu_secretKey)
const uploadToken = putPolicy.uploadToken(mac)

console.log(qiniu_bucket)

//上传配置
const config = new qiniu.conf.Config()
// @ts-ignore
config.zone = qiniu.zone.Zone_z2

// 获取上传方法
const formUploader = new qiniu.form_up.FormUploader(config)
//获取上传压缩
const putExtra = new qiniu.form_up.PutExtra()
//上传
formUploader.putFile( uploadToken , 'yxw', 'C:\\Users\\xiaoH\\OneDrive\\桌面\\227dba6a83840d2192520e76f31af047e30ead2d.jpg@48w_48h_1c.png',
    putExtra, function(respErr, respBody, respInfo) {
    console.log(qiniu_bucket)
    if (respErr) {
        throw respErr;
    }
    if (respInfo.statusCode == 200) {
        console.log( qiniu_url + respBody.key);
    } else {
        console.log(respInfo.statusCode);
        console.log(respBody);
    }

});
