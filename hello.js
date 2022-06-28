var arguments = process.argv.splice(2);
console.log('所传递的参数是：', arguments[0]);


function Config(name, firstArticalId){
    url='https://time.geekbang.org/serv/v1/article';
    commentUrl='https://time.geekbang.org/serv/v1/comments';
    columnBaseUrl='https://time.geekbang.org/column/article/';
    this.columnName = name;
    this.firstArticalId = firstArticalId;
    isdownloadVideo=false;
    isComment=false;
    commentCount=20;
    cookie='';
}

var config = new Config(arguments[0], arguments[1]);

console.log(config.columnName +' - '+config.firstArticalId);
//////////////////////////
// print process.argv
process.argv.forEach(function (val, index, array) {

    console.log(index + ': ' + val);
});
