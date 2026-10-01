const fs=require("fs");
const path=require("path");
const parts=[0,1,2,3].map(i=>fs.readFileSync(path.join(__dirname,`hero-b64-p${i}.txt`),"utf8").trim()).join("");
const buf=Buffer.from(parts,"base64");
const out=path.join(__dirname,"..","assets","hero-lotus-cool.jpg");
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,buf);
console.log("wrote",out,buf.length);
