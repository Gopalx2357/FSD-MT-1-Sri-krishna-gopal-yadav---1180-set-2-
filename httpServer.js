const app = require("./expressApp");

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Student Record Management API is running on port ${PORT}`);
});
