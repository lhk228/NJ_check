const express = require("express");
const imageController = require("./controllers/image.controllers");
const PORT = 3000;
const app = express();
const path = require("path");
const cors = require("cors");

app.use(express.json());
app.use("/static", express.static(path.join(__dirname, "public")));
app.use(cors());

app.use((req, res, next) => {
    const start = Date.now();
    // console.log(`${req.method} ${req.baseUrl}`);
    next();
    const diffTime = Date.now() - start;
    // console.log(`${req.method} ${req.baseUrl} ${diffTime}ms`);
});

//서버호출 테스트
app.get("/", (req, res, next) => {
    res.send("서버호출 테스트");
});

app.post("/baseImg", async (req, res, next) => {
    try {
        const imageUrl = req.body.imgUrl;
        const imageBase64 = await imageController.encodeImageUrlToBase64(imageUrl);
        return res.status(200).json({
            imgBase64: imageBase64,
        });
    } catch (error) {
        return res.json({ message: error.message });
    }
});

//에러 처리기
app.use((error, req, res, next) => {
    res.json({ message: error.message });
});

app.listen(PORT, () => {
    console.log(`PROXY SERVER PORT ${PORT}`);
});
