/*jslint browser: true, devel: true */
/*global $*/
/*global accounting*/
/*global GENERAL*/
/*global ROUTING*/
/*global Mustache*/
var SIMPLE = (function ($) {
    "use strict";
    var my = {}, lala = null;
    /***************************************************************************
     * DISPLAY
     **************************************************************************/
    my.getInputs = function () {
        var result, params;
        result = "";
        result += GENERAL.getParams();
        // procZ9761 diag:S501
        params = $('#simple-query-form :input[value][value!=""]').serialize();
        result += '&' + params;
        return result;
    };
    my.getInputs2 = function () {
        var result, params;
        result = {};
        result = GENERAL.getParamsObj();
        params = $('#simple-query-form :input[value][value!=""]').serializeArray();
        var values = {};
        $.each(params, function (i, field) {
            values[field.name] = field.value;
        });
        result = GENERAL.merge_options(result, values);
        return result;
    };

    my.render = function () {
        var params;
        params = GENERAL.getParams();
        GENERAL.loadCurrent = my.render;
        ROUTING.yC.navigate('/simple?' + params, {
            trigger : false
        });
        // output = Mustache.render(template, data);
        $('#content').html(GENERAL.templates.simple_query);
        $('#myTab a').click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        });
        $('#myTab a:first').tab('show');

        $("#rendProvNum").tokenInput("/MCFraudWeb/data/lists/rendprovs", {
            "tokenLimit" : 1,
            preventDuplicates : true,
            placeholder : "Provider",
            minChars : 0,
            extraParams : my.getInputs2
        });
        $("#rendProvType").tokenInput("/MCFraudWeb/data/lists/rendprovtypes/", {
            "tokenLimit" : 1,
            preventDuplicates : true,
            placeholder : "Provider Type",
            minChars : 0,
            extraParams : my.getInputs2
        });
        $("#rendProvSpec").tokenInput("/MCFraudWeb/data/lists/rendprovspecs/", {
            "tokenLimit" : 1,
            preventDuplicates : true,
            placeholder : "Provider Specialty",
            minChars : 0,
            extraParams : my.getInputs2
        });
        $("#proc").tokenInput("/MCFraudWeb/data/lists/procs", {
            "tokenLimit" : 1,
            preventDuplicates : true,
            placeholder : "Procedure",
            minChars : 0,
            extraParams : my.getInputs2
        });
        $("#procMod1").tokenInput("/MCFraudWeb/data/lists/procmod1s", {
            "tokenLimit" : 1,
            preventDuplicates : true,
            placeholder : "Provider Modifier",
            minChars : 0,
            extraParams : my.getInputs2
        });
        $("#procMod2").tokenInput("/MCFraudWeb/data/lists/procmod2s", {
            "tokenLimit" : 1,
            preventDuplicates : true,
            placeholder : "Provider Modifier",
            minChars : 0,
            extraParams : my.getInputs2
        });
        $("#diagPrimary").tokenInput("/MCFraudWeb/data/lists/diagprimaries", {
            "tokenLimit" : 1,
            preventDuplicates : true,
            placeholder : "Diagnosis",
            minChars : 0,
            extraParams : my.getInputs2
        });
        $("#diagSecondary").tokenInput("/MCFraudWeb/data/lists/diagsecondaries", {
            "tokenLimit" : 1,
            preventDuplicates : true,
            placeholder : "Diagnosis",
            minChars : 0,
            extraParams : my.getInputs2
        });
        $("#ndc").tokenInput("/MCFraudWeb/data/lists/ndcs", {
            "tokenLimit" : 1,
            preventDuplicates : true,
            placeholder : "NDC",
            minChars : 0,
            extraParams : my.getInputs2
        });
        $("#hicl").tokenInput("/MCFraudWeb/data/lists/hicls", {
            "tokenLimit" : 1,
            preventDuplicates : true,
            placeholder : "HICL",
            minChars : 0,
            extraParams : my.getInputs2
        });
        $("#claimId").tokenInput("/MCFraudWeb/data/lists/claims", {
            "tokenLimit" : 1,
            preventDuplicates : true,
            placeholder : "CCN",
            minChars : 0,
            extraParams : my.getInputs2
        });
        $("#claimType").tokenInput("/MCFraudWeb/data/lists/claimtypes", {
            "tokenLimit" : 1,
            preventDuplicates : true,
            placeholder : "Claim Type",
            minChars : 0,
            extraParams : my.getInputs2
        });
        $("#beneId").tokenInput("/MCFraudWeb/data/lists/benes", {
            "tokenLimit" : 1,
            preventDuplicates : true,
            placeholder : "Beneficiary ID",
            minChars : 0,
            extraParams : my.getInputs2
        });

    };
    my.initTable = function (data) {
        if (lala) {
            lala.fnDestroy(true);
        }
        $('#simple-table-container').html('<table id="simple-table"></table>');
        lala = $('#simple-table').dataTable({
            "aoColumns" : [ {
                "sTitle" : "CCN",
                "mData" : "ccn",
                "sClass" : "actionable",
                "mRender" : function (data, type, full) {
                    return '<div class="actionable content" onclick="window.open(\'/MCFraudWeb/app/claims/' + full.encCcn + '/' + full.line + '?dataSet=' + GENERAL.state.dataSet + '\');">' + data + '<i class="icon-hand-right"></i></div>';
                }
            }, {
                "sTitle" : "Rend Provider Num",
                "mData" : "rendProvNum",
                "mRender" : function (data, type, full) {
                    return '<div class="actionable content" onclick="window.open(\'/MCFraudWeb/app/providers/' + full.encRendProvNum + '?dataSet=' + GENERAL.state.dataSet + '\');">' + data + '<i class="icon-hand-right"></i></div>';
                }
            }, {
                "sTitle" : "Rend Provider Name",
                "mData" : "rendProvName",
                "mRender" : function (data, type, full) {
                    return '<div class="actionable content" onclick="window.open(\'/MCFraudWeb/app/providers/' + full.encRendProvNum + '?dataSet=' + GENERAL.state.dataSet + '\');">' + data + '<i class="icon-hand-right"></i></div>';
                }
            }, {
                "sTitle" : "Prov Type Code",
                "mData" : "rendProvTypeCode",
                "mRender" : function (data, type, full) {
                    return '<div class="content">' + data + '</div>';
                }
            }, {
                "sTitle" : "Prov Type Desc",
                "mData" : "rendProvTypeDesc",
                "mRender" : function (data, type, full) {
                    return '<div class="content">' + data + '</div>';
                }
            }, {
                "sTitle" : "Proc Code",
                "mData" : "procCode",
                "mRender" : function (data, type, full) {
                    return '<div class="content">' + data + '</div>';
                }
            }, {
                "sTitle" : "Proc Desc",
                "mData" : "procDesc",
                "mRender" : function (data, type, full) {
                    return '<div class="content">' + data + '</div>';
                }
            }, {
                "sTitle" : "DOS",
                "mData" : "dos",
                "sDefaultContent" : "",
                "mRender" : function (data, type, full) {
                    return '<div class="content">' + data + '</div>';
                }
            }, {
                "sTitle" : "Recipient",
                "mData" : "recId",
                "sDefaultContent" : "",
                "mRender" : function (data, type, full) {
                    return '<div class="content actionable" onclick="BENE.loadBeneDetails(' + full.encRecipId + ');">' + full.recId + '</div>';
                }
            }, {
                "sTitle" : "Reimb Amt",
                "mData" : "reimbAmt",
                "sClass" : "moneyFormat",
                "mRender" : function (data, type, full) {
                    if (type === 'display') {
                        return '<div class="content">' + accounting.formatMoney(data) + '</div>';
                    }
                    return data;
                }
            } ],
            "iDisplayLength" : 100,
            "bLengthChange" : false,
            "aaData" : data,
            "bFilter" : false
        });
        $('.actionable').popover({
            "trigger" : "hover",
            "stay" : "true"
        });
    };
    my.initDuplicateTable = function (data) {
        if (lala) {
            lala.fnDestroy(true);
        }
        $('#simple-table-container').html('<table id="simple-table"></table>');
        lala = $('#simple-table').dataTable({
            "aoColumns" : [ {
                "sTitle" : "Sample CCN",
                "mData" : "ccn",
                "sClass" : "actionable",
                "bSortable" : false,
                "sDefaultContent" : "",
                "mRender" : function (data, type, full) {
                    if (type === 'display') {
                        return '<div class="actionable content" onclick="window.open(\'/MCFraudWeb/app/claims/' + full.encCcn + '/' + full.line + '?dataSet=' + GENERAL.state.dataSet + '\');">' + data + '<i class="icon-hand-right"></i></div>';
                    }
                    return (data);
                }
            }, {
                "sTitle" : "Proc Code",
                "mData" : "procCode",
                "bSortable" : false,
                "sDefaultContent" : "",
                "mRender" : function (data, type, full) {
                    if (type === 'display') {
                        return '<div class="content">' + data + '</div>';
                    }
                    return (data);
                }
            }, {
                "sTitle" : "Proc Desc",
                "mData" : "procDesc",
                "bSortable" : false,
                "sDefaultContent" : "",
                "mRender" : function (data, type, full) {
                    if (type === 'display') {
                        return '<div class="content">' + data + '</div>';
                    }
                    return (data);
                }
            }, {
                "sTitle" : "DOS",
                "mData" : "dos",
                "bSortable" : false,
                "sDefaultContent" : "",
                "mRender" : function (data, type, full) {
                    if (type === 'display') {
                        return '<div class="content">' + data + '</div>';
                    }
                    return (data);
                }
            }, {
                "sTitle" : "Recipient",
                "mData" : "recId",
                "bSortable" : false,
                "sDefaultContent" : "",
                "mRender" : function (data, type, full) {
                    if (type === 'display') {
                        return '<div class="content actionable" onclick="BENE.loadBeneDetails(' + full.encRecipId + ');">' + full.recId + '</div>';
                    }
                    return (data);
                }
            }, {
                "sTitle" : "Reimb Amt",
                "mData" : "reimbAmt",
                "bSortable" : false,
                "sDefaultContent" : "",
                "sClass" : "moneyFormat",
                "mRender" : function (data, type, full) {
                    if (type === 'display') {
                        return '<div class="content">' + accounting.formatMoney(data) + '</div>';
                    }
                    return data;
                }
            }, {
                "sTitle" : "Clams",
                "mData" : "claims",
                "bSortable" : false,
                "sDefaultContent" : "",
                "mRender" : function (data, type, full) {
                    if (type === 'display') {
                        return '<div class="content actionable">' + data + '<i class="icon-hand-right"></i></div>';
                    }
                    return data;
                }
            } ],
            "iDisplayLength" : 100,
            "bLengthChange" : false,
            "sDefaultContent" : "",
            "aaData" : data,
            "bFilter" : false,
            "bSort" : false
        });
        $('.actionable').popover({
            "trigger" : "hover",
            "stay" : "true"
        });
    };
    my.search = function () {
        var httpReq, args;
        args = my.getInputs();
        httpReq = $.getJSON('/MCFraudWeb/data/claims/new?' + args);
        httpReq.success(function (data) {
            my.initTable(data);
        });
        httpReq.error(function (xhr, status, error) {
            alert("AJAX Error.\r\nStatus:" + status + xhr + "\r\nError:" + error);
        });
        return httpReq;
    };
    my.duplicates = function () {
        var httpReq, args;
        args = getInputs();
        httpReq = $.getJSON('/MCFraudWeb/data/claims/find?' + args + '&duplicates=true');
        httpReq.success(function (data) {
            my.initDuplicateTable(data);
        });
        httpReq.error(function (xhr, status, error) {
            alert("AJAX Error.\r\nStatus:" + status + xhr + "\r\nError:" + error);
        });
        return httpReq;
    };
    return my;
}($));
