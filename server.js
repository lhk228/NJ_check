const express = require("express");
const path = require("path");
const app = express();
const PORT = 5500;

// 정적 파일 제공
app.use(express.static(path.join(__dirname, "public")));

// 서버 시작
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
