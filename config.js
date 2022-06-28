/**
 * 需要转换为 pdf 的配置信息 
 */
module.exports = {
    url: 'https://time.geekbang.org/serv/v1/article',
    commentUrl: 'https://time.geekbang.org/serv/v1/comments',
    columnBaseUrl: 'https://time.geekbang.org/column/article/',
    columnName: '动态规划面试宝典',
    firstArticalId: 284937, //专栏第一篇文章的ID
    //articalIds: [201700,202772,204472,205784],  //指定下载的articalId, 优先级更高, 配置后firstArticalId配置将失效
    isdownloadVideo: false, // 是否下载音频
    isComment: false, // 是否导出评论
    commentCount:20,//不生效
    cookie: ''
};