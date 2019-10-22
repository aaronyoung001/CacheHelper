/**
 * Created by Aaron on 2019/10/22.
 */

var fs = require('fs');
var R=require('ramda');

var path = require('path');

var CacheHelper = function(options){
    this.options = R.merge({
        name:'cache.manifest',
        description: "",
        cache:[],
        network:[],
        fallback:[],
        timestamp: true,
        isWatch: false,
        entryHtmls:[],
        useAll:true,    //默认所有html页面都设置模板
        useChunks:true  //打包的chunks是否自动放入缓存文件
    }, options);
}
CacheHelper.prototype.apply = function(compiler){

    var __self = this;

    compiler.hooks.emit.tap("CacheEmitPlugin",(compilation,callback)=>{

        __self.getAllHtmlFiles(compilation);
        __self.generateManifestFile(compilation);

        __self.generateSwFile(compilation);


    })

}


/**
 * Get All Html Files Need To Change The Attribute OF Manifest
 * @param compilation
 */
CacheHelper.prototype.getAllHtmlFiles=function(compilation){
    var __self = this;

    if(this.options.useAll){//默认所有html页面都设置模板

        for(var fileName in compilation.assets){
            if(!!fileName&&fileName.toLowerCase().lastIndexOf(".html")===fileName.length-5){
                var entryHtmls=__self.options.entryHtmls;
                if(!R.contains(fileName,entryHtmls)){
                    entryHtmls=R.append(fileName,entryHtmls);
                    __self.entryHtmls=entryHtmls;
                }
                __self.setManifestAttribute(compilation,fileName);
                __self.addSwLoader(compilation,fileName);
            }
        }
    }else{
        R.forEach(function(fileName){
            if(!!fileName&&fileName.toLowerCase().lastIndexOf(".html")===fileName.length-5){
                __self.setManifestAttribute(compilation,fileName);
                __self.addSwLoader(compilation,fileName);
            }
        },this.options.entryHtmls);

    }
    
    
}


/**
 * Set Manifest Attribute
 * @param compilation
 * @param fileName
 */
CacheHelper.prototype.setManifestAttribute = function(compilation,fileName){
    var cacheFileName=this.options.name+".manifest";
    var data = compilation.assets[fileName];
    if(!data) return;
    var source_str = data.source();
    compilation.assets[fileName] = {
        source: function() {
            var url = path.relative(path.parse(fileName).dir,cacheFileName).split(path.sep).join('/');
            return source_str.replace(/<html[^>]*manifest="([^"]*)"[^>]*>/,function(word){
                return word.replace(/manifest="([^"]*)"/,'manifest="'+url+'"');
            }).replace(/<html(\s?[^\>]*\>)/,function(word){
                if(word.indexOf('manifest')>-1) return word
                return word.replace('<html','<html manifest="'+url+'"')
            });
        },
        size: function() {
            return source_str.length;
        }
    };
}


/**
 * 加载service worker
 * @param compilation
 * @param fileName
 */
CacheHelper.prototype.addSwLoader = function(compilation,fileName){
    let template = fs.readFileSync('./sw.template', 'utf8')
    let data = compilation.assets[fileName];
    if(!data) return;
    var source_str = data.source();
    compilation.assets[fileName] = {
        source: function() {;
            return source_str+template;
        },
        size: function() {
            return source_str.length;
        }
    };
}


CacheHelper.prototype.generateSwFile=function(compilation){
    var cacheName = this.options.name+"_cache";
    let template = fs.readFileSync('./swTemplate.template', 'utf8')
    template=template.replace(/<%=CACHE_NAME%>/gm, '"'+cacheName+'"');
    template=template.replace(/<%=CACHE_LIST%>/gm,  "'"+this.getAllCacheFiles(compilation,this.options.cache).join("','")+"'");

    compilation.assets["sw.js"] = {
        source: function() {
            return template;
        },
        size: function() {
            return template.length;
        }
    };

}


/**
 * 生成manifetst文件
 * @param compilation
 */
CacheHelper.prototype.generateManifestFile = function(compilation){

    var contents = [],
        options = this.options,
        fallback = options.fallback,
        network = options.network,
        cacheFileName = options.name+".manifest";
    var outputData = [];
    var networkData = [];

    contents.push('CACHE MANIFEST');
    if (options.timestamp) {
        contents.push('# Time: ' + new Date());
    }
    if (options.description) {
        contents.push('# '+options.description);
    }
    contents.push('');
    if(options.cache){
        contents.push('CACHE:');
        contents = contents.concat(this.getAllCacheFiles(compilation,options.cache));
        contents.push('');
    }

    if(network.length>0){
        contents.push('NETWORK:');
        contents.push(network.join('\n'));
        contents.push('');
    }

    if(fallback.length>0){
        contents.push('FALLBACK:');
        contents.push(fallback.join('\n'));
    }
    // Insert this list into the Webpack build as a new file asset:
    compilation.assets[cacheFileName] = {
        source: function() {
            return contents.join('\n');
        },
        size: function() {
            return contents.join('\n').length;
        }
    };

}


/**
 * 获取所有需要缓存的文件
 */
CacheHelper.prototype.getAllCacheFiles = function(compilation){


    var arr=[];
    if(this.options.useChunks){
        var files = compilation.chunks.reduce(function(files, chunk) {
            return chunk.files.reduce(function (files, path) {
                return files.concat(path);
            }.bind(this), files);
        }.bind(this), []);

        arr=arr.concat(files);
    }


    var attt =  arr.map(function(item,idx){
            item = compilation.getPath(item)
            if(item) return item;
        })
        .filter(function(elm){
            return (elm !== '' && typeof(elm) !== "undefined")
        });
    return R.uniq(attt)
}


module.exports = CacheHelper;