const fs=require("fs");
const path=require("path");
const parts=[];
for (let i=0;i<8;i++) {
  const f=path.join(__dirname, `hero-b64-p${i}.txt`);
  parts.push(fs.readFileSync(f,"utf8").replace(/\s+/g,""));
}
const buf=Buffer.from(parts.join(""),"base64");
const out=path.join(__dirname,"..","assets","hero-lotus-cool.jpg");
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,buf);
console.log("wrote",out,buf.length);
