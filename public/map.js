const apiKey = "Fj6bWPPoqYIcDAna3Bce";
const domain = "http://127.0.0.1:5500";
var map;
var map2;
var map3;
var map4;
var mapBounds = new OpenLayers.Bounds(-20037508.34, -20037508.34, 20037508.34, 20037508.34);
var mapMinZoom = 7;
var mapMaxZoom = 20;
var xyString;
var reqUrl;
var mtype = "AIR";

//영역 레이어 생성
function makeLayer(year) {
    var layer = new OpenLayers.Layer.XYZ(mtype, "", {
        url: farmmapObj.tmsProxyUrl,
        layer: mtype,
        matrixSet: "NGIS_AIR",
        format: "image/jpg",
        style: "_null",
        transitionEffect: "resize",
        serverResolutions: farmmapObj.oResolutions,
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
                    `AIRPHOTO_${year}` +
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
    });
    return layer;
}

//맵 생성
async function init(year = "2022", pnu = "3611031024201550000") {
    //팜맵 객체 생성
    if (!map) {
        map = farmmapObj.init("mapDiv1");
        map2 = farmmapObj.init("mapDiv2");
        map3 = farmmapObj.init("mapDiv3");
        map4 = farmmapObj.init("mapDiv4");
    }
    reqUrl = farmmapObj.rootUri;

    //레이어 생성
    const layer = makeLayer(year);
    const layer2 = makeLayer(year);
    const layer3 = makeLayer(year - 1);
    const layer4 = makeLayer(year - 1);

    //최신년도
    map.addLayer(layer); //팜맵
    map2.addLayer(layer2); //베이스

    //이전년도
    map3.addLayer(layer3); //팜맵
    map4.addLayer(layer4); //베이스

    await getFarmmapDataSeachPnu(pnu, "base");
    await getFarmmapDataSeachPnu(pnu, "farmmap");
}

//pnu코드로 데이터 조회
var checkCnt = 0;
async function getFarmmapDataSeachPnu(pnu, type) {
    var params = {};
    params.pnu = pnu;
    params.mapType = type;
    params.columnType = "KOR";
    params.apiKey = apiKey;
    params.domain = domain;
    params.apiVersion = "v1";
    const data = await fetchData("farmmapApi/getFarmmapDataSeachPnu.do", params);

    addVector(data, type);

    if (type === "farmmap") {
        (await handleConvertSync("1")) && checkCnt++;
        (await handleConvertSync("3")) && checkCnt++;
    } else {
        (await handleConvertSync("2")) && checkCnt++;
        (await handleConvertSync("4")) && checkCnt++;
    }

    let isAllReady = Object.values(READY_CHECK).every((item) => item.check === true);

    if (checkCnt === 4) {
        if (isAllReady === true) {
            $(`[name='img-download']`).val("S");
            $(`[name='img-download']`).attr("value", "S");
        } else {
            $(`[name='img-download']`).val("F");
            $(`[name='img-download']`).attr("value", "F");
        }
    }
}

//ajax 호출
async function fetchData(url, params) {
    const res = await axios({
        url: reqUrl + url,
        adapter: axiosJsonpAdapter,
        params: params,
        method: "GET",
        cache: false,
    })
        .then((response) => {
            return response.data;
        })
        .catch((error) => {
            console.error("Request failed", error);
            $.unblockUI();
        });
    return res;
}

//벡터 레이어 추가
function addVector(data, type) {
    if (data == null || data?.output.farmmapData.count === 0) {
        READY_CHECK.data.check = false;
        return;
    }

    READY_CHECK.data.check = true;
    var layerName = "vectorLayer";
    var layerOption = {
        hover: false,
        multiple: true,
        toggle: true,
    };
    if (type === "farmmap") {
        //1,3번에 팜맵지도
        farmmapObj.addVectorLayer(layerName, layerOption, map);
        farmmapObj.addVectorLayer(layerName, layerOption, map3);
    } else {
        //2,4번에 베이스지도
        farmmapObj.addVectorLayer(layerName, layerOption, map2);
        farmmapObj.addVectorLayer(layerName, layerOption, map4);
    }

    var farmmapData;

    if (data.output.farmmapData != null) {
        farmmapData = data.output.farmmapData;
        for (var k = 0; k < farmmapData.data.length; k++) {
            if (k > 300) break;

            var feature = farmmapData.data[k];
            var xy = feature.geometry[0].xy;

            var id = "";
            var label = "";

            if (data.input.mapType == "base") {
                if (data.input.columnType.toUpperCase() == "KOR") {
                    id = feature.필지고유번호;
                    label = feature.필지고유번호;
                } else {
                    id = feature.pnu;
                    label = feature.pnu;
                }
            } else {
                if (data.input.columnType.toUpperCase() == "KOR") {
                    id = feature.팜맵ID;
                    label = feature.팜맵ID;
                } else {
                    id = feature.id;
                    label = feature.id;
                }
            }

            vectorOptions = {
                id: id.toString(),
                type: "polygon",
                xy: xy,
                data: feature,
                style: {
                    fillColor: "#ff0000",
                    fillOpacity: 1,
                    strokeWidth: 1,
                    strokeColor: "#ff0000",
                    strokeLinecap: "round",
                    // fontSize: "12px",
                    // fontColor: "black",
                    // fontWeight: "bold",
                    // label: label.toString(),
                    // labelOutlineColor: "#ffffff",
                    // labelOutlineWidth: 1,
                },
            };
            if (type === "farmmap") {
                farmmapObj.addVector("vectorLayer", vectorOptions, map);
                farmmapObj.addVector("vectorLayer", vectorOptions, map3);
                map.zoomToExtent(farmmapObj.getObject("layer", "vectorLayer", map).features[0].geometry.getBounds());
                map.zoomTo(20);
                map3.zoomToExtent(farmmapObj.getObject("layer", "vectorLayer", map3).features[0].geometry.getBounds());
                map3.zoomTo(20);
            } else {
                farmmapObj.addVector("vectorLayer", vectorOptions, map2);
                farmmapObj.addVector("vectorLayer", vectorOptions, map4);
                map2.zoomToExtent(farmmapObj.getObject("layer", "vectorLayer", map2).features[0].geometry.getBounds());
                map2.zoomTo(20);
                map4.zoomToExtent(farmmapObj.getObject("layer", "vectorLayer", map4).features[0].geometry.getBounds());
                map4.zoomTo(20);
            }
        }
    }
}

//벡터 토글
function toggleVector() {
    var layer = farmmapObj.getObject("layer", "vectorLayer", map);
    if (layer) {
        $(`#${layer.id}`).toggle();
    }
}

//벡터 스타일 설정
function setVectorStyle(type, vecId) {
    var vec = farmmapObj.getObject("vector", vecId, map1);
    var styleOptions = {};
    if (vec != null) {
        if (type == "point") {
            styleOptions = {
                fillColor: "#ff99ee",
                graphicName: "x",
                pointRadius: 20,
                strokeWidth: 4,
                strokeColor: "#e62222",
                fontColor: "#ffffff",
                fontSize: "12px",
                fontWeight: "bold",
                label: vec.id + "스타일변경",
                labelYOffset: -30,
                labelOutlineColor: "black",
                labelOutlineWidth: 10,
                labelOutlineOpacity: 0.7,
            };
            farmmapObj.setVectorStyle(vec, styleOptions);
        } else if (type == "lineString") {
            styleOptions = {
                strokeWidth: 10,
                strokeColor: "blue",
                fontColor: "#000000",
                fontSize: "20px",
                fontWeight: "bold",
                label: vec.id + "스타일변경",
                labelYOffset: -30,
                labelOutlineColor: "white",
                labelOutlineWidth: 10,
                labelOutlineOpacity: 0.7,
            };
            farmmapObj.setVectorStyle(vec, styleOptions);
        }
    } else {
        alert(vecId + " 아이디의 벡터가 없습니다.");
    }
}
