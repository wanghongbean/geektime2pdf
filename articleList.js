// 获取专栏文章列表
var config = require('./config.js');
const superagent = require('superagent');
const utils = require('./utils');
const path = require('path');
const generaterPdf = require('./generaterPdf.js');
const downloadAudio = require('./downloadAudio.js');
const downloadComment = require('./downloadComment.js');



var cookie = '';
var columnQueryUrl ='https://time.geekbang.org/serv/v3/lecture/list';
var userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';
var offset = 100065501;

(async function getAllColumns(){
    let res = await superagent.post(columnQueryUrl)
    // let res = superagent.post(columnQueryUrl)
        .set({
            'Content-Type': 'application/json',
            'Cookie': cookie,
            'Referer': 'https://time.geekbang.org/?sort=2&order=desc',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
        }).send({
            'label_id': 0,
            'type': 0
        });
    if (res.body && res.body.error && res.body.error.code) {
        console.log('error msg', res.body.error.msg);
        throw new Error(res.body.error.msg);
    };
    var arr = res.body.data.list;
    var columnIds = [];
    for (i = 0; i < arr.length; i++) {
        columnIds.push(arr[i].pid);
    } 
    
    getColumnName(columnIds);

})();

function partition(arr,length){
    var result = [];
    for(var i=0,j=arr.length; i<j;i++){
        if(i % length === 0){
            result.push([]);
        }
        result[result.length-1].push(arr[i]);
    }
    return result;
}

var columnNameUrl ='https://time.geekbang.org/serv/v3/product/infos';
var chapterUrl ='https://time.geekbang.org/serv/v1/chapters';
var firstIdUrl = 'https://time.geekbang.org/serv/v1/column/articles';

async function getColumnName(columnIds){
    if(columnIds.length==0){
        return;
    }

    resArr = partition(columnIds,10);
    // console.log(resArr);
    for(z=0;z<resArr.length;z++){
        // console.log(pid);
        let res = await superagent.post(columnNameUrl)
            .set({
                'Content-Type': 'application/json',
                'Cookie': cookie,
                'Referer': 'https://time.geekbang.org/?sort=2&order=desc',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
            }).send({
                'ids': resArr[z]
        });
        if (res.body && res.body.error && res.body.error.code) {
            console.log('error msg', res.body.error.msg);
            throw new Error(res.body.error.msg);
        };
        var titleList = res.body.data.infos;
        for(j=0;j<titleList.length;j++){
            // var cid =  titleList[i].id;
            // var name = titleList[i].share.title;
            if (titleList[j].id > offset){
                console.log('已完成下载 cid: ' + titleList[j].id + ',name: ' + titleList[j].share.title);
                continue; 
            }
            var chapterIds = await getChapters(titleList[j].id, titleList[j].share.title);
            // var firstId = await getFirstId(cid,name,chapterIds);
            
            // console.log(cid + ' - ' + name + ' - ' + firstId +' - ' + chapterIds);
            // console.log(firstId + ' '+ name );

            // sleep(fun,2000);
        }
    }
}

let fun = () => console.log('time out');
let sleep = function (fun, time) {
    setTimeout(() => {
        fun();
    }, time);
}

async function getChapters(cid,name){
    let res = await superagent.post(chapterUrl)
        .set({
            'Content-Type': 'application/json',
            'Cookie': cookie,
            'Referer': 'https://time.geekbang.org/column/intro/' + cid +'?tab=catalog',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
        }).send({
            'cid': cid
        });
    if (res.body && res.body.error && res.body.error.code) {
        console.log('error msg', res.body.error.msg);
        throw new Error(res.body.error.msg);
    };
    var list = res.body.data;
    var chapterIds = [];
    for(i=0;i<list.length;i++){
        chapterIds.push(list[i].id);
    }
    var firstId = await getFirstId(cid, name, chapterIds);
    return chapterIds;
}

async function getFirstId(cid,name,chapterIds) {
    let res = await superagent.post(firstIdUrl)
        .set({
            'Content-Type': 'application/json',
            'Cookie': cookie,
            'Referer': 'https://time.geekbang.org/column/intro/' + cid + '?tab=catalog',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1'
        }).send({
            'cid': cid,
            'chapter_ids':chapterIds,
            'size': 500, 
            'prev': 0, 
            'order': 'earliest', 
            'sample': false
        });
    if (res.body && res.body.error && res.body.error.code) {
        console.log('error msg', res.body.error.msg);
        throw new Error(res.body.error.msg);
    };
    var first = res.body.data.list[0].id;
    if (first == 316179){
        name = '张博伟 · A-B测试从0到1';
    }
    console.log(first + ' ' + name);
    await getColumnArticleList(first,name);
    console.log('over '+cid)
    return first;
}

/**
 * 执行方法
 * */
async function getColumnArticleList (firstArticalId,name){
    await utils.createDir('geektime_' + name);
    console.log('专栏文章链接开始获取');
    let columnArticleUrlList = [];
    // 下载类型， 1: 指定文章ID进行下载， 0: 通过 firstArticalId进行下载
    let type = 0, nextId, neighborRight;
    //指定id下载
    let assignIndex = 1;
    if (config.articalIds && config.articalIds.length > 0) {
        type = 1;
        firstArticalId = config.articalIds[0];
        console.log('通过articalIds配置进行文章获取', config.articalIds.length);
    } else {
        console.log('通过firstArticalId配置进行文章获取', firstArticalId);
    };
    let articalId = firstArticalId;

    async function getNextColumnArticleUrl (){
        try {
            let res = await superagent.post(config.url)
            .set({
                'Content-Type': 'application/json',
                'Cookie': cookie,
                'Referer': config.columnBaseUrl + articalId,
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36'
            }).send({
                'id': articalId,
                'include_neighbors': true
            });
            if (res.body && res.body.error && res.body.error.code){
                console.log('error msg', res.body.error.msg);
                throw new Error(res.body.error.msg);
            };
            console.log(res.body.data.article_title);
            let columnArticle = res.body.data;

            let articleInfo = {
                articleTitle: columnArticle.article_title, // 文章标题
                articalUrl: config.columnBaseUrl + articalId, // 文章地址
                articleContent: columnArticle.article_content, // 文章内容
                articleCover: columnArticle.article_cover, // 文章背景图
                authorName: columnArticle.author_name, // 文章作者
                articleCtime: utils.formatDate(columnArticle.article_ctime), // 文章创建时间 unix 时间戳 单位为 s 
                articleNeighbors: columnArticle.neighbors,  //  上下篇文章信息
                audioDownloadUrl: columnArticle.audio_download_url,
                audioTitle: columnArticle.audio_title
            };
            columnArticleUrlList.push(articleInfo);
            articleInfo.commentsTotal = 0;
            articleInfo.commentsArr = [];
            // 是否导出评论
            if (config.isComment) {
                let {commentsTotal, commentsArr} = await downloadComment(
                    config.columnBaseUrl + articalId,
                    articalId);
                articleInfo.commentsTotal = commentsTotal;
                articleInfo.commentsArr = commentsArr;
            };
            // 替换非法文件名
            let useArticleTtle = columnArticle.article_title.replace(/[\/:*?"<>|]/g, '-');
            //生成PDF 
            await generaterPdf(articleInfo,
                useArticleTtle + '.pdf',
                path.resolve(__dirname, 'geektime_' + name)
            );
            // 是否下载音频
            if (config.isdownloadVideo && columnArticle.audio_download_url) {
                await downloadAudio(
                    columnArticle.audio_download_url,
                    useArticleTtle + '.mp3',
                    path.resolve(__dirname, 'geektime_' + name)
                );
            };

            if(type == 1) {
                nextId = config.articalIds.length > assignIndex ? config.articalIds[assignIndex] : undefined;
                assignIndex++;
            } else {
                neighborRight = columnArticle.neighbors.right;
                nextId = (neighborRight && neighborRight.id) ? neighborRight.id : undefined;
            };
            // 判断是否还有下一篇文章
            if (nextId){
                articalId = nextId;
                await utils.sleep(1.5);
                await getNextColumnArticleUrl();
            };
        } catch(err){
            console.log(`访问 地址 ${config.columnBaseUrl + articalId} err`, err.message);
        };
    };
    await getNextColumnArticleUrl();
    console.log('专栏文章链接获取完成');
    utils.writeToFile(`geektime_${name}`, JSON.stringify(columnArticleUrlList,null,4));
    return columnArticleUrlList;
}