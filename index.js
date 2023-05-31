/* eslint-disable no-undef */
const app = require("./app");
const port = process.env.PORT || 5500;
app.listen(port, () => {
  console.log(`server listening at port - ${port}`);
});
