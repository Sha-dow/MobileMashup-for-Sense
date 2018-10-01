var server = {
    config: {
        host: 'localhost',
        prefix: '/',
        port: 4848,
        isSecure: false
    },

    vars: {
        id: 'Consumer Sales.qvf'
    },

    headers: {},

    data: {},

    items: {
        FF01: ['FF01', 'EzEYG', ''],
        DFF01: ['DFF01', 'EzEYG', ''],
        TFF01: ['TFF01', 'EzEYG', ''],
        FB: ['FB', 'CurrentSelections', ''],
        DFB: ['DFB', 'CurrentSelections', ''],
        TFB: ['TFB', 'CurrentSelections', '']
    },

    // Format: DIV | ID | Normal Round | Prefix | Tidy | Tidy Round
    kpi: {
        Monthly: {
            KPI01: ['KPI01', 0, 2, '%', false, 2, ''],
            KPI02: ['KPI02', 1, 0, '$', true, 2, ''],
            KPI03: ['KPI03', 2, 2, '%', false, 2, ''],

            KPI04: ['KPI04', 3, 2, '%', false, 2, ''],
            KPI05: ['KPI05', 4, 0, '', false, 2, 'CPR05'],
            KPI06: ['KPI06', 5, 0, '', false, 2, 'CPR06']
        },
        YTD: {}
    },
    tablekpi: {
        TKPI01_1: ['TKPI01_1', 0, 2, '%', false, 0],
        TKPI02_1: ['TKPI02_1', 1, 0, '$', true, 2],
        TKPI03_1: ['TKPI03_1', 2, 0, '%', false, 0],

        TKPI04_1: ['TKPI04_1', 3, 0, '%', false, 0],
        TKPI05_1: ['TKPI05_1', 4, 2, '', false, 0],
        TKPI07_1: ['TKPI07_1', 5, 0, '', false, 0],
        TKPI06_1: ['TKPI06_1', 6, 0, '%', false, 0],
        TKPI08_1: ['TKPI08_1', 7, 0, '', false, 0]
    },
    detailskpi: {
        Monthly: {
            sales: {
                DKPI01: ['DKPI01', 0, 2, '%', false, 2],
                DKPI02: ['DKPI02', 1, 0, '$', true, 2],
                DKPI03: ['DKPI03', 2, 2, '%', false, 2],
                DKPI04: ['DKPI04', 3, 2, '%', false, 2],
            },
            shipments: {
                DKPI01: ['DKPI01', 4, 0, '', false, 2],
                DKPI02: ['DKPI02', 5, 0, '', false, 2]
            }
        },
        YTD: {}
    },
    // Format: DIV | ID | KPIID | Round | Prefix | Suffix 
    compare: {
        Monthly: {
            CPR05: ['CPR05', 6, 4, 0, '%', 'OnTime:'],
            CPR06: ['CPR06', 7, 5, 0, '', 'Lost:'],
        },
        YTD: {}
        
    },
    detailscompare: {
        Monthly: {
            sales: {},
            shipments: {
                DCPR01: ['DCPR01', 6, 4, 0, '%', 'OnTime:'],
                DCPR02: ['DCPR02', 7, 5, 0, '', 'Lost:'],
            }
        },
        YTD: {}
    },
    selections: {
        timeframe: '',
        measures: '',
        modal: {
            state: '',
            kpi: 0
        },
        previous: {},
        next: {},
        servicemanagers: [],
        supervisors: [],
        period: [],
        SalesRep: ''
    },
    variables: {},
    css: {},
    activecss: {},
    obj: {
        qlik: null,
        app: null
    },
    init: function () {
        require.config({
            baseUrl: (server.config.isSecure ? "https://" : "http://") + server.config.host + (server.config.port ? ":" + server.config.port : "") + server.config.prefix + "resources"
        });
    },
    boot: function () {
        server.init();
        console.log('Successfully connected!');

        require(["qlik"], function (qlik) {
            server.obj.qlik = qlik;
            qlik.setOnError(function (error) {
                alert(error.message);
            });

            server.obj.app = qlik.openApp(server.vars.id, server.config);
            server.events();

            server.selections.timeframe = 'Monthly';

            for (id in server.items) {
                server.placeObject(id);
            }

            server.selectDefaults();

            server.getData(function () {
                server.placeKPIData();
                server.placeTableKPIData();
                server.placeCompareData();
                server.drawModalContent(server.selections.modal.state, server.selections.modal.kpi);
            });

            server.getSalesReps(function () {
                server.placeSalesReps();
            });

            var currentDate = new Date();
            server.placeWelcomeContent('Welcome, Today is ' + currentDate.getDate() + '.' + (currentDate.getMonth() + 1) + '.' + currentDate.getFullYear());
        });
    },
    events: function () {},
    placeWelcomeContent: function(text) {
        var div = document.getElementById('welcome-nav');
        div.innerHTML = text;
    },
    getSalesReps: function (callback) {

        server.obj.app.createCube({
            "qInitialDataFetch": [
		        {
		            "qHeight": 10,
		            "qWidth": 1
		        }
            ],
            "qDimensions": [
                {
                    "qDef": {
                        "qFieldDefs": [
                            "Sales Rep Name"
                        ]
                    },
                    "qNullSuppression": true,
                    "qOtherTotalSpec": {
                        "qOtherMode": "OTHER_OFF",
                        "qSuppressOther": true,
                        "qOtherSortMode": "OTHER_SORT_DESCENDING",
                        "qOtherCounted": {
                            "qv": "5"
                        },
                        "qOtherLimitMode": "OTHER_GE_LIMIT"
                    }
                }
            ],
            "qMeasures": [],
            "qSuppressZero": true,
            "qSuppressMissing": true,
            "qMode": "S",
            "qInterColumnSortOrder": [],
            "qStateName": "$"
        }, function (reply) {
            console.log("Sales Reps fetched!");
            server.data.reps = reply.qHyperCube.qDataPages[0].qMatrix;
            callback(true);
        });
    },
    getData: function (callback) {
        server.obj.app.createCube({
            "qDimensions": [],
            "qMeasures": [
                //Monthly Actual
                {
                    "qDef": {
                        "qDef": '(Sum ([Budget Amount])/Sum ([Actual Amount]))*100'
                    },
                    "qLabel": "Sales vs Budget %",
                    "qLibraryId": null,
                    "qSortBy": {
                        "qSortByState": 0,
                        "qSortByFrequency": 0,
                        "qSortByNumeric": 0,
                        "qSortByAscii": 1,
                        "qSortByLoadOrder": 0,
                        "qSortByExpression": 0,
                        "qExpression": {
                            "qv": " "
                        }
                    }
                },
                {
                    "qDef": {
                        "qDef": 'Sum ([Sales Amount])'
                    },
                    "qLabel": "Sales $",
                    "qLibraryId": null,
                    "qSortBy": {
                        "qSortByState": 0,
                        "qSortByFrequency": 0,
                        "qSortByNumeric": 0,
                        "qSortByAscii": 1,
                        "qSortByLoadOrder": 0,
                        "qSortByExpression": 0,
                        "qExpression": {
                            "qv": " "
                        }
                    }
                },
                {
                    "qDef": {
                        "qDef": '(sum([YTD Sales Amount])-sum([LY YTD Sales Amount])*0.2)/sum([LY YTD Sales Amount])*100'
                    },
                    "qLabel": "TY vs LY Sales",
                    "qLibraryId": null,
                    "qSortBy": {
                        "qSortByState": 0,
                        "qSortByFrequency": 0,
                        "qSortByNumeric": 0,
                        "qSortByAscii": 1,
                        "qSortByLoadOrder": 0,
                        "qSortByExpression": 0,
                        "qExpression": {
                            "qv": " "
                        }
                    }
                },
                {
                    "qDef": {
                        "qDef": 'Sum([Sales Margin Amount])/Sum([Sales Amount])*100'
                    },
                    "qLabel": "Margin %",
                    "qLibraryId": null,
                    "qSortBy": {
                        "qSortByState": 0,
                        "qSortByFrequency": 0,
                        "qSortByNumeric": 0,
                        "qSortByAscii": 1,
                        "qSortByLoadOrder": 0,
                        "qSortByExpression": 0,
                        "qExpression": {
                            "qv": " "
                        }
                    }
                },
                {
                    "qDef": {
                        "qDef": 'count(distinct Shipments)'
                    },
                    "qLabel": "Total Shipments",
                    "qLibraryId": null,
                    "qSortBy": {
                        "qSortByState": 0,
                        "qSortByFrequency": 0,
                        "qSortByNumeric": 0,
                        "qSortByAscii": 1,
                        "qSortByLoadOrder": 0,
                        "qSortByExpression": 0,
                        "qExpression": {
                            "qv": " "
                        }
                    }
                },
                {
                    "qDef": {
                        "qDef": 'Count({$<Cust_New={"1"}>} distinct Customer)'
                    },
                    "qLabel": "New Customer Count",
                    "qLibraryId": null,
                    "qSortBy": {
                        "qSortByState": 0,
                        "qSortByFrequency": 0,
                        "qSortByNumeric": 0,
                        "qSortByAscii": 1,
                        "qSortByLoadOrder": 0,
                        "qSortByExpression": 0,
                        "qExpression": {
                            "qv": " "
                        }
                    }
                },
                //Monthly Plan
                {
                     "qDef": {
                         "qDef": 'count(distinct If([Late Shipment] = 0,Shipments))/Count(Distinct Shipments)*100'
                     },
                     "qLabel": "% of On Time Shipments",
                     "qLibraryId": null,
                     "qSortBy": {
                         "qSortByState": 0,
                         "qSortByFrequency": 0,
                         "qSortByNumeric": 0,
                         "qSortByAscii": 1,
                         "qSortByLoadOrder": 0,
                         "qSortByExpression": 0,
                         "qExpression": {
                             "qv": " "
                         }
                     }
                 },
                 {
                     "qDef": {
                         "qDef": 'Count({$<Cust_Lost={"1"}>} distinct Customer)'
                     },
                     "qLabel": "Lost Customer Count",
                     "qLibraryId": null,
                     "qSortBy": {
                         "qSortByState": 0,
                         "qSortByFrequency": 0,
                         "qSortByNumeric": 0,
                         "qSortByAscii": 1,
                         "qSortByLoadOrder": 0,
                         "qSortByExpression": 0,
                         "qExpression": {
                             "qv": " "
                         }
                     }
                 }
            ],
            qInitialDataFetch: [{
                qTop: 0,
                qLeft: 0,
                qHeight: 1,
                qWidth: 10
            }]
        }, function (reply) {
            console.log("Data fetched!");
            server.data.hq = reply.qHyperCube.qDataPages[0].qMatrix;
            callback(true);
        });
    },
    selectDefaults: function () {
        server.obj.app.clearAll();
    },
    placeSalesReps: function () {
        var names = [];

        for (rep in server.data.reps) {
            names.push(server.data.reps[rep][0].qText);
        }

        var div = document.getElementById('salesrepslist-main');
        var detailsdiv = document.getElementById('salesrepslist-details');
        var tablediv = document.getElementById('salesrepslist-table');

        div.innerHTML = '<li><a onclick="app.clearSalesRepMode();"><span class="glyphicon glyphicon-remove"></span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Clear</a></li>';
        detailsdiv.innerHTML = '<li><a onclick="app.clearSalesRepMode();"><span class="glyphicon glyphicon-remove"></span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Clear</a></li>';
        tablediv.innerHTML = '<li><a onclick="app.clearSalesRepMode();"><span class="glyphicon glyphicon-remove"></span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Clear</a></li>';

        for (i = 0; i < 10; i++) {
            if (names[i] != undefined) {
                div.innerHTML += '<li><a data-toggle="collapse" data-target="#salesreps-main" onclick="app.enableSalesRepMode(\'' + names[i] + '\');"><span class="glyphicon glyphicon-user"></span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + names[i] + '</a></li>';
                detailsdiv.innerHTML += '<li><a data-toggle="collapse" data-target="#salesreps-details" onclick="app.enableSalesRepMode(\'' + names[i] + '\');"><span class="glyphicon glyphicon-user"></span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + names[i] + '</a></li>';
                tablediv.innerHTML += '<li><a data-toggle="collapse" data-target="#salesreps-table" onclick="app.enableSalesRepMode(\'' + names[i] + '\');"><span class="glyphicon glyphicon-user"></span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + names[i] + '</a></li>';
            }
        }
    },
    enableSalesRepMode(name) {
        server.obj.app.field('Sales Rep Name').selectMatch(name);
        server.selections.SalesRep = name;
    },
    clearSalesRepMode() {
        server.obj.app.field('Sales Rep Name').clear();
        server.selections.SalesRep = '';
        console.log('SalesRep Cleared');
    },
    placeKPIData: function () {
        if (server.selections.timeframe == 'Monthly') {
            for (id in server.kpi['Monthly']) {
                var div = document.getElementById(server.kpi['Monthly'][id][0]);

                if (server.kpi['Monthly'][id][4]) {

                    if (parseFloat(server.data.hq[0][server.kpi['Monthly'][id][1]].qText) > 1000000) {
                        div.innerHTML = '<div class="kpi-value">' + format((parseFloat(server.data.hq[0][server.kpi['Monthly'][id][1]].qNum) / 1000000).toFixed(server.kpi['Monthly'][id][5])) + ' M ' + server.kpi['Monthly'][id][3] + '</div>';
                    }

                    else if (parseFloat(server.data.hq[0][server.kpi['Monthly'][id][1]].qText) > 1000) {
                        div.innerHTML = '<div class="kpi-value">' + format((parseFloat(server.data.hq[0][server.kpi['Monthly'][id][1]].qNum) / 1000).toFixed(server.kpi['Monthly'][id][5])) + ' k ' + server.kpi['Monthly'][id][3] + '</div>';
                    }

                    else {
                        div.innerHTML = '<div class="kpi-value">' + format(parseFloat(server.data.hq[0][server.kpi['Monthly'][id][1]].qNum).toFixed(server.kpi['Monthly'][id][2])) + ' ' + server.kpi['Monthly'][id][3] + '</div>';
                    }
                }
                else {
                    div.innerHTML = '<div class="kpi-value">' + format(parseFloat(server.data.hq[0][server.kpi['Monthly'][id][1]].qNum).toFixed(server.kpi['Monthly'][id][2])) + ' ' + server.kpi['Monthly'][id][3] + '</div>';
                }

                div.innerHTML += '<div id="' + server.kpi['Monthly'][id][6] + '" class="graph-kpi-compare"></div>'

                if(server.kpi['Monthly'][id][3] == '%') {
                    var parent = div.parentElement;
                    var stylediv = parent.getElementsByClassName('graph-kpi-topic')[0];
                    
                    if(server.data.hq[0][server.kpi['Monthly'][id][1]].qNum < 90) {
                        $(stylediv).removeClass('neutral');
                        $(stylediv).addClass('negative');
                        $(stylediv).removeClass('positive');
                        $(stylediv).removeClass('orange');
                    }
                    else if(server.data.hq[0][server.kpi['Monthly'][id][1]].qNum < 100) {
                        $(stylediv).removeClass('neutral');
                        $(stylediv).removeClass('negative');
                        $(stylediv).addClass('orange');
                        $(stylediv).removeClass('positive');
                    }
                    else {
                        $(stylediv).removeClass('neutral');
                        $(stylediv).removeClass('negative');
                        $(stylediv).removeClass('orange');
                        $(stylediv).addClass('positive');
                    }
                }
            }
        }
        else if (server.selections.timeframe == 'YTD') {}
        else {
            console.log('Incorrect timeframe!');
        }

        console.log("KPI objects placed!");
    },
    placeTableKPIData: function () {
        for (id in server.tablekpi) {
            var div = document.getElementById(server.tablekpi[id][0]);

            if (server.tablekpi[id][4]) {

                if (parseFloat(server.data.hq[0][server.tablekpi[id][1]].qText) > 1000000) {
                    div.innerHTML = format((parseFloat(server.data.hq[0][server.tablekpi[id][1]].qNum) / 1000000).toFixed(server.tablekpi[id][5])) + ' M ' + server.tablekpi[id][3];
                }

                else if (parseFloat(server.data.hq[0][server.tablekpi[id][1]].qText) > 1000) {
                    div.innerHTML = format((parseFloat(server.data.hq[0][server.tablekpi[id][1]].qNum) / 1000).toFixed(server.tablekpi[id][5])) + ' k ' + server.tablekpi[id][3];
                }

                else {
                    div.innerHTML = format(parseFloat(server.data.hq[0][server.tablekpi[id][1]].qNum).toFixed(server.tablekpi[id][2])) + ' ' + server.tablekpi[id][3];
                }
            }
            else {
                div.innerHTML = format(parseFloat(server.data.hq[0][server.tablekpi[id][1]].qNum).toFixed(server.tablekpi[id][2])) + ' ' + server.tablekpi[id][3];
            }
        }

        console.log("Table KPI objects placed!");
    },
    placeCompareData: function () {
        if (server.selections.timeframe == 'Monthly') {
            for (id in server.compare['Monthly']) {
                var div = document.getElementById(server.compare['Monthly'][id][0]);
                div.innerHTML = server.compare['Monthly'][id][5] + ' ' + parseFloat(server.data.hq[0][server.compare['Monthly'][id][1]].qNum).toFixed(server.compare['Monthly'][id][3]) + ' ' + server.compare['Monthly'][id][4];
                
            }
                
        }
        else if (server.selections.timeframe == 'YTD') {}
        else {
            console.log('Incorrect timeframe!');
        }

        console.log("Compare objects placed!");
    },
    placeDetailsKPIData: function (name) {
        if (server.selections.timeframe == 'Monthly') {
            for (id in server.detailskpi['Monthly'][name]) {
                var div = document.getElementById(server.detailskpi['Monthly'][name][id][0]);

                if (server.detailskpi['Monthly'][name][id][4]) {

                    if (parseFloat(server.data.hq[0][server.detailskpi['Monthly'][name][id][1]].qText) > 1000000) {
                        div.innerHTML = format((parseFloat(server.data.hq[0][server.detailskpi['Monthly'][name][id][1]].qNum) / 1000000).toFixed(server.detailskpi['Monthly'][name][id][5])) + ' M ' + server.detailskpi['Monthly'][name][id][3];
                    }

                    else if (parseFloat(server.data.hq[0][server.detailskpi['Monthly'][name][id][1]].qText) > 1000) {
                        div.innerHTML = format((parseFloat(server.data.hq[0][server.detailskpi['Monthly'][name][id][1]].qNum) / 1000).toFixed(server.detailskpi['Monthly'][name][id][5])) + ' k ' + server.detailskpi['Monthly'][name][id][3];
                    }

                    else {
                        div.innerHTML = format(parseFloat(server.data.hq[0][server.detailskpi['Monthly'][name][id][1]].qNum).toFixed(server.detailskpi['Monthly'][name][id][2])) + ' ' + server.detailskpi['Monthly'][name][id][3];
                    }
                }
                else {
                    div.innerHTML = format(parseFloat(server.data.hq[0][server.detailskpi['Monthly'][name][id][1]].qNum).toFixed(server.detailskpi['Monthly'][name][id][2])) + ' ' + server.detailskpi['Monthly'][name][id][3];
                }


                if(server.detailskpi['Monthly'][name][id][3] == '%' && name == 'sales') {
                    var parent = div.parentElement;
                   
                    if(server.data.hq[0][server.detailskpi['Monthly'][name][id][1]].qNum < 90) {
                        $(parent).removeClass('neutral');
                        $(parent).addClass('negative');
                        $(parent).removeClass('positive');
                        $(parent).removeClass('orange');
                    }
                    else if(server.data.hq[0][server.detailskpi['Monthly'][name][id][1]].qNum < 100) {
                        $(parent).removeClass('neutral');
                        $(parent).removeClass('negative');
                        $(parent).addClass('orange');
                        $(parent).removeClass('positive');
                    }
                    else {
                        $(parent).removeClass('neutral');
                        $(parent).removeClass('negative');
                        $(parent).removeClass('orange');
                        $(parent).addClass('positive');
                    }
                }
            }
        }
        else if (server.selections.timeframe == 'YTD') {}
        else {
            console.log('Unknown timeframe!');
        }

        console.log("Details KPI objects placed!");
    },
    placeDetailsCompareData: function (name) {

        if (server.selections.timeframe == 'Monthly') {
            for (id in server.detailscompare['Monthly'][name]) {

                var div = document.getElementById(server.detailscompare['Monthly'][name][id][0]);
                div.innerHTML = server.detailscompare['Monthly'][name][id][5] + ' ' + parseFloat(server.data.hq[0][server.detailscompare['Monthly'][name][id][1]].qNum).toFixed(server.detailscompare['Monthly'][name][id][3]) + ' ' + server.detailscompare['Monthly'][name][id][4];
                console.log(div);

            }
        }
        else if (server.selections.timeframe == 'YTD') {}
        else {
            console.log('Unknown timeframe!');
        }

        console.log("Details compare objects placed!");
    },
    placeObject: function (id) {
        server.obj.app.getObject(server.items[id][0], server.items[id][1]);
        console.log("Object " + id + " placed!");
    },
    update: function () {
        setTimeout(function () {
            server.obj.qlik.resize();
            console.log("Objects resized!");
        }, 500);
    },
    toggleTableModal: function (operation) {
       
        $('#modal-landscape').modal({
            backdrop: 'static',
            keyboard: false
        })

        if (operation == 'open') {
            $('#modal-landscape').modal('show');
        }
        else if (operation == 'close') {
            $('#modal-landscape').modal('hide');
        }
        else {
            console.log('Unknown Modal operation: ' + operation);
        }
    },
    drawModalContent: function (name, kpi) {

        server.selections.modal.state = name;
        server.selections.modal.kpi = kpi;

        var div = document.getElementById('details-modal-content');

        if (name == 'sales') {

            if (kpi == 1) {
                div.innerHTML = '<h3 class="details-modal-header" id="details-modal-header">Sales Performance</h3><div class="details-modal-left"><div class="details-kpi neutral active" onclick="app.drawModalContent(\'sales\', 1);"><div class="details-kpi-topic">Sales vs Budget %</div><div class="details-kpi-value" id="DKPI01"></div><div class="details-kpi-runrate" id="RR00"></div><div class="details-graph-arrow">→</div></div>'
                           + '<div class="details-kpi neutral" onclick="app.drawModalContent(\'sales\', 3);"><div class="details-kpi-topic">TY vs LY Sales</div><div class="details-kpi-value" id="DKPI03"></div><div class="details-kpi-status" id="DCPR03"></div><div class="details-kpi-runrate" id="RR02"></div><div class="details-graph-arrow">→</div></div>'
                           + '</div><div class="details-modal-right"><div class="details-kpi neutral" onclick="app.drawModalContent(\'sales\', 2);"><div class="details-kpi-topic">Sales $</div><div class="details-kpi-value" id="DKPI02"></div><div class="details-kpi-status" id="DCPR02"></div><div class="details-kpi-runrate" id="RR01"></div><div class="details-graph-arrow">→</div></div>'
                           + '<div class="details-kpi neutral" onclick="app.drawModalContent(\'sales\', 4);"><div class="details-kpi-topic">Margin %</div><div class="details-kpi-value" id="DKPI04"></div><div class="details-kpi-status" id="DCPR04"></div><div class="details-kpi-runrate" id="RR03"></div><div class="details-graph-arrow">→</div></div></div>'
                           + '<h3 class="details-modal-header subheader">Sales vs Budget %</h3>'
                           + '<div class="details-graph" id="DGRH01"></div>'
                           + '<div class="details-graph" id="DGRH02"></div>';

                server.obj.app.getObject('DGRH01', 'WJYuPN');
                server.obj.app.getObject('DGRH02', 'TqwwFf');
            }

            if (kpi == 2) {
                div.innerHTML = '<h3 class="details-modal-header" id="details-modal-header">Sales Performance</h3><div class="details-modal-left"><div class="details-kpi neutral" onclick="app.drawModalContent(\'sales\', 1);"><div class="details-kpi-topic">Sales vs Budget %</div><div class="details-kpi-value" id="DKPI01"></div><div class="details-kpi-runrate" id="RR00"></div><div class="details-graph-arrow">→</div></div>'
                           + '<div class="details-kpi neutral" onclick="app.drawModalContent(\'sales\', 3);"><div class="details-kpi-topic">TY vs LY Sales</div><div class="details-kpi-value" id="DKPI03"></div><div class="details-kpi-status" id="DCPR03"></div><div class="details-kpi-runrate" id="RR02"></div><div class="details-graph-arrow">→</div></div>'
                           + '</div><div class="details-modal-right"><div class="details-kpi neutral active" onclick="app.drawModalContent(\'sales\', 2);"><div class="details-kpi-topic">Sales $</div><div class="details-kpi-value" id="DKPI02"></div><div class="details-kpi-status" id="DCPR02"></div><div class="details-kpi-runrate" id="RR01"></div><div class="details-graph-arrow">→</div></div>'
                           + '<div class="details-kpi neutral" onclick="app.drawModalContent(\'sales\', 4);"><div class="details-kpi-topic">Margin %</div><div class="details-kpi-value" id="DKPI04"></div><div class="details-kpi-status" id="DCPR04"></div><div class="details-kpi-runrate" id="RR03"></div><div class="details-graph-arrow">→</div></div></div>'
                           + '<h3 class="details-modal-header subheader">Sales $</h3>'
                           + '<div class="details-graph" id="DGRH01"></div>'
                           + '<div class="details-graph" id="DGRH02"></div>';

                server.obj.app.getObject('DGRH01', 'PyQXKt');
                server.obj.app.getObject('DGRH02', 'fNGRa');
            }

             if (kpi == 3) {
                div.innerHTML = '<h3 class="details-modal-header" id="details-modal-header">Sales Performance</h3><div class="details-modal-left"><div class="details-kpi neutral" onclick="app.drawModalContent(\'sales\', 1);"><div class="details-kpi-topic">Sales vs Budget %</div><div class="details-kpi-value" id="DKPI01"></div><div class="details-kpi-runrate" id="RR00"></div><div class="details-graph-arrow">→</div></div>'
                           + '<div class="details-kpi neutral active" onclick="app.drawModalContent(\'sales\', 3);"><div class="details-kpi-topic">TY vs LY Sales</div><div class="details-kpi-value" id="DKPI03"></div><div class="details-kpi-status" id="DCPR03"></div><div class="details-kpi-runrate" id="RR02"></div><div class="details-graph-arrow">→</div></div>'
                           + '</div><div class="details-modal-right"><div class="details-kpi neutral" onclick="app.drawModalContent(\'sales\', 2);"><div class="details-kpi-topic">Sales $</div><div class="details-kpi-value" id="DKPI02"></div><div class="details-kpi-status" id="DCPR02"></div><div class="details-kpi-runrate" id="RR01"></div><div class="details-graph-arrow">→</div></div>'
                           + '<div class="details-kpi neutral" onclick="app.drawModalContent(\'sales\', 4);"><div class="details-kpi-topic">Margin %</div><div class="details-kpi-value" id="DKPI04"></div><div class="details-kpi-status" id="DCPR04"></div><div class="details-kpi-runrate" id="RR03"></div><div class="details-graph-arrow">→</div></div></div>'
                           + '<h3 class="details-modal-header subheader">TY vs LY Sales</h3>'
                           + '<div class="details-graph" id="DGRH01"></div>'
                           + '<div class="details-graph" id="DGRH02"></div>';

                server.obj.app.getObject('DGRH01', 'JcJvj');
                server.obj.app.getObject('DGRH02', 'prgzES');
            }

            if (kpi == 4) {
                div.innerHTML = '<h3 class="details-modal-header" id="details-modal-header">Sales Performance</h3><div class="details-modal-left"><div class="details-kpi neutral" onclick="app.drawModalContent(\'sales\', 1);"><div class="details-kpi-topic">Sales vs Budget %</div><div class="details-kpi-value" id="DKPI01"></div><div class="details-kpi-runrate" id="RR00"></div><div class="details-graph-arrow">→</div></div>'
                           + '<div class="details-kpi neutral" onclick="app.drawModalContent(\'sales\', 3);"><div class="details-kpi-topic">TY vs LY Sales</div><div class="details-kpi-value" id="DKPI03"></div><div class="details-kpi-status" id="DCPR03"></div><div class="details-kpi-runrate" id="RR02"></div><div class="details-graph-arrow">→</div></div>'
                           + '</div><div class="details-modal-right"><div class="details-kpi neutral" onclick="app.drawModalContent(\'sales\', 2);"><div class="details-kpi-topic">Sales $</div><div class="details-kpi-value" id="DKPI02"></div><div class="details-kpi-status" id="DCPR02"></div><div class="details-kpi-runrate" id="RR01"></div><div class="details-graph-arrow">→</div></div>'
                           + '<div class="details-kpi neutral active" onclick="app.drawModalContent(\'sales\', 4);"><div class="details-kpi-topic">Margin %</div><div class="details-kpi-value" id="DKPI04"></div><div class="details-kpi-status" id="DCPR04"></div><div class="details-kpi-runrate" id="RR03"></div><div class="details-graph-arrow">→</div></div></div>'
                           + '<h3 class="details-modal-header subheader">Margin %</h3>'
                           + '<div class="details-graph" id="DGRH01"></div>'
                           + '<div class="details-graph" id="DGRH02"></div>';

                server.obj.app.getObject('DGRH01', 'qamd');
                server.obj.app.getObject('DGRH02', 'bsxkrg');
            }

            server.placeDetailsKPIData('sales');
            server.placeDetailsCompareData('sales');
        }
        else if (name == 'shipments') {

            if (kpi == 1) {
                div.innerHTML = '<h3 class="details-modal-header" id="details-modal-header">Orders and Customers</h3><div class="details-modal-left-small"><div class="details-kpi neutral active" onclick="app.drawModalContent(\'shipments\', 1);"><div class="details-kpi-topic">Total Shipments</div><div class="details-kpi-value" id="DKPI01"></div><div class="details-kpi-status" id="DCPR01"></div><div class="details-kpi-runrate" id="RR00"></div><div class="details-graph-arrow">→</div></div>'
                           + '</div><div class="details-modal-right-small"><div class="details-kpi neutral" onclick="app.drawModalContent(\'shipments\', 2);"><div class="details-kpi-topic">New Customers</div><div class="details-kpi-value" id="DKPI02"></div><div class="details-kpi-status" id="DCPR02"></div><div class="details-kpi-runrate" id="RR01"></div><div class="details-graph-arrow">→</div></div></div>'
                           + '<h3 class="details-modal-header subheader">Total Shipments</h3>'
                           + '<div class="details-graph" id="DGRH01"></div>'
                           + '<div class="details-graph" id="DGRH02"></div>';

                server.obj.app.getObject('DGRH01', 'savsPXN');
                server.obj.app.getObject('DGRH02', 'MRmuW');
            }

            if (kpi == 2) {
                div.innerHTML = '<h3 class="details-modal-header" id="details-modal-header">Orders and Customers</h3><div class="details-modal-left-small"><div class="details-kpi neutral" onclick="app.drawModalContent(\'shipments\', 1);"><div class="details-kpi-topic">Total Shipments</div><div class="details-kpi-value" id="DKPI01"></div><div class="details-kpi-status" id="DCPR01"></div><div class="details-kpi-runrate" id="RR00"></div><div class="details-graph-arrow">→</div></div>'
                           + '</div><div class="details-modal-right-small"><div class="details-kpi neutral active" onclick="app.drawModalContent(\'shipments\', 2);"><div class="details-kpi-topic">New Customers</div><div class="details-kpi-value" id="DKPI02"></div><div class="details-kpi-status" id="DCPR02"></div><div class="details-kpi-runrate" id="RR01"></div><div class="details-graph-arrow">→</div></div></div>'
                           + '<h3 class="details-modal-header subheader">New Customers</h3>'
                           + '<div class="details-graph" id="DGRH01"></div>'
                           + '<div class="details-graph-table phone-hidden" id="DGRH02"></div>';

                server.obj.app.getObject('DGRH01', 'pyQPxfg');
                server.obj.app.getObject('DGRH02', 'gUJWPF');
            }

            server.placeDetailsKPIData('shipments');
            server.placeDetailsCompareData('shipments');
        }
    },
    openDetailsModal: function (name, kpi) {
       
        $('#modal-details').modal({
            backdrop: 'static',
            keyboard: false
        })

        server.drawModalContent(name, kpi);

        $('#modal-details').modal('show');
        server.update();
    },
    closeDetailsModal: function () {
        $('#modal-details').modal('hide');
    },
    selectPeriod: function(period) {
        
        var YTDdiv = document.getElementById('YTD');
        var YTDmodaldiv = document.getElementById('YTD_modal');
        var MTDdiv = document.getElementById('monthly');
        var MTDmodaldiv = document.getElementById('monthly_modal');

        if (period == 'YTD') {
            $(MTDdiv).removeClass('active');
            $(MTDmodaldiv).removeClass('active');

            $(YTDdiv).addClass('active');
            $(YTDmodaldiv).addClass('active');

            server.selections.timeframe = 'YTD';
        }
        else if (period == 'Monthly') {
            $(YTDdiv).removeClass('active');
            $(YTDmodaldiv).removeClass('active');

            $(MTDdiv).addClass('active');
            $(MTDmodaldiv).addClass('active');

            server.selections.timeframe = 'Monthly';
        }

        server.placeKPIData();
        server.placeCompareData();
        server.drawModalContent(server.selections.modal.state, server.selections.modal.kpi);
    },
    clearSelections: function () {
        server.obj.app.clearAll();
        server.selections.SalesRep = '';
        console.log("Selections cleared!");
        server.selectDefaults();
        server.update();
    },
    selectNext: function () {
        server.obj.app.forward();
        console.log("Next selection state retrieved!");
        server.update();
    },
    selectPrevious: function () {
        server.obj.app.back();
        console.log("Previous selection state retrieved!");
        server.update();
    }
};

app = server;
app.boot();




function format(num) {
    var n = num.toString(), p = n.indexOf('.');
    return n.replace(/\d(?=(?:\d{3})+(?:\.|$))/g, function ($0, i) {
        return p < 0 || i < p ? ($0 + '&nbsp;') : $0;
    });
}