const apiKey = "Fj6bWPPoqYIcDAna3Bce";
const domain = "http://127.0.0.1:5500";
var map;
var map2;
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
function init(year = "2022", pnu = "3611031024201550000") {
    if (!map) {
        map = farmmapObj.init("mapDiv1");
        map2 = farmmapObj.init("mapDiv2");
    }
    reqUrl = farmmapObj.rootUri;

    const layer = makeLayer(year);
    const layer2 = makeLayer(year - 1);

    map.addLayer(layer);
    map2.addLayer(layer2);

    getFarmmapDataSeachPnu(pnu);
}

//pnu코드로 데이터 조회
async function getFarmmapDataSeachPnu(pnu) {
    var params = {};
    params.pnu = pnu;
    params.mapType = "farmmap";
    params.columnType = "KOR";
    params.apiKey = apiKey;
    params.domain = domain;
    params.apiVersion = "v1";
    farmmapObj.removeLayer("vectorLayer", map);
    const data = await fetchData("farmmapApi/getFarmmapDataSeachPnu.do", params);

    console.log("data :", data);
    addVector(data);

    await handleMapDownload("1");
    await handleMapDownload("2");

    let isAllReady = Object.values(READY_CHECK).every((item) => item.check === true);

    // isAllReady = false;

    if (isAllReady === true) {
        $(`[name='img-download']`).val("S");
        // var canvasDownload = document.createElement("a");
        // canvasDownload.download = "canvas-image.png"; // 다운로드할 파일 이름
        // canvasDownload.href = READY_CHECK.img.link;
        // canvasDownload.click();

        // // 레이어 이미지 다운로드 (아직 다운로드하지 않았을 경우에만)
        // if (!layerImageDownloaded) {
        //     const layerDownload = document.createElement("a");
        //     layerDownload.download = "layer.png";
        //     layerDownload.href = READY_CHECK.layer.link; // 레이어 이미지 URL을 저장했다고 가정
        //     layerDownload.click();
        //     layerImageDownloaded = true; // 레이어 이미지 다운로드 완료 표시
        // }
    }

    if (isAllReady === false) {
        console.error("데이터 로드 실패");
        $(`[name='img-download']`).val("F");
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
function addVector(data) {
    if (data == null || data?.output.farmmapData.count === 0) {
        READY_CHECK.data.check = false;
        return;
    }

    READY_CHECK.data.check = true;
    var layerName = "vectorLayer";
    var layerOption = {
        hover: false,
        multiple: false,
        toggle: true,
    };
    farmmapObj.addVectorLayer(layerName, layerOption, map);
    farmmapObj.addVectorLayer(layerName, layerOption, map2);

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
                    fillOpacity: 0.5,
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
            farmmapObj.addVector("vectorLayer", vectorOptions, map);
            farmmapObj.addVector("vectorLayer", vectorOptions, map2);
        }
    }

    if (farmmapObj.getObject("layer", "vectorLayer", map).features.length > 0) {
        map.zoomToExtent(farmmapObj.getObject("layer", "vectorLayer", map).features[0].geometry.getBounds());
        map.zoomTo(15);
        map2.zoomToExtent(farmmapObj.getObject("layer", "vectorLayer", map2).features[0].geometry.getBounds());
        map2.zoomTo(15);
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
