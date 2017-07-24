$.widget('rk.photos',{
        options:{
            selector : "a.js-album",
            idx : 0,
            itemWid : 82,
            itemMargin: 36,
            itemFocusWid : 100,
            halfItem: 4,
            pageType: null,
            photos: false,
            renderFun: null,
            param: null,
            pageSize: 21
        },
        _init: function(){
            var me = this;
            var opt = me.options;
            me.hasNextData = true;
            me.hasPrevData = true;
            if(opt.pageType == "feed"){
                me.element.on('click', opt.selector, function(evt) {
                    evt.preventDefault();
                    me.showLoading();
                    var act = $(this);
                    var wrap = act.closest('.js-album-box');
                    var list = wrap.find(opt.selector);
                    me.options.idx = list.index(act);
                    me.options.wrap = wrap;
                    me.loadTmpl();
                });
            }else if(opt.pageType == "doc" || opt.pageType == "chat"){
                me.showLoading();
                me.loadTmpl();
            }
        },
        showLoading: function(){
            var html = '<div class="pho-mask box-sizing ui-front" id="J_photos"><p id="pho_loading" class="J_ploading">页面正在拼命加载中...</p></div>';
            $('body').append(html);
            $('body').css({"overflow":"hidden"});
        },
        loadTmpl: function(){
            var me = this;
            if(!$('#J_phohead').length){
                me.getTmpl();
            }
        },
        getTmpl: function(){
            var me = this;
            var opt = me.options;
            if(opt.pageType == "feed"){
                me.getFeedData(function(arr){
                    me.bindInitEvent(arr);
                });
            }else if(opt.pageType == "doc" || opt.pageType == "chat"){
                me.getDocData("init", function(arr){
                    me.bindInitEvent(arr);
                });
            }
        },
        bindInitEvent: function(arr){
            var me = this;
            var opt = me.options;
            me.renderTmpl(arr);
            opt.renderFun && opt.renderFun();
            me.toolEvent();
            me.focusIndex = me.options.idx;
            me.setsliderWidth();
            me.iconEvent();
            me.setsliderPos();
        },
        renderTmpl : function(arr){
            var me = this;
            var opt = me.options;
            var tmpl = require('./tmpl/photos.tpl');
            var photoTmpl = rk.templateText(tmpl, {
                arr: arr,
                act: arr[opt.idx],
                idx: opt.idx,
                pageType: opt.pageType,
                photos: opt.photos
            });
            $('#pho_loading').remove();
            $('#J_photos').append(photoTmpl);
        },
        getFeedData: function(callback){
            var me = this;
            var opt = me.options, arr = [], obj = {}, that = null;
            var images = opt.wrap.find(opt.selector);
            $.each(images, function(idx, info){
                obj = {};
                that = $(info);
                obj.href = that.attr("href");
                obj.lurl = that.attr("lurl");
                obj.surl = that.attr("surl");
                obj.fileName = that.attr("name");
                arr.push(obj);
            });
            me.lastIndex = arr.length - 1;
            callback && callback(arr);
        },
        getDocData: function(type, callback){
            var me = this, url = null, param = null;
            var opt = me.options;
            if((type == "next") && !me.hasNextData){
                return false;
            }else if((type == "prev") && !me.hasPrevData){
                return false;
            }
            if(opt.pageType == "doc"){
                switch(type){
                    case "init":
                        url = "/json/oa_twitter-file/init-images.action";
                        param = opt.param;
                        break;
                    case "next":
                        url = "/json/oa_twitter-file/next-list-imagefiles.action";
                        param = $.extend(opt.param, {
                            fileId: $('#J_plist li:last').attr("data-fileid")
                        });
                        break;
                    case "prev":
                        url = "/json/oa_twitter-file/previous-list-imagefiles.action";
                        param = $.extend(opt.param, {
                            fileId: $('#J_plist li').eq(0).attr("data-fileid")
                        });
                        break;
                }
            }else if(opt.pageType == "chat"){
                switch(type){
                    case "init":
                        url = "/json/sns_wx/init-list-imagefiles.action";
                        param = opt.param;
                        break;
                    case "next":
                        url = "/json/sns_wx/next-list-imagefiles.action";
                        param = $.extend(opt.param, {
                            pmDetailId: $('#J_plist li:last').attr("data-fileid")
                        });
                        break;
                    case "prev":
                        url = "/json/sns_wx/previous-list-imagefiles.action";
                        param = $.extend(opt.param, {
                            pmDetailId: $('#J_plist li').eq(0).attr("data-fileid")
                        });
                        break;
                }
            }
            var data = null, file = null;
            if(me.isGetJson){
                return false;
            }
            me.isGetJson = true;
            $.getJSON(url,param).done(function (json) {
                me.isGetJson = false;
                if(json.status == 0){
                    if(type == "init"){
                        if(opt.pageType == "doc"){
                            data = json && json.imageRecords;
                            $.each(data, function(idx, info){
                                info["lurl"] = info.href;
                                info["surl"] = info.href;
                                if(info["isCheck"] == "true"){
                                    me.options.idx = idx;
                                }
                            });
                        }else if(opt.pageType == "chat"){
                            data = json && json.data && json.data.pmDetailList;
                            data = me.parseChatData(data);
                        }
                        me.setIndexVal(data,"init");
                        callback && callback(data);
                    }else if(type == "next"){
                        if(opt.pageType == "doc"){
                            data = json && json.imageRecords;
                            data = me.parseDocData(data);
                        }else if(opt.pageType == "chat"){
                            data = json && json.data && json.data.pmDetailList;
                            data = me.parseChatData(data);
                        }
                        me.setIndexVal(data,"next");
                        me.renderImgList(data, type);
                    }else if(type == "prev"){
                        if(opt.pageType == "doc"){
                            data = json && json.imageRecords;
                            data = me.parseDocData(data);
                        }else if(opt.pageType == "chat"){
                            data = json && json.data && json.data.pmDetailList;
                            data = me.parseChatData(data);
                        }
                        me.setIndexVal(data, "prev");
                        me.renderImgList(data, type);
                    }
                }else if(json.status == 300002){
                    $('#J_photos').html(rk.templateText(require('oa/tmpl/rescenter/tpl_rescenter_detail_deleted.tpl'), {
                        content: rk.i18n('TWITTERFILE_NOT_EXISTS_OR_DELETED')
                    }));
                }else{
                    rk.noticeError(rk.i18n('TWITTERFILE_SYSTEM_ERROR'));
                }
            });
            return data;
        },
        parseDocData: function(data){
            $.each(data, function(idx, info){
                info["lurl"] = info.href;
                info["surl"] = info.href;
            });
            return data;
        },
        parseChatData: function(data){
            var me = this, file = null, arr= [], obj = null;
            $.each(data, function(idx, info){
                file = {};
                obj = info["file"];
                file["lurl"] = obj["lpicurl"];
                file["surl"] = obj["spicurl"];
                file["href"] = obj["fileurl"];
                file["fileName"] = obj["filename"];
                file["fileId"] = info["id"]
                arr.push(file);
                if(info["ischeck"] == "1"){
                    me.options.idx = idx;
                }
            });
            return arr;
        },
        setIndexVal: function(data, type){
            var me = this, len = null;
            var opt = me.options;
            switch(type){
                case "init":
                    len = data.length;
                    me.lastIndex = len - 1;
                    if(len < opt.pageSize){
                        me.hasNextData = false;
                        me.hasPrevData = false;
                    }
                    break;
                case "next":
                    len = data.length;
                    me.lastIndex = me.lastIndex + len;
                    if(len < opt.pageSize){
                        me.hasNextData = false;
                    }
                    break;
                case "prev":
                    len = data.length;
                    me.lastIndex = me.lastIndex + len;
                    me.focusIndex = me.focusIndex + len;
                    if(len < opt.pageSize){
                        me.hasPrevData = false;
                    }
                    break;
            }
        },
        renderImgList: function(data, type){
            if(!data.length){
                return false;
            }
            var me = this, arr = null, result = [];
            $.each(data, function(idx, info){
                arr = [
                    '<li data-fileid="'+ info.fileId +'" data-filename="'+info.fileName+'" data-checkcode="'+info.checkCode+'" data-downloadflag="'+info.downloadFlag+'">',
                    '<i class="unsel"></i>',
                    '<img src="'+ info.href +'"  data-dlurl="'+ info.lurl +'" data-dsurl="'+ info.surl +'" data-durl="'+ info.href +'">',
                    '</li>'
                ];
                result.push(arr.join(""));
            });
            if(type == "next"){
                $('#J_plist').append(result.join(""));
            }else if(type == "prev"){
                $('#J_plist').prepend(result.join(""));
            }
            me.imgErrorEvent();
            me.setsliderWidth();
            me.setsliderPos();
        },
        toolEvent: function(){
            var me = this;
            var opt = me.options;
            $('#J_plarge').on('click', function(e){
                me.transformRender("large");
                var $act = $(e.target);
                me.focusEvent($act);
                return false;
            });
            $('#J_pnarrow').on('click', function(e){
                me.transformRender("narrow");
                var $act = $(e.target);
                me.focusEvent($act);
                return false;
            });
            $('#J_pleft').on('click', function(e){
                me.transformRender("left");
                var $act = $(e.target);
                me.focusEvent($act);
                return false;
            });
            $('#J_pright').on('click', function(e){
                me.transformRender("right");
                var $act = $(e.target);
                me.focusEvent($act);
                return false;
            });
            $('#J_pfull').on('click', function(e){
                var that = $(this);
                if(that.hasClass("full-screen")){
                    $('#J_phohead').show();
                    $('#J_photos').css({"padding-top":"60px"});
                }else{
                    $('#J_phohead').hide();
                    $('#J_photos').css({"padding-top":"10px"});
                }
                $(this).toggleClass("full-screen");
                var $act = $(e.target);
                me.focusEvent($act);
                return false;
            });
            $('#J_pclose').on('click', function(e){
                var that = $(this);
                var list = $('#J_pimglist');
                var wrap = $('#J_phowrap');
                var botm = $('#J_phobotm');
                if(that.hasClass("J_close")){
                    botm.animate({
                        "margin-top" : "82px"
                    },"slow", function(){
                        list.hide();
                        wrap.css({"padding-bottom": "154px"});
                        that.removeClass("J_close").addClass("J_open");
                        that.find('b').html("展开缩略图");
                    });
                }else if(that.hasClass("J_open")){
                    list.show();
                    botm.animate({
                        "margin-top" : "24px"
                    }, "slow", function(){
                        wrap.css({"padding-bottom": "220px"});
                        that.removeClass("J_open").addClass("J_close");
                        that.find('b').html("收起缩略图");
                    });
                }
                var $act = $(e.target);
                me.focusEvent($act);
                return false;
            });
            $('#J_plist').on('click', 'i', function(e){
                var that = $(this);
                that.toggleClass("sel");
                var len = $('#J_plist').find('i.sel').length;
                var batch = $('#J_phobatch');
                if(len){
                    me.setbatchPos();
                    batch.show();
                }else{
                    batch.hide();
                }
                var $act = $(e.target);
                me.focusEvent($act);
                return false;
            });
            $('#J_plist').on("mouseenter mouseleave", "li", function(e){
                if(e.type == "mouseenter"){
                    var icon = $(this).find('.unsel').not(".sel");
                    icon.css({"display": "inline-block"});
                }else if(e.type == "mouseleave"){
                    var icon = $(this).find('.unsel').not(".sel");
                    var $act = $(e.target);
                    if(icon.length){
                        var state = $.contains(icon[0], $act[0]) || $act.is(icon);
                        if(!state){
                            icon.css({"display": "none"});
                        }
                    }
                }
            });
            $('#J_phobatch').on('click', function(e){
                if(opt.pageType == "doc"){
                    var arr = [], obj = null, parent= null;
                    $.each($('#J_plist li i.sel'), function(idx, info){
                        obj = {};
                        parent = $(this).parent("li");
                        obj["fileid"] = parent.attr("data-fileid");
                        obj["downloadflag"] = parent.attr("data-downloadflag");
                        obj["checkcode"] = parent.attr("data-checkcode");
                        arr.push(obj);
                    });
                    me.batchLoad(arr);
                }else if(opt.pageType == "chat" || opt.pageType == "feed"){
                    $.each($('#J_plist li i.sel'), function(idx, info){
                        var batch = $('#J_batchImg');
                        var batchurl = $(info).next('img').attr("data-durl");
                        if(batch.length){
                            batch.attr("href", batchurl);
                            batch[0].click();
                        }else{
                            batch = $("<a id='J_batchImg'></a>").attr("href", batchurl).attr("download", "img.png");
                            $('body').append(batch);
                            batch[0].click();
                        }
                    });
                }
                $('#J_plist li i.sel').removeClass("sel").hide();
                $('#J_phobatch').hide();
                var $act = $(e.target);
                me.focusEvent($act);
                return false;
            });
            $('#J_plist').on('click', 'li', function(e){
                var focus = $(this);
                var img = focus.find('img');
                var src = img.attr("data-dlurl");
                if(src){
                    var idx = me.focusIndex;
                    var cidx = focus.index();
                    if(cidx == idx){
                        return false;
                    }
                    var loadurl = img.attr('data-durl');
                    var fid = focus.attr("data-fileid");
                    var fname = focus.attr("data-filename");
                    me.resetCss(src, loadurl, fid, fname);
                    $('#J_plist li').removeClass("item-focus");
                    focus.addClass("item-focus");
                    me.focusIndex = cidx;
                    if(cidx > idx){
                        me.resetsliderPos("next");
                    }else if(cidx < idx){
                        me.resetsliderPos("prev");
                    }
                }
                var $act = $(e.target);
                me.focusEvent($act);
                return false;
            });
            $('#J_pprev').on('click', function(e){
                if(me.focusIndex == 0){
                    $.msg("当前已经是第一张啦", 1);
                    return false;
                }else{
                    var list = $('#J_plist li');
                    var focus = list.eq(me.focusIndex-1);
                    var img = focus.find('img');
                    var src = img.attr("data-dlurl");
                    list.removeClass("item-focus");
                    focus.addClass("item-focus");
                    if(src){
                        var loadurl = img.attr("data-durl");
                        var fid = focus.attr("data-fileid");
                        var fname = focus.attr("data-filename");
                        me.resetCss(src, loadurl, fid, fname);
                    }
                    me.focusIndex = me.focusIndex - 1;
                    me.resetsliderPos("prev");
                }
                var $act = $(e.target);
                me.focusEvent($act);
                return false;
            });
            $('#J_pnext').on('click', function(e){
                if(me.focusIndex == me.lastIndex){
                    $.msg("当前已经是最后一张啦", 1);
                    return false;
                }else{
                    var list = $('#J_plist li');
                    var focus = list.eq(me.focusIndex+1);
                    var img = focus.find('img');
                    var src = img.attr("data-dlurl");
                    list.removeClass("item-focus");
                    focus.addClass("item-focus");
                    if(src){
                        var loadurl = img.attr("data-durl");
                        var fid = focus.attr("data-fileid");
                        var fname = focus.attr("data-filename");
                        me.resetCss(src, loadurl, fid, fname);
                    }
                    me.focusIndex = me.focusIndex + 1;
                    me.resetsliderPos("next");
                }
                var $act = $(e.target);
                me.focusEvent($act);
                return false;
            });
            $(window).resize(function(){
                me.setbatchPos();
            });
            $('#J_photos').on('selectstart', function(){
                return false;
            });
            $('#J_phowrap').mousemove(function(e){
                var $act = $(e.target);
                me.focusEvent($act, function(){
                    me.enterEvent = setTimeout(function(){
                        $('#J_phobotm').hide();
                    },3000);
                });
            }).mouseout(function(e){
                var $act = $(e.target);
                var state = $.contains($('#J_phowrap')[0], $act[0]) || $act.is($('#J_phowrap'));
                if(!state){
                    me.enterEvent && clearTimeout(me.enterEvent);
                    $('#J_phobotm').hide();
                }
            });
            // load img
            $('#J_pshow').on('error', function(){
                $(this).attr({"src": SESSION.resDomain + "/static/img/photos/loadfail.png"});
            });
            me.imgErrorEvent();
        },
        imgErrorEvent: function(){
            $('#J_plist img').off('error').on('error', function(){
                $(this).attr({"src": SESSION.resDomain + "/static/img/photos/loadfail.png"});
            });
        },
        batchLoad: function(data){
            var me = this;
            if ($.isArray(data)) {
                var cantDownload = 0;
                var id = null, code = null, param = null;
                $.each(data, function(idx, info){
                    id = info.fileid;
                    code = info.checkcode;
                    param = {
                        fileId: id,
                        checkCode: code
                    };
                    if(info.downloadflag == "true"){
                        me.batchDone(param);
                    }else{
                        cantDownload++;
                        if(data.length == 1){
                            rk.noticeError(rk.i18n('RESCENTER_THE_FILE_CANT_DOWNLOAD'));
                        }
                    }
                });
                if (cantDownload > 0) rk.noticeError(rk.i18n("RESCENTER_MULTI_FILES_CANT_DOWNLOAD", cantDownload));
            }
        },
        batchDone: function (param) {
            setTimeout(function () {
                window.open('/json/sns_twitter_file/download-new.action?fileId=' + param.fileId + '&checkCode=' + param.checkCode + '&collect=' + param.collect, param.fileId);
            }, 500);
        },
        enterEvent: null,
        outEvent: null,
        focusEvent: function($act, callback){
            var me = this;
            if($.contains($('#J_phowrap')[0], $act[0]) || $act.is($('#J_phowrap'))){
                $('#J_phobotm').show();
                me.setbatchPos();
                me.enterEvent && clearTimeout(me.enterEvent);
                callback && callback();
            }
        },
        setbatchPos: function(){
            var list = $('#J_pimglist');
            var left = (list.length) && list.offset().left;
            var wid = list.width();
            $('#J_phobatch').css({"left":(left+wid)+"px"});
        },
        iconEvent: function(){
            var me = this;
            $('#J_delbtn').on('click', function(){
                $('#J_photos').remove();
                $('body').css({"overflow":"auto"});
            });
            $('#J_loadbtn').on('click', function(){
                var src = $('#J_pshow').attr("data-load");
                var $load = $('#J_loadImg');
                if($load.length){
                    $load.attr("href", src);
                    $load[0].click();
                }else{
                    $load = $("<a id='J_loadImg'></a>").attr("href", src).attr("download", "img.png");
                    $('body').append($load);
                    $load[0].click();
                }
            });
            $('#J_detailbtn').on('click', function(){
                var detail = $('#J_phodetail');
                var wrap = $('#J_photos');
                if(detail.hasClass("show")){
                    detail.hide();
                    wrap.css({"padding-right": 0});
                }else{
                    detail.show();
                    wrap.css({"padding-right": "462px"});
                }
                detail.toggleClass("show");
                me.setbatchPos();
            });
            $('#J_morebtn').on('click', function(e){
                e.stopPropagation();
                $('#J_moremenu').show();
            });
        },
        resetCss: function(lurl, loadurl, fid, fname){
            var me = this;
            var opt = me.options;
            var show = $('#J_pshow');
            show.css({
                "transform": "scale(1) rotate(0deg)"
            });
            show.attr({
                "data-large":"1.0",
                "data-rotate":"0",
                "data-load": loadurl,
                "src": lurl
            });
            opt.renderFun && opt.renderFun(Number(fid));
            $('#J_phofname').text(fname);
            $('#J_porigin a').attr({"href": loadurl});
        },
        setsliderWidth: function(){
            var me = this;
            var num = me.lastIndex;
            var opt = me.options;
            var width = num * (opt.itemWid + opt.itemMargin) + opt.itemFocusWid;
            if(width  < 1044){
                $('#J_pimglist').css({"width": width});
            }
            $('#J_plist').css({"width": (num * (opt.itemWid + opt.itemMargin) + (opt.itemFocusWid+opt.itemMargin))+"px"});
        },
        setsliderPos: function(){
            var me = this;
            var opt = me.options;
            var endNum = me.lastIndex - me.focusIndex;
            var focusPos = me.focusIndex * (opt.itemWid + opt.itemMargin) + opt.itemFocusWid;
            if(me.lastIndex > (opt.halfItem*2)){
                if(endNum > opt.halfItem){
                    $('#J_plist').css({"left": "-"+(focusPos-522-50)+"px"});
                }else{
                    var endPos = me.lastIndex * (opt.itemWid + opt.itemMargin) + opt.itemFocusWid;
                    $('#J_plist').css({"left": "-"+(endPos-1044)+"px"});
                }
            }
        },
        resetsliderPos: function(type){
            var me = this;
            var opt = me.options;
            if(type == "next"){
                var focusPos = me.focusIndex * (opt.itemWid + opt.itemMargin) + opt.itemFocusWid;
                var nextCount =  me.lastIndex - me.focusIndex;
                if(nextCount >= opt.halfItem){
                    $('#J_plist').css({"left": "-"+(focusPos-522-50)+"px"});
                }
                if(nextCount <= opt.halfItem){
                    me.getDocData("next");
                }
            }else if(type == "prev"){
                var focusPos = me.focusIndex * (opt.itemWid + opt.itemMargin) + opt.itemFocusWid;
                var prevCount =  me.focusIndex;
                var nextCount = me.lastIndex -  me.focusIndex;
                if((prevCount >= opt.halfItem) && (nextCount >= opt.halfItem)){
                    $('#J_plist').css({"left": "-"+(focusPos-522-50)+"px"});
                }
                if(me.focusIndex <= opt.halfItem){
                    me.getDocData("prev");
                }
            }
        },
        transformRender: function(type){
            var  show = $('#J_pshow'), large = null, rotate = null;
            var max = 2.0, step = 0.1, angle = 90;
            switch(type){
                case "large" :
                     large = Number(show.attr("data-large")) + step;
                     if(large > max){
                         large  =  max;
                     }
                     rotate = Number(show.attr("data-rotate"));
                     break;
                case "narrow":
                     large = Number(show.attr("data-large")) - step;
                     rotate = Number(show.attr("data-rotate"));
                     if(large < step){
                         large = step;
                     }
                     break;
                case "left":
                     large = Number(show.attr("data-large"));
                     rotate = Number(show.attr("data-rotate")) - angle;
                     break;
                case "right":
                     large = Number(show.attr("data-large"));
                     rotate = Number(show.attr("data-rotate")) + angle;
                     break;
            }
            show.css({
                "transform" : "scale("+ large +") rotate("+ rotate +"deg)",
                "-moz-transform" : "scale("+ large +") rotate("+ rotate +"deg)",
                "-webkit-transform" : "scale("+ large +") rotate("+ rotate +"deg)"
            });
            show.attr("data-large", large);
            show.attr("data-rotate", rotate);
        }
    });