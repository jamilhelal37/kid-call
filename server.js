import app from "./app.js";

 app.listen(process.env.LISTEN_PORT, () => console.log(`Listening at port ${process.env.LISTEN_PORT}`));