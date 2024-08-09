$(function () {
    $(mapDivId).css("background-color", "#f4f3ed");
});

$(window).resize(function () {
    setTimeout(function () {
        if (this._Map2D) {
            this._Map2D.map.zoomOut();
            this._Map2D.map.zoomIn();
            this._Map2D.map.updateSize();
        }
    }, 200);
});

var mapDivId;

(function () {
    farmmapObj = {
        _Map2D: null,
        rootUri: "https://agis.epis.or.kr/ASD/",
        systemInquiry: "070-4324-7745",
        mapMinZoom: 0,
        mapMaxZoom: 15,
        srsPrj: "EPSG:5179",
        serverUrl: "https://agis.epis.or.kr/geoserver/",
        tmsProxyUrl: "https://agis.epis.or.kr/ASD/" + "imageProxy/getImage.do",
        airLayerUrl: "http://210.117.198.120:8081/o2map/services",
        airLayerApiKey: "04trYP9_xwLAfALjwZ-B8g",
        thisCenterCoord: [982592.29115681, 1832832.4221686],
        oResolutions: [
            2088.96, 1044.48, 522.24, 261.12, 130.56, 65.28, 32.64, 16.32, 8.16, 4.08, 2.04, 1.02, 0.51, 0.255,
        ],
        eMaxExtent: new OpenLayers.Bounds(-200000.0, -28024123.62, 31824123.62, 4000000.0),
        epsgList: {
            "EPSG:3857":
                "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs",
            "EPSG:900913":
                "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs",
            "EPSG:4326": "+proj=longlat +datum=WGS84 +no_defs",
            "EPSG:5179":
                "+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
            "EPSG:5185":
                "+proj=tmerc +lat_0=38 +lon_0=125 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
            "EPSG:5186":
                "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
            "EPSG:5187":
                "+proj=tmerc +lat_0=38 +lon_0=129 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
            "EPSG:5188":
                "+proj=tmerc +lat_0=38 +lon_0=131 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
        },
        farmmapLayerInfo: { 2023: "farm_map_api" },
        basicInfomapLayerInfo: { 2023: "trit_info_bass_map_n_2023" },
        mapTypeArray: ["farmmap", "base"],
        mapTypeNameArray: ["t_clfm_frm_map", "trit_info_bass_map_n"],
        systemLayer: ["AIR", "selection"],
        typeNames: [],
        layerNames: [],

        init: function (mapDiv) {
            mapDivId = mapDiv;
            this.createMap(this.srsPrj, mapDivId);
            // this.addBaseLayer(this._Map2D, "AIR");
            this.initDefaultLayers();
            this.initDefaultEvents(this._Map2D);
            this.initMapControls();
            this.initEpsgList();
            return this._Map2D;
        },

        getMapOptions: function () {
            var mapOptions = {
                center: this.thisCenterCoord,
                zoom: 10,
                maxExtent: this.eMaxExtent,
                tileSize: new OpenLayers.Size(256, 256),
                projection: this.srsPrj,
                units: "m",
                maxResolution: this.oResolutions[0],
                numZoomLevels: 14,
                allOverlays: true,
                transitionEffect: "resize",
                controls: [],
            };

            return mapOptions;
        },

        createMap: function (crs) {
            var mapOptions;
            var mapProjection = new OpenLayers.Projection(this.srsPrj);
            mapOptions = this.getMapOptions();
            this._Map2D = new OpenLayers.Map(mapDivId, mapOptions);
        },

        initDefaultLayers: function () {
            var highlightLayer = new OpenLayers.Layer.Vector("selection", {
                displayInLayerSwitcher: false,
                isBaseLayer: false,
                rendererOptions: {
                    zIndexing: true,
                },
            });
            highlightLayer.styleMap = this.selectionVectorStyleMap();
            this._Map2D.addLayer(highlightLayer);
            highlightLayer.setZIndex(1000);
        },

        initDefaultEvents: function (mapObj) {
            this._Map2D.events.register("changelayer", mapObj, function () {
                farmmapObj.clearMap(mapObj);
            });
            this._Map2D.events.register("preaddlayer", mapObj, function () {
                farmmapObj.clearMap(mapObj);
            });
            this._Map2D.events.register("preremovelayer", mapObj, function () {
                farmmapObj.clearMap(mapObj);
            });
        },

        initMapControls: function () {
            var controls = [
                new OpenLayers.Control.Navigation({
                    id: "pan",
                    zoomWheelEnabled: true,
                    defaultDblClick: function (event) {
                        farmmapObj.searchFarmmapData(event);
                        return;
                    },
                }),
                new OpenLayers.Control.ZoomBox({
                    id: "zoomIn",
                    draw: function () {
                        this.handler = new OpenLayers.Handler.Box(
                            this,
                            {
                                done: this.zoomBox,
                            },
                            {
                                keyMask: this.keyMask,
                            }
                        );
                    },
                }),
                new OpenLayers.Control.ZoomBox({
                    id: "zoomOut",
                    out: true,
                    draw: function () {
                        this.handler = new OpenLayers.Handler.Box(
                            this,
                            {
                                done: this.zoomBox,
                            },
                            {
                                keyMask: this.keyMask,
                            }
                        );
                    },
                }),
            ];
            this._Map2D.addControls(controls);
            this.activeControl("pan");
        },

        activeControl: function (controls) {
            for (var i in this._Map2D.controls) {
                if (this._Map2D.controls[i].active) {
                    this._Map2D.controls[i].deactivate();
                }
            }

            if (Array.isArray(controls)) {
                if (controls.length && controls.length > 0) {
                    for (var i = 0; i < controls.length; i++) {
                        this._Map2D.getControl(controls[i]).activate();
                    }
                }
            } else if (typeof controls == "string") {
                for (var i in this._Map2D.controls) {
                    if (this._Map2D.controls[i].id == controls) {
                        this._Map2D.controls[i].activate();
                        break;
                    }
                }
            } else {
                this._Map2D.getControl(controls).activate();
            }
        },

        initEpsgList: function () {
            var keys = Object.keys(this.epsgList);
            for (var i = 0; i < keys.length; i++) {
                var source = keys[i];
                OpenLayers.Projection.addTransform(source, this.srsPrj, this.transCoordFunc);
                OpenLayers.Projection.addTransform(this.srsPrj, source, this.transCoordFunc);
            }
        },

        transCoordFunc: function (p) {
            var transCoord = {};
            if (
                p.source != null &&
                p.target != null &&
                Object.keys(farmmapObj.epsgList).includes(p.source) &&
                Object.keys(farmmapObj.epsgList).includes(p.target)
            ) {
                transCoord = proj4(farmmapObj.epsgList[p.source], farmmapObj.epsgList[p.target], [p.x, p.y]);
                transCoord.x = transCoord[0];
                transCoord.y = transCoord[1];
            } else {
                transCoord.x = p.x;
                transCoord.y = p.y;
            }
            return transCoord;
        },

        transformXY: function (epsg, options) {
            var returnXY = new OpenLayers.LonLat(options.x, options.y).transform(
                new OpenLayers.Projection(epsg),
                new OpenLayers.Projection(this.srsPrj)
            );
            return returnXY;
        },

        selectionVectorStyleMap: function () {
            var vector_style_map = new OpenLayers.StyleMap({
                default: new OpenLayers.Style({
                    fillColor: "#FFFFFF",
                    fillOpacity: 0.01,
                    strokeColor: "#fc2b2b",
                    strokeWidth: 5,
                    strokeOpacity: 1,
                    graphicZIndex: 3000,
                }),
            });
            return vector_style_map;
        },

        clearMap: function (mapObj) {
            if (farmmapUtils.isEmpty(mapObj)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                var vList = this.getObject("vectorLayers", "vectorLayers", mapObj);
                for (var i = 0; i < vList.length; i++) {
                    var v = vList[i];
                    v.destroyFeatures();
                }
            }
        },

        addBaseLayer: function (element, mtype) {
            var attributionText =
                '<div class="attribution">' +
                "<span>본 시스템에서 제공하는 정보는 법적인 효력이 없으며, 참고용으로만 활용하시기 바랍니다</span><br/>" +
                '<img style="width:96px; height:16px; margin: 8px 0 0 3px; float:right;" src="' +
                this.rootUri +
                'images/map/logo_ngis.png" alt="국토지리정보원">' +
                '<img style="width:172px; height:26px; float:right;" src="' +
                this.rootUri +
                'images/map/logo_epis.png" alt="농림수산식품교육문화정보원">' +
                '<img style="width:112px; height:29px; margin: 2px 3px 0 0; float:right;" src="' +
                this.rootUri +
                'images/map/logo_mafra.png" alt="농림축산식품부">' +
                "<br/><br/><span>시스템 문의 : " +
                this.systemInquiry +
                "</span>" +
                "</div>";

            var ortLayer = new OpenLayers.Layer.XYZ(mtype, "", {
                url: this.tmsProxyUrl,
                layer: mtype,
                matrixSet: "NGIS_AIR",
                format: "image/jpg",
                style: "_null",
                transitionEffect: "resize",
                serverResolutions: this.oResolutions,
                opacity: 1,
                tileSize: new OpenLayers.Size(256, 256),
                tileOrigin: new OpenLayers.LonLat(-200000.0, 4000000.0),
                maxExtent: new OpenLayers.Bounds(-200000.0, 997738.4107, 2802261.589, 4000000.0),
                transparent: true,
                buffer: 1,
                getURL: function (bounds) {
                    var res = this.getServerResolution();
                    var x = Math.round((bounds.left - this.maxExtent.left) / (res * this.tileSize.w));
                    var y = Math.round((this.maxExtent.top - bounds.top) / (res * this.tileSize.h));
                    var z = this.getServerZoom() + 5;
<<<<<<< HEAD
                    console.log("year :", year);
=======
>>>>>>> dev
                    year = year || "AIRPHOTO_2022";
                    if (x >= 0 && y >= 0) {
                        return (
                            this.options.url +
                            "?service=" +
                            "WMTS" +
                            "&request=" +
                            "GetTile" +
                            "&version=" +
                            "1.0.0" +
                            "&layer=" +
                            year +
                            // "AIRPHOTO_2022" +
                            "&style=" +
                            this.style +
                            "&format=" +
                            this.format +
                            "&tilematrixset=" +
                            this.matrixSet +
                            "&tilematrix=" +
                            z +
                            "&tilerow=" +
                            y +
                            "&tilecol=" +
                            x +
                            "&apiKey=" +
                            farmmapObj.airLayerApiKey +
                            "&baseUrl=" +
                            farmmapObj.airLayerUrl
                        );
                    } else {
                        return "../images/nodata.png";
                    }
                },
                isBaseLayer: true,
                isFirstLayer: true,
                visibility: true,
                attribution: attributionText,
            });

            element.addLayer(ortLayer);
            element.setBaseLayer(ortLayer);
            element.addControl(new OpenLayers.Control.Attribution());
            return false;
        },

        addControl: function (cName, mapObj) {
            if (farmmapUtils.isEmpty(mapObj) || farmmapUtils.isEmpty(cName)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                var c = this.getObject("control", cName, mapObj);
                if (c == null) {
                    if (cName == "scaleLine") {
                        mapObj.addControl(new OpenLayers.Control.ScaleLine({ id: "scaleLine", bottomOutUnits: "" }));
                    } else if (cName == "panZoomBar") {
                        mapObj.addControl(new OpenLayers.Control.PanZoomBar({ id: "panZoomBar" }));
                    } else if (cName == "panZoom") {
                        mapObj.addControl(new OpenLayers.Control.PanZoom({ id: "panZoom" }));
                    } else if (cName == "navigation") {
                        mapObj.addControl(new OpenLayers.Control.Navigation({ id: "navigation" }));
                    } else if (cName == "layerSwitcher") {
                        mapObj.addControl(new OpenLayers.Control.LayerSwitcher({ id: "layerSwitcher" }));
                    }
                }
            }
        },

        removeControl: function (cName, mapObj) {
            if (farmmapUtils.isEmpty(mapObj) || farmmapUtils.isEmpty(cName)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                var c = this.getObject("control", cName, mapObj);
                if (c != null) {
                    mapObj.removeControl(c);
                }
            }
        },

        activateControl: function (cName, mapObj) {
            if (farmmapUtils.isEmpty(mapObj) || farmmapUtils.isEmpty(cName)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                var c = this.getObject("control", cName, mapObj);
                if (c != null) {
                    c.activate();
                    return c.active;
                }
            }
        },

        deactivateControl: function (cName, mapObj) {
            if (farmmapUtils.isEmpty(mapObj) || farmmapUtils.isEmpty(cName)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                var c = this.getObject("control", cName, mapObj);
                if (c != null) {
                    c.deactivate();
                    return c.active;
                }
            }
        },

        addEvent: function (eName, mapObj, func) {
            if (farmmapUtils.isEmpty(eName) || farmmapUtils.isEmpty(mapObj) || farmmapUtils.isEmpty(func)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                mapObj.events.register(eName, mapObj, func);
            }
        },

        removeEvent: function (eName, mapObj) {
            if (farmmapUtils.isEmpty(eName) || farmmapUtils.isEmpty(mapObj)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                var e = this.getObject("event", eName, mapObj);
                if (e != null && e.length > 0) {
                    mapObj.events.remove(eName);
                }
            }
        },

        getObject: function (objType, objName, mapObj) {
            if (farmmapUtils.isEmpty(objType) || farmmapUtils.isEmpty(objName) || farmmapUtils.isEmpty(mapObj)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                var returnObj;
                if (objType == "layer") {
                    returnObj = mapObj.getLayersByName(objName)[0];
                } else if (objType == "event") {
                    returnObj = mapObj.events.listeners[objName];
                } else if (objType == "control") {
                    returnObj = mapObj.getControl(objName);
                } else if (objType == "marker") {
                    var markerLayers = mapObj.getLayersByClass("OpenLayers.Layer.Markers");
                    for (var i = 0; i < markerLayers.length; i++) {
                        var markers = markerLayers[i].markers;
                        for (var j = 0; j < markers.length; j++) {
                            var marker = markers[j];
                            if (marker.id == objName) {
                                returnObj = marker;
                                break;
                            }
                        }
                    }
                } else if (objType == "vector") {
                    var vectorLayers = mapObj.getLayersByClass("OpenLayers.Layer.Vector");
                    for (var i = 0; i < vectorLayers.length; i++) {
                        var vectors = vectorLayers[i].features;
                        for (var j = 0; j < vectors.length; j++) {
                            var vector = vectors[j];
                            if (vector.id == objName) {
                                returnObj = vector;
                                break;
                            }
                        }
                    }
                } else if (objType == "wmsLayers") {
                    return mapObj.getLayersByClass("OpenLayers.Layer.WMS");
                } else if (objType == "markerLayers") {
                    return mapObj.getLayersByClass("OpenLayers.Layer.Markers");
                } else if (objType == "vectorLayers") {
                    return mapObj.getLayersByClass("OpenLayers.Layer.Vector");
                }
                return returnObj;
            }
        },

        redrawLayers: function (type, mapObj) {
            var markerLayers = this.getObject(type, type, mapObj);
            for (var i = 0; i < markerLayers.length; i++) {
                markerLayers[i].redraw();
            }
        },

        searchBjdFromPoint: function (pt) {
            if (farmmapUtils.isEmpty(pt)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                var params = {};
                params.x = Number(pt.lon);
                params.y = Number(pt.lat);

                $.ajax({
                    url: this.rootUri + "farmmapApi/getAddrFromCoordAjax.do",
                    dataType: "jsonp",
                    jsonpCallback: "searchJusoWhenMovedMapCallback",
                    async: false,
                    type: "GET",
                    cache: false,
                    data: params,
                    error: function (XMLHttpRequest, textStatus, errorThrown) {},
                });
            }
        },

        addWMSLayer: function (layerName, wmsUrl, layerObj, mapObj) {
            if (
                farmmapUtils.isEmpty(layerName) ||
                farmmapUtils.isEmpty(wmsUrl) ||
                farmmapUtils.isEmpty(layerObj) ||
                farmmapUtils.isEmpty(mapObj)
            ) {
                alert("입력파라미터를 확인하세요.");
            } else {
                if (layerObj.layers == null || layerObj.styles == null) {
                    alert("레이어 파라미터를 확인하세요.");
                } else {
                    var version = farmmapUtils.isEmpty(layerObj.version) ? "1.3.0" : layerObj.version;
                    var format = farmmapUtils.isEmpty(layerObj.format) ? "image/png" : layerObj.format;
                    var crs = farmmapUtils.isEmpty(layerObj.crs) ? this.srsPrj : layerObj.crs;
                    var width = farmmapUtils.isEmpty(layerObj.width) ? 512 : layerObj.width;
                    var height = farmmapUtils.isEmpty(layerObj.height) ? 512 : layerObj.height;

                    var layerOption = {
                        service: "WMS",
                        version: version,
                        request: "GetMap",
                        format: format,
                        transparent: "true",
                        crs: crs,
                        width: width,
                        height: height,
                        exceptions: "text/xml",
                        bgcolor: 0xffff00,
                    };

                    var wmsOptions = Object.assign(layerOption, layerObj);

                    var l = this.getObject("layer", layerName, mapObj);
                    if (farmmapUtils.isEmpty(l)) {
                        var wmsLayer = new OpenLayers.Layer.WMS(layerName, wmsUrl, wmsOptions, {
                            singleTile: false,
                            tileSize: new OpenLayers.Size(width, height),
                        });
                        wmsLayer.setZIndex(5);
                        mapObj.addLayer(wmsLayer);
                    }
                }
            }
        },

        addMarkerLayer: function (layerName, mapObj) {
            if (farmmapUtils.isEmpty(layerName) || farmmapUtils.isEmpty(mapObj)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                var l = this.getObject("layer", layerName, mapObj);
                if (farmmapUtils.isEmpty(l)) {
                    var markerLayer = new OpenLayers.Layer.Markers(layerName);
                    mapObj.addLayer(markerLayer);
                    markerLayer.setZIndex(1500);
                }
            }
        },

        addVectorLayer: function (layerName, layerObj, mapObj) {
            if (farmmapUtils.isEmpty(layerName) || farmmapUtils.isEmpty(mapObj)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                var l = this.getObject("layer", layerName, mapObj);
                if (farmmapUtils.isEmpty(l)) {
                    var styleMap;
                    var events;
                    var vLayer;

                    if (!farmmapUtils.isEmpty(layerObj)) {
                        if (
                            !farmmapUtils.isEmpty(layerObj.defaultStyle) &&
                            !farmmapUtils.isEmpty(layerObj.selectStyle)
                        ) {
                            styleMap = new OpenLayers.StyleMap({
                                default: layerObj.defaultStyle,
                                select: layerObj.selectStyle,
                            });
                        } else if (
                            !farmmapUtils.isEmpty(layerObj.defaultStyle) &&
                            farmmapUtils.isEmpty(layerObj.selectStyle)
                        ) {
                            styleMap = new OpenLayers.StyleMap({
                                default: layerObj.defaultStyle,
                            });
                        } else if (
                            farmmapUtils.isEmpty(layerObj.defaultStyle) &&
                            !farmmapUtils.isEmpty(layerObj.selectStyle)
                        ) {
                            styleMap = new OpenLayers.StyleMap({
                                select: layerObj.selectStyle,
                            });
                        }
                    }

                    if (!farmmapUtils.isEmpty(styleMap)) {
                        vLayer = new OpenLayers.Layer.Vector(layerName, {
                            styleMap: styleMap,
                        });
                    } else {
                        vLayer = new OpenLayers.Layer.Vector(layerName);
                    }

                    if (!farmmapUtils.isEmpty(layerObj)) {
                        var hover = !farmmapUtils.isEmpty(layerObj.hover) ? layerObj.hover : false;
                        var multiple = !farmmapUtils.isEmpty(layerObj.multiple) ? layerObj.multiple : false;
                        var toggle = !farmmapUtils.isEmpty(layerObj.toggle) ? layerObj.toggle : false;

                        if (!farmmapUtils.isEmpty(layerObj.onSelect) && !farmmapUtils.isEmpty(layerObj.onUnselect)) {
                            events = new OpenLayers.Control.SelectFeature(vLayer, {
                                id: layerName + "_SelectFeature",
                                hover: hover,
                                multiple: multiple,
                                toggle: toggle,
                                onSelect: layerObj.onSelect,
                                onUnselect: layerObj.onUnselect,
                            });
                        } else if (
                            !farmmapUtils.isEmpty(layerObj.onSelect) &&
                            farmmapUtils.isEmpty(layerObj.onUnselect)
                        ) {
                            events = new OpenLayers.Control.SelectFeature(vLayer, {
                                id: layerName + "_SelectFeature",
                                hover: hover,
                                onSelect: layerObj.onSelect,
                            });
                        } else if (
                            farmmapUtils.isEmpty(layerObj.onSelect) &&
                            !farmmapUtils.isEmpty(layerObj.onUnselect)
                        ) {
                            events = new OpenLayers.Control.SelectFeature(vLayer, {
                                id: layerName + "_SelectFeature",
                                hover: hover,
                                onUnselect: layerObj.onUnselect,
                            });
                        }
                    }

                    mapObj.addLayer(vLayer);

                    if (!farmmapUtils.isEmpty(events)) {
                        mapObj.addControl(events);
                        events.activate();
                    }

                    vLayer.setZIndex(1500);
                }
            }
        },

        activateVectorLayerEvent: function (layerName, mapObj) {
            if (farmmapUtils.isEmpty(layerName) || farmmapUtils.isEmpty(mapObj)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                var c = this.getObject("control", layerName + "_SelectFeature", mapObj);
                if (!farmmapUtils.isEmpty(c)) {
                    return this.activateControl(layerName + "_SelectFeature", mapObj);
                } else {
                    return "None";
                }
            }
        },

        deactivateVectorLayerEvent: function (layerName, mapObj) {
            if (farmmapUtils.isEmpty(layerName) || farmmapUtils.isEmpty(mapObj)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                var c = this.getObject("control", layerName + "_SelectFeature", mapObj);
                if (!farmmapUtils.isEmpty(c)) {
                    return this.deactivateControl(layerName + "_SelectFeature", mapObj);
                } else {
                    return "None";
                }
            }
        },

        hideLayer: function (layerName, mapObj) {
            if (farmmapUtils.isEmpty(layerName) || farmmapUtils.isEmpty(mapObj)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                var l = this.getObject("layer", layerName, mapObj);
                if (!farmmapUtils.isEmpty(l)) {
                    l.setVisibility(false);
                }
            }
        },

        showLayer: function (layerName, mapObj) {
            if (farmmapUtils.isEmpty(layerName) || farmmapUtils.isEmpty(mapObj)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                var l = this.getObject("layer", layerName, mapObj);
                if (!farmmapUtils.isEmpty(l)) {
                    l.setVisibility(true);
                }
            }
        },

        getLayerNameList: function (mapObj) {
            if (farmmapUtils.isEmpty(mapObj)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                var layerNames = new Array();
                var layerList = mapObj.layers;
                for (var i = 0; i < layerList.length; i++) {
                    var layerName = layerList[i].name;
                    if (!this.systemLayer.includes(layerName)) {
                        layerNames.push(layerName);
                    }
                }
                return layerNames;
            }
        },

        removeLayer: function (layerName, mapObj) {
            if (farmmapUtils.isEmpty(mapObj) || farmmapUtils.isEmpty(layerName)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                var l = this.getObject("layer", layerName, mapObj);
                if (!farmmapUtils.isEmpty(l)) {
                    var c = this.getObject("control", layerName + "_SelectFeature", mapObj);
                    if (!farmmapUtils.isEmpty(c)) {
                        this.removeControl(layerName + "_SelectFeature", mapObj);
                    }

                    if (!farmmapUtils.isEmpty(this.typeNames) && !farmmapUtils.isEmpty(l.params)) {
                        var typeName = l.params.LAYERS.split(":")[1];
                        if (this.typeNames.includes(typeName)) {
                            var idx = this.typeNames.indexOf(typeName);
                            this.typeNames.splice(idx, 1);
                            this.layerNames.splice(idx, 1);
                        }
                    }
                    mapObj.removeLayer(l);
                }
            }
        },

        addFarmmapLayer: function (layerName, mapObj, year) {
            if (farmmapUtils.isEmpty(layerName) || farmmapUtils.isEmpty(mapObj)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                if (farmmapUtils.isEmpty(year)) {
                    year = Object.keys(this.farmmapLayerInfo).sort().reverse()[0];
                }
                var l = this.getObject("layer", layerName, mapObj);
                if (farmmapUtils.isEmpty(l)) {
                    var tableId = this.farmmapLayerInfo[year];
                    if (farmmapUtils.isEmpty(tableId)) {
                        alert("연도를 확인하세요.");
                    } else {
                        var styleNm = ["t_clfm_frm_map_sy_api"];
                        this.addFarmmapWMSLayer(layerName, tableId, styleNm, mapObj);
                        this.sortFarmmapLayer(mapObj);
                    }
                }
            }
        },

        addWhiteFarmmapLayer: function (layerName, mapObj, year) {
            if (farmmapUtils.isEmpty(layerName) || farmmapUtils.isEmpty(mapObj)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                if (farmmapUtils.isEmpty(year)) {
                    year = Object.keys(this.farmmapLayerInfo).sort().reverse()[0];
                }
                var l = this.getObject("layer", layerName, mapObj);
                if (farmmapUtils.isEmpty(l)) {
                    var tableId = this.farmmapLayerInfo[year];
                    if (farmmapUtils.isEmpty(tableId)) {
                        alert("연도를 확인하세요.");
                    } else {
                        var styleNm = ["t_clfm_frm_map_white_sy_api"];
                        this.addFarmmapWMSLayer(layerName, tableId, styleNm, mapObj);
                        this.sortFarmmapLayer(mapObj);
                    }
                }
            }
        },

        addBasicInfomapLayer: function (layerName, mapObj, year) {
            if (farmmapUtils.isEmpty(layerName) || farmmapUtils.isEmpty(mapObj)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                if (farmmapUtils.isEmpty(year)) {
                    year = Object.keys(this.basicInfomapLayerInfo).sort().reverse()[0];
                }
                var l = this.getObject("layer", layerName, mapObj);
                if (farmmapUtils.isEmpty(l)) {
                    var tableId = this.basicInfomapLayerInfo[year];
                    if (farmmapUtils.isEmpty(tableId)) {
                        alert("연도를 확인하세요.");
                    } else {
                        var styleNm = ["trit_info_bass_map_sy_api"];
                        this.addFarmmapWMSLayer(layerName, tableId, styleNm, mapObj);
                    }
                }
            }
        },

        sortFarmmapLayer: function (mapObj) {
            for (var i = 0; i < this.typeNames.length; i++) {
                if (this.typeNames[i] == "t_clfm_frm_map") {
                    var layer = this.getObject("layer", this.layerNames[i], mapObj);
                    layer.setZIndex(370);
                } else if (this.typeNames[i] == "trit_info_bass_map_n") {
                    var layer = this.getObject("layer", this.layerNames[i], mapObj);
                    layer.setZIndex(371);
                }
            }
        },

        addFarmmapWMSLayer: function (layerName, tableId, styleNm, mapObj) {
            var wmsLayer = new OpenLayers.Layer.WMS(
                layerName,
                this.serverUrl + "farmmap/" + "wms?",
                {
                    service: "WMS",
                    version: "1.1.1",
                    request: "GetMap",
                    layers: "farmmap:" + tableId,
                    styles: styleNm,
                    format: "image/png",
                    transparent: "true",
                    crs: this.srsPrj,
                },
                {
                    singleTile: false,
                    tileSize: new OpenLayers.Size(512, 512),
                }
            );

            wmsLayer.visibility = true;
            wmsLayer.buffer = 1.0;
            wmsLayer.isBaseLayer = false;

            mapObj.addLayer(wmsLayer);

            this.typeNames.push(tableId);
            this.layerNames.push(layerName);
        },

        addSearchFarmmapDataEvent: function (mapObj, callback, apiVersion) {
            if (farmmapUtils.isEmpty(mapObj) || farmmapUtils.isEmpty(callback)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                var _version = "v1";
                if (!farmmapUtils.isEmpty(apiVersion)) {
                    if (apiVersion != "v1" && apiVersion != "v2" && apiVersion != "V1" && apiVersion != "V2") {
                        alert("apiVersion 파라미터를 확인하세요.");
                        return false;
                    } else {
                        _version = apiVersion;
                    }
                }
                this.apiVersion = _version;
                mapObj.searchFarmmapDataCallbackFunc = callback;
                this.clearMap(mapObj);
            }
        },

        removeSearchFarmmapDataEvent: function (mapObj) {
            mapObj.searchFarmmapDataCallbackFunc = null;
            this.clearMap(mapObj);
        },

        searchFarmmapData: function (e) {
            var mapObj = e.object;
            if (!farmmapUtils.isEmpty(mapObj.searchFarmmapDataCallbackFunc)) {
                this.clearMap(mapObj);

                if (!farmmapUtils.isEmpty(this.typeNames)) {
                    var lonlat = mapObj.getLonLatFromViewPortPx(e.xy);

                    var params = {};
                    params.x = Number(lonlat.lon);
                    params.y = Number(lonlat.lat);
                    params.apiVersion = this.apiVersion;

                    var pTypeNames = [];
                    var pLayerNames = [];
                    var typeName;
                    for (var i = 0; i < this.layerNames.length; i++) {
                        var l = this.getObject("layer", this.layerNames[i], mapObj);
                        if (!farmmapUtils.isEmpty(l)) {
                            if (l.getVisibility()) {
                                pTypeNames.push(this.typeNames[i]);
                                pLayerNames.push(this.layerNames[i]);
                            }
                        }
                    }

                    if (pTypeNames.length > 0) {
                        params.typeNames = pTypeNames.toString();
                        params.layerNames = encodeURIComponent(pLayerNames.toString());

                        $.ajax({
                            url: this.rootUri + "farmmapApi/getFarmmapData.do",
                            dataType: "jsonp",
                            jsonpCallback: mapObj.searchFarmmapDataCallbackFunc,
                            async: false,
                            type: "GET",
                            cache: false,
                            data: params,
                            success: function (data) {
                                for (var i = 0; i < Object.keys(data).length; i++) {
                                    if (!farmmapUtils.isEmpty(data[Object.keys(data)[i]])) {
                                        var idx = farmmapObj.layerNames.indexOf(Object.keys(data)[i]);
                                        cTypeName = farmmapObj.typeNames[idx];
                                        if (cTypeName.indexOf("_v2_") != -1) {
                                            typeName = farmmapObj.typeNames[idx];
                                        } else if (
                                            cTypeName.indexOf("_bass_") != -1 &&
                                            farmmapUtils.isEmpty(typeName)
                                        ) {
                                            typeName = farmmapObj.typeNames[idx];
                                        } else if (
                                            (cTypeName.indexOf("farm_") != -1 || cTypeName.indexOf("t_clfm_") != -1) &&
                                            farmmapUtils.isEmpty(typeName)
                                        ) {
                                            typeName = farmmapObj.typeNames[idx];
                                        }
                                    }
                                }

                                var l = farmmapObj.getObject("layer", "selection", mapObj);
                                if (!farmmapUtils.isEmpty(l)) {
                                    l.removeAllFeatures();
                                }

                                var position = mapObj.getLonLatFromViewPortPx(e.xy);
                                var tolerance = 20;
                                var filterType = OpenLayers.Filter.Spatial.INTERSECTS;
                                var strategy = new OpenLayers.Strategy.BBOX();
                                var filter = new OpenLayers.Filter.Spatial({
                                    type: filterType,
                                    value: new OpenLayers.Geometry.Point(position.lon, position.lat),
                                    distance: tolerance,
                                    distanceUtil: "m",
                                });
                                typeName = farmmapUtils.isEmpty(typeName) ? pTypeNames[0] : typeName;
                                var wfsProtocol = farmmapObj.getWFSProtocol(typeName);

                                wfsProtocol.read({
                                    filter: filter,
                                    extractAttributes: true,
                                    format: new OpenLayers.Format.GeoJSON(),
                                    scope: strategy,
                                    callback: function (resp) {
                                        if (resp.features.length > 0) {
                                            var selection = farmmapObj.getObject("layer", "selection", mapObj);
                                            selection.addFeatures(resp.features);

                                            var idxs = [];
                                            for (var i = 0; i < mapObj.layers.length; i++) {
                                                var lyr = mapObj.layers[i];
                                                if (lyr.name == "selection") {
                                                    continue;
                                                }
                                                idxs.push(Number(lyr.getZIndex()));
                                            }

                                            idxs.sort();
                                            selection.setZIndex(idxs[idxs.length - 1] + 1);
                                        }
                                    },
                                });
                            },
                            error: function (XMLHttpRequest, textStatus, errorThrown) {},
                        });
                    }
                }
            }
        },

        getWFSProtocol: function (layerId) {
            var protocol = null;

            if (typeof layerId == "string") {
                protocol = new OpenLayers.Protocol.WFS({
                    version: "1.1.0",
                    url: this.serverUrl + "farmmap/" + "wms?",
                    featureType: layerId,
                    featurePrefix: "farmmap",
                    geometryName: "shape",
                    srsName: this.srsPrj,
                });
            } else {
                var options = {
                    geometryName: "shape",
                };
                protocol = new OpenLayers.Protocol.WFS.fromWMSLayer(layerId, options);
            }
            return protocol;
        },

        getLegendImage: function (mapType, option) {
            var url = "";
            var idx = this.mapTypeArray.indexOf(mapType);
            if (idx != -1) {
                var year = Object.keys(this.farmmapLayerInfo).sort().reverse()[0];
                var layerName = farmmapObj.farmmapLayerInfo[year];
                if (!farmmapUtils.isEmpty(option) && (option == "H" || option == "h")) {
                    url =
                        this.serverUrl +
                        "farmmap/" +
                        "wms?Service=WMS&REQUEST=GetLegendGraphic&VERSION=1.0.0&STYLE=t_clfm_frm_map_sy_api&FORMAT=image/png&LAYER=farmmap:" +
                        layerName +
                        "&legend_options=layout:horizontal";
                } else {
                    url =
                        this.serverUrl +
                        "farmmap/" +
                        "wms?Service=WMS&REQUEST=GetLegendGraphic&VERSION=1.0.0&STYLE=t_clfm_frm_map_sy_api&FORMAT=image/png&LAYER=farmmap:" +
                        layerName;
                }
            }
            return url;
        },

        addMarker: function (layerName, markerOptions, mapObj) {
            if (
                farmmapUtils.isEmpty(layerName) ||
                farmmapUtils.isEmpty(markerOptions) ||
                farmmapUtils.isEmpty(mapObj) ||
                farmmapUtils.isEmpty(markerOptions.id) ||
                farmmapUtils.isEmpty(markerOptions.iconSizeWidth) ||
                farmmapUtils.isEmpty(markerOptions.iconSizeHeight) ||
                farmmapUtils.isEmpty(markerOptions.iconUrl) ||
                farmmapUtils.isEmpty(markerOptions.x) ||
                farmmapUtils.isEmpty(markerOptions.y)
            ) {
                alert("입력파라미터를 확인하세요.");
            } else {
                var m = this.getObject("marker", markerOptions.id, mapObj);
                if (!farmmapUtils.isEmpty(m)) {
                    //alert("이미 사용중인 마커 아이디 입니다. (" + markerOptions.id + ")");
                } else {
                    if (
                        !farmmapUtils.isPositiveNum(markerOptions.iconSizeWidth) ||
                        !farmmapUtils.isPositiveNum(markerOptions.iconSizeHeight)
                    ) {
                        alert("마커 아이콘 크기는 양수로 입력해주세요.");
                        return false;
                    }
                    if (!farmmapUtils.isNum(markerOptions.x) || !farmmapUtils.isNum(markerOptions.y)) {
                        alert("마커 아이콘 좌표를 확인해주세요.");
                        return false;
                    }

                    var l = this.getObject("layer", layerName, mapObj);
                    if (!farmmapUtils.isEmpty(l)) {
                        var size = new OpenLayers.Size(markerOptions.iconSizeWidth, markerOptions.iconSizeHeight);
                        var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
                        var icon = new OpenLayers.Icon(markerOptions.iconUrl, size, offset);
                        var epsg = !farmmapUtils.isEmpty(markerOptions.epsg) ? markerOptions.epsg : this.srsPrj;
                        var transXY = this.transformXY(epsg, markerOptions);
                        var lonlat = new OpenLayers.LonLat(transXY.lon, transXY.lat);
                        var marker = new OpenLayers.Marker(lonlat, icon);

                        marker.id = markerOptions.id;
                        marker.isVisible = true;

                        if (!farmmapUtils.isEmpty(markerOptions.attributes)) {
                            marker.attributes = markerOptions.attributes;
                        }

                        if (!farmmapUtils.isEmpty(markerOptions.data)) {
                            marker.data = markerOptions.data;
                        }

                        if (!farmmapUtils.isEmpty(markerOptions.clickFunc)) {
                            marker.events.register("mousedown", marker, markerOptions.clickFunc);
                        }

                        if (!farmmapUtils.isEmpty(markerOptions.opacity)) {
                            marker.setOpacity(markerOptions.opacity);
                        }

                        l.addMarker(marker);
                    } else {
                        alert("레이어명을 확인하세요.");
                    }
                }
            }
        },

        isMarkerVisible: function (marker) {
            if (farmmapUtils.isEmpty(marker)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                return marker.isVisible;
            }
        },

        showMarker: function (marker) {
            if (farmmapUtils.isEmpty(marker)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                marker.isVisible = true;
                marker.display(true);
            }
        },

        hideMarker: function (marker) {
            if (farmmapUtils.isEmpty(marker)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                marker.isVisible = false;
                marker.display(false);
            }
        },

        showAllMarker: function (layerName, mapObj) {
            if (farmmapUtils.isEmpty(layerName) || farmmapUtils.isEmpty(mapObj)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                var l = this.getObject("layer", layerName, mapObj);
                if (!farmmapUtils.isEmpty(l)) {
                    var markers = l.markers;
                    for (var i = 0; i < markers.length; i++) {
                        var marker = markers[i];
                        this.showMarker(marker);
                    }
                }
            }
        },

        hideAllMarker: function (layerName, mapObj) {
            if (farmmapUtils.isEmpty(layerName) || farmmapUtils.isEmpty(mapObj)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                var l = this.getObject("layer", layerName, mapObj);
                if (!farmmapUtils.isEmpty(l)) {
                    var markers = l.markers;
                    for (var i = 0; i < markers.length; i++) {
                        var marker = markers[i];
                        this.hideMarker(marker);
                    }
                }
            }
        },

        setMarkerSize: function (marker, markerOptions) {
            if (
                farmmapUtils.isEmpty(marker) ||
                farmmapUtils.isEmpty(markerOptions) ||
                farmmapUtils.isEmpty(markerOptions.iconSizeWidth) ||
                farmmapUtils.isEmpty(markerOptions.iconSizeHeight)
            ) {
                alert("입력파라미터를 확인하세요.");
            } else {
                if (
                    !farmmapUtils.isPositiveNum(markerOptions.iconSizeWidth) ||
                    !farmmapUtils.isPositiveNum(markerOptions.iconSizeHeight)
                ) {
                    alert("마커 아이콘 크기는 양수로 입력해주세요.");
                } else {
                    var size = new OpenLayers.Size(markerOptions.iconSizeWidth, markerOptions.iconSizeHeight);
                    var offset = new OpenLayers.Pixel(-(size.w / 2), -size.h);
                    marker.icon.setSize(size);
                    marker.icon.offset = offset;
                    this.redrawLayers("markerLayers", marker.map);
                }
            }
        },

        setMarkerLocation: function (marker, markerOptions) {
            if (
                farmmapUtils.isEmpty(marker) ||
                farmmapUtils.isEmpty(markerOptions) ||
                farmmapUtils.isEmpty(markerOptions.x) ||
                farmmapUtils.isEmpty(markerOptions.y)
            ) {
                alert("입력파라미터를 확인하세요.");
            } else {
                if (!farmmapUtils.isNum(markerOptions.x) || !farmmapUtils.isNum(markerOptions.y)) {
                    alert("마커 아이콘 좌표를 확인하세요.");
                } else {
                    var epsg = !farmmapUtils.isEmpty(markerOptions.epsg) ? markerOptions.epsg : this.srsPrj;
                    var transXY = this.transformXY(epsg, markerOptions);
                    marker.lonlat = new OpenLayers.LonLat(transXY.lon, transXY.lat);
                    this.redrawLayers("markerLayers", marker.map);
                }
            }
        },

        setMarkerIcon: function (marker, markerOptions) {
            if (
                farmmapUtils.isEmpty(marker) ||
                farmmapUtils.isEmpty(markerOptions) ||
                farmmapUtils.isEmpty(markerOptions.iconUrl)
            ) {
                alert("입력파라미터를 확인하세요.");
            } else {
                marker.setUrl(markerOptions.iconUrl);

                if (!farmmapUtils.isEmpty(markerOptions.opacity) && farmmapUtils.isNum(markerOptions.opacity)) {
                    marker.setOpacity(markerOptions.opacity);
                }
            }
        },

        setMarkerData: function (marker, markerOptions) {
            if (farmmapUtils.isEmpty(marker) || farmmapUtils.isEmpty(markerOptions)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                marker.data = markerOptions;
            }
        },

        removeMarker: function (marker) {
            if (farmmapUtils.isEmpty(marker)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                var markerLayers = this.getObject("markerLayers", "markerLayers", marker.map);
                for (var i = 0; i < markerLayers.length; i++) {
                    var markers = markerLayers[i].markers;
                    for (var j = 0; j < markers.length; j++) {
                        var m = markers[j];
                        if (m === marker) {
                            markerLayers[i].removeMarker(marker);
                        }
                    }
                }
            }
        },

        getVectorStyleObj: function (vectorStyleOptions) {
            var styleObj = new OpenLayers.Style();
            var pointRadius;
            var externalGraphic;
            var graphicName;
            var graphicOpacity;
            var graphicWidth;
            var graphicHeight;
            var graphicXOffset;
            var graphicYOffset;
            var strokeWidth;
            var strokeColor;
            var strokeOpacity;
            var fillColor;
            var fillOpacity;
            var strokeDashstyle;
            var strokeLinecap;
            var fontColor;
            var fontSize;
            var fontStyle;
            var fontWeight;
            var label;
            var labelXOffset;
            var labelYOffset;
            var labelOutlineColor;
            var labelOutlineWidth;
            var labelOutlineOpacity;

            var graphicNameArray = ["circle", "square", "star", "x", "cross", "triangle"];
            var strokeDashstyleArray = ["dot", "dash", "dashdot", "longdash", "longdashdot", "solid"];
            var strokeLinecapArray = ["butt", "round", "square"];

            pointRadius =
                !farmmapUtils.isEmpty(vectorStyleOptions.pointRadius) &&
                farmmapUtils.isPositiveNum(vectorStyleOptions.pointRadius)
                    ? vectorStyleOptions.pointRadius
                    : 10;
            externalGraphic = !farmmapUtils.isEmpty(vectorStyleOptions.externalGraphic)
                ? vectorStyleOptions.externalGraphic
                : null;
            graphicName =
                !farmmapUtils.isEmpty(vectorStyleOptions.graphicName) &&
                graphicNameArray.includes(vectorStyleOptions.graphicName)
                    ? vectorStyleOptions.graphicName
                    : null;
            graphicOpacity =
                !farmmapUtils.isEmpty(vectorStyleOptions.graphicOpacity) &&
                farmmapUtils.isNum(vectorStyleOptions.graphicOpacity) &&
                Number(vectorStyleOptions.graphicOpacity) > 0 &&
                Number(vectorStyleOptions.graphicOpacity) <= 1
                    ? vectorStyleOptions.graphicOpacity
                    : null;
            graphicWidth =
                !farmmapUtils.isEmpty(vectorStyleOptions.graphicWidth) &&
                farmmapUtils.isPositiveNum(vectorStyleOptions.graphicWidth)
                    ? vectorStyleOptions.graphicWidth
                    : null;
            graphicHeight =
                !farmmapUtils.isEmpty(vectorStyleOptions.graphicHeight) &&
                farmmapUtils.isPositiveNum(vectorStyleOptions.graphicHeight)
                    ? vectorStyleOptions.graphicHeight
                    : null;
            graphicXOffset =
                !farmmapUtils.isEmpty(vectorStyleOptions.graphicXOffset) &&
                farmmapUtils.isNum(vectorStyleOptions.graphicXOffset)
                    ? vectorStyleOptions.graphicXOffset
                    : null;
            graphicYOffset =
                !farmmapUtils.isEmpty(vectorStyleOptions.graphicYOffset) &&
                farmmapUtils.isNum(vectorStyleOptions.graphicYOffset)
                    ? vectorStyleOptions.graphicYOffset
                    : null;
            strokeWidth =
                !farmmapUtils.isEmpty(vectorStyleOptions.strokeWidth) &&
                farmmapUtils.isNum(vectorStyleOptions.strokeWidth)
                    ? vectorStyleOptions.strokeWidth
                    : null;
            strokeColor = !farmmapUtils.isEmpty(vectorStyleOptions.strokeColor) ? vectorStyleOptions.strokeColor : null;
            strokeOpacity =
                !farmmapUtils.isEmpty(vectorStyleOptions.strokeOpacity) &&
                farmmapUtils.isNum(vectorStyleOptions.strokeOpacity) &&
                Number(vectorStyleOptions.strokeOpacity) > 0 &&
                Number(vectorStyleOptions.strokeOpacity) <= 1
                    ? vectorStyleOptions.strokeOpacity
                    : null;
            fillColor = !farmmapUtils.isEmpty(vectorStyleOptions.fillColor) ? vectorStyleOptions.fillColor : null;
            fillOpacity =
                !farmmapUtils.isEmpty(vectorStyleOptions.fillOpacity) &&
                farmmapUtils.isNum(vectorStyleOptions.fillOpacity) &&
                Number(vectorStyleOptions.fillOpacity) > 0 &&
                Number(vectorStyleOptions.fillOpacity) <= 1
                    ? vectorStyleOptions.fillOpacity
                    : null;
            strokeDashstyle =
                !farmmapUtils.isEmpty(vectorStyleOptions.strokeDashstyle) &&
                strokeDashstyleArray.includes(vectorStyleOptions.strokeDashstyle)
                    ? vectorStyleOptions.strokeDashstyle
                    : null;
            strokeLinecap =
                !farmmapUtils.isEmpty(vectorStyleOptions.strokeLinecap) &&
                strokeLinecapArray.includes(vectorStyleOptions.strokeLinecap)
                    ? vectorStyleOptions.strokeLinecap
                    : null;
            fontColor = !farmmapUtils.isEmpty(vectorStyleOptions.fontColor) ? vectorStyleOptions.fontColor : null;
            fontSize = !farmmapUtils.isEmpty(vectorStyleOptions.fontSize) ? vectorStyleOptions.fontSize : null;
            fontStyle = !farmmapUtils.isEmpty(vectorStyleOptions.fontStyle) ? vectorStyleOptions.fontStyle : null;
            fontWeight = !farmmapUtils.isEmpty(vectorStyleOptions.fontWeight) ? vectorStyleOptions.fontWeight : null;
            label = !farmmapUtils.isEmpty(vectorStyleOptions.label) ? vectorStyleOptions.label : null;
            labelXOffset =
                !farmmapUtils.isEmpty(vectorStyleOptions.labelXOffset) &&
                farmmapUtils.isNum(vectorStyleOptions.labelXOffset)
                    ? vectorStyleOptions.labelXOffset
                    : null;
            labelYOffset =
                !farmmapUtils.isEmpty(vectorStyleOptions.labelYOffset) &&
                farmmapUtils.isNum(vectorStyleOptions.labelYOffset)
                    ? vectorStyleOptions.labelYOffset
                    : null;
            labelOutlineColor = !farmmapUtils.isEmpty(vectorStyleOptions.labelOutlineColor)
                ? vectorStyleOptions.labelOutlineColor
                : null;
            labelOutlineWidth =
                !farmmapUtils.isEmpty(vectorStyleOptions.labelOutlineWidth) &&
                farmmapUtils.isNum(vectorStyleOptions.labelOutlineWidth)
                    ? vectorStyleOptions.labelOutlineWidth
                    : null;
            labelOutlineOpacity =
                !farmmapUtils.isEmpty(vectorStyleOptions.labelOutlineOpacity) &&
                farmmapUtils.isNum(vectorStyleOptions.labelOutlineOpacity) &&
                Number(vectorStyleOptions.labelOutlineOpacity) > 0 &&
                Number(vectorStyleOptions.labelOutlineOpacity) <= 1
                    ? vectorStyleOptions.labelOutlineOpacity
                    : null;

            var eleArray = [
                pointRadius,
                externalGraphic,
                graphicName,
                graphicOpacity,
                graphicWidth,
                graphicHeight,
                graphicXOffset,
                graphicYOffset,
                strokeWidth,
                strokeColor,
                strokeOpacity,
                fillColor,
                fillOpacity,
                strokeDashstyle,
                strokeLinecap,
                fontColor,
                fontSize,
                fontStyle,
                fontWeight,
                label,
                labelXOffset,
                labelYOffset,
                labelOutlineColor,
                labelOutlineWidth,
                labelOutlineOpacity,
            ];
            var eleStrArray = [
                "pointRadius",
                "externalGraphic",
                "graphicName",
                "graphicOpacity",
                "graphicWidth",
                "graphicHeight",
                "graphicXOffset",
                "graphicYOffset",
                "strokeWidth",
                "strokeColor",
                "strokeOpacity",
                "fillColor",
                "fillOpacity",
                "strokeDashstyle",
                "strokeLinecap",
                "fontColor",
                "fontSize",
                "fontStyle",
                "fontWeight",
                "label",
                "labelXOffset",
                "labelYOffset",
                "labelOutlineColor",
                "labelOutlineWidth",
                "labelOutlineOpacity",
            ];
            for (var i = 0; i < eleArray.length; i++) {
                var ele = eleArray[i];
                if (!farmmapUtils.isEmpty(ele)) {
                    styleObj[eleStrArray[i]] = ele;
                }
            }

            return styleObj;
        },

        addVector: function (layerName, vectorOptions, mapObj) {
            if (
                farmmapUtils.isEmpty(layerName) ||
                farmmapUtils.isEmpty(vectorOptions) ||
                farmmapUtils.isEmpty(mapObj) ||
                farmmapUtils.isEmpty(vectorOptions.id) ||
                farmmapUtils.isEmpty(vectorOptions.type)
            ) {
                alert("입력파라미터를 확인하세요.");
            } else {
                var v = this.getObject("vector", vectorOptions.id, mapObj);
                if (!farmmapUtils.isEmpty(v)) {
                    //alert("이미 사용중인 vector 아이디 입니다. (" + vectorOptions.id + ")");
                } else {
                    var l = this.getObject("layer", layerName, mapObj);
                    if (!farmmapUtils.isEmpty(l)) {
                        var vec;

                        var isStyle = false;
                        var styleObj;
                        if (!farmmapUtils.isEmpty(vectorOptions.style)) {
                            isStyle = true;
                            styleObj = this.getVectorStyleObj(vectorOptions.style);
                        }

                        if (vectorOptions.type.toUpperCase() == "POINT") {
                            if (
                                farmmapUtils.isEmpty(vectorOptions.x) ||
                                farmmapUtils.isEmpty(vectorOptions.y) ||
                                !farmmapUtils.isNum(vectorOptions.x) ||
                                !farmmapUtils.isNum(vectorOptions.y)
                            ) {
                                alert("POINT 좌표를 확인해주세요.");
                                return false;
                            }
                            var epsg = !farmmapUtils.isEmpty(vectorOptions.epsg) ? vectorOptions.epsg : this.srsPrj;
                            var transXY = this.transformXY(epsg, vectorOptions);
                            vec = new OpenLayers.Feature.Vector(
                                new OpenLayers.Geometry.Point(transXY.lon, transXY.lat)
                            );
                        } else if (vectorOptions.type.toUpperCase() == "LINESTRING") {
                            if (!farmmapUtils.isEmpty(vectorOptions.xy)) {
                                var points = [];
                                for (var i = 0; i < vectorOptions.xy.length; i++) {
                                    var xy = vectorOptions.xy[i];
                                    if (
                                        farmmapUtils.isEmpty(xy.x) ||
                                        farmmapUtils.isEmpty(xy.y) ||
                                        !farmmapUtils.isNum(xy.x) ||
                                        !farmmapUtils.isNum(xy.y)
                                    ) {
                                        alert("POINT 좌표를 확인해주세요.");
                                        return false;
                                    }
                                    var epsg = !farmmapUtils.isEmpty(vectorOptions.epsg)
                                        ? vectorOptions.epsg
                                        : this.srsPrj;
                                    var transXY = this.transformXY(epsg, xy);
                                    var point = new OpenLayers.Geometry.Point(transXY.lon, transXY.lat);
                                    points.push(point);
                                }
                                vec = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.LineString(points));
                            } else {
                                alert("vector option xy 파라미터를 확인해주세요.");
                                return false;
                            }
                        } else if (vectorOptions.type.toUpperCase() == "POLYGON") {
                            if (!farmmapUtils.isEmpty(vectorOptions.xy)) {
                                var points = [];
                                for (var i = 0; i < vectorOptions.xy.length; i++) {
                                    var xy = vectorOptions.xy[i];
                                    if (
                                        farmmapUtils.isEmpty(xy.x) ||
                                        farmmapUtils.isEmpty(xy.y) ||
                                        !farmmapUtils.isNum(xy.x) ||
                                        !farmmapUtils.isNum(xy.y)
                                    ) {
                                        alert("POINT 좌표를 확인해주세요.");
                                        return false;
                                    }
                                    var epsg = !farmmapUtils.isEmpty(vectorOptions.epsg)
                                        ? vectorOptions.epsg
                                        : this.srsPrj;
                                    var transXY = this.transformXY(epsg, xy);
                                    var point = new OpenLayers.Geometry.Point(transXY.lon, transXY.lat);
                                    points.push(point);
                                }
                                var linearRing = new OpenLayers.Geometry.LinearRing(points);
                                vec = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Polygon([linearRing]));
                            } else {
                                alert("vector option xy 파라미터를 확인해주세요.");
                                return false;
                            }
                        } else if (vectorOptions.type.toUpperCase() == "CIRCLE") {
                            if (
                                farmmapUtils.isEmpty(vectorOptions.x) ||
                                farmmapUtils.isEmpty(vectorOptions.y) ||
                                !farmmapUtils.isNum(vectorOptions.x) ||
                                !farmmapUtils.isNum(vectorOptions.y)
                            ) {
                                alert("POINT 좌표를 확인해주세요.");
                                return false;
                            }
                            if (
                                farmmapUtils.isEmpty(vectorOptions.radius) ||
                                !farmmapUtils.isNum(vectorOptions.radius)
                            ) {
                                alert("반경을 확인해주세요.");
                                return false;
                            }
                            var epsg = !farmmapUtils.isEmpty(vectorOptions.epsg) ? vectorOptions.epsg : this.srsPrj;
                            var transXY = this.transformXY(epsg, vectorOptions);
                            vec = new OpenLayers.Feature.Vector(
                                OpenLayers.Geometry.Polygon.createRegularPolygon(
                                    new OpenLayers.Geometry.Point(transXY.lon, transXY.lat),
                                    vectorOptions.radius,
                                    100,
                                    0
                                )
                            );
                        } else if (vectorOptions.type.toUpperCase() == "REGULAR") {
                            if (
                                farmmapUtils.isEmpty(vectorOptions.x) ||
                                farmmapUtils.isEmpty(vectorOptions.y) ||
                                !farmmapUtils.isNum(vectorOptions.x) ||
                                !farmmapUtils.isNum(vectorOptions.y)
                            ) {
                                alert("POINT 좌표를 확인해주세요.");
                                return false;
                            }
                            if (
                                farmmapUtils.isEmpty(vectorOptions.radius) ||
                                !farmmapUtils.isNum(vectorOptions.radius)
                            ) {
                                alert("반경을 확인해주세요.");
                                return false;
                            }
                            if (
                                farmmapUtils.isEmpty(vectorOptions.sideCnt) ||
                                !farmmapUtils.isNum(vectorOptions.sideCnt)
                            ) {
                                alert("변의 갯수 확인해주세요.");
                                return false;
                            }
                            var epsg = !farmmapUtils.isEmpty(vectorOptions.epsg) ? vectorOptions.epsg : this.srsPrj;
                            var transXY = this.transformXY(epsg, vectorOptions);
                            vec = new OpenLayers.Feature.Vector(
                                OpenLayers.Geometry.Polygon.createRegularPolygon(
                                    new OpenLayers.Geometry.Point(transXY.lon, transXY.lat),
                                    vectorOptions.radius,
                                    vectorOptions.sideCnt,
                                    0
                                )
                            );
                        }

                        if (isStyle) {
                            vec.style = styleObj;
                        }

                        if (!farmmapUtils.isEmpty(vectorOptions.attributes)) {
                            vec.attributes = vectorOptions.attributes;
                        }

                        if (!farmmapUtils.isEmpty(vectorOptions.data)) {
                            vec.data = vectorOptions.data;
                        }

                        vec.id = vectorOptions.id;
                        vec.isVisible = true;

                        l.addFeatures(vec);
                        l.redraw();
                    } else {
                        alert("레이어명을 확인하세요.");
                    }
                }
            }
        },

        setVectorStyle: function (vec, styleOptions) {
            if (farmmapUtils.isEmpty(vec) || farmmapUtils.isEmpty(styleOptions)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                var styleObj = this.getVectorStyleObj(styleOptions);
                vec.style = styleObj;
                vec.layer.redraw();
            }
        },

        setVectorData: function (vec, type, dataOptions) {
            if (farmmapUtils.isEmpty(vec) || farmmapUtils.isEmpty(type) || farmmapUtils.isEmpty(dataOptions)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                if (type.toUpperCase() == "ATTR") {
                    vec.attributes = dataOptions;
                } else if (type.toUpperCase() == "DATA") {
                    vec.data = dataOptions;
                }
                vec.layer.redraw();
            }
        },

        isVectorVisible: function (vec) {
            if (farmmapUtils.isEmpty(vec)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                return vec.isVisible;
            }
        },

        hideVector: function (vec) {
            if (farmmapUtils.isEmpty(vec)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                if (farmmapUtils.isEmpty(vec.style)) {
                    //vec.style =  new OpenLayers.Style({defaultStyle: vec.layer.styleMap.styles.default.defaultStyle});
                    vec.style = this.getVectorStyleObj(vec.layer.styleMap.styles.default.defaultStyle);
                }
                vec.isVisible = false;
                vec.style.display = "none";
                vec.layer.redraw();
            }
        },

        showVector: function (vec) {
            if (farmmapUtils.isEmpty(vec)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                vec.isVisible = true;
                vec.style.display = "";
                vec.layer.redraw();
            }
        },

        showAllVector: function (layerName, mapObj) {
            if (farmmapUtils.isEmpty(layerName) || farmmapUtils.isEmpty(mapObj)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                var l = this.getObject("layer", layerName, mapObj);
                if (!farmmapUtils.isEmpty(l)) {
                    var features = l.features;
                    for (var i = 0; i < features.length; i++) {
                        var feature = features[i];
                        this.showVector(feature);
                    }
                }
            }
        },

        hideAllVector: function (layerName, mapObj) {
            if (farmmapUtils.isEmpty(layerName) || farmmapUtils.isEmpty(mapObj)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                var l = this.getObject("layer", layerName, mapObj);
                if (!farmmapUtils.isEmpty(l)) {
                    var features = l.features;
                    for (var i = 0; i < features.length; i++) {
                        var feature = features[i];
                        this.hideVector(feature);
                    }
                }
            }
        },

        removeVector: function (vec) {
            if (farmmapUtils.isEmpty(vec)) {
                alert("입력파라미터를 확인하세요.");
            } else {
                var layer = vec.layer;
                vec.layer.removeFeatures(vec);
                layer.redraw();
            }
        },
    };

    farmmapUtils = {
        isEmpty: function (value) {
            if (
                value == "" ||
                value == null ||
                value == undefined ||
                (value != null && typeof value == "object" && !Object.keys(value).length)
            ) {
                return true;
            } else {
                return false;
            }
        },

        isPositiveNum: function (num) {
            var isNanNum = isNaN(Number(num));

            if (!isNanNum && Number.isInteger(num) && num > 0) {
                return true;
            } else {
                return false;
            }
        },

        isNum: function (num) {
            var isNanNum = isNaN(Number(num));

            if (!isNanNum) {
                return true;
            } else {
                return false;
            }
        },
    };
})();
